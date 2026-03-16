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

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goTo(activeIndex + 1); // swipe up → next (older)
      else goTo(activeIndex - 1); // swipe down → prev (newer)
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

  return (
    <div className="px-5 pt-6 pb-24 max-w-lg mx-auto" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Month navigation arrows at top */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === months.length - 1}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", activeIndex === months.length - 1 ? "text-muted-foreground/20" : "text-foreground/50 hover:bg-muted/30 active:scale-90")}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-foreground/70 font-medium">
          {activeMonth.monthName} {activeMonth.year}
        </span>
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", activeIndex === 0 ? "text-muted-foreground/20" : "text-foreground/50 hover:bg-muted/30 active:scale-90")}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Card stack */}
      <div className="relative">

        {/* Stacked card tabs behind — show up to 2 behind cards */}
        {months.slice(activeIndex + 1, activeIndex + 3).map((m, i) => (
          <button
            key={m.key}
            onClick={() => goTo(activeIndex + i + 1)}
            className="absolute left-1 right-1 bottom-0 rounded-b-3xl border border-t-0 border-border/15 bg-card/60 backdrop-blur-sm transition-all duration-500 cursor-pointer"
            style={{
              bottom: `${-(i + 1) * 10 - 4}px`,
              height: "16px",
              zIndex: 10 - i,
              transform: `scale(${1 - (i + 1) * 0.04})`,
              opacity: 1 - (i + 1) * 0.25,
            }}
          />
        ))}

        {/* Active card */}
        <div
          key={activeMonth.key}
          className="relative z-20 rounded-3xl border border-border/30 bg-card shadow-lg overflow-hidden animate-fade-in"
        >
          {/* Header: Month title + mini calendar */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Month name large */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground leading-none tracking-tight" style={{ fontFamily: "'Caveat', 'Ma Shan Zheng', cursive" }}>
                  {activeMonth.monthName}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{activeMonth.year}</p>
                {activeIndex === 0 && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {t("story.current")}
                  </span>
                )}
              </div>
              {/* Mini calendar */}
              <div className="w-[130px] shrink-0">
                <MonthCalendarGrid year={activeMonth.year} month={activeMonth.month} completedDates={activeMonth.completedDates} />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{activeMonth.completedCount} {t("story.completed") || "已完成"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                <span>{activeMonth.total - activeMonth.completedCount} {t("story.pending") || "待完成"}</span>
              </div>
              {activeMonth.photos.length > 0 && (
                <div className="text-xs text-muted-foreground ml-auto">
                  📷 {activeMonth.photos.length}
                </div>
              )}
            </div>
          </div>

          {/* AI Summary highlights */}
          <div className="px-6 py-4 border-t border-dashed border-border/30">
            <div className="space-y-2">
              {story.highlights.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary/60 text-xs mt-0.5 shrink-0">✽</span>
                  <span className="text-sm text-foreground/80 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
                    {h.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim()}
                  </span>
                </div>
              ))}
            </div>
            {story.summary && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed italic">
                {story.summary}
              </p>
            )}
          </div>

          {/* Photo collage */}
          {activeMonth.photos.length > 0 && (
            <div className="px-6 py-4 border-t border-dashed border-border/30">
              {/* Main photo */}
              <div className="rounded-2xl overflow-hidden mb-2.5 aspect-[16/10] bg-muted/20">
                <img src={activeMonth.photos[0]} alt="" className="w-full h-full object-cover" />
              </div>
              {/* Small photo row */}
              {activeMonth.photos.length > 1 && (
                <div className="flex gap-2">
                  {activeMonth.photos.slice(1, 5).map((photo, i) => (
                    <div key={i} className="flex-1 aspect-square rounded-xl overflow-hidden bg-muted/20">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {activeMonth.photos.length > 5 && (
                    <div className="flex-1 aspect-square rounded-xl bg-muted/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">+{activeMonth.photos.length - 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No photos empty state */}
          {activeMonth.photos.length === 0 && activeMonth.completedCount > 0 && (
            <div className="px-6 py-6 border-t border-dashed border-border/30 text-center">
              <span className="text-2xl block mb-1">📷</span>
              <p className="text-xs text-muted-foreground">{t("story.noPhotos") || "完成任务时拍张照，记录美好瞬间"}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 py-4 border-t border-dashed border-border/30 space-y-2.5">
            {/* AI generate */}
            <button
              onClick={() => generateAIStory(activeMonth)}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-medium transition-all duration-300",
                hasAI
                  ? "bg-muted/30 text-muted-foreground hover:text-foreground"
                  : "gradient-warm text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>{t("story.aiGenerating")}</span></>
              ) : hasAI ? (
                <><RefreshCw size={14} /><span>{t("story.refreshStory")}</span></>
              ) : (
                <><Sparkles size={14} /><span>{t("story.generateAI")}</span></>
              )}
            </button>

            {/* Notes */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PenLine size={12} className="text-primary/50" />
                  <span className="text-[11px] font-semibold text-foreground/60">{t("story.notes")}</span>
                </div>
                {editingNote === activeMonth.key ? (
                  <button onClick={() => { setEditingNote(null); saveNote(activeMonth.key, notes[activeMonth.key] || ""); }} className="flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Check size={12} /><span>{t("story.done")}</span>
                  </button>
                ) : (
                  <button onClick={() => setEditingNote(activeMonth.key)} className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors italic">
                    {notes[activeMonth.key] ? t("story.edit") : t("story.writeSomething")}
                  </button>
                )}
              </div>
              {editingNote === activeMonth.key ? (
                <textarea autoFocus value={notes[activeMonth.key] || ""} onChange={e => saveNote(activeMonth.key, e.target.value)} placeholder={t("story.notePlaceholder")}
                  className="w-full min-h-[70px] p-3 rounded-2xl bg-muted/15 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive" }} />
              ) : notes[activeMonth.key] ? (
                <div onClick={() => setEditingNote(activeMonth.key)} className="px-3 py-2.5 rounded-2xl bg-muted/10 text-sm text-foreground/60 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-muted/20 transition-colors border border-border/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
                  {notes[activeMonth.key]}
                </div>
              ) : null}
            </div>

            {/* Share + Category buttons row */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const s = aiStories[activeMonth.key] || buildFallback(activeMonth);
                  setShareDialog({ story: s, periodLabel: activeMonth.label, timeRange: `${format(activeMonth.start, "M/d")} - ${format(activeMonth.end, "M/d")}`, photos: activeMonth.photos });
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

        {/* Month navigation arrows at bottom */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", activeIndex === 0 ? "text-muted-foreground/20" : "text-foreground/50 hover:bg-muted/30 active:scale-90")}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {activeIndex + 1} / {months.length}
          </span>
          <button
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === months.length - 1}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", activeIndex === months.length - 1 ? "text-muted-foreground/20" : "text-foreground/50 hover:bg-muted/30 active:scale-90")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

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
