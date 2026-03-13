import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Period = "week" | "month" | "quarter" | "half" | "year";

interface PeriodDialProps {
  activePeriod: Period;
  onPeriodChange: (period: Period) => void;
}

const periods: { id: Period; icon: string }[] = [
  { id: "week", icon: "📅" },
  { id: "month", icon: "🗓️" },
  { id: "quarter", icon: "🌙" },
  { id: "half", icon: "☀️" },
  { id: "year", icon: "🌟" },
];

const ANGLE_STEP = 360 / periods.length; // 72°

const PeriodDial = ({ activePeriod, onPeriodChange }: PeriodDialProps) => {
  const { t } = useI18n();
  const activeIndex = periods.findIndex(p => p.id === activePeriod);
  // Rotate so active item is at the top (0°)
  const rotation = -activeIndex * ANGLE_STEP;

  const labelMap: Record<Period, string> = {
    week: t("story.week"),
    month: t("story.month"),
    quarter: t("story.quarter"),
    half: t("story.half"),
    year: t("story.year"),
  };

  return (
    <div className="flex flex-col items-center mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {/* Indicator arrow */}
      <div className="relative z-10 mb-[-8px]">
        <div className="w-3 h-3 rotate-45 bg-primary/60 rounded-sm" />
      </div>

      {/* Dial container */}
      <div className="relative w-[200px] h-[200px]">
        {/* Outer ring decoration */}
        <div className="absolute inset-0 rounded-full border-2 border-border/30 bg-card/30 backdrop-blur-sm" />
        
        {/* Gold dots around the edge */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 18) * (Math.PI / 180);
          const x = 100 + 95 * Math.cos(angle);
          const y = 100 + 95 * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/20"
              style={{ left: `${x}px`, top: `${y}px`, transform: "translate(-50%, -50%)" }}
            />
          );
        })}

        {/* Rotating disc */}
        <div
          className="absolute inset-[12px] rounded-full border border-border/20 bg-card/50 transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Inner decorative circle */}
          <div className="absolute inset-[30%] rounded-full border border-primary/15 bg-primary/5 flex items-center justify-center">
            <span className="text-lg" style={{ transform: `rotate(${-rotation}deg)`, transition: "transform 0.5s ease-out" }}>
              🎞️
            </span>
          </div>

          {/* Period items arranged in circle */}
          {periods.map((period, i) => {
            const angle = (i * ANGLE_STEP - 90) * (Math.PI / 180); // -90 to start from top
            const radius = 38; // % from center
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const isActive = period.id === activePeriod;
            const itemRotation = i * ANGLE_STEP; // Counter-rotate text

            return (
              <button
                key={period.id}
                onClick={() => onPeriodChange(period.id)}
                className="absolute flex flex-col items-center gap-0.5 transition-all duration-500"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                  transition: "transform 0.5s ease-out",
                }}
              >
                <span className={cn(
                  "text-base transition-transform duration-300",
                  isActive && "scale-125"
                )}>
                  {period.icon}
                </span>
                <span className={cn(
                  "text-[10px] font-medium whitespace-nowrap transition-all duration-300",
                  isActive ? "text-primary font-bold" : "text-muted-foreground/60"
                )}>
                  {labelMap[period.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sprocket holes inside ring */}
        {periods.map((_, i) => {
          const angle = (i * ANGLE_STEP - 90) * (Math.PI / 180);
          const x = 100 + 80 * Math.cos(angle);
          const y = 100 + 80 * Math.sin(angle);
          return (
            <div
              key={`hole-${i}`}
              className="absolute w-2 h-2 rounded-full bg-background border border-border/20"
              style={{ left: `${x}px`, top: `${y}px`, transform: "translate(-50%, -50%)" }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PeriodDial;
