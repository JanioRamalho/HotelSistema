'use client'

import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { format, isValid, parse, parseISO } from 'date-fns'
import type { Matcher } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type CalendarDisabled = Matcher | Matcher[]

interface DatePickerFieldProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'disabled'> {
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  disabled?: CalendarDisabled
}

function parseDateValue(value: string) {
  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

function normalizeDateInput(value: string) {
  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = parseISO(trimmed)
    return isValid(date) ? format(date, 'yyyy-MM-dd') : undefined
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const date = parse(trimmed, 'dd/MM/yyyy', new Date())
    return isValid(date) ? format(date, 'yyyy-MM-dd') : undefined
  }

  return undefined
}

function asMatchers(disabled: CalendarDisabled): Matcher[] {
  return Array.isArray(disabled) ? disabled : [disabled]
}

function buildDisabledDays(minDate?: string, maxDate?: string): Matcher[] | undefined {
  const disabled: Matcher[] = []

  if (minDate) {
    const date = parseDateValue(minDate)
    if (date) disabled.push({ before: date })
  }
  if (maxDate) {
    const date = parseDateValue(maxDate)
    if (date) disabled.push({ after: date })
  }

  return disabled.length > 0 ? disabled : undefined
}

export function DatePickerField({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  className,
  ...props
}: DatePickerFieldProps) {
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const selectedDate = React.useMemo(() => parseDateValue(value), [value])
  const disabledDays = React.useMemo(
    () => {
      const rangeDisabled = buildDisabledDays(minDate, maxDate)
      if (disabled && rangeDisabled) return [...asMatchers(disabled), ...rangeDisabled]
      return disabled || rangeDisabled
    },
    [disabled, minDate, maxDate]
  )

  const handleInputBlur = () => {
    if (!inputValue) {
      onChange('')
      return
    }

    const normalized = normalizeDateInput(inputValue)
    if (normalized) {
      onChange(normalized)
      setInputValue(normalized)
      return
    }

    setInputValue(value)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return
    const formatted = format(date, 'yyyy-MM-dd')
    onChange(formatted)
    setInputValue(formatted)
  }

  return (
    <div className={cn('relative', className)}>
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Popover>
        <PopoverTrigger asChild>
          <Input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onBlur={handleInputBlur}
            className="pl-10"
            {...props}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={disabledDays}
            fromMonth={selectedDate || parseDateValue(minDate || '') || undefined}
            className="min-w-[18rem]"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
