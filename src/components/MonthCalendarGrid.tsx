import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, getDay, getDaysInMonth, isToday, format } from "date-fns";

interface MonthCalendarGridProps {
  year: number;
  month: number; // 0-indexed
  completedDates: Set<string>; // format "YYYY-MM-DD"
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const MonthCalendarGrid = ({ year, month, completedDates }: MonthCalendarGridProps) => {
  const grid = useMemo(() => {
    const firstDay = startOfMonth(new Date(year, month));
    const startDow = getDay(firstDay);
    const daysInMonth = getDaysInMonth(firstDay);
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-[8px] text-muted-foreground/50 font-medium">
            {label}
          </div>
        ))}
      </div>
      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="w-full aspect-square" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dateObj = new Date(year, month, day);
          const hasCompleted = completedDates.has(dateStr);
          const isTodayDate = isToday(dateObj);

          return (
            <div
              key={day}
              className={cn(
                "w-full aspect-square flex items-center justify-center relative rounded-full text-[9px]",
                isTodayDate && "ring-1 ring-primary/50 font-bold text-primary",
                !isTodayDate && "text-foreground/50"
              )}
            >
              {day}
              {hasCompleted && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
