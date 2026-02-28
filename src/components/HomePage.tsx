import { useState } from "react";
import { format, addDays, subDays, isToday, isFuture, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CheckCircle2, Circle, Clock, Sparkles, ChevronRight,
  Sun, Moon, Coffee, Dumbbell, BookOpen, Music, Heart, Star
} from "lucide-react";
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
}

const generateMockTasks = (): Task[] => {
  const today = new Date();
  return [
    { id: "1", title: "晨跑 30 分钟", time: "07:00", icon: "dumbbell", completed: true, date: subDays(today, 5), category: "运动" },
    { id: "2", title: "阅读《人类简史》", time: "09:00", icon: "book", completed: true, date: subDays(today, 4), category: "学习" },
    { id: "3", title: "和朋友喝咖啡", time: "14:00", icon: "coffee", completed: true, date: subDays(today, 3), category: "社交" },
    { id: "4", title: "听播客学英语", time: "20:00", icon: "music", completed: true, date: subDays(today, 2), category: "学习" },
    { id: "5", title: "健身房力量训练", time: "18:00", icon: "dumbbell", completed: true, date: subDays(today, 1), category: "运动" },
    { id: "6", title: "写日记", time: "22:00", icon: "heart", completed: false, date: today, category: "记录" },
    { id: "7", title: "冥想 15 分钟", time: "07:30", icon: "star", completed: false, date: today, category: "健康" },
    { id: "8", title: "学习 React", time: "10:00", icon: "book", completed: false, date: addDays(today, 1), category: "学习" },
    { id: "9", title: "约朋友看电影", time: "19:00", icon: "heart", completed: false, date: addDays(today, 2), category: "社交" },
    { id: "10", title: "准备周报", time: "09:00", icon: "star", completed: false, date: addDays(today, 3), category: "工作" },
    { id: "11", title: "瑜伽课", time: "18:00", icon: "dumbbell", completed: false, date: addDays(today, 4), category: "运动" },
    { id: "12", title: "读完一本新书", time: "全天", icon: "book", completed: false, date: addDays(today, 5), category: "学习" },
  ];
};

const HomePage = () => {
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks);
  const today = new Date();

  const pastTasks = tasks.filter(t => isPast(t.date) && !isToday(t.date));
  const todayTasks = tasks.filter(t => isToday(t.date));
  const futureTasks = tasks.filter(t => isFuture(t.date) && !isToday(t.date));

  const completedCount = pastTasks.filter(t => t.completed).length;
  const totalPast = pastTasks.length;
  const progressPercent = totalPast > 0 ? Math.round((completedCount / totalPast) * 100) : 0;

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: "早上好", icon: Sun };
    if (h < 18) return { text: "下午好", icon: Sun };
    return { text: "晚上好", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-2 mb-1">
          <GreetingIcon size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">{greeting.text}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">鲜活生命</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(today, "yyyy年M月d日 EEEE", { locale: zhCN })}
        </p>
      </div>

      {/* Past Week Progress */}
      <section className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">过去一周</h2>
          <span className="text-xs text-muted-foreground">{completedCount}/{totalPast} 已完成</span>
        </div>
        <div className="bg-card rounded-2xl p-5 card-glow border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={18} className="text-primary" />
            <span className="text-sm text-foreground font-medium">
              {progressPercent >= 80 ? "太棒了！生活充实而精彩 ✨" :
               progressPercent >= 50 ? "不错哦，继续保持！" :
               "新的一周，新的开始 💪"}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-progress animate-progress-fill"
              style={{ "--progress-width": `${progressPercent}%` } as React.CSSProperties}
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {pastTasks.map((task) => {
              const Icon = iconMap[task.icon] || Star;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all",
                    task.completed
                      ? "bg-forest-light text-secondary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon size={16} />
                  <span className="whitespace-nowrap max-w-[60px] truncate">{task.title}</span>
                  {task.completed && <CheckCircle2 size={12} />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Today */}
      <section className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-lg font-semibold text-foreground font-serif mb-3">今天</h2>
        <div className="space-y-3">
          {todayTasks.map((task) => {
            const Icon = iconMap[task.icon] || Star;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
              >
                {task.completed
                  ? <CheckCircle2 size={22} className="text-secondary flex-shrink-0" />
                  : <Circle size={22} className="text-muted-foreground flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{task.time}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">{task.category}</span>
                  </div>
                </div>
                <Icon size={18} className="text-primary/60 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Upcoming */}
      <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">即将到来</h2>
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {futureTasks.map((task) => {
            const Icon = iconMap[task.icon] || Star;
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex flex-col items-center justify-center">
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {format(task.date, "M月", { locale: zhCN })}
                  </span>
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {format(task.date, "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{task.time}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">{task.category}</span>
                  </div>
                </div>
                <Icon size={18} className="text-primary/60 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
