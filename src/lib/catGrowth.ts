import type { Task } from "@/hooks/useTasks";
import { differenceInCalendarDays, format } from "date-fns";

/* ── 猫粮计算 ── */
export function calcCatFood(tasks: Task[]): number {
  const completed = tasks.filter(t => t.completed);
  let food = 0;
  for (const t of completed) {
    food += t.completionPhoto ? 15 : 10;
  }
  // 连续记录奖励
  const streak = calcStreak(tasks);
  if (streak >= 30) food += 300;
  else if (streak >= 7) food += 100;
  else if (streak >= 3) food += 40;
  return food;
}

/* ── 连续天数计算 ── */
export function calcStreak(tasks: Task[]): number {
  const completed = tasks.filter(t => t.completed && t.date);
  if (completed.length === 0) return 0;

  const daySet = new Set<string>();
  completed.forEach(t => {
    if (t.date) daySet.add(format(t.date, "yyyy-MM-dd"));
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

  // Streak must include today or yesterday
  if (!daySet.has(today) && !daySet.has(yesterday)) return 0;

  let current = daySet.has(today) ? new Date() : new Date(Date.now() - 86400000);
  let streak = 0;
  while (daySet.has(format(current, "yyyy-MM-dd"))) {
    streak++;
    current = new Date(current.getTime() - 86400000);
  }
  return streak;
}

/* ── 成长阶段 ── */
export interface CatStage {
  level: number; // -1 = default egg
  label: string;
  emoji: string;
  desc: string;
  foodRequired: number; // cumulative threshold
}

export const CAT_STAGES: CatStage[] = [
  { level: -1, label: "蛋", emoji: "🥚", desc: "等待第一次喂食...", foodRequired: 0 },
  { level: 0, label: "裂缝蛋", emoji: "🐣", desc: "蛋壳出现了裂缝！", foodRequired: 10 },
  { level: 1, label: "小奶猫", emoji: "🐱", desc: "喵呜...刚到这个世界", foodRequired: 40 },
  { level: 2, label: "活泼猫", emoji: "😺", desc: "开始到处探索啦", foodRequired: 140 },
  { level: 3, label: "探索猫", emoji: "😸", desc: "好奇心驱使着冒险", foodRequired: 360 },
  { level: 4, label: "冒险猫", emoji: "😻", desc: "见过世面的勇者", foodRequired: 780 },
  { level: 5, label: "哲学猫", emoji: "🧐", desc: "开始思考猫生的意义", foodRequired: 1530 },
  { level: 6, label: "宇宙猫", emoji: "✨", desc: "超越一切的存在", foodRequired: 2830 },
];

export function getCatStage(food: number): { current: CatStage; next: CatStage | null; progress: number } {
  let current = CAT_STAGES[0];
  for (const s of CAT_STAGES) {
    if (food >= s.foodRequired) current = s;
  }
  const idx = CAT_STAGES.indexOf(current);
  const next = idx < CAT_STAGES.length - 1 ? CAT_STAGES[idx + 1] : null;
  const progress = next
    ? Math.min(((food - current.foodRequired) / (next.foodRequired - current.foodRequired)) * 100, 100)
    : 100;
  return { current, next, progress };
}

/* ── 背景系统 ── */
export interface CatBackground {
  level: number;
  name: string;
  gradient: string; // fallback CSS gradient
  emoji: string;
  imageKey?: string; // key to match imported images in component
}

export const CAT_BACKGROUNDS: CatBackground[] = [
  { level: 0, name: "草地", emoji: "🌿", gradient: "linear-gradient(180deg, #87CEEB 0%, #98FB98 60%, #228B22 100%)", imageKey: "grassland" },
  { level: 1, name: "小屋", emoji: "🏠", gradient: "linear-gradient(180deg, #87CEEB 0%, #DEB887 50%, #8B7355 100%)", imageKey: "cottage" },
  { level: 2, name: "花园", emoji: "🌸", gradient: "linear-gradient(180deg, #FFB6C1 0%, #98FB98 50%, #90EE90 100%)", imageKey: "garden" },
  { level: 3, name: "森林", emoji: "🌲", gradient: "linear-gradient(180deg, #4682B4 0%, #2E8B57 40%, #006400 100%)" },
  { level: 4, name: "山顶", emoji: "⛰️", gradient: "linear-gradient(180deg, #1E90FF 0%, #B0C4DE 40%, #708090 100%)" },
  { level: 5, name: "星空", emoji: "🌌", gradient: "linear-gradient(180deg, #0B0B3B 0%, #191970 50%, #4B0082 100%)" },
  { level: 6, name: "宇宙", emoji: "🪐", gradient: "linear-gradient(180deg, #000011 0%, #0D0D3D 30%, #1A0033 60%, #330033 100%)" },
];

export function getCurrentBackground(level: number): CatBackground {
  let bg = CAT_BACKGROUNDS[0];
  for (const b of CAT_BACKGROUNDS) {
    if (level >= b.level) bg = b;
  }
  return bg;
}

/* ── 连续奖励描述 ── */
export const STREAK_REWARDS = [
  { days: 3, bonus: 40, label: "3天连续" },
  { days: 7, bonus: 100, label: "7天连续" },
  { days: 30, bonus: 300, label: "30天连续" },
];
