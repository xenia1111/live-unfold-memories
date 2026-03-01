import { useState, useCallback, useMemo } from "react";
import { format, addDays, subDays, isToday, isFuture, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CheckCircle2, Circle, Clock,
  Coffee, Dumbbell, BookOpen, Music, Heart, Star,
  ChevronDown, Sparkles, CalendarDays, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CompletionPhotoDialog from "@/components/CompletionPhotoDialog";
import ConfettiCanvas from "@/components/ConfettiCanvas";

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

interface HomePageProps {
  extraTasks?: Task[];
  onTasksChange?: (tasks: Task[]) => void;
}

/* ── 未来规划分组组件 ── */
const FuturePlanSection = ({ tasks, today }: { tasks: Task[]; today: Date }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    const sorted = [...tasks].sort((a, b) => a.date.getTime() - b.date.getTime());
    sorted.forEach(t => {
      const key = format(t.date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([key, items]) => ({ key, date: items[0].date, items }));
  }, [tasks]);

  const getDayLabel = (date: Date) => {
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) return "明天";
    if (diff === 2) return "后天";
    return format(date, "M月d日 EEEE", { locale: zhCN });
  };

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.key}>
          {/* 日期标签 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-primary">{getDayLabel(group.date)}</span>
            {Math.ceil((group.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 2 && (
              <span className="text-[10px] text-muted-foreground">{format(group.date, "M/d EEEE", { locale: zhCN })}</span>
            )}
            <div className="flex-1 h-px bg-border/40" />
          </div>
          {/* 该日任务 */}
          <div className="space-y-2">
            {group.items.map(task => {
              const Icon = iconMap[task.icon] || Star;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-card/50 border border-border/30 hover:border-primary/15 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-primary/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/80">{task.title}</p>
                    <span className="text-[10px] text-muted-foreground/50">{task.time} · {task.category}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/20 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const HomePage = ({ extraTasks = [], onTasksChange }: HomePageProps) => {
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks);
  const allTasks = [...tasks, ...extraTasks];
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const today = new Date();

  const todayTasks = allTasks.filter(t => isToday(t.date));
  const futureTasks = allTasks.filter(t => isFuture(t.date) && !isToday(t.date)).sort((a, b) => a.date.getTime() - b.date.getTime());
  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;
  const allCompleted = allTasks.filter(t => t.completed).length;

  const handleTaskClick = (task: Task) => {
    if (task.completed) return;
    setCompletingTask(task);
  };

  const handleCompleteConfirm = useCallback((photo?: string) => {
    if (!completingTask) return;
    const id = completingTask.id;
    setShowConfetti(true);
    setJustCompleted(id);
    setTimeout(() => setJustCompleted(null), 1200);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true, completionPhoto: photo } : t));
    if (onTasksChange && extraTasks.some(t => t.id === id)) {
      onTasksChange(extraTasks.map(t => t.id === id ? { ...t, completed: true, completionPhoto: photo } : t));
    }
    setCompletingTask(null);
  }, [completingTask, onTasksChange, extraTasks]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return { text: "夜深了", emoji: "🌙" };
    if (h < 9) return { text: "早安", emoji: "🌅" };
    if (h < 12) return { text: "上午好", emoji: "☀️" };
    if (h < 14) return { text: "午安", emoji: "🍵" };
    if (h < 18) return { text: "下午好", emoji: "🌤️" };
    if (h < 21) return { text: "傍晚好", emoji: "🌇" };
    return { text: "晚安", emoji: "🌛" };
  };

  const greeting = getGreeting();
  const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <ConfettiCanvas active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* ── Hero: 简洁问候 + 核心数据 ── */}
      <div className="mb-8 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-1">
          {format(today, "M月d日 EEEE", { locale: zhCN })}
        </p>
        <h1 className="text-3xl font-bold text-foreground font-serif leading-tight">
          {greeting.emoji} {greeting.text}
        </h1>

        {/* 迷你状态条 */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-progress transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">
            {todayCompleted}/{todayTotal}
          </span>
        </div>
        {todayTotal > 0 && todayCompleted === todayTotal && (
          <p className="text-xs text-secondary font-medium mt-2">🎉 今天全部完成！太棒了</p>
        )}

        {/* 快速统计 */}
        <div className="mt-4 flex gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs">
            <span className="text-accent">🔥</span>
            <span className="font-medium text-foreground">5 天连续</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs">
            <span className="text-primary">⚡</span>
            <span className="font-medium text-foreground">{allCompleted * 10} XP</span>
          </div>
        </div>
      </div>

      {/* ── 今天的任务（主区域）── */}
      <section className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {todayTotal === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌿</p>
            <p className="text-sm text-muted-foreground">今天还没有安排</p>
            <p className="text-xs text-muted-foreground/60 mt-1">点击右下角 + 添加一件想做的事</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((task, index) => {
              const Icon = iconMap[task.icon] || Star;
              const isCelebrating = justCompleted === task.id;
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "w-full flex items-center gap-3.5 rounded-2xl p-4 text-left transition-all",
                    task.completed
                      ? "bg-card/60 border border-border/30"
                      : "bg-card border border-border/50 card-glow active:scale-[0.98]",
                    isCelebrating && "animate-celebrate"
                  )}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {task.completed
                    ? <CheckCircle2 size={22} className="text-secondary flex-shrink-0" />
                    : <Circle size={22} className="text-muted-foreground/30 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      task.completed ? "line-through text-muted-foreground/60" : "text-foreground"
                    )}>
                      {task.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground/50">{task.time} · {task.category}</span>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                    task.completed ? "bg-secondary/10" : "bg-muted/40"
                  )}>
                    <Icon size={14} className={task.completed ? "text-secondary" : "text-primary/40"} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 未来规划预览 ── */}
      {futureTasks.length > 0 && (
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={() => setShowUpcoming(true)}
            className="flex items-center gap-2 w-full text-left mb-3 group active:scale-[0.98] transition-all"
          >
            <CalendarDays size={14} className="text-primary/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              即将到来
            </span>
            <ChevronRight size={14} className="text-muted-foreground/40 ml-auto" />
          </button>

          {/* 预览前3条 */}
          <div className="space-y-2">
            {futureTasks.slice(0, 3).map(task => {
              const Icon = iconMap[task.icon] || Star;
              const diff = Math.ceil((task.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const dayLabel = diff === 1 ? "明天" : diff === 2 ? "后天" : format(task.date, "M/d EEE", { locale: zhCN });
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-card/50 border border-border/30">
                  <span className="text-[10px] font-medium text-primary w-12 text-center flex-shrink-0">{dayLabel}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 truncate">{task.title}</p>
                  </div>
                  <Icon size={14} className="text-muted-foreground/30 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 未来规划全屏 Sheet ── */}
      <Sheet open={showUpcoming} onOpenChange={setShowUpcoming}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0 pb-0">
          <SheetHeader className="px-5 pb-3 border-b border-border/50">
            <SheetTitle className="text-lg font-bold font-serif">未来规划</SheetTitle>
            <p className="text-xs text-muted-foreground">{futureTasks.length} 件事待完成</p>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pt-4 pb-8 h-full">
            <FuturePlanSection tasks={futureTasks} today={today} />
          </div>
        </SheetContent>
      </Sheet>

      <CompletionPhotoDialog
        open={!!completingTask}
        onOpenChange={(open) => !open && setCompletingTask(null)}
        taskTitle={completingTask?.title || ""}
        onConfirm={handleCompleteConfirm}
      />
    </div>
  );
};

export default HomePage;
