import { AxiosError } from 'axios'
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useDownloadEmployeeImportTemplateMutation,
  useImportEmployeesMutation,
  type ImportEmployeesResult,
} from '@/features/employee'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

type ImportEmployeesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024
const TEMPLATE_FALLBACK_FILENAME = 'employee-import-template.xlsx'

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const parseFilenameFromContentDisposition = (
  contentDisposition?: string,
): string | null => {
  if (!contentDisposition) return null

  const encodedFilenameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  )

  if (encodedFilenameMatch?.[1]) {
    try {
      return decodeURIComponent(
        encodedFilenameMatch[1].trim().replace(/^"|"$/g, ''),
      )
    } catch {
      return encodedFilenameMatch[1].trim().replace(/^"|"$/g, '')
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)

  return filenameMatch?.[1]?.trim() || null
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
  if (!file) {
    return 'Vui lòng chọn file Excel.'
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'Vui lòng chọn file Excel định dạng .xlsx.'
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return 'File Excel vượt quá giới hạn 5 MB.'
  }

  return null
}

const getImportEmployeesErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 413) {
      return 'File Excel vượt quá giới hạn 5 MB.'
    }

    if (error.response?.status === 400) {
      return 'File Excel không hợp lệ. Vui lòng kiểm tra file mẫu và thử lại.'
    }
  }

  return 'Không thể nhập danh sách nhân viên. Vui lòng thử lại sau.'
}

const getImportResultMessage = (result: ImportEmployeesResult) => {
  if (result.successCount > 0 && result.failedCount === 0) {
    return 'Tất cả dòng hợp lệ đã được nhập thành công.'
  }

  if (result.successCount > 0 && result.failedCount > 0) {
    return 'Một số dòng đã được tạo, một số dòng cần kiểm tra và sửa lại trong file Excel.'
  }

  return 'Không có dòng nào được nhập. Vui lòng kiểm tra danh sách lỗi bên dưới.'
}

const getRowErrorMessage = (message: string) =>
  message.trim() || 'Lỗi dữ liệu không xác định.'

export function ImportEmployeesDialog({
  open,
  onOpenChange,
}: ImportEmployeesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const importEmployeesMutation = useImportEmployeesMutation()
  const templateMutation = useDownloadEmployeeImportTemplateMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportEmployeesResult | null>(null)

  const isImporting = importEmployeesMutation.isPending
  const hasProcessedCurrentFile = Boolean(result)
  const isImportDisabled = !selectedFile || isImporting || hasProcessedCurrentFile

  const resetDialogState = () => {
    setSelectedFile(null)
    setFileError(null)
    setResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isImporting) {
      return
    }

    if (!nextOpen) {
      resetDialogState()
    }

    onOpenChange(nextOpen)
  }

  const openFilePicker = () => {
    if (isImporting) {
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isImporting) {
      return
    }

    const file = event.target.files?.[0] ?? null
    const validationMessage = validateImportFile(file)

    setResult(null)

    if (validationMessage) {
      setSelectedFile(null)
      setFileError(validationMessage)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setFileError(null)
  }

  const handleRemoveFile = () => {
    if (isImporting) {
      return
    }

    setSelectedFile(null)
    setFileError(null)
    setResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = async () => {
    if (templateMutation.isPending) {
      return
    }

    try {
      const { blob, contentDisposition } = await templateMutation.mutateAsync()
      const filename =
        parseFilenameFromContentDisposition(contentDisposition) ??
        TEMPLATE_FALLBACK_FILENAME

      triggerBrowserDownload(blob, filename)
    } catch {
      showErrorToast(
        'Không thể tải file mẫu. Vui lòng thử lại sau.',
        'Tải file mẫu thất bại',
      )
    }
  }

  const handleImportEmployees = async () => {
    const validationMessage = validateImportFile(selectedFile)

    if (validationMessage || !selectedFile) {
      setFileError(validationMessage)
      return
    }

    setFileError(null)

    try {
      const importResult =
        await importEmployeesMutation.mutateAsync(selectedFile)

      setResult(importResult)

      if (importResult.successCount > 0 && importResult.failedCount === 0) {
        showSuccessToast('Danh sách nhân viên đã được nhập thành công.')
      } else if (
        importResult.successCount > 0 &&
        importResult.failedCount > 0
      ) {
        showInfoToast(
          'Một số nhân viên đã được tạo, một số dòng cần kiểm tra lại.',
          'Nhập dữ liệu một phần',
        )
      } else {
        showErrorToast(
          'Không có dòng nào được nhập. Vui lòng kiểm tra danh sách lỗi.',
          'Nhập dữ liệu chưa thành công',
        )
      }
    } catch (error) {
      showErrorToast(
        getImportEmployeesErrorMessage(error),
        'Nhập Excel thất bại',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Nhập nhân viên từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file .xlsx để tạo mới danh sách nhân viên theo file mẫu.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-5 py-1">
            <section className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Hướng dẫn nhập dữ liệu
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Vui lòng tải và nhập dữ liệu theo file mẫu.</li>
                    <li>Chỉ hỗ trợ file Excel định dạng .xlsx.</li>
                    <li>Dung lượng tối đa 5 MB, tối đa 1000 dòng.</li>
                    <li>Chỉ tạo nhân viên mới, không cập nhật nhân viên cũ.</li>
                    <li>
                      Nếu một số dòng lỗi, các dòng hợp lệ vẫn được nhập.
                    </li>
                  </ul>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full shrink-0 gap-2 sm:w-auto"
                  disabled={templateMutation.isPending}
                  onClick={() => void handleDownloadTemplate()}
                >
                  {templateMutation.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  {templateMutation.isPending ? 'Đang tải...' : 'Tải file mẫu'}
                </Button>
              </div>
            </section>

            <section className="grid gap-3">
              <div>
                <label
                  htmlFor="employee-import-file"
                  className="text-sm font-medium text-foreground"
                >
                  File Excel
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chọn file .xlsx từ máy tính của bạn. Hệ thống sẽ không tự nhập
                  cho đến khi bạn bấm “Nhập dữ liệu”.
                </p>
              </div>

              <input
                ref={fileInputRef}
                id="employee-import-file"
                type="file"
                accept=".xlsx"
                className="sr-only"
                disabled={isImporting}
                aria-label="Chọn file Excel nhập nhân viên"
                onChange={handleFileChange}
              />

              <div className="rounded-lg border border-dashed border-border p-4">
                {selectedFile ? (
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileSpreadsheet
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium text-foreground">
                          {selectedFile.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={isImporting}
                        onClick={openFilePicker}
                      >
                        Đổi file
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10 text-muted-foreground hover:text-destructive"
                        disabled={isImporting}
                        aria-label="Xóa file đã chọn"
                        title="Xóa file đã chọn"
                        onClick={handleRemoveFile}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid justify-items-center gap-3 py-6 text-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Upload className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Chưa chọn file
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        File hợp lệ có định dạng .xlsx và không vượt quá 5 MB.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isImporting}
                      onClick={openFilePicker}
                    >
                      Chọn file
                    </Button>
                  </div>
                )}
              </div>

              {fileError ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {fileError}
                </p>
              ) : null}
            </section>

            {result ? (
              <section className="grid gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Kết quả nhập dữ liệu
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getImportResultMessage(result)}
                  </p>
                  {result.failedCount > 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Hãy sửa các dòng lỗi trong file và chọn lại file trước khi
                      nhập tiếp.
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Tổng số dòng
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {result.totalRows}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        Thành công
                      </p>
                      <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                        {result.successCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                      <p className="text-xs font-medium text-destructive">
                        Thất bại
                      </p>
                      <p className="mt-1 text-xl font-semibold text-destructive">
                        {result.failedCount}
                      </p>
                    </div>
                  </div>
                </div>

                {result.createdEmployees.length > 0 ? (
                  <div className="grid gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Nhân viên đã tạo
                    </h4>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                      {result.createdEmployees.map((employee) => (
                        <div
                          key={`${employee.rowNumber}-${employee.id}`}
                          className="grid gap-1 border-b border-border p-3 last:border-b-0"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            Dòng {employee.rowNumber}
                          </p>
                          <p className="break-words text-sm font-medium text-foreground">
                            {employee.fullName}
                          </p>
                          <p className="text-sm text-primary">
                            {employee.employeeCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.errors.length > 0 ? (
                  <div className="grid gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Danh sách lỗi
                    </h4>
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                      {result.errors.map((error, index) => (
                        <div
                          key={`${error.rowNumber}-${error.field}-${index}`}
                          className="grid gap-1 border-b border-border p-3 last:border-b-0"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            Dòng {error.rowNumber}
                          </p>
                          <p className="break-words text-sm font-medium text-foreground">
                            Trường: {error.field}
                          </p>
                          <p className="break-words text-sm text-destructive">
                            {getRowErrorMessage(error.message)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            onClick={() => handleOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            type="button"
            disabled={isImportDisabled}
            onClick={() => void handleImportEmployees()}
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isImporting ? 'Đang nhập...' : 'Nhập dữ liệu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
