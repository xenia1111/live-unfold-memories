import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, isToday, addMonths, subMonths, setDate as setDateFns } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Star, Dumbbell, BookOpen, Coffee, Heart, Music, CalendarDays } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [mockEvents] = useState<MockEvent[]>(generateMockEvents);

  const daysInMonth = getDaysInMonth(currentMonth);
  const selectedDate = setDateFns(currentMonth, Math.min(selectedDay, daysInMonth));

  // Merge mock events + real tasks for the selected date
  const selectedItems = useMemo(() => {
    const mockForDate = mockEvents
      .filter(e => isSameDay(e.date, selectedDate))
      .map(e => ({
        id: `mock-${e.date.getTime()}-${e.title}`,
        title: e.title,
        icon: e.icon,
        category: e.category,
        emoji: e.emoji,
        completionPhoto: e.completionPhoto,
        time: "",
      }));

    const tasksForDate = tasks
      .filter(t => isSameDay(t.date, selectedDate))
      .map(t => ({
        id: t.id,
        title: t.title,
        icon: t.icon,
        category: t.category,
        emoji: t.icon,
        completionPhoto: t.completionPhoto,
        time: t.time,
      }));

    return [...tasksForDate, ...mockForDate];
  }, [selectedDate, mockEvents, tasks]);

  // Days that have events (for slider track markers)
  const daysWithEvents = useMemo(() => {
    const days = new Set<number>();
    mockEvents.forEach(e => {
      if (e.date.getMonth() === currentMonth.getMonth() && e.date.getFullYear() === currentMonth.getFullYear()) {
        days.add(e.date.getDate());
      }
    });
    tasks.forEach(t => {
      if (t.date.getMonth() === currentMonth.getMonth() && t.date.getFullYear() === currentMonth.getFullYear()) {
        days.add(t.date.getDate());
      }
    });
    return days;
  }, [currentMonth, mockEvents, tasks]);

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDay(today.getDate());
  };

  const handleMonthChange = (delta: number) => {
    const newMonth = delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    const newDays = getDaysInMonth(newMonth);
    setSelectedDay(Math.min(selectedDay, newDays));
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

      {/* Date Slider */}
      <div className="bg-card rounded-2xl p-5 card-glow border border-border/50 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {/* Slider track with event markers */}
        <div className="relative mb-3">
          <Slider
            value={[selectedDay]}
            onValueChange={(v) => setSelectedDay(v[0])}
            min={1}
            max={daysInMonth}
            step={1}
            className="w-full"
          />
          {/* Event dot markers */}
          <div className="absolute top-full mt-1.5 left-0 right-0 flex justify-between px-[10px] pointer-events-none">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <div key={day} className="flex flex-col items-center" style={{ width: 0 }}>
                {daysWithEvents.has(day) && day !== selectedDay && (
                  <div className="w-1 h-1 rounded-full bg-primary/50" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Date labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
          <span>{format(startOfMonth(currentMonth), "M/d")}</span>
          <span>{format(endOfMonth(currentMonth), "M/d")}</span>
        </div>

        {/* Selected date display */}
        <div className="text-center">
          <p className={cn(
            "text-lg font-bold font-serif text-foreground",
            isToday(selectedDate) && "text-primary"
          )}>
            {format(selectedDate, "M月d日 EEEE", { locale: zhCN })}
            {isToday(selectedDate) && <span className="text-xs ml-2 text-primary">· 今天</span>}
          </p>
        </div>
      </div>

      {/* Timeline Cards */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
      {selectedItems.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 card-glow border border-border/50 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm text-muted-foreground">这一天还没有记录哦</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/40 to-accent/40 rounded-full" />

            {selectedItems.map((item, i) => {
              const Icon = iconMap[item.icon] || Star;
              return (
                <div key={item.id} className="relative mb-4 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-6 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>

                  {/* Card */}
                  <div className="bg-card rounded-2xl card-glow border border-border/50 hover:border-primary/20 transition-all p-4">
                    {/* Date + Icon row */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {format(selectedDate, "M月d日 EEEE", { locale: zhCN })}
                      </span>
                      <Icon size={20} className="text-muted-foreground/60" />
                    </div>

                    {/* Title */}
                    <p className="text-base font-bold text-foreground mb-2">{item.title}</p>

                    {/* Completion photo */}
                    {item.completionPhoto && (
                      <img
                        src={item.completionPhoto}
                        alt={item.title}
                        className="w-full h-40 object-cover rounded-xl mb-2"
                      />
                    )}

                    {/* Category + Status */}
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
