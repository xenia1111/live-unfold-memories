import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { Task } from "@/hooks/useTasks";
import { getCatPersonality } from "@/lib/catPersonality";

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  "美食": { emoji: "🍜", label: "美食" },
  "学习": { emoji: "📚", label: "学习" },
  "运动": { emoji: "💪", label: "运动" },
  "社交": { emoji: "💬", label: "社交" },
  "工作": { emoji: "💼", label: "工作" },
  "美景": { emoji: "🏔️", label: "美景" },
  "娱乐": { emoji: "🎮", label: "娱乐" },
  "记录": { emoji: "✍️", label: "记录" },
  "健康": { emoji: "🧘", label: "健康" },
  "美丽": { emoji: "💄", label: "美丽" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

interface CatRadarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

const CatRadarDialog = ({ open, onOpenChange, tasks }: CatRadarDialogProps) => {
  const completed = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const personality = useMemo(() => getCatPersonality(tasks), [tasks]);

  const radarData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of completed) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    const max = Math.max(...Object.values(counts), 1);
    return ALL_CATEGORIES.map((cat) => ({
      category: `${CATEGORY_META[cat].emoji} ${CATEGORY_META[cat].label}`,
      value: counts[cat] || 0,
      fullMark: max,
    }));
  }, [completed]);

  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of completed) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [completed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-3xl p-5">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-center text-base font-semibold">
            {personality.emoji} {personality.label}
          </DialogTitle>
          <p className="text-center text-xs text-muted-foreground mt-1">
            {personality.desc}
          </p>
        </DialogHeader>

        <div className="w-full h-[220px] -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 口味排行 */}
        <div className="space-y-1.5 -mt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            偏好口味 TOP 3
          </p>
          {topCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">
              还没有完成任何任务哦～快去喂猫猫吧
            </p>
          ) : (
            topCategories.map(([cat, count], i) => {
              const meta = CATEGORY_META[cat] || { emoji: "📦", label: cat };
              return (
                <div
                  key={cat}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-muted-foreground/50 w-4 text-right font-mono">
                    {i + 1}.
                  </span>
                  <span>{meta.emoji}</span>
                  <span className="font-medium text-foreground">
                    {meta.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-accent/60 transition-all duration-500"
                      style={{
                        width: `${
                          topCategories[0]
                            ? (count / topCategories[0][1]) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground/60 font-mono w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatRadarDialog;
