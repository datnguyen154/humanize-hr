export type ApiResponse<TData> = {
  data: TData
  message?: string
}

export type ApiErrorResponse = {
  message: string
}
