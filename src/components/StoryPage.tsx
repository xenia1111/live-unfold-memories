import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { extractDominantColor, hslToString } from "@/lib/colorExtract";
import { Sparkles, Share2, RefreshCw, Loader2, PenLine, Check, Layers } from "lucide-react";
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

const PEEK_HEIGHT = 48; // px height of each peeking card header
const SCALE_STEP = 0.03; // scale reduction per layer
const MAX_VISIBLE_BEHIND = 2; // max peeking cards behind active
const SAFE_TOP = 56; // px safe area padding matching pt-14

const StoryPage = ({ tasks }: StoryPageProps) => {
  const { t, lang } = useI18n();
  const catName = useCategoryName();
  const { notes, saveNote } = useStoryNotes();
  const { aiStories, saveAiStory } = useAiStories();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCategory, setShowCategory] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ story: any; periodLabel: string; timeRange: string; photos: string[]; calendarData?: any } | null>(null);

  // Swipe state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<{ y: number; time: number; canSwipe: boolean } | null>(null);

  // Non-passive touchmove
  const touchMoveHandler = useRef<(e: TouchEvent) => void>();
  touchMoveHandler.current = (e: TouchEvent) => {
    const start = touchRef.current;
    if (!start) return;

    const dy = e.touches[0].clientY - start.y;

    if (!start.canSwipe) {
      const scrollEl = scrollRef.current;
      if (scrollEl) {
        const atTop = scrollEl.scrollTop <= 1;
        const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
        if ((dy > 0 && atTop) || (dy < 0 && atBottom)) {
          start.canSwipe = true;
        } else {
          return; // let internal scroll happen
        }
      } else {
        start.canSwipe = true;
      }
    }

    if (start.canSwipe) {
      e.preventDefault();
      // Resist at boundaries
      let offset = dy;
      if ((activeIndex === 0 && dy > 0) || (activeIndex === months.length - 1 && dy < 0)) {
        offset = dy * 0.3;
      }
      setDragOffset(offset);
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => touchMoveHandler.current?.(e);
    el.addEventListener("touchmove", handler, { passive: false });
    return () => el.removeEventListener("touchmove", handler);
  }, []);

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
      const incomplete = monthTasks.filter(t => !t.completed);
      let photos = completed.map(t => t.completionPhoto).filter((p): p is string => !!p);
      // Demo photos for current month preview
      if (i === 0 && photos.length === 0) {
        photos = ["/images/demo-photo-1.jpg", "/images/demo-photo-2.jpg", "/images/demo-photo-3.jpg"];
      }
      const completedDates = new Set(completed.map(t => t.date ? format(t.date, "yyyy-MM-dd") : "").filter(Boolean));
      const taskDates = new Set(monthTasks.map(t => t.date ? format(t.date, "yyyy-MM-dd") : "").filter(Boolean));
      const incompleteDates = new Set(incomplete.map(t => t.date ? format(t.date, "yyyy-MM-dd") : "").filter(Boolean));
      const key = `month-${year}-${month}`;
      const monthName = lang === "zh" ? MONTH_NAMES_ZH[month] : MONTH_NAMES_EN[month];
      const label = i === 0 ? t("story.thisMonth") : `${monthName} ${year}`;
      return { key, year, month, label, monthName, start, end, tasks: monthTasks, completed, photos, completedDates, taskDates, incompleteDates, total: monthTasks.length, completedCount: completed.length };
    });
  }, [tasks, lang, t]);

  // Extract dominant color from first photo of each month
  const [monthColors, setMonthColors] = useState<Record<string, { h: number; s: number; l: number }>>({});

  useEffect(() => {
    months.forEach(m => {
      if (m.photos.length > 0 && !monthColors[m.key]) {
        extractDominantColor(m.photos[0]).then(color => {
          if (color) {
            setMonthColors(prev => ({ ...prev, [m.key]: color }));
          }
        });
      }
    });
  }, [months]);

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

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { y: e.touches[0].clientY, time: Date.now(), canSwipe: false };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;

    if (!start?.canSwipe || !isDragging) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const dy = e.changedTouches[0].clientY - start.y;
    const dt = Date.now() - start.time;
    const velocity = Math.abs(dy) / dt;
    const threshold = 80;

    let newIndex = activeIndex;
    if (Math.abs(dy) > threshold || velocity > 0.3) {
      if (dy < 0 && activeIndex < months.length - 1) newIndex = activeIndex + 1;
      else if (dy > 0 && activeIndex > 0) newIndex = activeIndex - 1;
    }

    setActiveIndex(newIndex);
    setDragOffset(0);
    setIsDragging(false);
  }, [activeIndex, isDragging, months.length]);

  if (showCategory) {
    return (
      <div className="px-5 pt-10 pb-24 max-w-lg mx-auto animate-fade-in">
        <button onClick={() => setShowCategory(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          <span>←</span>
          <span>{t("story.backToMonths")}</span>
        </button>
        <CategoryStoryView tasks={tasks} />
      </div>
    );
  }

  // Only show up to MAX_VISIBLE_BEHIND peeking cards behind active
  const olderStack = months
    .slice(activeIndex + 1, activeIndex + 1 + MAX_VISIBLE_BEHIND)
    .map((month, offset) => ({ month, index: activeIndex + 1 + offset }))
    .reverse();

  const activeTop = olderStack.length * PEEK_HEIGHT;

  const renderMonthCard = (m: typeof months[0], isActive = false) => {
    const s = aiStories[m.key] || buildFallback(m);
    const hasAIStory = !!aiStories[m.key];
    const loading = loadingKeys.has(m.key);
    const themeColor = monthColors[m.key];
    const accentColor = themeColor ? hslToString(themeColor, { s: Math.min(themeColor.s + 10, 70), l: Math.max(themeColor.l - 10, 30) }) : undefined;
    const accentColorLight = themeColor ? hslToString(themeColor, { s: Math.min(themeColor.s, 50), l: Math.min(themeColor.l + 25, 85), a: 0.15 }) : undefined;
    const accentColorMuted = themeColor ? hslToString(themeColor, { s: Math.min(themeColor.s, 40), l: Math.min(themeColor.l + 10, 60), a: 0.6 }) : undefined;

    return (
      <div className={cn("h-full flex flex-col overflow-hidden", !isActive && "pointer-events-none select-none")}>
        <div
          ref={isActive ? (el) => { if (el) scrollRef.current = el; } : undefined}
          className={cn("flex-1", isActive ? "overflow-y-auto" : "overflow-hidden")}
          style={{ scrollbarWidth: "none" }}
        >
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1
                  className="text-3xl font-bold leading-none tracking-tight"
                  style={{ fontFamily: "'Caveat', 'Ma Shan Zheng', cursive", color: accentColor || 'hsl(var(--foreground))' }}
                >
                  {m.monthName}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{m.year}</p>
                {m.key === months[0].key && (
                  <span
                    className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={accentColor ? { backgroundColor: accentColorLight, color: accentColor } : undefined}
                  >
                    {t("story.current")}
                  </span>
                )}
                <div className="mt-3 space-y-1.5">
                  {s.highlights.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[10px] mt-0.5 shrink-0" style={{ color: accentColorMuted || 'hsl(var(--primary) / 0.6)' }}>✽</span>
                      <span className="text-xs text-foreground/70 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
                        {h.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2B50}\u{2728}\u{270A}-\u{270D}\u{2764}]/gu, "").trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[130px] shrink-0">
                <MonthCalendarGrid year={m.year} month={m.month} completedDates={m.completedDates} taskDates={m.taskDates} incompleteDates={m.incompleteDates} themeColor={themeColor} />
              </div>
            </div>
          </div>

          {m.photos.length > 0 && (
            <div className="px-5 py-2 border-t border-dashed border-border/30">
              <div className="relative">
                {/* Hero photo - large, takes most width */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-muted/20 shadow-sm">
                  <img src={m.photos[0]} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Smaller photos stacked on right side, overlapping */}
                {m.photos.length > 1 && (
                  <div className="absolute right-3 bottom-4 flex flex-col gap-2">
                    {m.photos.slice(1, 4).map((photo, i) => (
                      <div
                        key={i}
                        className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted/20 border-2 border-card shadow-lg"
                        style={{ transform: `rotate(${i % 2 === 0 ? 2 : -1.5}deg)` }}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {m.photos.length > 4 && (
                      <div className="w-[72px] h-[72px] rounded-xl bg-foreground/60 border-2 border-card shadow-lg flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xs text-card font-semibold">+{m.photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {m.photos.length === 0 && m.completedCount > 0 && (
            <div className="px-5 py-6 border-t border-dashed border-border/30 text-center">
              <p className="text-xs text-muted-foreground">{t("story.noPhotos") || "完成任务时拍张照，记录美好瞬间"}</p>
            </div>
          )}

          <div className="px-5 py-2 border-t border-dashed border-border/30 space-y-1.5">
            <button
              onClick={() => generateAIStory(m)}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-medium transition-all duration-300",
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

            <div className="pt-1">
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const s2 = aiStories[m.key] || buildFallback(m);
                  setShareDialog({ story: s2, periodLabel: m.label, timeRange: `${format(m.start, "M/d")} - ${format(m.end, "M/d")}`, photos: m.photos, calendarData: { year: m.year, month: m.month, monthName: m.monthName, completedDates: m.completedDates, taskDates: m.taskDates, themeColor: monthColors[m.key] } });
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted/15 text-muted-foreground hover:text-primary text-[11px] font-medium transition-all"
              >
                <Share2 size={12} /><span>{t("story.share")}</span>
              </button>
              <button
                onClick={() => setShowCategory(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted/15 text-muted-foreground hover:text-primary text-[11px] font-medium transition-all"
              >
                <Layers size={12} /><span>{t("story.categoryView")}</span>
              </button>
            </div>
          </div>
          <div className="h-2" />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-80px)] relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {olderStack.map(({ month, index }, layerIndex) => {
        const layersFromFront = olderStack.length - layerIndex;
        const scale = 1 - Math.min(layersFromFront, 6) * SCALE_STEP;

        return (
          <div
            key={month.key}
            className="absolute left-0 right-0 bottom-0 cursor-pointer"
            style={{
              top: `${SAFE_TOP + layerIndex * PEEK_HEIGHT}px`,
              zIndex: layerIndex + 1,
              transform: `scale(${Math.max(scale, 0.86)})`,
              transformOrigin: "top center",
              transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            onClick={() => { setActiveIndex(index); setDragOffset(0); }}
          >
            <div className="mx-4 h-full rounded-3xl border border-border/30 bg-card shadow-xl overflow-hidden">
              {renderMonthCard(month)}
            </div>
          </div>
        );
      })}

      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: `${SAFE_TOP + activeTop}px`,
          zIndex: olderStack.length + 20,
          transform: `translateY(${isDragging ? dragOffset : 0}px)`,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        <div className="mx-4 h-full rounded-3xl border border-border/30 bg-card shadow-xl overflow-hidden">
          {renderMonthCard(months[activeIndex], true)}
        </div>
      </div>


      {activeIndex !== 0 && (
        <button
          onClick={() => { setActiveIndex(0); setDragOffset(0); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full border border-border/50 bg-card px-5 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur-sm transition-all hover:shadow-lg active:scale-95"
        >
          {lang === "zh" ? "回到本月" : "Back to this month"}
        </button>
      )}

      {shareDialog && (
        <SharePosterDialog
          open={!!shareDialog}
          onClose={() => setShareDialog(null)}
          story={shareDialog.story}
          periodLabel={shareDialog.periodLabel}
          timeRange={shareDialog.timeRange}
          photos={shareDialog.photos}
          calendarData={shareDialog.calendarData}
        />
      )}
    </div>
  );
};

export default StoryPage;
