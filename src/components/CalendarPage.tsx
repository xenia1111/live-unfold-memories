import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Star, Dumbbell, BookOpen, Coffee, Heart, Music, CalendarDays, ArrowUp } from "lucide-react";

const iconMap: Record<string, any> = {
  coffee: Coffee, dumbbell: Dumbbell, book: BookOpen,
  music: Music, heart: Heart, star: Star,
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
  // Generate 90 days of mock data (past 3 months)
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

interface CalendarPageProps {
  tasks?: Task[];
}

const CalendarPage = ({ tasks = [] }: CalendarPageProps) => {
  const [mockEvents] = useState<MockEvent[]>(generateMockEvents);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Merge all events and sort by date descending
  const allEvents = useMemo(() => {
    const items: { date: Date; id: string; title: string; icon: string; category: string; completionPhoto?: string }[] = [];

    mockEvents.forEach(e => {
      items.push({
        date: e.date,
        id: `mock-${e.date.getTime()}-${e.title}`,
        title: e.title,
        icon: e.icon,
        category: e.category,
        completionPhoto: e.completionPhoto,
      });
    });

    tasks.forEach(t => {
      items.push({
        date: t.date,
        id: t.id,
        title: t.title,
        icon: t.icon,
        category: t.category,
        completionPhoto: t.completionPhoto,
      });
    });

    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [mockEvents, tasks]);

  // Group events by month
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

  // Find today's date string for ref matching
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const scrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const scrollToMonth = useCallback((key: string) => {
    monthRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Track scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto" ref={scrollRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground font-serif">时间轴</h1>
        <button
          onClick={scrollToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <CalendarDays size={14} />
          回到今天
        </button>
      </div>

      {/* Month quick switch */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {groupedByMonth.map((group) => {
          const shortLabel = format(new Date(group.items[0].date), "M月", { locale: zhCN });
          return (
            <button
              key={group.key}
              onClick={() => scrollToMonth(group.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-muted/60 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {shortLabel}
            </button>
          );
        })}
      </div>

      {/* Endless Vertical Timeline */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {allEvents.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 card-glow border border-border/50 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm text-muted-foreground">还没有记录哦</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/40 to-accent/40 rounded-full" />

            {groupedByMonth.map((group) => (
              <div key={group.key} ref={el => { if (el) monthRefs.current.set(group.key, el); }}>
                {/* Month label */}
                <div className="relative mb-3 mt-2">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-bold text-primary">{group.label}</span>
                </div>

                {group.items.map((item, i) => {
                  const Icon = iconMap[item.icon] || Star;
                  const itemDateStr = format(item.date, "yyyy-MM-dd");
                  const isToday = itemDateStr === todayStr;
                  return (
                    <div
                      key={item.id}
                      ref={isToday ? todayRef : undefined}
                      className="relative mb-4 animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 top-6 w-4 h-4 rounded-full flex items-center justify-center ${isToday ? 'bg-primary/40' : 'bg-primary/20'}`}>
                        <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
                      </div>

                      {/* Card */}
                      <div className={`bg-card rounded-2xl card-glow border hover:border-primary/20 transition-all p-4 ${isToday ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {format(item.date, "M月d日 EEEE", { locale: zhCN })}
                            {isToday && <span className="ml-1.5 text-primary font-medium">今天</span>}
                          </span>
                          <Icon size={20} className="text-muted-foreground/60" />
                        </div>

                        <p className="text-base font-bold text-foreground mb-2">{item.title}</p>

                        {item.completionPhoto && (
                          <img
                            src={item.completionPhoto}
                            alt={item.title}
                            className="w-full h-40 object-cover rounded-xl mb-2"
                          />
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-muted/60 rounded-md text-muted-foreground">{item.category}</span>
                          <span className="text-xs text-primary flex items-center gap-0.5">✓ 已完成</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-5 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-50"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default CalendarPage;
