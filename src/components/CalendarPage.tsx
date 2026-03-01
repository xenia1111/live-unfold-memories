import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Star, Dumbbell, BookOpen, Coffee, Heart, Music, CalendarDays, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const iconMap: Record<string, any> = {
  coffee: Coffee, dumbbell: Dumbbell, book: BookOpen,
  music: Music, heart: Heart, star: Star,
};

const emojiMap: Record<string, string> = {
  dumbbell: "🏃", book: "📖", coffee: "☕",
  star: "🧘", heart: "📝", music: "🎵",
};

const categoryColorMap: Record<string, string> = {
  "运动": "bg-accent/15 text-accent",
  "学习": "bg-primary/15 text-primary",
  "社交": "bg-secondary/15 text-secondary",
  "健康": "bg-secondary/15 text-secondary",
  "记录": "bg-primary/15 text-primary",
};

interface Task {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  date: Date;
  category: string;
  coverImage?: string;
  completionPhoto?: string;
}

interface MockEvent {
  date: Date;
  title: string;
  icon: string;
  category: string;
  emoji: string;
  completionPhoto?: string;
}

const generateMockEvents = (): MockEvent[] => {
  const today = new Date();
  const events: MockEvent[] = [];
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (Math.random() > 0.4) {
      const items = [
        { title: "晨跑 30分钟", icon: "dumbbell", category: "运动", emoji: "🏃" },
        { title: "阅读《人类简史》", icon: "book", category: "学习", emoji: "📖" },
        { title: "咖啡时光", icon: "coffee", category: "社交", emoji: "☕" },
        { title: "冥想 15分钟", icon: "star", category: "健康", emoji: "🧘" },
        { title: "写日记", icon: "heart", category: "记录", emoji: "📝" },
      ];
      const item = items[Math.floor(Math.random() * items.length)];
      events.push({ date, ...item });
    }
  }
  return events;
};

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

interface MonthPickerProps {
  months: { key: string; label: string; items: any[] }[];
  onSelect: (key: string) => void;
  currentMonthKey: string;
}

const MonthPicker = ({ months, onSelect, currentMonthKey }: MonthPickerProps) => {
  const [open, setOpen] = useState(false);
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    months.forEach(g => { years.add(Number(g.key.split("-")[0])); });
    return Array.from(years).sort((a, b) => b - a);
  }, [months]);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());
  const monthKeyMap = useMemo(() => {
    const map = new Map<string, number>();
    months.forEach(g => map.set(g.key, g.items.length));
    return map;
  }, [months]);

  const currentLabel = useMemo(() => {
    const [y, m] = currentMonthKey.split("-");
    return `${y}年${Number(m) + 1}月`;
  }, [currentMonthKey]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/80 text-sm font-medium text-foreground hover:bg-muted transition-all active:scale-95">
          <CalendarDays size={14} className="text-primary" />
          {currentLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 pointer-events-auto rounded-2xl" align="start" sideOffset={8}>
        {/* Year row */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelectedYear(y => y - 1)} className="p-1.5 rounded-full hover:bg-muted transition-colors"><ChevronLeft size={16} className="text-muted-foreground" /></button>
          <span className="text-base font-bold text-foreground">{selectedYear}</span>
          <button onClick={() => setSelectedYear(y => y + 1)} className="p-1.5 rounded-full hover:bg-muted transition-colors"><ChevronRight size={16} className="text-muted-foreground" /></button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-4 gap-2">
          {MONTHS.map((label, i) => {
            const key = `${selectedYear}-${i}`;
            const count = monthKeyMap.get(key);
            const hasData = count !== undefined;
            const isCurrent = key === currentMonthKey;
            return (
              <button
                key={key}
                disabled={!hasData}
                onClick={() => { onSelect(key); setOpen(false); }}
                className={`relative py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md"
                    : hasData
                      ? "text-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
                      : "text-muted-foreground/25 cursor-not-allowed"
                }`}
              >
                {label}
                {hasData && !isCurrent && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface CalendarPageProps {
  tasks?: Task[];
}

const CalendarPage = ({ tasks = [] }: CalendarPageProps) => {
  const [mockEvents] = useState<MockEvent[]>(generateMockEvents);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showBackToTop, setShowBackToTop] = useState(false);

  const allEvents = useMemo(() => {
    const items: { date: Date; id: string; title: string; icon: string; category: string; completionPhoto?: string }[] = [];
    mockEvents.forEach(e => {
      items.push({ date: e.date, id: `mock-${e.date.getTime()}-${e.title}`, title: e.title, icon: e.icon, category: e.category, completionPhoto: e.completionPhoto });
    });
    tasks.forEach(t => {
      items.push({ date: t.date, id: t.id, title: t.title, icon: t.icon, category: t.category, completionPhoto: t.completionPhoto });
    });
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [mockEvents, tasks]);

  const groupedByMonth = useMemo(() => {
    const groups: { key: string; label: string; items: typeof allEvents }[] = [];
    const map = new Map<string, typeof allEvents>();
    allEvents.forEach(item => {
      const key = `${item.date.getFullYear()}-${item.date.getMonth()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    map.forEach((items, key) => {
      const label = format(items[0].date, "yyyy年 M月", { locale: zhCN });
      groups.push({ key, label, items });
    });
    return groups;
  }, [allEvents]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;

  const scrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const scrollToMonth = useCallback((key: string) => {
    monthRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="px-5 pt-10 pb-24 max-w-lg mx-auto" ref={scrollRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground font-serif">时间轴</h1>
        <div className="flex items-center gap-2">
          <MonthPicker months={groupedByMonth} onSelect={scrollToMonth} currentMonthKey={currentMonthKey} />
          <button
            onClick={scrollToToday}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            今天
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {allEvents.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 card-glow border border-border/50 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm text-muted-foreground">还没有记录哦</p>
          </div>
        ) : (
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-primary/20 to-transparent rounded-full" />

            {groupedByMonth.map((group, gi) => (
              <div key={group.key} ref={el => { if (el) monthRefs.current.set(group.key, el); }}>
                {/* Month header */}
                <div className="relative flex items-center gap-3 mb-4 mt-6 first:mt-0">
                  <div className="absolute -left-8 w-6 h-6 rounded-full gradient-warm flex items-center justify-center shadow-sm">
                    <span className="text-[10px] text-primary-foreground font-bold">
                      {format(group.items[0].date, "M", { locale: zhCN })}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">{group.label}</span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground/60">{group.items.length}条记录</span>
                </div>

                {group.items.map((item, i) => {
                  const emoji = emojiMap[item.icon] || "⭐";
                  const itemDateStr = format(item.date, "yyyy-MM-dd");
                  const isToday = itemDateStr === todayStr;
                  const catColor = categoryColorMap[item.category] || "bg-muted/60 text-muted-foreground";

                  return (
                    <div
                      key={item.id}
                      ref={isToday ? todayRef : undefined}
                      className="relative mb-3 animate-fade-in"
                      style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isToday ? 'bg-primary shadow-md animate-breathe' : 'bg-card border-2 border-primary/30'
                      }`}>
                        {isToday
                          ? <span className="text-primary-foreground text-[10px]">●</span>
                          : <span className="text-[11px]">{emoji}</span>
                        }
                      </div>

                      {/* Card */}
                      <div className={`rounded-2xl transition-all p-4 ${
                        isToday
                          ? 'bg-primary/5 border-2 border-primary/25 shadow-md'
                          : 'bg-card border border-border/40 card-glow hover:border-primary/15'
                      }`}>
                        {/* Date + tag row */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {format(item.date, "M/d EEEE", { locale: zhCN })}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-full">
                                今天
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                            {item.category}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="text-[15px] font-semibold text-foreground leading-snug">{item.title}</p>

                        {/* Photo */}
                        {item.completionPhoto && (
                          <img
                            src={item.completionPhoto}
                            alt={item.title}
                            className="w-full h-36 object-cover rounded-xl mt-2.5"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Timeline end */}
            <div className="relative flex items-center gap-3 mt-6 pb-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">∞</span>
              </div>
              <span className="text-xs text-muted-foreground/50 italic">更早的记录...</span>
            </div>
          </div>
        )}
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-44 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-50 active:scale-90"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default CalendarPage;
