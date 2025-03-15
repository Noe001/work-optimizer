import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useNavigation } from "react-day-picker"
import { ja } from "date-fns/locale"
import { format, isValid } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// 日付が有効かどうかを確認する関数
function createSafeDate(year: number, month: number): Date {
  // yearとmonthの値が妥当な範囲かチェック
  if (isNaN(year) || isNaN(month) || year < 1900 || year > 2100 || month < 0 || month > 11) {
    // 開発モードでのみ警告を表示
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Invalid date values: year=${year}, month=${month}. Using current date instead.`)
    }
    return new Date()
  }
  
  const date = new Date(year, month)
  return isValid(date) ? date : new Date()
}

// カスタムキャプションコンポーネント
function CustomCaption(props: any) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation()
  const [monthLabel, setMonthLabel] = React.useState("読み込み中...")
  
  // 現在の月を安全に取得
  React.useEffect(() => {
    try {
      if (props.calendarMonth && typeof props.calendarMonth.year === 'number' && 
          typeof props.calendarMonth.month === 'number') {
        
        // 安全に日付オブジェクトを作成
        const month = createSafeDate(props.calendarMonth.year, props.calendarMonth.month)
        setMonthLabel(format(month, "yyyy年MM月", { locale: ja }))
      } else if (previousMonth && isValid(previousMonth)) {
        // 前月がある場合、その次の月を表示
        const currentMonth = createSafeDate(
          previousMonth.getFullYear(), 
          previousMonth.getMonth() + 1
        )
        setMonthLabel(format(currentMonth, "yyyy年MM月", { locale: ja }))
      } else if (nextMonth && isValid(nextMonth)) {
        // 次月がある場合、その前の月を表示
        const currentMonth = createSafeDate(
          nextMonth.getFullYear(), 
          nextMonth.getMonth() - 1
        )
        setMonthLabel(format(currentMonth, "yyyy年MM月", { locale: ja }))
      } else {
        // フォールバックとして現在の日付を使用
        const today = new Date()
        setMonthLabel(format(today, "yyyy年MM月", { locale: ja }))
      }
    } catch (error) {
      // エラーのみログに残す
      if (process.env.NODE_ENV === 'development') {
        console.error('Error formatting date:', error)
      }
      const today = new Date()
      setMonthLabel(format(today, "yyyy年MM月", { locale: ja }))
    }
  }, [props.calendarMonth, previousMonth, nextMonth])

  return (
    <div className="flex justify-between items-center px-1">
      <button
        type="button"
        aria-label="前月へ"
        disabled={!previousMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        onClick={() => previousMonth && goToMonth(previousMonth)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="text-sm font-medium">
        {monthLabel}
      </div>

      <button
        type="button"
        aria-label="次月へ"
        disabled={!nextMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        onClick={() => nextMonth && goToMonth(nextMonth)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={ja}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex relative items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "hidden", // ナビゲーションは非表示にしてカスタムキャプションで処理
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground focus:bg-primary focus:text-primary-foreground [&:hover]:bg-primary [&:hover]:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:hover:!bg-accent/50 aria-selected:hover:!text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:hover:!bg-accent aria-selected:hover:!text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        MonthCaption: CustomCaption
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
