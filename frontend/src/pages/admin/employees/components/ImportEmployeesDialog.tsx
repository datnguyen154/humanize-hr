import { AxiosError } from 'axios'
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useDownloadEmployeeImportTemplateMutation,
  useImportEmployeesMutation,
  usePreviewEmployeeImportMutation,
  type EmployeeImportPreviewResult,
  type EmployeeImportPreviewRow,
  type ImportEmployeesResult,
} from '@/features/employee'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

type ImportEmployeesDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }
type ImportPhase = 'select' | 'preview' | 'result'

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024
const TEMPLATE_FALLBACK_FILENAME = 'employee-import-template.xlsx'
const previewStatusTone: Record<'valid' | 'invalid', StatusBadgeTone> = { valid: 'success', invalid: 'danger' }

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

const parseFilenameFromContentDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null
  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encoded?.[1]) {
    try { return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, '')) } catch { return encoded[1].trim().replace(/^"|"$/g, '') }
  }
  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim() || null
}

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }
}

const validateImportFile = (file: File | null) => {
  if (!file) return 'Vui lòng chọn file Excel.'
  if (!file.name.toLowerCase().endsWith('.xlsx')) return 'Vui lòng chọn file Excel định dạng .xlsx.'
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) return 'File Excel vượt quá giới hạn 5 MB.'
  return null
}

const getImportFileErrorMessage = (error: unknown, preview: boolean) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    const messages: Record<string, string> = {
      'File is required': 'Vui lòng chọn file Excel.',
      'Invalid file type': 'File không đúng định dạng. Vui lòng chọn file .xlsx.',
      'File size must not exceed 5 MB': 'File không được vượt quá 5 MB.',
      'Workbook is invalid or corrupted': 'File Excel không hợp lệ hoặc đã bị hỏng.',
      'Workbook must contain a worksheet': 'File Excel phải có ít nhất một sheet.',
      'Import file must contain data rows': 'File Excel không có dữ liệu nhân viên.',
      'Import file must not exceed 1000 data rows': 'File Excel không được vượt quá 1000 dòng dữ liệu.',
      Unauthorized: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      Forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    }
    if (message && messages[message]) return messages[message]
  }
  return preview ? 'Không thể xem trước file Excel. Vui lòng kiểm tra file và thử lại.' : 'Không thể nhập danh sách nhân viên. Vui lòng thử lại sau.'
}

const getImportResultMessage = (result: ImportEmployeesResult) => {
  if (result.successCount > 0 && result.failedCount === 0) return 'Tất cả dòng hợp lệ đã được nhập thành công.'
  if (result.successCount > 0) return 'Một số dòng đã được tạo, một số dòng cần kiểm tra và sửa lại trong file Excel.'
  return 'Không có dòng nào được nhập. Vui lòng kiểm tra danh sách lỗi bên dưới.'
}

const getRowErrorMessage = (message: string) => message.trim() || 'Lỗi dữ liệu không xác định.'
const getPreviewValue = (value: string | null) => value || 'Chưa có'

function PreviewSummary({ preview }: { preview: EmployeeImportPreviewResult }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">Tổng số dòng</p><p className="mt-1 text-xl font-semibold text-foreground">{preview.totalRows}</p></div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20"><p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Hợp lệ</p><p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{preview.validCount}</p></div>
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3"><p className="text-xs font-medium text-destructive">Có lỗi</p><p className="mt-1 text-xl font-semibold text-destructive">{preview.invalidCount}</p></div>
    </div>
  )
}

function PreviewRowStatus({ valid }: { valid: boolean }) {
  return <StatusBadge label={valid ? 'Hợp lệ' : 'Có lỗi'} tone={previewStatusTone[valid ? 'valid' : 'invalid']} />
}

function PreviewErrors({ row }: { row: EmployeeImportPreviewRow }) {
  if (row.errors.length === 0) return null
  return <div className="grid gap-1 text-sm"><p className="font-medium text-destructive">Lỗi:</p><ul className="list-disc space-y-1 pl-5 text-destructive">{row.errors.map((error, index) => <li key={`${error.field}-${index}`} className="break-words">{error.message || 'Lỗi dữ liệu không xác định.'}</li>)}</ul></div>
}

function PreviewTable({ rows }: { rows: EmployeeImportPreviewRow[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
      <Table className="min-w-[1120px]"><TableHeader><TableRow>
        <TableHead>Dòng</TableHead><TableHead>Mã nhân viên</TableHead><TableHead>Họ tên</TableHead><TableHead>Email</TableHead><TableHead>Số điện thoại</TableHead><TableHead>Chức vụ</TableHead><TableHead>Phòng ban</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày vào làm</TableHead><TableHead>Kết quả</TableHead>
      </TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.rowNumber}>
        <TableCell>{row.rowNumber}</TableCell><TableCell>{getPreviewValue(row.employeeCode)}</TableCell><TableCell className="max-w-48 whitespace-normal break-words">{getPreviewValue(row.fullName)}</TableCell><TableCell className="max-w-56 whitespace-normal break-words">{getPreviewValue(row.email)}</TableCell><TableCell>{getPreviewValue(row.phone)}</TableCell><TableCell className="max-w-48 whitespace-normal break-words">{getPreviewValue(row.position)}</TableCell><TableCell>{getPreviewValue(row.department)}</TableCell><TableCell>{row.status ? employeeStatusLabel[row.status] : 'Chưa có'}</TableCell><TableCell>{row.joinedAt ? formatEmployeeDate(row.joinedAt) : 'Chưa có'}</TableCell><TableCell><PreviewRowStatus valid={row.valid} /><div className="mt-2 min-w-48"><PreviewErrors row={row} /></div></TableCell>
      </TableRow>)}</TableBody></Table>
    </div>
  )
}

function PreviewCards({ rows }: { rows: EmployeeImportPreviewRow[] }) {
  return <div className="grid gap-3 md:hidden">{rows.map((row) => <article key={row.rowNumber} className="grid min-w-0 gap-3 rounded-lg border border-border p-4">
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-foreground">Dòng {row.rowNumber}</p><PreviewRowStatus valid={row.valid} /></div>
    <dl className="grid gap-3 text-sm">
      {([['Mã nhân viên', row.employeeCode, 'break-words'], ['Họ tên', row.fullName, 'break-words'], ['Email', row.email, 'break-all'], ['Số điện thoại', row.phone, 'break-words'], ['Chức vụ', row.position, 'break-words'], ['Phòng ban', row.department, 'break-words']] as const).map(([label, value, breakClass]) => <div key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className={`mt-1 ${breakClass} text-foreground`}>{getPreviewValue(value)}</dd></div>)}
      <div><dt className="text-xs font-medium text-muted-foreground">Trạng thái</dt><dd className="mt-1 text-foreground">{row.status ? employeeStatusLabel[row.status] : 'Chưa có'}</dd></div>
      <div><dt className="text-xs font-medium text-muted-foreground">Ngày vào làm</dt><dd className="mt-1 text-foreground">{row.joinedAt ? formatEmployeeDate(row.joinedAt) : 'Chưa có'}</dd></div>
    </dl><PreviewErrors row={row} />
  </article>)}</div>
}

function ImportResult({ result }: { result: ImportEmployeesResult }) {
  return <section className="grid gap-4">
    <div className="rounded-lg border border-border bg-card p-4"><h3 className="text-sm font-semibold text-foreground">Kết quả nhập dữ liệu</h3><p className="mt-1 text-sm text-muted-foreground">{getImportResultMessage(result)}</p>{result.failedCount > 0 ? <p className="mt-2 text-sm text-muted-foreground">Hãy sửa các dòng lỗi trong file và chọn lại file trước khi nhập tiếp.</p> : null}<div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">Tổng số dòng</p><p className="mt-1 text-xl font-semibold text-foreground">{result.totalRows}</p></div><div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20"><p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Thành công</p><p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{result.successCount}</p></div><div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3"><p className="text-xs font-medium text-destructive">Thất bại</p><p className="mt-1 text-xl font-semibold text-destructive">{result.failedCount}</p></div></div></div>
    {result.createdEmployees.length > 0 ? <div className="grid gap-2"><h4 className="text-sm font-semibold text-foreground">Nhân viên đã tạo</h4><div className="max-h-40 overflow-y-auto rounded-lg border border-border">{result.createdEmployees.map((employee) => <div key={`${employee.rowNumber}-${employee.id}`} className="grid gap-1 border-b border-border p-3 last:border-b-0"><p className="text-xs font-medium text-muted-foreground">Dòng {employee.rowNumber}</p><p className="break-words text-sm font-medium text-foreground">{employee.fullName}</p><p className="text-sm text-primary">{employee.employeeCode}</p></div>)}</div></div> : null}
    {result.errors.length > 0 ? <div className="grid gap-2"><h4 className="text-sm font-semibold text-foreground">Danh sách lỗi</h4><div className="max-h-56 overflow-y-auto rounded-lg border border-border">{result.errors.map((error, index) => <div key={`${error.rowNumber}-${error.field}-${index}`} className="grid gap-1 border-b border-border p-3 last:border-b-0"><p className="text-xs font-medium text-muted-foreground">Dòng {error.rowNumber}</p><p className="break-words text-sm font-medium text-foreground">Trường: {error.field}</p><p className="break-words text-sm text-destructive">{getRowErrorMessage(error.message)}</p></div>)}</div></div> : null}
  </section>
}

export function ImportEmployeesDialog({ open, onOpenChange }: ImportEmployeesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewMutation = usePreviewEmployeeImportMutation()
  const importMutation = useImportEmployeesMutation()
  const templateMutation = useDownloadEmployeeImportTemplateMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<EmployeeImportPreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportEmployeesResult | null>(null)
  const phase: ImportPhase = importResult ? 'result' : previewResult ? 'preview' : 'select'
  const isBusy = previewMutation.isPending || importMutation.isPending

  const resetDialogState = () => {
    setSelectedFile(null); setFileError(null); setPreviewError(null); setPreviewResult(null); setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleOpenChange = (nextOpen: boolean) => { if (isBusy) return; if (!nextOpen) resetDialogState(); onOpenChange(nextOpen) }
  const openFilePicker = () => { if (isBusy || !fileInputRef.current) return; fileInputRef.current.value = ''; fileInputRef.current.click() }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return
    const file = event.target.files?.[0] ?? null
    const validationMessage = validateImportFile(file)
    setPreviewResult(null); setImportResult(null); setPreviewError(null)
    if (validationMessage) { setSelectedFile(null); setFileError(validationMessage); event.target.value = ''; return }
    setSelectedFile(file); setFileError(null)
  }
  const handleRemoveFile = () => { if (!isBusy) resetDialogState() }
  const handleDownloadTemplate = async () => {
    if (templateMutation.isPending) return
    try { const { blob, contentDisposition } = await templateMutation.mutateAsync(); triggerBrowserDownload(blob, parseFilenameFromContentDisposition(contentDisposition) ?? TEMPLATE_FALLBACK_FILENAME) } catch { showErrorToast('Không thể tải file mẫu. Vui lòng thử lại sau.', 'Tải file mẫu thất bại') }
  }
  const handlePreview = async () => {
    const validationMessage = validateImportFile(selectedFile)
    if (validationMessage || !selectedFile) { setFileError(validationMessage); return }
    setFileError(null); setPreviewError(null)
    try { setPreviewResult(await previewMutation.mutateAsync(selectedFile)) } catch (error) { setPreviewError(getImportFileErrorMessage(error, true)) }
  }
  const handleImport = async () => {
    if (!selectedFile || !previewResult || previewResult.validCount === 0) return
    try {
      const result = await importMutation.mutateAsync(selectedFile)
      setImportResult(result)
      if (result.successCount > 0 && result.failedCount === 0) showSuccessToast('Danh sách nhân viên đã được nhập thành công.')
      else if (result.successCount > 0) showInfoToast('Một số nhân viên đã được tạo, một số dòng cần kiểm tra lại.', 'Nhập dữ liệu một phần')
      else showErrorToast('Không có dòng nào được nhập. Vui lòng kiểm tra danh sách lỗi.', 'Nhập dữ liệu chưa thành công')
    } catch (error) { showErrorToast(getImportFileErrorMessage(error, false), 'Nhập Excel thất bại') }
  }

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden">
      <DialogHeader className="shrink-0"><DialogTitle>Nhập nhân viên từ Excel</DialogTitle><DialogDescription>Chọn file, xem trước dữ liệu rồi xác nhận nhập nhân viên hợp lệ.</DialogDescription></DialogHeader>
      <input ref={fileInputRef} id="employee-import-file" type="file" accept=".xlsx" className="sr-only" disabled={isBusy} aria-label="Chọn file Excel nhập nhân viên" onChange={handleFileChange} />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1"><div className="grid gap-5 py-1">
        {phase === 'select' ? <section className="grid gap-5">
          <section className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-sm font-semibold text-foreground">Hướng dẫn nhập dữ liệu</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>Chỉ hỗ trợ file Excel định dạng .xlsx.</li><li>Dung lượng tối đa 5 MB, tối đa 1000 dòng.</li><li>Hệ thống sẽ kiểm tra dữ liệu trước khi nhập.</li></ul></div><Button type="button" variant="outline" className="w-full shrink-0 gap-2 sm:w-auto" disabled={templateMutation.isPending} onClick={() => void handleDownloadTemplate()}>{templateMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}{templateMutation.isPending ? 'Đang tải...' : 'Tải file mẫu'}</Button></div></section>
          <section className="grid gap-3"><div><label htmlFor="employee-import-file" className="text-sm font-medium text-foreground">File Excel</label><p className="mt-1 text-sm text-muted-foreground">Chọn file .xlsx. File sẽ chưa được nhập cho đến khi bạn xác nhận.</p></div><div className="rounded-lg border border-dashed border-border p-4">{selectedFile ? <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileSpreadsheet className="size-5" aria-hidden="true" /></div><div className="min-w-0"><p className="break-all text-sm font-medium text-foreground">{selectedFile.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isBusy} onClick={openFilePicker}>Đổi file</Button><Button type="button" variant="ghost" size="icon" className="size-10 text-muted-foreground hover:text-destructive" disabled={isBusy} aria-label="Xóa file đã chọn" title="Xóa file đã chọn" onClick={handleRemoveFile}><Trash2 className="size-4" aria-hidden="true" /></Button></div></div> : <div className="grid justify-items-center gap-3 py-6 text-center"><div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><Upload className="size-5" aria-hidden="true" /></div><div><p className="text-sm font-medium text-foreground">Chưa chọn file</p><p className="mt-1 text-sm text-muted-foreground">File .xlsx, không vượt quá 5 MB.</p></div><Button type="button" variant="outline" disabled={isBusy} onClick={openFilePicker}>Chọn file</Button></div>}</div>{fileError ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{fileError}</p> : null}</section>
        </section> : null}
        {phase === 'preview' && previewResult ? <section className="grid gap-5"><div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-all text-sm font-medium text-foreground">{selectedFile?.name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedFile ? formatFileSize(selectedFile.size) : null}</p></div><Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" disabled={isBusy} onClick={openFilePicker}>Chọn file khác</Button></div><PreviewSummary preview={previewResult} />{previewResult.validCount === 0 ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">Không có dòng hợp lệ để nhập.</p> : null}<PreviewTable rows={previewResult.rows} /><PreviewCards rows={previewResult.rows} /></section> : null}
        {previewMutation.isPending ? <div className="grid justify-items-center gap-3 py-10 text-center"><Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" /><p className="text-sm text-muted-foreground">Đang kiểm tra...</p></div> : null}
        {previewError ? <div className="grid gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"><p className="text-sm text-destructive">{previewError}</p><Button type="button" variant="outline" className="w-fit" disabled={isBusy} onClick={() => void handlePreview()}>Thử lại xem trước</Button></div> : null}
        {phase === 'result' && importResult ? <ImportResult result={importResult} /> : null}
      </div></div>
      <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={isBusy} onClick={() => handleOpenChange(false)}>{phase === 'result' ? 'Đóng' : 'Hủy'}</Button>{phase === 'select' ? <Button type="button" disabled={!selectedFile || isBusy} onClick={() => void handlePreview()}>{previewMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{previewMutation.isPending ? 'Đang kiểm tra...' : 'Xem trước dữ liệu'}</Button> : null}{phase === 'preview' && previewResult ? <Button type="button" disabled={previewResult.validCount === 0 || isBusy} onClick={() => void handleImport()}>{importMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}{importMutation.isPending ? 'Đang nhập dữ liệu...' : `Nhập ${previewResult.validCount} nhân viên hợp lệ`}</Button> : null}{phase === 'result' ? <Button type="button" variant="outline" disabled={isBusy} onClick={openFilePicker}>Chọn file khác</Button> : null}</DialogFooter>
    </DialogContent>
  </Dialog>
}
