import { Prisma } from "@prisma/client";

/**
 * MONTHLY proration: monthlySalary × payableDays / standardDays, rounded half-up to whole VND.
 * A month without working days pays nothing from the timesheet (bonus/deduction still apply).
 */
export function proratedBaseSalary(monthlySalary: Prisma.Decimal, payableDays: number, standardDays: number): Prisma.Decimal {
    if (standardDays <= 0) return new Prisma.Decimal(0);
    return monthlySalary.mul(payableDays).div(standardDays).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}

/** Payroll is only created after the last civil day of the month, so the timesheet can no longer change by new punches. */
export function isPeriodClosed(year: number, month: number, today: string): boolean {
    // Numeric compare: a string compare breaks at year 9999 → "10000-01-01".
    const todayIndex = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7));
    return todayIndex > year * 12 + month;
}
