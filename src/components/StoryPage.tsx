import { useMemo, useState, useCallback } from "react";
import { BookOpen, Sparkles, Share2, RefreshCw, Loader2, PenLine, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import CategoryStoryView from "./CategoryStoryView";
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, isWithinInterval, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoryNotes, useAiStories } from "@/hooks/useStoryData";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";

interface StoryData { title: string; openingLine: string; summary: string; highlights: string[]; mood: string; emoji: string; }
type Period = "week" | "month" | "quarter" | "half" | "year";
type ViewMode = "period" | "category";

const categoryEmoji: Record<string, string> = { "运动": "🏃", "学习": "📖", "社交": "☕", "工作": "💼", "健康": "🧘", "记录": "📝", "娱乐": "🎵" };

const getMoodColor = (rate: number, total: number): string => {
  if (total === 0) return "from-muted/20 to-muted/10";
  if (rate >= 0.8) return "from-primary/20 to-accent/10";
  if (rate >= 0.6) return "from-secondary/15 to-primary/10";
  if (rate >= 0.4) return "from-accent/15 to-muted/15";
  return "from-secondary/10 to-muted/20";
};

interface StoryPageProps { tasks: Task[]; }

const StoryPage = ({ tasks }: StoryPageProps) => {
  const { t, locale } = useI18n();
  const catName = useCategoryName();
  const [viewMode, setViewMode] = useState<ViewMode>("period");
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const { notes, saveNote } = useStoryNotes();
  const { aiStories, saveAiStory } = useAiStories();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const buildFallback = useCallback((allTasks: Task[], total: number, completed: number, rate: number): StoryData => {
    const catCount: Record<string, number> = {};
    allTasks.filter(t => t.completed).forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const highlights: string[] = [];
    if (completed > 0) highlights.push(interpolate(t("story.fallback.completed"), { n: completed }));
    topCats.forEach(([cat, count]) => highlights.push(interpolate(t("story.fallback.catCompleted"), { emoji: categoryEmoji[cat] || "📌", cat: catName(cat), n: count })));
    if (total === 0) highlights.push(t("story.fallback.noPlans"));

    const summaryBase = total === 0 ? t("story.fallback.noTaskLine") : interpolate(t("story.fallback.completedOf"), { done: completed, total, rate: Math.round(rate * 100) }) + (topCats.length > 0 ? interpolate(t("story.fallback.mostActive"), { cat: catName(topCats[0][0]) }) : "");

    return {
      title: total === 0 ? t("story.fallback.waiting") : rate >= 0.8 ? t("story.fallback.highlight") : rate >= 0.5 ? t("story.fallback.steady") : t("story.fallback.building"),
      openingLine: total === 0 ? t("story.fallback.waitingLine") : rate >= 0.8 ? t("story.fallback.highlightLine") : t("story.fallback.steadyLine"),
      summary: summaryBase,
      highlights,
      mood: total === 0 ? t("story.fallback.waitMood") : rate >= 0.8 ? t("story.fallback.fullMood") : rate >= 0.5 ? t("story.fallback.steadyMood") : t("story.fallback.buildMood"),
      emoji: total === 0 ? "🌙" : rate >= 0.8 ? "🌟" : rate >= 0.5 ? "🚀" : "🌱",
    };
  }, [t, catName]);

  const getPeriodRanges = useCallback((period: Period) => {
    const now = new Date();
    switch (period) {
      case "week": return [0,1,2].map(i => ({ label: i === 0 ? t("story.thisWeek") : i === 1 ? t("story.lastWeek") : t("story.twoWeeksAgo"), start: startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(now, i), { weekStartsOn: 1 }), isCurrent: i === 0 }));
      case "month": return [0,1,2].map(i => ({ label: i === 0 ? t("story.thisMonth") : i === 1 ? t("story.lastMonth") : t("story.twoMonthsAgo"), start: startOfMonth(subMonths(now, i)), end: endOfMonth(subMonths(now, i)), isCurrent: i === 0 }));
      case "quarter": return [0,1].map(i => ({ label: i === 0 ? t("story.thisQuarter") : t("story.lastQuarter"), start: startOfQuarter(subQuarters(now, i)), end: endOfQuarter(subQuarters(now, i)), isCurrent: i === 0 }));
      case "half": return [0,1].map(i => ({ label: i === 0 ? t("story.recentHalf") : t("story.lastHalf"), start: subMonths(startOfMonth(now), i * 6 + 5), end: i === 0 ? now : endOfMonth(subMonths(startOfMonth(now), i * 6)), isCurrent: i === 0 }));
      case "year": return [0,1].map(i => ({ label: i === 0 ? t("story.thisYear") : t("story.lastYear"), start: subMonths(startOfMonth(now), i * 12 + 11), end: i === 0 ? now : endOfMonth(subMonths(startOfMonth(now), i * 12)), isCurrent: i === 0 }));
    }
  }, [t]);

  const formatRange = (start: Date, end: Date, period: Period): string => {
    if (period === "week") return `${format(start, "M/d")} - ${format(end, "M/d")}`;
    return format(start, t("story.formatMonth") || "yyyy年M月", { locale });
  };

  const periodTabs = [
    { id: "week" as Period, label: t("story.week"), emoji: "📅" },
    { id: "month" as Period, label: t("story.month"), emoji: "🗓️" },
    { id: "quarter" as Period, label: t("story.quarter"), emoji: "🍂" },
    { id: "half" as Period, label: t("story.half"), emoji: "🌍" },
    { id: "year" as Period, label: t("story.year"), emoji: "🎆" },
  ];

  const cards = useMemo(() => {
    const ranges = getPeriodRanges(activePeriod);
    return ranges.map(range => {
      const tasksInRange = tasks.filter(t => t.date && isWithinInterval(t.date, { start: range.start, end: range.end }));
      const noDateTasks = range.isCurrent ? tasks.filter(t => !t.date) : [];
      const allTasks = [...tasksInRange, ...noDateTasks];
      const total = allTasks.length; const completed = allTasks.filter(t => t.completed).length;
      const rate = total > 0 ? completed / total : 0;
      const key = `${activePeriod}-${range.label}`;
      return { key, label: range.label, timeRange: formatRange(range.start, range.end, activePeriod), isCurrent: range.isCurrent, color: getMoodColor(rate, total), fallback: buildFallback(allTasks, total, completed, rate), tasks: allTasks.map(t => ({ title: t.title, category: t.category, completed: t.completed, deadline: t.deadline ? t.deadline.toISOString() : undefined })) };
    });
  }, [tasks, activePeriod, getPeriodRanges, buildFallback]);

  const generateAIStory = useCallback(async (key: string, cardTasks: any[], label: string, timeRange: string) => {
    setLoadingKeys(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("generate-story", { body: { tasks: cardTasks, periodLabel: label, timeRange } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      await saveAiStory(key, data);
    } catch (e: any) {
      console.error("AI story generation failed:", e);
      toast.error(t("story.generateFailed"), { description: e.message });
    } finally { setLoadingKeys(prev => { const next = new Set(prev); next.delete(key); return next; }); }
  }, [saveAiStory, t]);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      <div className="flex gap-2 mb-4 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        <button onClick={() => setViewMode("period")} className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5", viewMode === "period" ? "gradient-warm text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:text-foreground")}>
          <BookOpen size={14} /><span>{t("story.byTime")}</span>
        </button>
        <button onClick={() => setViewMode("category")} className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5", viewMode === "category" ? "gradient-warm text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:text-foreground")}>
          <Layers size={14} /><span>{t("story.byCategory")}</span>
        </button>
      </div>

      {viewMode === "category" ? <CategoryStoryView tasks={tasks} /> : (
        <>
          <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {periodTabs.map(tab => (
              <button key={tab.id} onClick={() => setActivePeriod(tab.id)} className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center gap-0.5", activePeriod === tab.id ? "gradient-warm text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:text-foreground")}>
                <span className="text-base">{tab.emoji}</span><span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6" key={activePeriod}>
            {cards.map((card, storyIndex) => {
              const story = aiStories[card.key] || card.fallback;
              const isLoading = loadingKeys.has(card.key);
              const hasAI = !!aiStories[card.key];
              return (
                <div key={card.key} className="animate-slide-up" style={{ animationDelay: `${storyIndex * 0.1}s` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-primary">{card.label}</span>
                    <span className="text-[10px] text-muted-foreground">{card.timeRange}</span>
                    <div className="flex-1 h-px bg-border/40" />
                    {card.isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t("story.current")}</span>}
                  </div>
                  <div className={cn("rounded-t-2xl px-6 pt-5 pb-4 bg-gradient-to-br glass border-0", card.color)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3"><span className="text-3xl">{story.emoji}</span><h2 className="text-lg font-bold text-foreground font-serif">{story.title}</h2></div>
                      <div className="px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-[11px] font-medium text-foreground">{story.mood}</div>
                    </div>
                    <p className="text-sm text-primary font-medium italic font-serif mt-1">"{story.openingLine}"</p>
                  </div>
                  <div className="glass-card rounded-t-none rounded-b-2xl px-6 py-4 border-t-0">
                    <p className="text-sm text-foreground leading-[1.8] mb-4">{story.summary}</p>
                    <div>
                      <div className="flex items-center gap-2 mb-2.5"><Sparkles size={14} className="text-primary" /><span className="text-xs font-semibold text-foreground">{t("story.highlights")}</span></div>
                      <div className="space-y-2">{story.highlights.map((h, i) => (<div key={i} className="flex items-start gap-3 px-3 py-2 bg-muted/40 rounded-xl"><span className="text-sm text-foreground leading-relaxed">{h}</span></div>))}</div>
                    </div>
                    <button onClick={() => generateAIStory(card.key, card.tasks, card.label, card.timeRange)} disabled={isLoading}
                      className={cn("mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all", hasAI ? "bg-muted/50 text-muted-foreground hover:text-foreground" : "bg-primary/10 text-primary hover:bg-primary/20")}>
                      {isLoading ? (<><Loader2 size={14} className="animate-spin" /><span>{t("story.aiGenerating")}</span></>) : hasAI ? (<><RefreshCw size={14} /><span>{t("story.refreshStory")}</span></>) : (<><Sparkles size={14} /><span>{t("story.generateAI")}</span></>)}
                    </button>
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><PenLine size={14} className="text-primary" /><span className="text-xs font-semibold text-foreground">{t("story.notes")}</span></div>
                        {editingNote === card.key ? (
                          <button onClick={() => { setEditingNote(null); saveNote(card.key, notes[card.key] || ""); }} className="flex items-center gap-1 text-[11px] text-primary"><Check size={12} /><span>{t("story.done")}</span></button>
                        ) : (
                          <button onClick={() => setEditingNote(card.key)} className="text-[11px] text-muted-foreground hover:text-primary transition-colors">{notes[card.key] ? t("story.edit") : t("story.writeSomething")}</button>
                        )}
                      </div>
                      {editingNote === card.key ? (
                        <textarea autoFocus value={notes[card.key] || ""} onChange={e => saveNote(card.key, e.target.value)} placeholder={t("story.notePlaceholder")}
                          className="w-full min-h-[80px] p-3 rounded-xl bg-muted/30 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 leading-relaxed" />
                      ) : notes[card.key] ? (
                        <div onClick={() => setEditingNote(card.key)} className="px-3 py-2.5 rounded-xl bg-muted/20 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-muted/30 transition-colors">{notes[card.key]}</div>
                      ) : null}
                    </div>
                    <button onClick={() => {
                      const text = `${story.emoji} ${story.title}\n"${story.openingLine}"\n\n${story.summary}\n\n${story.highlights.join("\n")}${notes[card.key] ? `\n\n📝 ${notes[card.key]}` : ""}`;
                      if (navigator.share) navigator.share({ title: story.title, text }).catch(() => {});
                      else { navigator.clipboard.writeText(text); toast.success(t("story.copied")); }
                    }} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/30 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-xs font-medium">
                      <Share2 size={14} /><span>{t("story.share")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StoryPage;
