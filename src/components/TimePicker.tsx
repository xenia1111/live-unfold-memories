import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

type TimeMode = "none" | "allday" | "point" | "range";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

interface TimePickerProps {
  value: string; // stored format: "不限" | "全天" | "HH:MM" | "HH:MM-HH:MM"
  onChange: (value: string) => void;
}

function parseValue(value: string): { mode: TimeMode; startH: string; startM: string; endH: string; endM: string } {
  if (value === "不限") return { mode: "none", startH: "09", startM: "00", endH: "10", endM: "00" };
  if (value === "全天") return { mode: "allday", startH: "09", startM: "00", endH: "10", endM: "00" };
  if (value.includes("-")) {
    const [start, end] = value.split("-");
    const [sh, sm] = start.split(":");
    const [eh, em] = end.split(":");
    return { mode: "range", startH: sh, startM: sm, endH: eh, endM: em };
  }
  const [h, m] = value.split(":");
  return { mode: "point", startH: h || "09", startM: m || "00", endH: "10", endM: "00" };
}

const ScrollWheel = ({ items, selected, onSelect, label }: { items: string[]; selected: string; onSelect: (v: string) => void; label: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 36;
  const isScrolling = useRef(false);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && containerRef.current && !isScrolling.current) {
      containerRef.current.scrollTop = idx * ITEM_H;
    }
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    isScrolling.current = true;
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== selected) {
      onSelect(items[clamped]);
    }
    // snap after scroll ends
    clearTimeout((containerRef.current as any)._snapTimer);
    (containerRef.current as any)._snapTimer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      }
      isScrolling.current = false;
    }, 100);
  }, [items, selected, onSelect]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="relative h-[108px] w-14 overflow-hidden rounded-xl bg-muted/30">
        {/* highlight band */}
        <div className="pointer-events-none absolute inset-x-0 top-[36px] h-[36px] rounded-lg bg-primary/15 z-10 border-y border-primary/20" />
        {/* gradient masks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-card to-transparent z-20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-card to-transparent z-20" />
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ paddingTop: ITEM_H, paddingBottom: ITEM_H }}
        >
          {items.map((item) => (
            <div
              key={item}
              className={cn(
                "h-[36px] flex items-center justify-center text-sm font-medium snap-center transition-colors cursor-pointer",
                item === selected ? "text-primary" : "text-muted-foreground/50"
              )}
              onClick={() => {
                onSelect(item);
                const idx = items.indexOf(item);
                containerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TimePicker = ({ value, onChange }: TimePickerProps) => {
  const parsed = parseValue(value);
  const [mode, setMode] = useState<TimeMode>(parsed.mode);
  const [startH, setStartH] = useState(parsed.startH);
  const [startM, setStartM] = useState(parsed.startM);
  const [endH, setEndH] = useState(parsed.endH);
  const [endM, setEndM] = useState(parsed.endM);

  // Sync back
  useEffect(() => {
    if (mode === "none") onChange("不限");
    else if (mode === "allday") onChange("全天");
    else if (mode === "point") onChange(`${startH}:${startM}`);
    else if (mode === "range") onChange(`${startH}:${startM}-${endH}:${endM}`);
  }, [mode, startH, startM, endH, endM]);

  // Re-parse when value changes externally
  useEffect(() => {
    const p = parseValue(value);
    setMode(p.mode);
    setStartH(p.startH);
    setStartM(p.startM);
    setEndH(p.endH);
    setEndM(p.endM);
  }, []);

  const modeOptions: { key: TimeMode; label: string }[] = [
    { key: "none", label: "不限" },
    { key: "allday", label: "全天" },
    { key: "point", label: "时间点" },
    { key: "range", label: "时间区间" },
  ];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">⏰ 什么时候？</p>
      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-3">
        {modeOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs transition-all flex-1",
              mode === opt.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Scroll wheels for point */}
      {mode === "point" && (
        <div className="flex items-center justify-center gap-2 py-2">
          <ScrollWheel items={HOURS} selected={startH} onSelect={setStartH} label="时" />
          <span className="text-lg text-muted-foreground font-bold mt-5">:</span>
          <ScrollWheel items={MINUTES} selected={startM} onSelect={setStartM} label="分" />
        </div>
      )}

      {/* Scroll wheels for range */}
      {mode === "range" && (
        <div className="flex items-center justify-center gap-2 py-2">
          <ScrollWheel items={HOURS} selected={startH} onSelect={setStartH} label="时" />
          <span className="text-lg text-muted-foreground font-bold mt-5">:</span>
          <ScrollWheel items={MINUTES} selected={startM} onSelect={setStartM} label="分" />
          <span className="text-xs text-muted-foreground mt-5 mx-1">至</span>
          <ScrollWheel items={HOURS} selected={endH} onSelect={setEndH} label="时" />
          <span className="text-lg text-muted-foreground font-bold mt-5">:</span>
          <ScrollWheel items={MINUTES} selected={endM} onSelect={setEndM} label="分" />
        </div>
      )}
    </div>
  );
};

export default TimePicker;
