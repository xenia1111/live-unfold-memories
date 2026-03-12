import { useState, useCallback, useMemo, useEffect } from "react";
import { format, isToday, isFuture, differenceInCalendarDays } from "date-fns";
import {
  CheckCircle2, Circle,
  Coffee, Dumbbell, BookOpen, Music, Heart, Star,
  ChevronRight, CalendarDays, Inbox, AlertCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CompletionPhotoDialog from "@/components/CompletionPhotoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EditTaskDialog from "@/components/EditTaskDialog";
import ConfettiCanvas from "@/components/ConfettiCanvas";
import CatPet from "@/components/CatPet";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";
import eggNestImg from "@/assets/egg-nest.png";

const iconMap: Record<string, any> = {
  coffee: Coffee, dumbbell: Dumbbell, book: BookOpen,
  music: Music, heart: Heart, star: Star,
};

/* ── Deadline 标签 ── */
const DeadlineTag = ({ deadline }: { deadline: Date }) => {
  const { t } = useI18n();
  const days = differenceInCalendarDays(deadline, new Date());
  const isUrgent = days <= 2;
  const label = days <= 0 ? t("home.expired") : days === 1 ? t("home.dueTomorrow") : interpolate(t("home.daysLeft"), { n: days });
  return (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
      isUrgent ? "bg-destructive/10 text-destructive" : "bg-accent/50 text-accent-foreground/70"
    )}>
      {days <= 0 && <AlertCircle size={10} className="inline mr-0.5 -mt-0.5" />}
      {label}
    </span>
  );
};

/* ── 未来规划分组组件 ── */
const FuturePlanSection = ({ tasks, today }: { tasks: Task[]; today: Date }) => {
  const { t, locale, dateFormat } = useI18n();
  const catName = useCategoryName();

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    const sorted = [...tasks].sort((a, b) => a.date!.getTime() - b.date!.getTime());
    sorted.forEach(t => {
      const key = format(t.date!, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([key, items]) => ({ key, date: items[0].date!, items }));
  }, [tasks]);

  const getDayLabel = (date: Date) => {
    const diff = differenceInCalendarDays(date, today);
    if (diff === 1) return t("home.tomorrow");
    if (diff === 2) return t("home.dayAfter");
    return format(date, dateFormat, { locale });
  };

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.key}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-primary">{getDayLabel(group.date)}</span>
            {differenceInCalendarDays(group.date, today) <= 2 && (
              <span className="text-[10px] text-muted-foreground">{format(group.date, "M/d EEEE", { locale })}</span>
            )}
            <div className="flex-1 h-px bg-border/40" />
          </div>
          <div className="space-y-2">
            {group.items.map(task => {
              const Icon = iconMap[task.icon] || Star;
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-card border border-border/30 hover:border-card-foreground/15 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-card-foreground/8 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-card-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground/80">{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-card-foreground/40">{task.time} · {catName(task.category)}</span>
                      {task.deadline && <DeadlineTag deadline={task.deadline} />}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-card-foreground/20 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

interface HomePageProps {
  tasks: Task[];
  loading: boolean;
  onCompleteTask: (id: string, photo?: string, note?: string) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onNavigateProfile?: () => void;
}

const HomePage = ({ tasks, loading, onCompleteTask, onUpdateTask, onDeleteTask, onNavigateProfile }: HomePageProps) => {
  const { t, locale, shortDateFormat } = useI18n();
  const { user } = useAuth();
  const catName = useCategoryName();
  const [lifeDays, setLifeDays] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("birthday").eq("id", user.id).single().then(({ data }) => {
      if (data?.birthday) {
        const born = new Date(data.birthday + "T00:00:00");
        const days = differenceInCalendarDays(new Date(), born) + 1;
        if (days > 0) setLifeDays(days);
      }
    });
  }, [user]);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const today = new Date();

  const undatedIncompleteTasks = tasks.filter(t => !t.date && !t.completed);
  const todayTasks = [...tasks.filter(t => t.date && isToday(t.date)), ...undatedIncompleteTasks];
  const futureTasks = tasks.filter(t => t.date && isFuture(t.date) && !isToday(t.date)).sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const backlogTasks = tasks.filter(t => !t.date && t.completed);
  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;

  const handleTaskClick = (task: Task) => {
    if (task.completed) { setEditingTask(task); return; }
    setCompletingTask(task);
  };

  const handleCompleteConfirm = useCallback(async (photo?: string, note?: string) => {
    if (!completingTask) return;
    const id = completingTask.id;
    setShowConfetti(true);
    setJustCompleted(id);
    setTimeout(() => setJustCompleted(null), 1200);
    await onCompleteTask(id, photo, note);
    setCompletingTask(null);
  }, [completingTask, onCompleteTask]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return { text: t("greeting.lateNight") };
    if (h < 9) return { text: t("greeting.morning") };
    if (h < 12) return { text: t("greeting.forenoon") };
    if (h < 14) return { text: t("greeting.noon") };
    if (h < 18) return { text: t("greeting.afternoon") };
    if (h < 21) return { text: t("greeting.evening") };
    return { text: t("greeting.night") };
  };

  const greeting = getGreeting();
  const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="px-5 pt-14 pb-24 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t("home.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-mono bg-[hsl(0,0%,78%)] px-5 pt-14 pb-24 max-w-lg mx-auto min-h-screen">
      <ConfettiCanvas active={showConfetti} onDone={() => setShowConfetti(false)} />

      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground font-serif leading-tight">
          {greeting.text}
          {lifeDays ? (
            <span className="text-sm font-normal text-muted-foreground ml-2">({interpolate(t("greeting.lifeDays"), { n: lifeDays })})</span>
          ) : (
            <button onClick={onNavigateProfile} className="text-sm font-normal text-primary/60 ml-2 hover:text-primary transition-colors">({t("greeting.setBirthday")})</button>
          )}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-foreground/15 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-foreground transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">{todayCompleted}/{todayTotal}</span>
        </div>
        {todayTotal > 0 && todayCompleted === todayTotal && (
          <p className="text-xs text-secondary font-medium mt-2">{t("home.allDone")}</p>
        )}
      </div>

      <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        <CatPet tasks={tasks} />
      </div>

      <section className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {todayTotal === 0 ? (
          <div className="text-center py-10">
            <div className="inline-block animate-egg-wobble mb-4">
              <img src={eggNestImg} alt="" className="w-20 h-20 mx-auto object-contain" />
            </div>
            <p className="text-sm text-foreground/70 font-medium">{t("home.noTasks")}</p>
            <p className="text-xs text-muted-foreground/50 mt-1.5">{t("home.addHint")}</p>
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
                    task.completed ? "bg-card/60 border border-border/30" : "bg-card border border-border/50 card-glow active:scale-[0.98]",
                    isCelebrating && "animate-celebrate"
                  )}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {task.completed ? <CheckCircle2 size={22} className="text-secondary flex-shrink-0" /> : <Circle size={22} className="text-card-foreground/30 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", task.completed ? "line-through text-card-foreground/40" : "text-card-foreground")}>{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-card-foreground/40">{task.time} · {catName(task.category)}</span>
                      {task.deadline && <DeadlineTag deadline={task.deadline} />}
                    </div>
                  </div>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", task.completed ? "bg-secondary/10" : "bg-card-foreground/10")}>
                    <Icon size={14} className={task.completed ? "text-secondary" : "text-card-foreground/40"} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {futureTasks.length > 0 && (
        <section className="mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <button onClick={() => setShowUpcoming(true)} className="flex items-center gap-2 w-full text-left mb-3 group active:scale-[0.98] transition-all">
            <CalendarDays size={14} className="text-primary/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("home.upcoming")}</span>
            <ChevronRight size={14} className="text-muted-foreground/40 ml-auto" />
          </button>
          <div className="space-y-2">
            {futureTasks.slice(0, 3).map(task => {
              const Icon = iconMap[task.icon] || Star;
              const diff = differenceInCalendarDays(task.date!, today);
              const dayLabel = diff === 1 ? t("home.tomorrow") : diff === 2 ? t("home.dayAfter") : format(task.date!, shortDateFormat, { locale });
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-card border border-border/30">
                  <span className="text-[10px] font-medium text-card-foreground/70 w-12 text-center flex-shrink-0">{dayLabel}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-card-foreground/80 truncate">{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-card-foreground/40">{task.time} · {catName(task.category)}</span>
                      {task.deadline && <DeadlineTag deadline={task.deadline} />}
                    </div>
                  </div>
                  <Icon size={14} className="text-card-foreground/30 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {backlogTasks.length > 0 && (
        <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <button onClick={() => setShowBacklog(true)} className="flex items-center gap-2 w-full text-left mb-3 group active:scale-[0.98] transition-all">
            <Inbox size={14} className="text-primary/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("home.backlog")}</span>
            <span className="text-[10px] text-muted-foreground/40 ml-1">{backlogTasks.length}</span>
            <ChevronRight size={14} className="text-muted-foreground/40 ml-auto" />
          </button>
          <div className="space-y-2">
            {backlogTasks.slice(0, 2).map(task => {
              const Icon = iconMap[task.icon] || Star;
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-card/50 border border-border/30">
                  <div className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/70 truncate">{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground/40">{catName(task.category)}</span>
                      {task.deadline && <DeadlineTag deadline={task.deadline} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Sheet open={showUpcoming} onOpenChange={setShowUpcoming}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0 pb-0">
          <SheetHeader className="px-5 pb-3 border-b border-border/50">
            <SheetTitle className="text-lg font-bold font-serif">{t("home.futurePlan")}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pt-4 pb-8 h-full">
            <FuturePlanSection tasks={futureTasks} today={today} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showBacklog} onOpenChange={setShowBacklog}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl px-0 pb-0">
          <SheetHeader className="px-5 pb-3 border-b border-border/50">
            <SheetTitle className="text-lg font-bold font-serif">{t("home.backlogSheet")}</SheetTitle>
            <p className="text-xs text-muted-foreground">{t("home.backlogDesc")}</p>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pt-4 pb-8 h-full">
            <div className="space-y-2.5">
              {backlogTasks.map(task => {
                const Icon = iconMap[task.icon] || Star;
                return (
                  <button key={task.id} onClick={() => handleTaskClick(task)} className="w-full flex items-center gap-3.5 rounded-2xl p-4 text-left bg-card border border-border/50 active:scale-[0.98] transition-all">
                    <Circle size={22} className="text-muted-foreground/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground/50">{catName(task.category)}</span>
                        {task.deadline && <DeadlineTag deadline={task.deadline} />}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-primary/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CompletionPhotoDialog
        open={!!completingTask}
        onOpenChange={(open) => !open && setCompletingTask(null)}
        taskTitle={completingTask?.title || ""}
        onConfirm={handleCompleteConfirm}
      />

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </div>
  );
};

export default HomePage;
