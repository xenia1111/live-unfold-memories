import { useMemo, useState, useCallback } from "react";
import { Sparkles, Share2, RefreshCw, Loader2, Camera, ChevronRight } from "lucide-react";
import SharePosterDialog from "./SharePosterDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAiStories } from "@/hooks/useStoryData";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";

const CATEGORY_EMOJIS: Record<string, string> = { "美食": "🍜", "学习": "📖", "运动": "🏃", "社交": "☕", "工作": "💼", "美景": "🏔️", "娱乐": "🎵", "记录": "📝", "健康": "🧘", "美丽": "💄" };
const CATEGORY_COLORS: Record<string, string> = { "美食": "from-orange-100/60 to-amber-50/40", "学习": "from-violet-100/60 to-purple-50/40", "运动": "from-blue-100/60 to-cyan-50/40", "社交": "from-pink-100/60 to-rose-50/40", "工作": "from-slate-100/60 to-gray-50/40", "美景": "from-emerald-100/60 to-sky-50/40", "娱乐": "from-fuchsia-100/60 to-pink-50/40", "记录": "from-amber-100/60 to-yellow-50/40", "健康": "from-teal-100/60 to-green-50/40", "美丽": "from-rose-100/60 to-pink-50/40" };

interface CategoryCard { category: string; emoji: string; color: string; vibe: string; tasks: Task[]; completed: Task[]; photos: string[]; latestDate: Date | null; }
interface Props { tasks: Task[]; }

const CategoryStoryView = ({ tasks }: Props) => {
  const { t } = useI18n();
  const catName = useCategoryName();
  const { aiStories, saveAiStory } = useAiStories();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [shareDialog, setShareDialog] = useState<{ story: any; periodLabel: string; timeRange: string; photos: string[] } | null>(null);

  const categories = useMemo(() => {
    const catMap: Record<string, Task[]> = {};
    tasks.forEach(task => { if (!catMap[task.category]) catMap[task.category] = []; catMap[task.category].push(task); });
    return Object.entries(catMap).map(([category, catTasks]) => {
      const emoji = CATEGORY_EMOJIS[category] || "📌";
      const color = CATEGORY_COLORS[category] || "from-muted/20 to-muted/10";
      const vibe = t(`catVibe.${category}`) || "";
      const completed = catTasks.filter(t => t.completed);
      const photos = completed.map(t => t.completionPhoto).filter((p): p is string => !!p);
      const dates = catTasks.map(t => t.date).filter((d): d is Date => !!d);
      const latestDate = dates.length > 0 ? dates.sort((a, b) => b.getTime() - a.getTime())[0] : null;
      return { category, emoji, color, vibe, tasks: catTasks, completed, photos, latestDate } as CategoryCard;
    }).filter(c => c.completed.length > 0).sort((a, b) => b.completed.length - a.completed.length);
  }, [tasks, t, catName]);

  const generateCategoryStory = useCallback(async (card: CategoryCard) => {
    const key = `cat-${card.category}`;
    setLoadingKeys(prev => new Set(prev).add(key));
    try {
      const taskData = card.tasks.map(t => ({ title: t.title, category: t.category, completed: t.completed, deadline: t.deadline ? t.deadline.toISOString() : undefined }));
      const { data, error } = await supabase.functions.invoke("generate-story", { body: { tasks: taskData, periodLabel: interpolate(t("catStory.memLabel"), { cat: catName(card.category) }), timeRange: interpolate(t("catStory.countLabel"), { n: card.completed.length }) } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      await saveAiStory(key, data);
    } catch (e: any) {
      console.error("AI category story failed:", e);
      toast.error(t("catStory.failed"), { description: e.message });
    } finally { setLoadingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }
  }, [saveAiStory, t, catName]);

  if (categories.length === 0) {
    return (<div className="text-center py-16 text-muted-foreground"><span className="text-4xl block mb-3">🍽️</span><p className="text-sm">{t("catStory.empty")}</p></div>);
  }

  return (
    <div className="space-y-4">
      {categories.map((card, i) => {
        const key = `cat-${card.category}`;
        const story = aiStories[key];
        const isLoading = loadingKeys.has(key);
        const isExpanded = expandedCat === card.category;
        return (
          <div key={card.category} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <button onClick={() => setExpandedCat(isExpanded ? null : card.category)}
              className={cn("w-full text-left rounded-2xl px-5 py-4 bg-gradient-to-br transition-all duration-300", card.color, isExpanded && "rounded-b-none")}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{card.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{catName(card.category)}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-card/60 text-foreground/70 font-medium">{interpolate(t("catStory.times"), { n: card.completed.length })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{card.vibe}</p>
                </div>
                {card.photos.length > 0 && <div className="flex items-center gap-1 text-muted-foreground"><Camera size={12} /><span className="text-[10px]">{card.photos.length}</span></div>}
                <ChevronRight size={16} className={cn("text-muted-foreground transition-transform duration-300", isExpanded && "rotate-90")} />
              </div>
            </button>
            {isExpanded && (
              <div className="bg-card rounded-b-2xl border border-t-0 border-border/50 px-5 py-4 animate-fade-in">
                {card.photos.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-foreground mb-2 block">{t("catStory.photos")}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {card.photos.slice(0, 6).map((photo, pi) => (<div key={pi} className="aspect-square rounded-xl overflow-hidden bg-muted/30"><img src={photo} alt="" className="w-full h-full object-cover" /></div>))}
                    </div>
                    {card.photos.length > 6 && <p className="text-[10px] text-muted-foreground mt-1 text-center">{interpolate(t("catStory.morePhotos"), { n: card.photos.length - 6 })}</p>}
                  </div>
                )}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-foreground mb-2 block">{t("catStory.timeline")}</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {card.completed.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 10).map((task, ti) => (
                      <div key={ti} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg text-xs">
                        <span className="text-muted-foreground w-12 shrink-0">{task.date ? format(task.date, "M/d") : "—"}</span>
                        <span className="text-foreground truncate">{task.title}</span>
                        {task.completionPhoto && <Camera size={10} className="text-muted-foreground shrink-0" />}
                      </div>
                    ))}
                    {card.completed.length > 10 && <p className="text-[10px] text-muted-foreground text-center">{interpolate(t("catStory.moreRecords"), { n: card.completed.length - 10 })}</p>}
                  </div>
                </div>
                {story && (
                  <div className="mb-4 p-3 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-2 mb-1"><span className="text-lg">{story.emoji}</span><span className="text-sm font-bold text-foreground">{story.title}</span></div>
                    <p className="text-xs text-primary italic mb-2">"{story.openingLine}"</p>
                    <p className="text-sm text-foreground leading-relaxed">{story.summary}</p>
                  </div>
                )}
                <button onClick={() => generateCategoryStory(card)} disabled={isLoading}
                  className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all", story ? "bg-muted/50 text-muted-foreground hover:text-foreground" : "bg-primary/10 text-primary hover:bg-primary/20")}>
                  {isLoading ? (<><Loader2 size={14} className="animate-spin" /><span>{t("catStory.aiGenerating")}</span></>) : story ? (<><RefreshCw size={14} /><span>{t("catStory.refresh")}</span></>) : (<><Sparkles size={14} /><span>{t("catStory.generate")}</span></>)}
                </button>
                {story && (
                  <button onClick={() => {
                    setShareDialog({ story, periodLabel: catName(card.category), timeRange: interpolate(t("catStory.times"), { n: card.completed.length }), photos: card.photos });
                  }}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/30 text-muted-foreground hover:text-primary text-xs font-medium transition-all">
                    <Share2 size={14} /><span>{t("catStory.shareMem")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CategoryStoryView;
