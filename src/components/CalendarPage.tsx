import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Star, Dumbbell, BookOpen, Coffee, Heart, Music, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

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
  for (let i = 30; i >= 0; i--) {
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mockEvents] = useState<MockEvent[]>(generateMockEvents);

  // All events for the current month, grouped by date, sorted chronologically
  const monthEvents = useMemo(() => {
    const items: { date: Date; id: string; title: string; icon: string; category: string; completionPhoto?: string }[] = [];

    mockEvents.forEach(e => {
      if (e.date.getMonth() === currentMonth.getMonth() && e.date.getFullYear() === currentMonth.getFullYear()) {
        items.push({
          date: e.date,
          id: `mock-${e.date.getTime()}-${e.title}`,
          title: e.title,
          icon: e.icon,
          category: e.category,
          completionPhoto: e.completionPhoto,
        });
      }
    });

    tasks.forEach(t => {
      if (t.date.getMonth() === currentMonth.getMonth() && t.date.getFullYear() === currentMonth.getFullYear()) {
        items.push({
          date: t.date,
          id: t.id,
          title: t.title,
          icon: t.icon,
          category: t.category,
          completionPhoto: t.completionPhoto,
        });
      }
    });

    // Sort by date descending (newest first)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [currentMonth, mockEvents, tasks]);

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleMonthChange = (delta: number) => {
    const newMonth = delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header: month nav + today button */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-1">
          <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground font-serif">
            {format(currentMonth, "yyyy年 M月", { locale: zhCN })}
          </h1>
          <button onClick={() => handleMonthChange(1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <CalendarDays size={14} />
          今天
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {monthEvents.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 card-glow border border-border/50 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm text-muted-foreground">这个月还没有记录哦</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/40 to-accent/40 rounded-full" />

            {monthEvents.map((item, i) => {
              const Icon = iconMap[item.icon] || Star;
              return (
                <div key={item.id} className="relative mb-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-6 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>

                  {/* Card */}
                  <div className="bg-card rounded-2xl card-glow border border-border/50 hover:border-primary/20 transition-all p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {format(item.date, "M月d日 EEEE", { locale: zhCN })}
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
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
