import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, isFuture, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CheckCircle2, Circle, Clock, Sparkles, ChevronRight,
  Sun, Moon, Coffee, Dumbbell, BookOpen, Music, Heart, Star,
  PartyPopper, Flame
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

const encouragements = [
  "你正在创造美好的回忆 ✨",
  "每一个小事都闪闪发光 🌟",
  "今天也是值得期待的一天 💛",
  "你的生活比你以为的更精彩 🌈",
];

interface HomePageProps {
  extraTasks?: Task[];
  onTasksChange?: (tasks: Task[]) => void;
}

const HomePage = ({ extraTasks = [], onTasksChange }: HomePageProps) => {
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks);
  const allTasks = [...tasks, ...extraTasks];
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [encouragement] = useState(() => encouragements[Math.floor(Math.random() * encouragements.length)]);
  const today = new Date();

  const pastTasks = allTasks.filter(t => isPast(t.date) && !isToday(t.date));
  const todayTasks = allTasks.filter(t => isToday(t.date));
  const futureTasks = allTasks.filter(t => isFuture(t.date) && !isToday(t.date));

  const completedCount = pastTasks.filter(t => t.completed).length;
  const totalPast = pastTasks.length;
  const progressPercent = totalPast > 0 ? Math.round((completedCount / totalPast) * 100) : 0;

  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 800);
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return { text: "夜深了，好好休息", icon: Moon, emoji: "🌙" };
    if (h < 9) return { text: "早安，新的一天开始啦", icon: Sun, emoji: "🌅" };
    if (h < 12) return { text: "上午好，元气满满", icon: Sun, emoji: "☀️" };
    if (h < 14) return { text: "午安，记得休息一下", icon: Coffee, emoji: "🍵" };
    if (h < 18) return { text: "下午好，继续加油", icon: Sun, emoji: "🌤️" };
    if (h < 21) return { text: "傍晚好，今天辛苦了", icon: Moon, emoji: "🌇" };
    return { text: "晚安，今天也很棒", icon: Moon, emoji: "🌛" };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header with warm greeting */}
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl animate-float">{greeting.emoji}</span>
          <span className="text-sm text-muted-foreground">{greeting.text}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">鲜活生命</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(today, "yyyy年M月d日 EEEE", { locale: zhCN })}
        </p>
        {/* Encouragement banner */}
        <div className="mt-4 px-4 py-3 rounded-2xl animate-shimmer border border-primary/10">
          <p className="text-sm text-foreground/80 font-medium">{encouragement}</p>
        </div>
      </div>

      {/* Today - promoted to top with emotional framing */}
      <section className="mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-accent animate-pulse-warm" />
            <h2 className="text-lg font-semibold text-foreground font-serif">今天想做的事</h2>
          </div>
          {todayTotal > 0 && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              todayCompleted === todayTotal
                ? "bg-forest-light text-secondary"
                : "bg-muted text-muted-foreground"
            )}>
              {todayCompleted === todayTotal ? "🎉 全部完成！" : `${todayCompleted}/${todayTotal}`}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {todayTasks.map((task, index) => {
            const Icon = iconMap[task.icon] || Star;
            const isCelebrating = justCompleted === task.id;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-full flex items-center gap-4 bg-card rounded-2xl p-4 border border-border/50 text-left transition-all active:scale-[0.97]",
                  task.completed ? "card-glow" : "animate-breathe",
                  isCelebrating && "animate-celebrate"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {task.completed
                  ? <CheckCircle2 size={24} className="text-secondary flex-shrink-0" />
                  : <Circle size={24} className="text-muted-foreground/40 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-all",
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={11} className="text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground/60">{task.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted/60 rounded-md text-muted-foreground">{task.category}</span>
                  </div>
                </div>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                  task.completed ? "bg-forest-light" : "bg-muted/50"
                )}>
                  <Icon size={16} className={cn(
                    "transition-colors",
                    task.completed ? "text-secondary" : "text-primary/50"
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Past Week - emotional progress */}
      <section className="mb-8 animate-fade-in" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PartyPopper size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground font-serif">过去一周的你</h2>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 card-glow border border-border/50">
          {/* Emotional message based on progress */}
          <div className="mb-4 text-center">
            <p className="text-2xl mb-2">
              {progressPercent >= 80 ? "🌟" : progressPercent >= 50 ? "💪" : "🌱"}
            </p>
            <p className="text-sm text-foreground font-medium">
              {progressPercent >= 80
                ? "太棒了！你的生活充实而精彩"
                : progressPercent >= 50
                ? "做得不错，每一步都算数"
                : "每一颗种子都会发芽 🌿"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              完成了 {completedCount} / {totalPast} 件想做的事
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full gradient-progress animate-progress-fill"
              style={{ "--progress-width": `${progressPercent}%` } as React.CSSProperties}
            />
          </div>
          {/* Past tasks as warm memory chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {pastTasks.map((task) => {
              const Icon = iconMap[task.icon] || Star;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition-all",
                    task.completed
                      ? "bg-forest-light text-secondary"
                      : "bg-muted/50 text-muted-foreground/60"
                  )}
                >
                  <Icon size={16} />
                  <span className="whitespace-nowrap max-w-[60px] truncate">{task.title}</span>
                  {task.completed && <span className="text-[10px]">✓ 做到了</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming - framed as exciting things */}
      <section className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary animate-pulse-warm" />
            <h2 className="text-lg font-semibold text-foreground font-serif">即将发生的美好</h2>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {futureTasks.map((task, index) => {
            const Icon = iconMap[task.icon] || Star;
            const daysFromNow = Math.ceil((task.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const dayLabel = daysFromNow === 1 ? "明天" : daysFromNow === 2 ? "后天" : `${daysFromNow}天后`;
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 hover:border-primary/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex flex-col items-center justify-center">
                  <span className="text-[9px] text-primary font-medium leading-none">{dayLabel}</span>
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {format(task.date, "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={11} className="text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">{task.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted/60 rounded-md text-muted-foreground">{task.category}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Icon size={16} className="text-primary/50" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
