import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/hooks/useTasks";
import RoundnessLeaderboard from "@/components/RoundnessLeaderboard";
import CatRadarDialog from "@/components/CatRadarDialog";
import { getCatPersonality } from "@/lib/catPersonality";
import { calcCatFood, calcStreak, getCatStage, getCurrentBackground, STREAK_REWARDS } from "@/lib/catGrowth";
import catWalkSprite from "@/assets/cat-walk-sprite.png";
import bgGrassland from "@/assets/bg-grassland.png";
import bgCottage from "@/assets/bg-cottage.png";
import bgGarden from "@/assets/bg-garden.png";

const BG_IMAGES: Record<string, string> = {
  grassland: bgGrassland,
  cottage: bgCottage,
  garden: bgGarden,
};

/* ── 品尝评价模板（按分类） ── */
const TASTE_COMMENTS: Record<string, string[]> = {
  "运动": [
    "miamiamia~汗水味的！咸咸的！但是很提神！",
    "呼...这个有肌肉的味道，猫猫也想变壮💪",
    "运动完的你...味道好像更浓了呢（捂鼻）",
  ],
  "学习": [
    "嚼嚼嚼...知识的味道，有点苦但回甘很好",
    "墨水味的！猫猫舌头变黑了喵～",
    "学习是鱼罐头里最高级的那种，要细品",
  ],
  "社交": [
    "朋友的味道！暖暖的，像被窝一样舒服～",
    "miamiamia！这顿有人情味！是猫最爱的！",
    "咖啡味的友情，苦中带甜，上头！",
  ],
  "工作": [
    "嚼...这个...有点996的味道...",
    "打工人的饭，虽然不太好吃但很饱腹",
    "工作完成了！这顿加了绩效调料，不错不错",
  ],
  "健康": [
    "冥想味的...安静...空灵...猫猫也闭眼了😌",
    "健康是猫罐头里的营养膏，不好吃但必须吃",
    "养生局！猫猫也泡了枸杞水🧋",
  ],
  "记录": [
    "日记味的！有点甜，像回忆里加了蜜糖🍯",
    "文字的味道，每一笔都是生活的调味料",
    "miamiamia...这段文字入口即化，是好散文",
  ],
  "娱乐": [
    "好快乐的味道！猫猫也想一起玩！🎮",
    "这顿饭全是多巴胺！猫猫转圈圈了！",
    "快乐是小鱼干味的，怎么吃都不够",
  ],
  "美食": [
    "！！！这个！！猫猫闻到了！！是真的好吃的！！🤤",
    "miamiamia！终于不是抽象的味道了！是真·美食！",
    "好吃到猫猫翻肚皮了！再来一份！",
  ],
  "美景": [
    "哇...好漂亮...猫猫的瞳孔放大了✨",
    "这个风景！猫猫想住在里面！永远不出来！",
    "大自然的味道！有草的清香和风的自由🌿",
  ],
  "美丽": [
    "哇！变漂亮了！猫猫也想做个美甲💅",
    "美美的味道！猫猫照镜子去了🪞",
    "精致的味道，猫猫觉得自己也变好看了✨",
  ],
};

const PHOTO_COMMENTS = [
  "让猫看看！这张照片闻起来有故事的味道📸",
  "拍照了！猫猫凑过去看...嗯这个画面很好吃",
  "有图有真相！猫猫认证：这是真实的美好",
  "照片的味道就像罐头开封的瞬间，鲜！",
  "这张照片，猫猫要裱起来挂墙上喵",
];

const getComment = (task?: Task, idleLines?: string[]): string => {
  if (!task) {
    const pool = idleLines && idleLines.length > 0 ? idleLines : ["喵...猫猫饿了...快去做点什么喂猫猫吧～"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (task.completionPhoto) {
    return PHOTO_COMMENTS[Math.floor(Math.random() * PHOTO_COMMENTS.length)];
  }
  const pool = TASTE_COMMENTS[task.category] || TASTE_COMMENTS["记录"];
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ── 圆润度 ── */
const ROUNDNESS_TITLES = [
  { min: 0, label: "骨瘦如柴", emoji: "🦴" },
  { min: 0.3, label: "微微圆润", emoji: "🫧" },
  { min: 0.6, label: "小有肉感", emoji: "🍡" },
  { min: 1.0, label: "圆滚滚", emoji: "🟠" },
  { min: 1.5, label: "弹弹球", emoji: "⚽" },
  { min: 2.5, label: "圆到起飞", emoji: "🎈" },
  { min: 4.0, label: "宇宙级圆", emoji: "🪐" },
];

const getRoundnessTitle = (rate: number) => {
  let title = ROUNDNESS_TITLES[0];
  for (const t of ROUNDNESS_TITLES) {
    if (rate >= t.min) title = t;
  }
  return title;
};

const getClientId = (): string => {
  const key = "cat_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

/* ── 组件 ── */
interface CatPetProps {
  tasks: Task[];
}

const CatPet = ({ tasks }: CatPetProps) => {
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const completedCount = completedTasks.length;
  const photoCount = useMemo(() => completedTasks.filter(t => t.completionPhoto).length, [completedTasks]);

  const personality = useMemo(() => getCatPersonality(tasks), [tasks]);
  const catFood = useMemo(() => calcCatFood(tasks), [tasks]);
  const streak = useMemo(() => calcStreak(tasks), [tasks]);
  const { current: stage, next: nextStage, progress } = useMemo(() => getCatStage(catFood), [catFood]);
  const background = useMemo(() => getCurrentBackground(stage.level), [stage.level]);

  const [clientId] = useState(getClientId);
  const [bornAt, setBornAt] = useState<Date | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  // Ensure cat profile exists
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from("cat_profiles")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (data) {
        setBornAt(new Date(data.born_at));
      } else {
        const { data: newCat } = await supabase
          .from("cat_profiles")
          .insert({ client_id: clientId, cat_name: "小猫咪" })
          .select()
          .single();
        if (newCat) setBornAt(new Date(newCat.born_at));
      }
    };
    init();
  }, [clientId]);

  // Sync stats
  useEffect(() => {
    if (!bornAt) return;
    supabase
      .from("cat_profiles")
      .update({ completed_count: completedCount, photo_count: photoCount })
      .eq("client_id", clientId)
      .then(() => {});
  }, [completedCount, photoCount, clientId, bornAt]);

  const aliveDays = bornAt ? Math.max(differenceInCalendarDays(new Date(), bornAt), 1) : 1;
  const roundnessRate = aliveDays > 0 ? completedCount / aliveDays : 0;
  const roundness = getRoundnessTitle(roundnessRate);

  const lastCompleted = useMemo(() => {
    const sorted = [...completedTasks].sort((a, b) => {
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return b.id.localeCompare(a.id);
    });
    return sorted[0] || undefined;
  }, [completedTasks]);

  const [comment, setComment] = useState(() => getComment(lastCompleted, personality.idleLines));
  const [showBubble, setShowBubble] = useState(true);
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    setComment(getComment(lastCompleted, personality.idleLines));
    if (lastCompleted) {
      setIsEating(true);
      setShowBubble(true);
      const timer = setTimeout(() => setIsEating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastCompleted?.id, personality.label]);

  const refreshComment = () => {
    setComment(getComment(lastCompleted, personality.idleLines));
    setIsEating(true);
    setShowBubble(true);
    setTimeout(() => setIsEating(false), 1500);
  };

  // Determine if text should be light (for dark backgrounds like 星空/宇宙)
  const isDarkBg = stage.level >= 5;

  return (
    <>
      <div className="relative rounded-3xl border border-border/40 overflow-hidden">
        {/* 动态背景 */}
        {background.imageKey && BG_IMAGES[background.imageKey] ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${BG_IMAGES[background.imageKey!]})` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: stage.level >= 0 ? background.gradient : "linear-gradient(180deg, #E8E0D0 0%, #D4C8B0 100%)" }}
          />
        )}
        {/* 背景装饰 */}
        {stage.level >= 5 && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 70}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div className="relative z-10 p-5">
          {/* 顶部信息条 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm",
                isDarkBg ? "bg-white/20 text-white" : "bg-black/30 text-white"
              )}>
                {stage.level >= 0 ? `Lv.${stage.level}` : ""} {stage.emoji} {stage.label}
              </span>
              {personality.label !== "杂食猫" && (
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm",
                  isDarkBg ? "bg-white/15 text-white" : "bg-black/20 text-white"
                )}>
                  {personality.emoji} {personality.label}
                </span>
              )}
              <span className={cn("text-[10px]", isDarkBg ? "text-white/70" : "text-white/70")}>
                存活 {aliveDays} 天
              </span>
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className={cn(
                "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm hover:bg-black/30 active:scale-95 transition-all",
                isDarkBg ? "bg-white/15 text-white" : "bg-black/20 text-white"
              )}
            >
              <span>{roundness.emoji}</span>
              <span className="font-medium">{roundness.label}</span>
              <span className="text-white/50 ml-0.5">›</span>
            </button>
          </div>

          {/* 像素猫走动区域 */}
          <div className="relative h-20 mb-2">
            <button
              onClick={() => setShowRadar(true)}
              className="absolute bottom-0 animate-cat-walk active:scale-95 transition-transform bg-transparent border-none p-0 cursor-pointer"
            >
              <div
                className="w-16 h-16 animate-sprite-walk"
                style={{
                  backgroundImage: `url(${catWalkSprite})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "auto 100%",
                  imageRendering: "pixelated",
                }}
              />
            </button>
          </div>

          {/* 对话气泡 */}
          {showBubble && (
            <div className="relative mb-2.5 animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-white/50 shadow-sm">
                <p className="text-xs text-foreground/90 leading-relaxed">{comment}</p>
              </div>
            </div>
          )}

          {/* 底部统计 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px]">
              <span>🍖</span>
              <span className="font-medium text-foreground">{catFood} 猫粮</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px]">
                <span>🔥</span>
                <span className="font-medium text-foreground">连续 {streak} 天</span>
              </div>
            )}
            {photoCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px]">
                <span>📸</span>
                <span className="font-medium text-foreground">{photoCount} 张图</span>
              </div>
            )}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px] hover:bg-white/90 active:scale-95 transition-all"
            >
              <span>🏆</span>
              <span className="font-medium text-foreground">排行榜</span>
            </button>
          </div>

          {/* 成长进度条 */}
          {nextStage && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={cn(
                "text-[9px] whitespace-nowrap drop-shadow-sm",
                isDarkBg ? "text-white/80" : "text-white/80"
              )}>
                → {nextStage.emoji} {nextStage.label}
              </span>
            </div>
          )}

        </div>
      </div>

      <RoundnessLeaderboard
        open={showLeaderboard}
        onOpenChange={setShowLeaderboard}
        myClientId={clientId}
      />
      <CatRadarDialog
        open={showRadar}
        onOpenChange={setShowRadar}
        tasks={tasks}
      />
    </>
  );
};

export default CatPet;
