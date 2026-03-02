import { useMemo, useState, useCallback } from "react";
import { BookOpen, Sparkles, Share2, RefreshCw, Loader2, PenLine, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfQuarter, endOfQuarter, subQuarters,
  isWithinInterval, format, differenceInCalendarDays,
  isBefore
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  date?: Date;
  category: string;
  coverImage?: string;
  completionPhoto?: string;
  deadline?: Date;
}

type Period = "week" | "month" | "quarter" | "half";

interface StoryData {
  title: string;
  openingLine: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
}

interface StoryCard {
  label: string;
  timeRange: string;
  isCurrent: boolean;
  color: string;
  // Static fallback
  fallback: StoryData;
  // AI generated
  ai?: StoryData;
  loading: boolean;
}

const categoryEmoji: Record<string, string> = {
  "运动": "🏃", "学习": "📖", "社交": "☕", "工作": "💼",
  "健康": "🧘", "记录": "📝", "娱乐": "🎵",
};

const getMoodColor = (rate: number, total: number): string => {
  if (total === 0) return "from-muted/20 to-muted/10";
  if (rate >= 0.8) return "from-primary/20 to-accent/10";
  if (rate >= 0.6) return "from-secondary/15 to-primary/10";
  if (rate >= 0.4) return "from-accent/15 to-muted/15";
  return "from-secondary/10 to-muted/20";
};

// Simple fallback when AI is not yet loaded
const buildFallback = (tasks: Task[], total: number, completed: number, rate: number): StoryData => {
  const catCount: Record<string, number> = {};
  tasks.filter(t => t.completed).forEach(t => {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
  });
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const highlights: string[] = [];
  if (completed > 0) highlights.push(`✅ 完成了 ${completed} 项计划`);
  topCats.forEach(([cat, count]) => {
    highlights.push(`${categoryEmoji[cat] || "📌"} ${cat}类完成 ${count} 项`);
  });
  if (total === 0) highlights.push("📭 还没有安排计划");

  return {
    title: total === 0 ? "等待启程" : rate >= 0.8 ? "高光时刻" : rate >= 0.5 ? "稳步前行" : "蓄势待发",
    openingLine: total === 0 ? "新的开始随时可以出发。" : rate >= 0.8 ? "你的执行力让人佩服！" : "每一步都算数，继续加油。",
    summary: total === 0
      ? "给自己安排一些小目标吧。"
      : `完成了 ${completed}/${total} 项计划，完成率 ${Math.round(rate * 100)}%。${topCats.length > 0 ? `「${topCats[0][0]}」最活跃。` : ""}`,
    highlights,
    mood: total === 0 ? "等待" : rate >= 0.8 ? "充实" : rate >= 0.5 ? "稳步" : "蓄力",
    emoji: total === 0 ? "🌙" : rate >= 0.8 ? "🌟" : rate >= 0.5 ? "🚀" : "🌱",
  };
};

interface PeriodRange {
  label: string;
  start: Date;
  end: Date;
  isCurrent: boolean;
}

const getPeriodRanges = (period: Period): PeriodRange[] => {
  const now = new Date();
  switch (period) {
    case "week":
      return [0, 1, 2].map(i => ({
        label: i === 0 ? "本周" : i === 1 ? "上周" : "两周前",
        start: startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, i), { weekStartsOn: 1 }),
        isCurrent: i === 0,
      }));
    case "month":
      return [0, 1, 2].map(i => ({
        label: i === 0 ? "本月" : i === 1 ? "上个月" : "两个月前",
        start: startOfMonth(subMonths(now, i)),
        end: endOfMonth(subMonths(now, i)),
        isCurrent: i === 0,
      }));
    case "quarter":
      return [0, 1].map(i => ({
        label: i === 0 ? "本季度" : "上季度",
        start: startOfQuarter(subQuarters(now, i)),
        end: endOfQuarter(subQuarters(now, i)),
        isCurrent: i === 0,
      }));
    case "half":
      return [0, 1].map(i => ({
        label: i === 0 ? "近半年" : "上半年",
        start: subMonths(startOfMonth(now), i * 6 + 5),
        end: i === 0 ? now : endOfMonth(subMonths(startOfMonth(now), i * 6)),
        isCurrent: i === 0,
      }));
  }
};

const formatRange = (start: Date, end: Date, period: Period): string => {
  if (period === "week") return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  if (period === "month") return format(start, "yyyy年M月");
  return `${format(start, "yyyy年M月")} - ${format(end, "yyyy年M月")}`;
};

interface StoryPageProps {
  tasks: Task[];
}

const periodTabs = [
  { id: "week" as Period, label: "一周", emoji: "📅" },
  { id: "month" as Period, label: "一月", emoji: "🗓️" },
  { id: "quarter" as Period, label: "一季", emoji: "🍂" },
  { id: "half" as Period, label: "半年", emoji: "🌍" },
];

const StoryPage = ({ tasks }: StoryPageProps) => {
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const [aiStories, setAiStories] = useState<Record<string, StoryData>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);

  // Build base cards with fallback data
  const cards = useMemo(() => {
    const ranges = getPeriodRanges(activePeriod);
    return ranges.map(range => {
      const tasksInRange = tasks.filter(t => t.date && isWithinInterval(t.date, { start: range.start, end: range.end }));
      const noDateTasks = range.isCurrent ? tasks.filter(t => !t.date) : [];
      const allTasks = [...tasksInRange, ...noDateTasks];
      const total = allTasks.length;
      const completed = allTasks.filter(t => t.completed).length;
      const rate = total > 0 ? completed / total : 0;

      const key = `${activePeriod}-${range.label}`;
      return {
        key,
        label: range.label,
        timeRange: formatRange(range.start, range.end, activePeriod),
        isCurrent: range.isCurrent,
        color: getMoodColor(rate, total),
        fallback: buildFallback(allTasks, total, completed, rate),
        tasks: allTasks.map(t => ({
          title: t.title,
          category: t.category,
          completed: t.completed,
          deadline: t.deadline ? t.deadline.toISOString() : undefined,
        })),
      };
    });
  }, [tasks, activePeriod]);

  const generateAIStory = useCallback(async (key: string, cardTasks: any[], label: string, timeRange: string) => {
    setLoadingKeys(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: { tasks: cardTasks, periodLabel: label, timeRange },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAiStories(prev => ({ ...prev, [key]: data }));
    } catch (e: any) {
      console.error("AI story generation failed:", e);
      toast.error("故事生成失败，显示基础总结", { description: e.message });
    } finally {
      setLoadingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">回忆是最美的礼物</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">你的故事</h1>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {periodTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePeriod(tab.id)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center gap-0.5",
              activePeriod === tab.id
                ? "gradient-warm text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-base">{tab.emoji}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Stories List */}
      <div className="space-y-6" key={activePeriod}>
        {cards.map((card, storyIndex) => {
          const story = aiStories[card.key] || card.fallback;
          const isLoading = loadingKeys.has(card.key);
          const hasAI = !!aiStories[card.key];

          return (
            <div key={card.key} className="animate-slide-up" style={{ animationDelay: `${storyIndex * 0.1}s` }}>
              {/* Period time badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-primary">{card.label}</span>
                <span className="text-[10px] text-muted-foreground">{card.timeRange}</span>
                <div className="flex-1 h-px bg-border/40" />
                {card.isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">当前</span>
                )}
              </div>

              {/* Story Card */}
              <div className={cn("rounded-t-2xl px-6 pt-5 pb-4 bg-gradient-to-br", card.color)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{story.emoji}</span>
                    <h2 className="text-lg font-bold text-foreground font-serif">{story.title}</h2>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-[11px] font-medium text-foreground">
                    {story.mood}
                  </div>
                </div>
                <p className="text-sm text-primary font-medium italic font-serif mt-1">"{story.openingLine}"</p>
              </div>
              <div className="bg-card rounded-b-2xl px-6 py-4 border border-t-0 border-border/50">
                <p className="text-sm text-foreground leading-[1.8] mb-4">{story.summary}</p>

                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-foreground">亮点时刻</span>
                  </div>
                  <div className="space-y-2">
                    {story.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-2 bg-muted/40 rounded-xl">
                        <span className="text-sm text-foreground leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Generate / Regenerate button */}
                <button
                  onClick={() => generateAIStory(card.key, card.tasks, card.label, card.timeRange)}
                  disabled={isLoading}
                  className={cn(
                    "mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all",
                    hasAI
                      ? "bg-muted/50 text-muted-foreground hover:text-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>AI 正在撰写故事...</span>
                    </>
                  ) : hasAI ? (
                    <>
                      <RefreshCw size={14} />
                      <span>换一个版本</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>✨ 用 AI 生成有温度的故事</span>
                    </>
                  )}
                </button>

                {/* 随笔区域 */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PenLine size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-foreground">随笔</span>
                    </div>
                    {editingNote === card.key ? (
                      <button
                        onClick={() => setEditingNote(null)}
                        className="flex items-center gap-1 text-[11px] text-primary"
                      >
                        <Check size={12} />
                        <span>完成</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingNote(card.key)}
                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        {notes[card.key] ? "编辑" : "写点什么..."}
                      </button>
                    )}
                  </div>
                  {editingNote === card.key ? (
                    <textarea
                      autoFocus
                      value={notes[card.key] || ""}
                      onChange={e => setNotes(prev => ({ ...prev, [card.key]: e.target.value }))}
                      placeholder="记录这段时间的感受、想法、或任何值得留住的瞬间..."
                      className="w-full min-h-[80px] p-3 rounded-xl bg-muted/30 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 leading-relaxed"
                    />
                  ) : notes[card.key] ? (
                    <div
                      onClick={() => setEditingNote(card.key)}
                      className="px-3 py-2.5 rounded-xl bg-muted/20 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      {notes[card.key]}
                    </div>
                  ) : null}
                </div>

                {/* 分享按钮 */}
                <button
                  onClick={() => {
                    const text = `${story.emoji} ${story.title}\n"${story.openingLine}"\n\n${story.summary}\n\n${story.highlights.join("\n")}${notes[card.key] ? `\n\n📝 ${notes[card.key]}` : ""}`;
                    if (navigator.share) {
                      navigator.share({ title: story.title, text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success("已复制到剪贴板");
                    }
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/30 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-xs font-medium"
                >
                  <Share2 size={14} />
                  <span>分享这段故事</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoryPage;
