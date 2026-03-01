import { useMemo } from "react";
import { useState } from "react";
import { BookOpen, Sparkles, Share2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfQuarter, endOfQuarter, subQuarters,
  subDays, isWithinInterval, format, differenceInCalendarDays,
  isBefore
} from "date-fns";
import { zhCN } from "date-fns/locale";

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

interface Story {
  label: string;
  timeRange: string;
  title: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
  openingLine: string;
  color: string;
  isCurrent: boolean;
  overdueWarnings: string[];
}

// Category emoji mapping
const categoryEmoji: Record<string, string> = {
  "运动": "🏃", "学习": "📖", "社交": "☕", "工作": "💼",
  "健康": "🧘", "记录": "📝", "娱乐": "🎵",
};

// Mood mapping based on completion rate
const getMoodInfo = (rate: number, total: number): { mood: string; emoji: string; color: string } => {
  if (total === 0) return { mood: "等待", emoji: "🌙", color: "from-muted/20 to-muted/10" };
  if (rate >= 0.8) return { mood: "充实", emoji: "🌟", color: "from-primary/20 to-accent/10" };
  if (rate >= 0.6) return { mood: "稳步", emoji: "🚀", color: "from-secondary/15 to-primary/10" };
  if (rate >= 0.4) return { mood: "平和", emoji: "🍃", color: "from-accent/15 to-muted/15" };
  return { mood: "蓄力", emoji: "🌱", color: "from-secondary/10 to-muted/20" };
};

const getOpeningLine = (rate: number, total: number): string => {
  if (total === 0) return "这段时间还没有计划，新的开始随时可以出发。";
  if (rate >= 0.8) return "太棒了，你的执行力让人佩服！";
  if (rate >= 0.6) return "稳扎稳打，你正在变得更好。";
  if (rate >= 0.4) return "每一步都算数，继续加油。";
  return "慢慢来，重要的是不停下脚步。";
};

const generateTitle = (rate: number, total: number): string => {
  if (total === 0) return "等待启程";
  if (rate >= 0.8) return "高光时刻";
  if (rate >= 0.6) return "稳步前行";
  if (rate >= 0.4) return "成长进行时";
  return "蓄势待发";
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
      return [0, 1, 2].map(i => {
        const s = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const e = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        return {
          label: i === 0 ? "本周" : i === 1 ? "上周" : "两周前",
          start: s, end: e, isCurrent: i === 0,
        };
      });
    case "month":
      return [0, 1, 2].map(i => {
        const s = startOfMonth(subMonths(now, i));
        const e = endOfMonth(subMonths(now, i));
        return {
          label: i === 0 ? "本月" : i === 1 ? "上个月" : "两个月前",
          start: s, end: e, isCurrent: i === 0,
        };
      });
    case "quarter":
      return [0, 1].map(i => {
        const s = startOfQuarter(subQuarters(now, i));
        const e = endOfQuarter(subQuarters(now, i));
        return {
          label: i === 0 ? "本季度" : "上季度",
          start: s, end: e, isCurrent: i === 0,
        };
      });
    case "half":
      return [0, 1].map(i => {
        const s = subMonths(startOfMonth(now), i * 6 + (i === 0 ? 5 : 5));
        const e = i === 0 ? now : subMonths(startOfMonth(now), i * 6);
        return {
          label: i === 0 ? "近半年" : "上半年",
          start: s, end: endOfMonth(e), isCurrent: i === 0,
        };
      });
  }
};

const formatRange = (start: Date, end: Date, period: Period): string => {
  if (period === "week") {
    return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  }
  if (period === "month") {
    return format(start, "yyyy年M月");
  }
  return `${format(start, "yyyy年M月")} - ${format(end, "yyyy年M月")}`;
};

const buildStory = (tasks: Task[], range: PeriodRange, period: Period): Story => {
  const tasksInRange = tasks.filter(t => {
    if (!t.date) return false;
    return isWithinInterval(t.date, { start: range.start, end: range.end });
  });

  // Also include no-date tasks for current period
  const noDateTasks = range.isCurrent ? tasks.filter(t => !t.date) : [];
  const allTasks = [...tasksInRange, ...noDateTasks];

  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const rate = total > 0 ? completed / total : 0;

  // Category breakdown
  const catCount: Record<string, number> = {};
  allTasks.filter(t => t.completed).forEach(t => {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
  });
  const topCategories = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Highlights
  const highlights: string[] = [];
  if (completed > 0) {
    highlights.push(`✅ 完成了 ${completed} 项计划${total > completed ? `（共 ${total} 项）` : "，全部搞定！"}`);
  }
  topCategories.forEach(([cat, count]) => {
    const emoji = categoryEmoji[cat] || "📌";
    highlights.push(`${emoji} ${cat}类完成 ${count} 项`);
  });
  if (total === 0) {
    highlights.push("📭 这段时间还没有安排计划");
  }

  // Overdue warnings
  const now = new Date();
  const overdueWarnings: string[] = [];
  if (range.isCurrent) {
    allTasks.filter(t => !t.completed && t.deadline && isBefore(t.deadline, now)).forEach(t => {
      overdueWarnings.push(`⚠️ 「${t.title}」已超过截止日期`);
    });
    allTasks.filter(t => !t.completed && t.deadline && !isBefore(t.deadline, now) && differenceInCalendarDays(t.deadline, now) <= 2).forEach(t => {
      const days = differenceInCalendarDays(t.deadline!, now);
      overdueWarnings.push(`⏰ 「${t.title}」还剩 ${days} 天截止`);
    });
  }

  // Summary text
  let summary: string;
  if (total === 0) {
    summary = "这段时间还没有添加计划。给自己安排一些小目标吧，每完成一个都是对生活的热爱。";
  } else if (rate >= 0.8) {
    summary = `这段时间你完成了 ${completed} 项计划，完成率高达 ${Math.round(rate * 100)}%！${topCategories.length > 0 ? `在「${topCategories[0][0]}」方面尤其出色。` : ""} 继续保持这份热情！`;
  } else if (rate >= 0.5) {
    summary = `你安排了 ${total} 项计划，完成了其中 ${completed} 项。${topCategories.length > 0 ? `「${topCategories[0][0]}」是你最活跃的领域。` : ""} 节奏不错，稳步前进中。`;
  } else {
    summary = `这段时间有 ${total} 项计划，已完成 ${completed} 项。${overdueWarnings.length > 0 ? "有些计划快到截止日期了，别忘了关注一下。" : "不着急，按自己的节奏来就好。"}`;
  }

  const moodInfo = getMoodInfo(rate, total);

  return {
    label: range.label,
    timeRange: formatRange(range.start, range.end, period),
    title: generateTitle(rate, total),
    summary,
    highlights,
    mood: moodInfo.mood,
    emoji: moodInfo.emoji,
    openingLine: getOpeningLine(rate, total),
    color: moodInfo.color,
    isCurrent: range.isCurrent,
    overdueWarnings,
  };
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

  const stories = useMemo(() => {
    const ranges = getPeriodRanges(activePeriod);
    return ranges.map(r => buildStory(tasks, r, activePeriod));
  }, [tasks, activePeriod]);

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
        {stories.map((story, storyIndex) => (
          <div key={storyIndex} className="animate-slide-up" style={{ animationDelay: `${storyIndex * 0.1}s` }}>
            {/* Period time badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-primary">{story.label}</span>
              <span className="text-[10px] text-muted-foreground">{story.timeRange}</span>
              <div className="flex-1 h-px bg-border/40" />
              {story.isCurrent && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">当前</span>
              )}
            </div>

            {/* Story Card */}
            <div className={cn("rounded-t-2xl px-6 pt-5 pb-4 bg-gradient-to-br", story.color)}>
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

              {/* Overdue warnings */}
              {story.overdueWarnings.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  {story.overdueWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 bg-destructive/10 rounded-xl">
                      <span className="text-sm text-destructive leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              )}

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
            </div>
          </div>
        ))}
      </div>

      {/* Share button */}
      <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border/50 card-glow text-foreground hover:text-primary transition-colors text-sm font-medium mt-6">
        <Share2 size={16} />
        <span>分享我的故事</span>
      </button>
    </div>
  );
};

export default StoryPage;
