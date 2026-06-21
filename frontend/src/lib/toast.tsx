import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

export function showSuccessToast(description: string) {
  toast.success('Thành công', {
    description,
    icon: <CircleCheck className="size-5 text-emerald-600" />,
  })
}

export function showWarningToast(description: string) {
  toast.warning('Trạng thái đã thay đổi', {
    description,
    icon: <TriangleAlert className="size-5 text-amber-600" />,
  })
}

export function showErrorToast(description = 'Vui lòng thử lại sau.') {
  toast.error('Thao tác thất bại', {
    description,
    icon: <CircleX className="size-5 text-destructive" />,
  })
}
