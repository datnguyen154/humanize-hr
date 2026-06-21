import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

export function showSuccessToast(description: string, title = 'Thành công') {
  toast.success(title, {
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

export function showErrorToast(
  description = 'Vui lòng thử lại sau.',
  title = 'Thao tác thất bại',
) {
  toast.error(title, {
    description,
    icon: <CircleX className="size-5 text-destructive" />,
  })
}
