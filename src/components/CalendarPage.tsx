import { useState, useMemo, useRef, useCallback } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Star, Dumbbell, BookOpen, Coffee, Heart, Music, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PhotoGrid from "@/components/PhotoGrid";
import EditTaskDialog from "@/components/EditTaskDialog";
import type { Task } from "@/hooks/useTasks";

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


interface MockEvent {
  date: Date;
  title: string;
  icon: string;
  category: string;
  emoji: string;
  photos: string[];
}

const mockPhotos = [
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=400&h=300&fit=crop",
];

const generateMockEvents = (): MockEvent[] => {
  const today = new Date();
  const events: MockEvent[] = [];
  let photoIdx = 0;
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
      // 随机 0-6 张图片
      const photoCount = Math.random() > 0.35 ? Math.floor(Math.random() * 6) + 1 : 0;
      const photos: string[] = [];
      for (let p = 0; p < photoCount; p++) {
        photos.push(mockPhotos[photoIdx++ % mockPhotos.length]);
      }
      events.push({
        date,
        ...item,
        photos,
      });
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
  onUpdateTask?: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
}

const CalendarPage = ({ tasks = [], onUpdateTask, onDeleteTask }: CalendarPageProps) => {
  const [mockEvents] = useState<MockEvent[]>(generateMockEvents);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allEvents = useMemo(() => {
    const items: { date: Date; id: string; title: string; icon: string; category: string; photos: string[] }[] = [];
    mockEvents.forEach(e => {
      items.push({ date: e.date, id: `mock-${e.date.getTime()}-${e.title}`, title: e.title, icon: e.icon, category: e.category, photos: e.photos });
    });
    tasks.filter(t => t.date && t.date <= new Date()).forEach(t => {
      items.push({ date: t.date!, id: t.id, title: t.title, icon: t.icon, category: t.category, photos: t.completionPhoto ? [t.completionPhoto] : [] });
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

  return (
    <div ref={scrollRef}>
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground font-serif">时间轴</h1>
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
      </div>

      {/* Content with top padding to compensate for fixed header */}
      <div className="px-5 pt-16 pb-24 max-w-lg mx-auto">
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

              {groupedByMonth.map((group) => (
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
                        <div
                          onClick={() => {
                            if (!item.id.startsWith('mock-')) {
                              const found = tasks.find(t => t.id === item.id);
                              if (found) setEditingTask(found);
                            }
                          }}
                          className={`rounded-2xl transition-all p-4 ${
                            !item.id.startsWith('mock-') ? 'cursor-pointer active:scale-[0.98]' : ''
                          } ${
                            isToday
                              ? 'bg-primary/5 border-2 border-primary/25 shadow-md'
                              : 'bg-card border border-border/40 card-glow hover:border-primary/15'
                          }`}
                        >
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

                          {/* Photos */}
                          {item.photos.length > 0 && (
                            <PhotoGrid photos={item.photos} alt={item.title} />
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
      </div>

      {onUpdateTask && onDeleteTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null); }}
          onSave={onUpdateTask}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  );
};

export default CalendarPage;
