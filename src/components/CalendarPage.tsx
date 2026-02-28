import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Star, Dumbbell, BookOpen, Coffee, Heart, Music } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  coffee: Coffee, dumbbell: Dumbbell, book: BookOpen,
  music: Music, heart: Heart, star: Star,
};

interface CalendarEvent {
  date: Date;
  title: string;
  icon: string;
  category: string;
}

const generateEvents = (): CalendarEvent[] => {
  const today = new Date();
  const events: CalendarEvent[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (Math.random() > 0.4) {
      const items = [
        { title: "晨跑", icon: "dumbbell", category: "运动" },
        { title: "阅读", icon: "book", category: "学习" },
        { title: "咖啡时光", icon: "coffee", category: "社交" },
        { title: "冥想", icon: "star", category: "健康" },
        { title: "写日记", icon: "heart", category: "记录" },
      ];
      const item = items[Math.floor(Math.random() * items.length)];
      events.push({ date, ...item });
    }
  }
  return events;
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events] = useState<CalendarEvent[]>(generateEvents);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const eventsForDate = (date: Date) => events.filter(e => isSameDay(e.date, date));
  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground font-serif">
          {format(currentMonth, "yyyy年 M月", { locale: zhCN })}
        </h1>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight size={20} className="text-foreground" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl p-4 card-glow border border-border/50 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const hasEvents = eventsForDate(day).length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative",
                  isSelected ? "bg-primary text-primary-foreground font-bold" :
                  today ? "bg-muted font-semibold text-foreground" :
                  "text-foreground hover:bg-muted"
                )}
              >
                {format(day, "d")}
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-base font-semibold text-foreground font-serif mb-3">
            {format(selectedDate, "M月d日 EEEE", { locale: zhCN })}
          </h2>
          {selectedEvents.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 card-glow border border-border/50 text-center">
              <p className="text-sm text-muted-foreground">这一天还没有记录哦 ✨</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event, i) => {
                const Icon = iconMap[event.icon] || Star;
                return (
                  <div key={i} className="flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-forest-light flex items-center justify-center">
                      <Icon size={18} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <span className="text-xs text-muted-foreground">{event.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
