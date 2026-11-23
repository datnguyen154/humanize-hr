/**
 * Preview of the backend rule (payroll-proration.ts): monthly × payable / standard, rounded half-up to whole VND.
 * The backend result stays authoritative; this only drives the live preview in forms.
 */
export function proratedBaseSalary(monthlySalary: number, payableDays: number, standardDays: number): number {
  if (!Number.isFinite(monthlySalary) || standardDays <= 0) return 0
  return Math.round((monthlySalary * payableDays) / standardDays)
}
