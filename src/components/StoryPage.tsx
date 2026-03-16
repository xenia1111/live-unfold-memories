import { useMemo, useState, useCallback, useRef } from "react";
import { Sparkles, Share2, RefreshCw, Loader2, PenLine, Check, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import SharePosterDialog from "./SharePosterDialog";
import CategoryStoryView from "./CategoryStoryView";
import MonthCalendarGrid from "./MonthCalendarGrid";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoryNotes, useAiStories } from "@/hooks/useStoryData";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";

interface StoryData { title: string; openingLine: string; summary: string; highlights: string[]; mood: string; emoji: string; }
interface StoryPageProps { tasks: Task[]; }

const MONTH_NAMES_ZH = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const StoryPage = ({ tasks }: StoryPageProps) => {
  const { t, lang } = useI18n();
  const catName = useCategoryName();
  const { notes, saveNote } = useStoryNotes();
  const { aiStories, saveAiStory } = useAiStories();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCategory, setShowCategory] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ story: any; periodLabel: string; timeRange: string; photos: string[] } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Build 12 months of data
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(now, i);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthTasks = tasks.filter(t => t.date && isWithinInterval(t.date, { start, end }));
      const completed = monthTasks.filter(t => t.completed);
      const photos = completed.map(t => t.completionPhoto).filter((p): p is string => !!p);
      const completedDates = new Set(completed.map(t => t.date ? format(t.date, "yyyy-MM-dd") : "").filter(Boolean));
      const key = `month-${year}-${month}`;
      const monthName = lang === "zh" ? MONTH_NAMES_ZH[month] : MONTH_NAMES_EN[month];
      const label = i === 0 ? t("story.thisMonth") : `${monthName} ${year}`;
      return { key, year, month, label, monthName, start, end, tasks: monthTasks, completed, photos, completedDates, total: monthTasks.length, completedCount: completed.length };
    });
  }, [tasks, lang, t]);

  const activeMonth = months[activeIndex];

  const buildFallback = useCallback((m: typeof months[0]): StoryData => {
    const rate = m.total > 0 ? m.completedCount / m.total : 0;
    const catCount: Record<string, number> = {};
    m.completed.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const highlights: string[] = [];
    if (m.completedCount > 0) highlights.push(interpolate(t("story.fallback.completed"), { n: m.completedCount }));
    topCats.forEach(([cat, count]) => highlights.push(interpolate(t("story.fallback.catCompleted"), { cat: catName(cat), n: count })));
    if (m.total === 0) highlights.push(t("story.fallback.noPlans"));
    return {
      title: m.total === 0 ? t("story.fallback.waiting") : rate >= 0.8 ? t("story.fallback.highlight") : t("story.fallback.steady"),
      openingLine: m.total === 0 ? t("story.fallback.waitingLine") : rate >= 0.8 ? t("story.fallback.highlightLine") : t("story.fallback.steadyLine"),
      summary: m.total === 0 ? t("story.fallback.noTaskLine") : interpolate(t("story.fallback.completedOf"), { done: m.completedCount, total: m.total, rate: Math.round(rate * 100) }),
      highlights, mood: "", emoji: "",
    };
  }, [t, catName]);

  const generateAIStory = useCallback(async (m: typeof months[0]) => {
    setLoadingKeys(prev => new Set(prev).add(m.key));
    try {
      const taskData = m.tasks.map(t => ({ title: t.title, category: t.category, completed: t.completed, deadline: t.deadline ? t.deadline.toISOString() : undefined }));
      const { data, error } = await supabase.functions.invoke("generate-story", { body: { tasks: taskData, periodLabel: m.label, timeRange: `${format(m.start, "M/d")} - ${format(m.end, "M/d")}` } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      await saveAiStory(m.key, data);
    } catch (e: any) {
      console.error("AI story generation failed:", e);
      toast.error(t("story.generateFailed"), { description: e.message });
    } finally { setLoadingKeys(prev => { const n = new Set(prev); n.delete(m.key); return n; }); }
  }, [saveAiStory, t]);

  const goTo = (idx: number) => setActiveIndex(Math.max(0, Math.min(months.length - 1, idx)));

  // Touch swipe handling (vertical)
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(activeIndex + 1); // swipe up → older month
      else goTo(activeIndex - 1); // swipe down → newer month
    }
    setTouchStart(null);
  };

  if (showCategory) {
    return (
      <div className="px-5 pt-10 pb-24 max-w-lg mx-auto animate-fade-in">
        <button onClick={() => setShowCategory(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          <ChevronLeft size={16} />
          <span>{t("story.backToMonths") || "返回月历"}</span>
        </button>
        <CategoryStoryView tasks={tasks} />
      </div>
    );
  }

  const story = aiStories[activeMonth.key] || buildFallback(activeMonth);
  const hasAI = !!aiStories[activeMonth.key];
  const isLoading = loadingKeys.has(activeMonth.key);

  // Render a single month card content
  const renderMonthCard = (m: typeof months[0], index: number) => {
    const s = aiStories[m.key] || buildFallback(m);
    const hasAIStory = !!aiStories[m.key];
    const loading = loadingKeys.has(m.key);

    return (
      <div className="px-5 pt-8 pb-5 max-w-lg mx-auto">
        <div className="rounded-3xl border border-border/30 bg-card shadow-lg overflow-hidden">
          {/* Header: Month title + mini calendar */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground leading-none tracking-tight" style={{ fontFamily: "'Caveat', 'Ma Shan Zheng', cursive" }}>
                  {m.monthName}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{m.year}</p>
                {index === 0 && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {t("story.current")}
                  </span>
                )}
              </div>
              <div className="w-[130px] shrink-0">
                <MonthCalendarGrid year={m.year} month={m.month} completedDates={m.completedDates} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{m.completedCount} {t("story.completed") || "已完成"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                <span>{m.total - m.completedCount} {t("story.pending") || "待完成"}</span>
              </div>
              {m.photos.length > 0 && (
                <div className="text-xs text-muted-foreground ml-auto">📷 {m.photos.length}</div>
              )}
            </div>
          </div>

          {/* AI Summary highlights */}
          <div className="px-6 py-4 border-t border-dashed border-border/30">
            <div className="space-y-2">
              {s.highlights.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary/60 text-xs mt-0.5 shrink-0">✽</span>
                  <span className="text-sm text-foreground/80 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
                    {h.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim()}
                  </span>
                </div>
              ))}
            </div>
            {s.summary && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed italic">{s.summary}</p>
            )}
          </div>

          {/* Photo collage */}
          {m.photos.length > 0 && (
            <div className="px-6 py-4 border-t border-dashed border-border/30">
              <div className="rounded-2xl overflow-hidden mb-2.5 aspect-[16/10] bg-muted/20">
                <img src={m.photos[0]} alt="" className="w-full h-full object-cover" />
              </div>
              {m.photos.length > 1 && (
                <div className="flex gap-2">
                  {m.photos.slice(1, 5).map((photo, i) => (
                    <div key={i} className="flex-1 aspect-square rounded-xl overflow-hidden bg-muted/20">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {m.photos.length > 5 && (
                    <div className="flex-1 aspect-square rounded-xl bg-muted/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">+{m.photos.length - 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No photos empty state */}
          {m.photos.length === 0 && m.completedCount > 0 && (
            <div className="px-6 py-6 border-t border-dashed border-border/30 text-center">
              <span className="text-2xl block mb-1">📷</span>
              <p className="text-xs text-muted-foreground">{t("story.noPhotos") || "完成任务时拍张照，记录美好瞬间"}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 py-4 border-t border-dashed border-border/30 space-y-2.5">
            <button
              onClick={() => generateAIStory(m)}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-medium transition-all duration-300",
                hasAIStory
                  ? "bg-muted/30 text-muted-foreground hover:text-foreground"
                  : "gradient-warm text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98]"
              )}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /><span>{t("story.aiGenerating")}</span></>
              ) : hasAIStory ? (
                <><RefreshCw size={14} /><span>{t("story.refreshStory")}</span></>
              ) : (
                <><Sparkles size={14} /><span>{t("story.generateAI")}</span></>
              )}
            </button>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PenLine size={12} className="text-primary/50" />
                  <span className="text-[11px] font-semibold text-foreground/60">{t("story.notes")}</span>
                </div>
                {editingNote === m.key ? (
                  <button onClick={() => { setEditingNote(null); saveNote(m.key, notes[m.key] || ""); }} className="flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Check size={12} /><span>{t("story.done")}</span>
                  </button>
                ) : (
                  <button onClick={() => setEditingNote(m.key)} className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors italic">
                    {notes[m.key] ? t("story.edit") : t("story.writeSomething")}
                  </button>
                )}
              </div>
              {editingNote === m.key ? (
                <textarea autoFocus value={notes[m.key] || ""} onChange={e => saveNote(m.key, e.target.value)} placeholder={t("story.notePlaceholder")}
                  className="w-full min-h-[70px] p-3 rounded-2xl bg-muted/15 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive" }} />
              ) : notes[m.key] ? (
                <div onClick={() => setEditingNote(m.key)} className="px-3 py-2.5 rounded-2xl bg-muted/10 text-sm text-foreground/60 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-muted/20 transition-colors border border-border/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
                  {notes[m.key]}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShareDialog({ story: s, periodLabel: m.label, timeRange: `${format(m.start, "M/d")} - ${format(m.end, "M/d")}`, photos: m.photos });
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted/15 text-muted-foreground hover:text-primary text-[11px] font-medium transition-all"
              >
                <Share2 size={12} /><span>{t("story.share")}</span>
              </button>
              <button
                onClick={() => setShowCategory(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted/15 text-muted-foreground hover:text-primary text-[11px] font-medium transition-all"
              >
                <Layers size={12} /><span>{t("story.categoryView") || "分类回顾"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PEEK_HEIGHT = 34;
  const MAX_STACKED = 6;

  // Older months = higher index in months array
  const olderCount = months.length - 1 - activeIndex;
  const numVisibleAbove = Math.min(olderCount, MAX_STACKED);
  // Newer months (below) = activeIndex
  const newerCount = activeIndex;
  const numVisibleBelow = Math.min(newerCount, MAX_STACKED);

  const stackTopHeight = numVisibleAbove * PEEK_HEIGHT;
  const stackBottomHeight = numVisibleBelow * PEEK_HEIGHT;

  return (
    <div
      className="h-[calc(100vh-80px)] relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stacked OLDER months above — oldest at top, newest near active */}
      {months.map((m, i) => {
        if (i <= activeIndex) return null;
        const stackPos = i - activeIndex; // 1 = nearest older
        if (stackPos > MAX_STACKED) return null;

        // Nearest older month at bottom of stack area, oldest at top
        const topOffset = (numVisibleAbove - stackPos) * PEEK_HEIGHT;

        return (
          <div
            key={m.key}
            onClick={() => goTo(i)}
            className="absolute left-0 right-0 cursor-pointer transition-all duration-400 ease-out"
            style={{
              top: `${topOffset}px`,
              height: `${PEEK_HEIGHT}px`,
              zIndex: stackPos,
            }}
          >
            <div className={cn(
              "h-full bg-card border-x border-t border-border/20 px-6 flex items-center",
              stackPos === numVisibleAbove && "rounded-t-2xl",
              "shadow-[0_1px_0_0_hsl(var(--border)/0.15)]"
            )}>
              <span className="text-sm font-semibold text-foreground/45 tracking-wide" style={{ fontFamily: "'Caveat', 'Ma Shan Zheng', cursive" }}>
                {m.monthName}
              </span>
              <span className="text-[10px] text-muted-foreground/35 ml-2">{m.year}</span>
            </div>
          </div>
        );
      })}

      {/* Active card */}
      <div
        key={activeMonth.key}
        className="absolute left-0 right-0 transition-all duration-400 ease-out"
        style={{
          top: `${stackTopHeight}px`,
          bottom: `${stackBottomHeight}px`,
          zIndex: MAX_STACKED + 2,
        }}
      >
        <div className={cn(
          "h-full rounded-t-3xl bg-card border border-b-0 border-border/20 overflow-hidden",
          "shadow-[0_-4px_16px_-4px_hsl(var(--foreground)/0.08)]"
        )}>
          <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {renderMonthCard(activeMonth, activeIndex)}
            <div className="h-20" /> {/* bottom spacing for nav bar */}
          </div>
        </div>

        {/* "Back to this month" floating button */}
        {activeIndex !== 0 && (
          <button
            onClick={() => goTo(0)}
            className="absolute top-3 right-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-medium shadow-md hover:bg-primary transition-colors"
          >
            <ChevronRight size={12} />
            <span>{t("story.current") || "本月"}</span>
          </button>
        )}
      </div>

      {/* Stacked NEWER months below — newest at bottom, oldest near active */}
      {months.map((m, i) => {
        if (i >= activeIndex) return null;
        const stackPos = activeIndex - i; // 1 = nearest newer
        if (stackPos > MAX_STACKED) return null;

        const bottomOffset = (numVisibleBelow - stackPos) * PEEK_HEIGHT;

        return (
          <div
            key={m.key}
            onClick={() => goTo(i)}
            className="absolute left-0 right-0 cursor-pointer transition-all duration-400 ease-out"
            style={{
              bottom: `${bottomOffset}px`,
              height: `${PEEK_HEIGHT}px`,
              zIndex: stackPos,
            }}
          >
            <div className={cn(
              "h-full bg-card border-x border-b border-border/20 px-6 flex items-center",
              stackPos === numVisibleBelow && "rounded-b-2xl",
              "shadow-[0_-1px_0_0_hsl(var(--border)/0.15)]"
            )}>
              <span className="text-sm font-semibold text-foreground/45 tracking-wide" style={{ fontFamily: "'Caveat', 'Ma Shan Zheng', cursive" }}>
                {m.monthName}
              </span>
              <span className="text-[10px] text-muted-foreground/35 ml-2">{m.year}</span>
            </div>
          </div>
        );
      })}

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
