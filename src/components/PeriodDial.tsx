import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Period = "week" | "month" | "quarter" | "half" | "year";
type ViewMode = "period" | "category";

interface PeriodDialProps {
  activePeriod: Period;
  onPeriodChange: (period: Period) => void;
  viewMode: ViewMode;
  onViewModeToggle: () => void;
}

const periods: { id: Period; label: string }[] = [
  { id: "week", label: "W" },
  { id: "month", label: "M" },
  { id: "quarter", label: "Q" },
  { id: "half", label: "H" },
  { id: "year", label: "Y" },
];

const ANGLE_STEP = 360 / periods.length; // 72°

const PeriodDial = ({ activePeriod, onPeriodChange }: PeriodDialProps) => {
  const { t } = useI18n();
  const activeIndex = periods.findIndex(p => p.id === activePeriod);
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
      {/* Indicator notch at top */}
      <div className="relative z-10 mb-[-10px]">
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground/70" />
      </div>

      {/* Dial container - rotary phone style */}
      <div className="relative w-[220px] h-[220px]">
        {/* Outer black bezel */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 35%, hsl(0 0% 25%), hsl(0 0% 8%) 70%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)",
          }}
        />

        {/* Chrome ring */}
        <div
          className="absolute inset-[3px] rounded-full"
          style={{
            background: "linear-gradient(145deg, hsl(0 0% 40%), hsl(0 0% 20%) 50%, hsl(0 0% 35%))",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.3)",
          }}
        />

        {/* Inner dark face */}
        <div
          className="absolute inset-[6px] rounded-full"
          style={{
            background: "radial-gradient(circle at 45% 40%, hsl(0 0% 18%), hsl(0 0% 6%) 80%)",
          }}
        />

        {/* Finger stop dots around edge — static */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i * 12) * (Math.PI / 180);
          const r = 103;
          const x = 110 + r * Math.cos(angle);
          const y = 110 + r * Math.sin(angle);
          return (
            <div
              key={`dot-${i}`}
              className="absolute rounded-full"
              style={{
                width: "2px",
                height: "2px",
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
                background: "hsl(0 0% 30%)",
              }}
            />
          );
        })}

        {/* Rotating disc */}
        <div
          className="absolute inset-[18px] rounded-full transition-transform duration-500 ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: "radial-gradient(circle at 45% 40%, hsl(0 0% 22%), hsl(0 0% 10%) 75%)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.05)",
          }}
        >
          {/* Center hub — metal look */}
          <div
            className="absolute inset-[34%] rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 45% 40%, hsl(0 0% 30%), hsl(0 0% 12%) 80%)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: "radial-gradient(circle at 40% 35%, hsl(0 0% 35%), hsl(0 0% 15%))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
              }}
            />
          </div>

          {/* Period holes arranged in circle */}
          {periods.map((period, i) => {
            const angle = (i * ANGLE_STEP - 90) * (Math.PI / 180);
            const radius = 36;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const isActive = period.id === activePeriod;

            return (
              <button
                key={period.id}
                onClick={() => onPeriodChange(period.id)}
                className="absolute flex flex-col items-center justify-center transition-all duration-500"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                  transition: "transform 0.5s ease-out",
                  width: "42px",
                  height: "42px",
                }}
              >
                {/* The "hole" */}
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "w-[38px] h-[38px]" : "w-[34px] h-[34px]"
                  )}
                  style={{
                    background: isActive
                      ? "radial-gradient(circle at 45% 40%, hsl(0 0% 35%), hsl(0 0% 15%) 70%)"
                      : "radial-gradient(circle at 45% 40%, hsl(0 0% 12%), hsl(0 0% 4%) 70%)",
                    boxShadow: isActive
                      ? "inset 0 2px 6px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.08)"
                      : "inset 0 2px 4px rgba(0,0,0,0.7)",
                  }}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-wide transition-all duration-300",
                      isActive ? "text-white/90" : "text-white/40"
                    )}
                  >
                    {labelMap[period.id]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Finger stop — the little metal bump */}
        <div
          className="absolute"
          style={{
            left: "50%",
            bottom: "6px",
            transform: "translateX(-50%)",
            width: "8px",
            height: "4px",
            borderRadius: "2px",
            background: "linear-gradient(180deg, hsl(0 0% 50%), hsl(0 0% 30%))",
            boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </div>
  );
};

export default PeriodDial;
