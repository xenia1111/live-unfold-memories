import { Flame, Zap, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameStatsProps {
  totalCompleted: number;
  streak: number;
}

const LEVELS = [
  { name: "小种子", emoji: "🌱", xpNeeded: 0 },
  { name: "小树苗", emoji: "🌿", xpNeeded: 10 },
  { name: "小花朵", emoji: "🌸", xpNeeded: 25 },
  { name: "大树", emoji: "🌳", xpNeeded: 50 },
  { name: "花园", emoji: "🏡", xpNeeded: 100 },
  { name: "森林", emoji: "🌲", xpNeeded: 200 },
  { name: "传说", emoji: "✨", xpNeeded: 500 },
];

const ACHIEVEMENTS = [
  { id: "first", name: "迈出第一步", emoji: "👣", desc: "完成第一个任务", threshold: 1 },
  { id: "five", name: "五连发", emoji: "🎯", desc: "累计完成 5 个任务", threshold: 5 },
  { id: "ten", name: "行动达人", emoji: "💪", desc: "累计完成 10 个任务", threshold: 10 },
  { id: "streak3", name: "三连击", emoji: "🔥", desc: "连续 3 天完成任务", threshold: 3, isStreak: true },
  { id: "streak7", name: "一周之星", emoji: "⭐", desc: "连续 7 天完成任务", threshold: 7, isStreak: true },
];

const GameStats = ({ totalCompleted, streak }: GameStatsProps) => {
  const xp = totalCompleted * 10;
  const currentLevel = [...LEVELS].reverse().find(l => xp >= l.xpNeeded) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel
    ? ((xp - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100
    : 100;

  const unlockedAchievements = ACHIEVEMENTS.filter(a =>
    a.isStreak ? streak >= a.threshold : totalCompleted >= a.threshold
  );

  return (
    <div className="space-y-4">
      {/* Level & XP */}
      <div className="bg-card rounded-2xl p-4 card-glow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-float">{currentLevel.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentLevel.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {nextLevel ? `距离「${nextLevel.name}」还需 ${nextLevel.xpNeeded - xp} XP` : "已达最高等级！"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10">
            <Zap size={12} className="text-primary" />
            <span className="text-xs font-bold text-primary">{xp} XP</span>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full gradient-progress transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progressToNext, 100)}%` }}
          />
        </div>
      </div>

      {/* Streak & Stats Row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-3 card-glow border border-border/50 flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            streak >= 3 ? "bg-accent/15" : "bg-muted/50"
          )}>
            <Flame size={20} className={cn(
              streak >= 3 ? "text-accent animate-pulse-warm" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">{streak}</p>
            <p className="text-[10px] text-muted-foreground">连续天数</p>
          </div>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-3 card-glow border border-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
            <Trophy size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">{totalCompleted}</p>
            <p className="text-[10px] text-muted-foreground">已完成</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-card rounded-2xl p-4 card-glow border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">成就徽章</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {unlockedAchievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/50 animate-fade-in"
                title={a.desc}
              >
                <span className="text-base">{a.emoji}</span>
                <span className="text-[10px] font-medium text-foreground">{a.name}</span>
              </div>
            ))}
          </div>
          {/* Locked hints */}
          {ACHIEVEMENTS.length > unlockedAchievements.length && (
            <div className="flex gap-2 mt-2">
              {ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a)).slice(0, 2).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/30 opacity-40"
                  title={a.desc}
                >
                  <span className="text-base">🔒</span>
                  <span className="text-[10px] text-muted-foreground">{a.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameStats;
