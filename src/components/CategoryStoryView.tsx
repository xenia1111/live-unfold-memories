import { useMemo, useState, useCallback } from "react";
import { Sparkles, Share2, RefreshCw, Loader2, Camera, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAiStories } from "@/hooks/useStoryData";
import type { Task } from "@/hooks/useTasks";

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; vibe: string }> = {
  "美食": { emoji: "🍜", color: "from-orange-100/60 to-amber-50/40", vibe: "每一口都是幸福的味道" },
  "美景": { emoji: "🏔️", color: "from-emerald-100/60 to-sky-50/40", vibe: "眼睛装满了世界的美" },
  "社交": { emoji: "☕", color: "from-pink-100/60 to-rose-50/40", vibe: "有人陪伴的日子最温暖" },
  "运动": { emoji: "🏃", color: "from-blue-100/60 to-cyan-50/40", vibe: "流汗的每一刻都在发光" },
  "学习": { emoji: "📖", color: "from-violet-100/60 to-purple-50/40", vibe: "知识让灵魂更自由" },
  "工作": { emoji: "💼", color: "from-slate-100/60 to-gray-50/40", vibe: "努力的样子最好看" },
  "健康": { emoji: "🧘", color: "from-teal-100/60 to-green-50/40", vibe: "善待身体，它会回报你" },
  "记录": { emoji: "📝", color: "from-amber-100/60 to-yellow-50/40", vibe: "记下来，就不会忘记" },
  "娱乐": { emoji: "🎵", color: "from-fuchsia-100/60 to-pink-50/40", vibe: "快乐就是生活的意义" },
};

interface CategoryCard {
  category: string;
  emoji: string;
  color: string;
  vibe: string;
  tasks: Task[];
  completed: Task[];
  photos: string[];
  latestDate: Date | null;
}

interface Props {
  tasks: Task[];
}

const CategoryStoryView = ({ tasks }: Props) => {
  const { aiStories, saveAiStory } = useAiStories();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const catMap: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = [];
      catMap[t.category].push(t);
    });

    const cards: CategoryCard[] = Object.entries(catMap)
      .map(([category, catTasks]) => {
        const config = CATEGORY_CONFIG[category] || { emoji: "📌", color: "from-muted/20 to-muted/10", vibe: "每一步都算数" };
        const completed = catTasks.filter(t => t.completed);
        const photos = completed
          .map(t => t.completionPhoto)
          .filter((p): p is string => !!p);
        const dates = catTasks.map(t => t.date).filter((d): d is Date => !!d);
        const latestDate = dates.length > 0 ? dates.sort((a, b) => b.getTime() - a.getTime())[0] : null;

        return { category, ...config, tasks: catTasks, completed, photos, latestDate };
      })
      .filter(c => c.completed.length > 0)
      .sort((a, b) => b.completed.length - a.completed.length);

    return cards;
  }, [tasks]);

  const generateCategoryStory = useCallback(async (card: CategoryCard) => {
    const key = `cat-${card.category}`;
    setLoadingKeys(prev => new Set(prev).add(key));
    try {
      const taskData = card.tasks.map(t => ({
        title: t.title, category: t.category, completed: t.completed,
        deadline: t.deadline ? t.deadline.toISOString() : undefined,
      }));
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: { tasks: taskData, periodLabel: `「${card.category}」类回忆`, timeRange: `共 ${card.completed.length} 次` },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      await saveAiStory(key, data);
    } catch (e: any) {
      console.error("AI category story failed:", e);
      toast.error("故事生成失败", { description: e.message });
    } finally {
      setLoadingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [saveAiStory]);

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <span className="text-4xl block mb-3">🍽️</span>
        <p className="text-sm">还没有完成的计划，去创造一些美好回忆吧！</p>
      </div>
    );
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
            {/* Header card - always visible */}
            <button
              onClick={() => setExpandedCat(isExpanded ? null : card.category)}
              className={cn(
                "w-full text-left rounded-2xl px-5 py-4 bg-gradient-to-br transition-all duration-300",
                card.color,
                isExpanded && "rounded-b-none"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{card.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{card.category}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-card/60 text-foreground/70 font-medium">
                      {card.completed.length} 次
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{card.vibe}</p>
                </div>
                {card.photos.length > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Camera size={12} />
                    <span className="text-[10px]">{card.photos.length}</span>
                  </div>
                )}
                <ChevronRight size={16} className={cn(
                  "text-muted-foreground transition-transform duration-300",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="bg-card rounded-b-2xl border border-t-0 border-border/50 px-5 py-4 animate-fade-in">
                {/* Photo grid */}
                {card.photos.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-foreground mb-2 block">📸 记忆碎片</span>
                    <div className="grid grid-cols-3 gap-2">
                      {card.photos.slice(0, 6).map((photo, pi) => (
                        <div key={pi} className="aspect-square rounded-xl overflow-hidden bg-muted/30">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {card.photos.length > 6 && (
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">还有 {card.photos.length - 6} 张...</p>
                    )}
                  </div>
                )}

                {/* Task timeline */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-foreground mb-2 block">🕰️ 时间线</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {card.completed
                      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
                      .slice(0, 10)
                      .map((t, ti) => (
                        <div key={ti} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg text-xs">
                          <span className="text-muted-foreground w-12 shrink-0">
                            {t.date ? format(t.date, "M/d") : "—"}
                          </span>
                          <span className="text-foreground truncate">{t.title}</span>
                          {t.completionPhoto && <Camera size={10} className="text-muted-foreground shrink-0" />}
                        </div>
                      ))}
                    {card.completed.length > 10 && (
                      <p className="text-[10px] text-muted-foreground text-center">还有 {card.completed.length - 10} 条记录</p>
                    )}
                  </div>
                </div>

                {/* AI story */}
                {story && (
                  <div className="mb-4 p-3 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{story.emoji}</span>
                      <span className="text-sm font-bold text-foreground">{story.title}</span>
                    </div>
                    <p className="text-xs text-primary italic mb-2">"{story.openingLine}"</p>
                    <p className="text-sm text-foreground leading-relaxed">{story.summary}</p>
                  </div>
                )}

                {/* AI generate button */}
                <button
                  onClick={() => generateCategoryStory(card)}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all",
                    story ? "bg-muted/50 text-muted-foreground hover:text-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="animate-spin" /><span>AI 正在回忆...</span></>
                  ) : story ? (
                    <><RefreshCw size={14} /><span>换一个版本</span></>
                  ) : (
                    <><Sparkles size={14} /><span>✨ 用 AI 写一段回忆</span></>
                  )}
                </button>

                {/* Share */}
                {story && (
                  <button
                    onClick={() => {
                      const text = `${story.emoji} ${story.title}\n"${story.openingLine}"\n\n${story.summary}`;
                      if (navigator.share) navigator.share({ title: story.title, text }).catch(() => {});
                      else { navigator.clipboard.writeText(text); toast.success("已复制到剪贴板"); }
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/30 text-muted-foreground hover:text-primary text-xs font-medium transition-all"
                  >
                    <Share2 size={14} /><span>分享这段回忆</span>
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
