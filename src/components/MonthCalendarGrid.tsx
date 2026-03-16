import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { startOfMonth, getDay, getDaysInMonth, isToday } from "date-fns";

interface MonthCalendarGridProps {
  year: number;
  month: number;
  completedDates: Set<string>;
  taskDates?: Set<string>;
  incompleteDates?: Set<string>;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

// Predefined "wobble" variations for hand-drawn feel
const WOBBLES = [
  "49% 51% 52% 48% / 50% 48% 52% 50%",
  "52% 48% 50% 50% / 48% 52% 50% 50%",
  "50% 50% 48% 52% / 52% 50% 50% 50%",
  "48% 52% 51% 49% / 50% 50% 48% 52%",
  "51% 49% 50% 50% / 49% 51% 52% 48%",
  "50% 50% 52% 48% / 51% 49% 50% 50%",
  "52% 48% 49% 51% / 50% 52% 48% 50%",
];

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
      <div className="grid grid-cols-7 gap-[3px]">
        {grid.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="w-full aspect-square" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dateObj = new Date(year, month, day);
          const hasCompleted = completedDates.has(dateStr);
          const hasTask = taskDates?.has(dateStr) ?? false;
          const hasIncomplete = incompleteDates?.has(dateStr) ?? false;
          const isTodayDate = isToday(dateObj);

          const showGreenCircle = hasCompleted;
          const showDarkCircle = !hasCompleted && hasTask;
          const showRedDot = hasIncomplete && !hasCompleted;
          const wobble = WOBBLES[day % WOBBLES.length];

          return (
            <div key={day} className="w-full aspect-square flex flex-col items-center justify-center">
              <span
                className={cn(
                  "w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] leading-none",
                  showGreenCircle && "bg-primary/80 text-primary-foreground font-semibold",
                  showDarkCircle && "bg-foreground/15 text-foreground font-medium",
                  !showGreenCircle && !showDarkCircle && isTodayDate && "text-primary font-bold",
                  !showGreenCircle && !showDarkCircle && !isTodayDate && "text-foreground/40"
                )}
                style={
                  (showGreenCircle || showDarkCircle)
                    ? { borderRadius: wobble }
                    : undefined
                }
              >
                {day}
              </span>
              {showRedDot && (
                <span className="w-[2.5px] h-[2.5px] rounded-full bg-destructive/60 mt-[1px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
