import { Flame, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { calcCatFood, calcStreak, getCatStage, STREAK_REWARDS } from "@/lib/catGrowth";
import type { Task } from "@/hooks/useTasks";
import { useI18n, interpolate } from "@/lib/i18n";

interface GameStatsProps { tasks: Task[]; }

const GameStats = ({ tasks }: GameStatsProps) => {
  const { t } = useI18n();
  const completedCount = tasks.filter(t => t.completed).length;
  const catFood = calcCatFood(tasks);
  const streak = calcStreak(tasks);
  const { current, next, progress } = getCatStage(catFood);

  const stageKeys = ["egg","cracked","kitten","playful","explorer","adventurer","philosopher","cosmic"];
  const currentLabel = t(`stage.${stageKeys[current.level + 1] || "egg"}`);
  const nextLabel = next ? t(`stage.${stageKeys[next.level + 1] || "cosmic"}`) : null;

  const ACHIEVEMENTS = [
    { id: "first", name: t("game.first"), emoji: "👣", desc: t("game.firstDesc"), threshold: 1 },
    { id: "five", name: t("game.five"), emoji: "🎯", desc: t("game.fiveDesc"), threshold: 5 },
    { id: "ten", name: t("game.ten"), emoji: "💪", desc: t("game.tenDesc"), threshold: 10 },
    { id: "thirty", name: t("game.thirty"), emoji: "🏅", desc: t("game.thirtyDesc"), threshold: 30 },
    { id: "streak3", name: t("game.streak3"), emoji: "🔥", desc: t("game.streak3Desc"), threshold: 3, isStreak: true },
    { id: "streak7", name: t("game.streak7"), emoji: "⭐", desc: t("game.streak7Desc"), threshold: 7, isStreak: true },
    { id: "streak30", name: t("game.streak30"), emoji: "👑", desc: t("game.streak30Desc"), threshold: 30, isStreak: true },
  ];

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.isStreak ? streak >= a.threshold : completedCount >= a.threshold);
  const nextStreakReward = STREAK_REWARDS.find(r => streak < r.days);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 card-glow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-float">{current.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{current.level >= 0 ? `Lv.${current.level}` : ""} {currentLabel}</p>
              <p className="text-[10px] text-muted-foreground">
                {next ? interpolate(t("game.nextLevel"), { name: nextLabel || "", n: next.foodRequired - catFood }) : t("game.maxLevel")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10">
            <span className="text-xs">🍖</span><span className="text-xs font-bold text-primary">{catFood}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full gradient-progress transition-all duration-700 ease-out" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>{t("game.recordHint")}</span><span>{t("game.photoHint")}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-3 card-glow border border-border/50 flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", streak >= 3 ? "bg-accent/15" : "bg-muted/50")}>
            <Flame size={20} className={cn(streak >= 3 ? "text-accent animate-pulse-warm" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">{streak}</p>
            <p className="text-[10px] text-muted-foreground">{nextStreakReward ? interpolate(t("game.streakReward"), { n: nextStreakReward.days, bonus: nextStreakReward.bonus }) : t("game.streakDays")}</p>
          </div>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-3 card-glow border border-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center"><Trophy size={20} className="text-secondary" /></div>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground">{t("game.completed")}</p>
          </div>
        </div>
      </div>

      {unlockedAchievements.length > 0 && (
        <div className="bg-card rounded-2xl p-4 card-glow border border-border/50">
          <div className="flex items-center gap-2 mb-3"><Star size={14} className="text-primary" /><span className="text-xs font-semibold text-foreground">{t("game.achievements")}</span></div>
          <div className="flex gap-2 flex-wrap">
            {unlockedAchievements.map(a => (<div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/50 animate-fade-in" title={a.desc}><span className="text-base">{a.emoji}</span><span className="text-[10px] font-medium text-foreground">{a.name}</span></div>))}
          </div>
          {ACHIEVEMENTS.length > unlockedAchievements.length && (
            <div className="flex gap-2 mt-2">
              {ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a)).slice(0, 2).map(a => (<div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/30 opacity-40" title={a.desc}><span className="text-base">🔒</span><span className="text-[10px] text-muted-foreground">{a.desc}</span></div>))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameStats;
