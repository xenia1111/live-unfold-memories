import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { Task } from "@/hooks/useTasks";
import { getCatPersonality } from "@/lib/catPersonality";
import { useI18n, useCategoryName } from "@/lib/i18n";

const CATEGORY_EMOJIS: Record<string, string> = {
  "美食": "", "学习": "", "运动": "", "社交": "", "工作": "",
  "美景": "", "娱乐": "", "记录": "", "健康": "", "美丽": "",
};
const ALL_CATEGORIES = Object.keys(CATEGORY_EMOJIS);

interface CatRadarDialogProps { open: boolean; onOpenChange: (open: boolean) => void; tasks: Task[]; }

const CatRadarDialog = ({ open, onOpenChange, tasks }: CatRadarDialogProps) => {
  const { t } = useI18n();
  const catName = useCategoryName();
  const completed = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const personality = useMemo(() => getCatPersonality(tasks), [tasks]);

  const personalityLabel = personality.category ? t(`personality.${personality.category}`) : t("personality.default");
  const personalityDesc = personality.category ? t(`personality.${personality.category}Desc`) : t("personality.defaultDesc");

  const radarData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of completed) counts[t.category] = (counts[t.category] || 0) + 1;
    const max = Math.max(...Object.values(counts), 1);
    return ALL_CATEGORIES.map(cat => ({ category: catName(cat), value: counts[cat] || 0, fullMark: max }));
  }, [completed, catName]);

  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of completed) counts[t.category] = (counts[t.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [completed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-3xl p-5">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-center text-base font-semibold">{personalityLabel}</DialogTitle>
          <p className="text-center text-xs text-muted-foreground mt-1">{personalityDesc}</p>
        </DialogHeader>
        <div className="w-full h-[220px] -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 -mt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("radar.top3")}</p>
          {topCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">{t("radar.empty")}</p>
          ) : (
            topCategories.map(([cat, count], i) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground/50 w-4 text-right font-mono">{i + 1}.</span>
                <span className="font-medium text-foreground">{catName(cat)}</span>
                <span className="font-medium text-foreground">{catName(cat)}</span>
                <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-accent/60 transition-all duration-500" style={{ width: `${topCategories[0] ? (count / topCategories[0][1]) * 100 : 0}%` }} />
                </div>
                <span className="text-muted-foreground/60 font-mono w-6 text-right">{count}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatRadarDialog;
