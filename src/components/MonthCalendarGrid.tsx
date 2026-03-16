import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { startOfMonth, getDay, getDaysInMonth, isToday } from "date-fns";

interface MonthCalendarGridProps {
  year: number;
  month: number; // 0-indexed
  completedDates: Set<string>; // "YYYY-MM-DD"
  taskDates?: Set<string>; // all dates with tasks
  incompleteDates?: Set<string>; // dates with incomplete tasks
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const MonthCalendarGrid = ({ year, month, completedDates, taskDates, incompleteDates }: MonthCalendarGridProps) => {
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
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-[8px] text-muted-foreground/50 font-medium">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="w-full aspect-square" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dateObj = new Date(year, month, day);
          const hasCompleted = completedDates.has(dateStr);
          const hasTask = taskDates?.has(dateStr) ?? false;
          const hasIncomplete = incompleteDates?.has(dateStr) ?? false;
          const isTodayDate = isToday(dateObj);

          // Green circle for completed, black circle for has-task-but-no-completion
          const showGreenCircle = hasCompleted;
          const showDarkCircle = !hasCompleted && hasTask;
          // Red dot for incomplete tasks (only if not already showing green)
          const showRedDot = hasIncomplete && !hasCompleted;

          return (
            <div
              key={day}
              className="w-full aspect-square flex flex-col items-center justify-center relative"
            >
              <span
                className={cn(
                  "w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] leading-none",
                  showGreenCircle && "ring-[1.5px] ring-primary text-primary font-semibold",
                  showDarkCircle && "ring-[1.5px] ring-foreground/70 text-foreground/70 font-medium",
                  !showGreenCircle && !showDarkCircle && isTodayDate && "text-primary font-bold",
                  !showGreenCircle && !showDarkCircle && !isTodayDate && "text-foreground/40"
                )}
              >
                {day}
              </span>
              {showRedDot && (
                <span className="w-[3px] h-[3px] rounded-full bg-destructive/70 mt-[1px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
