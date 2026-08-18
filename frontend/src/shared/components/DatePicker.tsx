import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  disabled?: boolean
  allowClear?: boolean
  'aria-invalid'?: boolean
}

const parseDateValue = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  id,
  disabled = false,
  allowClear = false,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateValue(value)

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'h-10 w-full justify-between px-3 font-normal',
            !selectedDate && 'text-muted-foreground',
          )}
        >
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder}
          <CalendarDays className="size-4 shrink-0 opacity-70" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-[calc(100vw-2rem)]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          defaultMonth={selectedDate}
        />
        {allowClear && selectedDate ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Bỏ chọn ngày
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
