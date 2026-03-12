import { useMemo, useState, useCallback } from "react";
import { BookOpen, Sparkles, Share2, RefreshCw, Loader2, PenLine, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import CategoryStoryView from "./CategoryStoryView";
import SharePosterDialog from "./SharePosterDialog";
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, isWithinInterval, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoryNotes, useAiStories } from "@/hooks/useStoryData";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";

interface StoryData { title: string; openingLine: string; summary: string; highlights: string[]; mood: string; emoji: string; }
type Period = "week" | "month" | "quarter" | "half" | "year";
type ViewMode = "period" | "category";

const categoryEmoji: Record<string, string> = {};

const getMoodDecor = (rate: number, total: number): { bg: string; accent: string } => {
  if (total === 0) return { bg: "bg-muted/20", accent: "text-muted-foreground" };
  if (rate >= 0.8) return { bg: "bg-primary/5", accent: "text-primary" };
  if (rate >= 0.6) return { bg: "bg-secondary/5", accent: "text-secondary" };
  if (rate >= 0.4) return { bg: "bg-accent/5", accent: "text-accent" };
  return { bg: "bg-muted/10", accent: "text-muted-foreground" };
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
  const [shareDialog, setShareDialog] = useState<{ story: any; periodLabel: string; timeRange: string; photos: string[] } | null>(null);

  const buildFallback = useCallback((allTasks: Task[], total: number, completed: number, rate: number): StoryData => {
    const catCount: Record<string, number> = {};
    allTasks.filter(t => t.completed).forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const highlights: string[] = [];
    if (completed > 0) highlights.push(interpolate(t("story.fallback.completed"), { n: completed }));
    topCats.forEach(([cat, count]) => highlights.push(interpolate(t("story.fallback.catCompleted"), { cat: catName(cat), n: count })));
    if (total === 0) highlights.push(t("story.fallback.noPlans"));

    const summaryBase = total === 0 ? t("story.fallback.noTaskLine") : interpolate(t("story.fallback.completedOf"), { done: completed, total, rate: Math.round(rate * 100) }) + (topCats.length > 0 ? interpolate(t("story.fallback.mostActive"), { cat: catName(topCats[0][0]) }) : "");

    return {
      title: total === 0 ? t("story.fallback.waiting") : rate >= 0.8 ? t("story.fallback.highlight") : rate >= 0.5 ? t("story.fallback.steady") : t("story.fallback.building"),
      openingLine: total === 0 ? t("story.fallback.waitingLine") : rate >= 0.8 ? t("story.fallback.highlightLine") : t("story.fallback.steadyLine"),
      summary: summaryBase,
      highlights,
      mood: total === 0 ? t("story.fallback.waitMood") : rate >= 0.8 ? t("story.fallback.fullMood") : rate >= 0.5 ? t("story.fallback.steadyMood") : t("story.fallback.buildMood"),
      emoji: "",
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
    { id: "week" as Period, label: t("story.week") },
    { id: "month" as Period, label: t("story.month") },
    { id: "quarter" as Period, label: t("story.quarter") },
    { id: "half" as Period, label: t("story.half") },
    { id: "year" as Period, label: t("story.year") },
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
      const photos = allTasks.filter(t => t.completed && t.completionPhoto).map(t => t.completionPhoto!);
      return { key, label: range.label, timeRange: formatRange(range.start, range.end, activePeriod), isCurrent: range.isCurrent, decor: getMoodDecor(rate, total), fallback: buildFallback(allTasks, total, completed, rate), tasks: allTasks.map(t => ({ title: t.title, category: t.category, completed: t.completed, deadline: t.deadline ? t.deadline.toISOString() : undefined })), total, completed, rate, photos };
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
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto">

      {/* View mode toggle — pill style */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl bg-muted/40 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        <button onClick={() => setViewMode("period")} className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5", viewMode === "period" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <BookOpen size={13} /><span>{t("story.byTime")}</span>
        </button>
        <button onClick={() => setViewMode("category")} className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5", viewMode === "category" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Layers size={13} /><span>{t("story.byCategory")}</span>
        </button>
      </div>

      {viewMode === "category" ? <CategoryStoryView tasks={tasks} /> : (
        <>
          {/* Period tabs — scrollable pills */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide animate-fade-in pb-1" style={{ animationDelay: "0.1s" }}>
            {periodTabs.map(tab => (
              <button key={tab.id} onClick={() => setActivePeriod(tab.id)} className={cn("shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300", activePeriod === tab.id ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Story cards */}
          <div className="space-y-8" key={activePeriod}>
            {cards.map((card, storyIndex) => {
              const story = aiStories[card.key] || card.fallback;
              const isLoading = loadingKeys.has(card.key);
              const hasAI = !!aiStories[card.key];
              return (
                <div key={card.key} className="animate-slide-up" style={{ animationDelay: `${storyIndex * 0.12}s` }}>
                  {/* Timeline header */}
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", card.decor.accent)}>{card.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{card.timeRange}</span>
                    <div className="flex-1 border-b border-dashed border-border/30" />
                    {card.isCurrent && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/8 text-primary font-medium animate-pulse-warm">
                        {t("story.current")}
                      </span>
                    )}
                  </div>

                  {/* Main story card — journal page feel */}
                  <div className={cn("rounded-3xl overflow-hidden card-glow", card.decor.bg)}>
                    {/* Story header area */}
                    <div className="px-6 pt-6 pb-4 relative">
                     
                      {/* Emoji + Title cluster */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-4xl leading-none animate-float" style={{ animationDelay: "0.2s" }}>{story.emoji}</span>
                        <div className="flex-1 min-w-0 pt-1">
                          <h2 className="text-xl font-bold text-foreground leading-tight">{story.title}</h2>
                          <div className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-card/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
                            {story.mood}
                          </div>
                        </div>
                      </div>

                      {/* Opening quote */}
                      <div className="relative pl-4 mt-3">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-primary/30" />
                        <p className="text-sm text-primary/80 italic leading-relaxed font-serif">
                          "{story.openingLine}"
                        </p>
                      </div>

                      {/* Progress indicator — organic bar */}
                      {card.total > 0 && (
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-warm transition-all duration-700 ease-out"
                              style={{ width: `${Math.round(card.rate * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                            {card.completed}/{card.total}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Separator — hand-drawn feel */}
                    <div className="mx-6">
                      <svg viewBox="0 0 300 6" className="w-full h-1.5 text-border/30">
                        <path d="M0 3 Q 25 0, 50 3 T 100 3 T 150 3 T 200 3 T 250 3 T 300 3" fill="none" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>

                    {/* Summary + highlights */}
                    <div className="px-6 py-4">
                      <p className="text-sm text-foreground/80 leading-[1.9] mb-4">{story.summary}</p>

                      {/* Highlights — warm cards */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={13} className="text-primary" />
                          <span className="text-xs font-semibold text-foreground">{t("story.highlights")}</span>
                        </div>
                        {story.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-card/80 border border-border/20">
                            <span className="text-primary/40 text-xs mt-0.5">✦</span>
                            <span className="text-sm text-foreground/80 leading-relaxed">{h}</span>
                          </div>
                        ))}
                      </div>

                      {/* AI Generate button */}
                      <button onClick={() => generateAIStory(card.key, card.tasks, card.label, card.timeRange)} disabled={isLoading}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-medium transition-all duration-300",
                          hasAI
                            ? "bg-card/60 text-muted-foreground hover:text-foreground border border-border/20"
                            : "gradient-warm text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98]"
                        )}>
                        {isLoading ? (
                          <><Loader2 size={14} className="animate-spin" /><span>{t("story.aiGenerating")}</span></>
                        ) : hasAI ? (
                          <><RefreshCw size={14} /><span>{t("story.refreshStory")}</span></>
                        ) : (
                          <><Sparkles size={14} /><span>{t("story.generateAI")}</span></>
                        )}
                      </button>

                      {/* Notes section — journal entry */}
                      <div className="mt-5 pt-4 border-t border-dashed border-border/30">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <PenLine size={13} className="text-primary/60" />
                            <span className="text-xs font-semibold text-foreground/70">{t("story.notes")}</span>
                          </div>
                          {editingNote === card.key ? (
                            <button onClick={() => { setEditingNote(null); saveNote(card.key, notes[card.key] || ""); }} className="flex items-center gap-1 text-[11px] text-primary font-medium">
                              <Check size={12} /><span>{t("story.done")}</span>
                            </button>
                          ) : (
                            <button onClick={() => setEditingNote(card.key)} className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors italic">
                              {notes[card.key] ? t("story.edit") : t("story.writeSomething")}
                            </button>
                          )}
                        </div>
                        {editingNote === card.key ? (
                          <textarea autoFocus value={notes[card.key] || ""} onChange={e => saveNote(card.key, e.target.value)} placeholder={t("story.notePlaceholder")}
                            className="w-full min-h-[80px] p-4 rounded-2xl bg-card/60 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-serif" />
                        ) : notes[card.key] ? (
                          <div onClick={() => setEditingNote(card.key)} className="px-4 py-3 rounded-2xl bg-card/40 text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-card/60 transition-colors font-serif italic border border-border/10">
                            {notes[card.key]}
                          </div>
                        ) : null}
                      </div>

                      {/* Share */}
                      <button onClick={() => {
                        const story2 = aiStories[card.key] || card.fallback;
                        setShareDialog({ story: story2, periodLabel: card.label, timeRange: card.timeRange, photos: card.photos });
                      }} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-muted-foreground/50 hover:text-primary hover:bg-card/40 transition-all text-xs font-medium">
                        <Share2 size={13} /><span>{t("story.share")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {shareDialog && (
        <SharePosterDialog
          open={!!shareDialog}
          onClose={() => setShareDialog(null)}
          story={shareDialog.story}
          periodLabel={shareDialog.periodLabel}
          timeRange={shareDialog.timeRange}
          photos={shareDialog.photos}
        />
      )}
    </div>
  );
};

export default StoryPage;
