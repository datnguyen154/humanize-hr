import { vi } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'

import { cn } from '@/lib/utils'

const calendarToday = new Date()
const calendarStartMonth = new Date(calendarToday.getFullYear() - 100, 0, 1)
const calendarEndMonth = new Date(calendarToday.getFullYear() + 10, 11, 31)

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays
      fixedWeeks
      startMonth={calendarStartMonth}
      endMonth={calendarEndMonth}
      navLayout="around"
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'relative space-y-4',
        month_caption: 'relative flex min-h-8 items-center justify-center px-10',
        caption_label: 'hidden',
        dropdowns: 'flex items-center gap-2',
        months_dropdown: 'min-w-32',
        years_dropdown: 'min-w-20',
        dropdown: 'h-8 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        nav: 'flex items-center gap-1',
        button_previous: 'absolute left-1 top-0 z-10 inline-flex size-8 items-center justify-center rounded-md border border-input bg-background p-0 text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        button_next: 'absolute right-1 top-0 z-10 inline-flex size-8 items-center justify-center rounded-md border border-input bg-background p-0 text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'w-9 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'relative size-9 p-0 text-center text-sm',
        day_button: 'size-9 rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground',
        selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'down' ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : orientation === 'left' ? (
            <ChevronLeft className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          ),
      }}
      {...props}
    />
  )
}
