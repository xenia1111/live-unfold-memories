import { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/hooks/useTasks";
import RoundnessLeaderboard from "@/components/RoundnessLeaderboard";
import CatRadarDialog from "@/components/CatRadarDialog";
import { getCatPersonality } from "@/lib/catPersonality";
import ghibliBg from "@/assets/ghibli-summer-bg.jpg";
import pixelCatImg from "@/assets/pixel-cat.png";

/* ── 猫咪成长阶段 ── */
const CAT_STAGES = [
  { min: 0,  emoji: "🥚",  label: "神秘蛋蛋", desc: "等待第一次喂食..." },
  { min: 1,  emoji: "🐣",  label: "破壳小猫", desc: "喵呜...刚到这个世界" },
  { min: 3,  emoji: "🐱",  label: "奶猫咪咪", desc: "小小的，但很能吃" },
  { min: 8,  emoji: "😺",  label: "好奇猫猫", desc: "开始到处探索啦" },
  { min: 15, emoji: "😸",  label: "元气橘猫", desc: "精力充沛，胃口更大了" },
  { min: 30, emoji: "😻",  label: "优雅大猫", desc: "见过世面的美食家" },
  { min: 50, emoji: "👑",  label: "猫界传说", desc: "什么都吃过，什么都见过" },
];

const getCatStage = (completedCount: number) => {
  let stage = CAT_STAGES[0];
  for (const s of CAT_STAGES) {
    if (completedCount >= s.min) stage = s;
  }
  const nextStage = CAT_STAGES[CAT_STAGES.indexOf(stage) + 1];
  return { ...stage, next: nextStage };
};

/* ── 品尝评价模板（按分类） ── */
const TASTE_COMMENTS: Record<string, string[]> = {
  "运动": [
    "miamiamia~汗水味的！咸咸的！但是很提神！",
    "呼...这个有肌肉的味道，猫猫也想变壮💪",
    "跑步的风好大，差点把猫吹走了喵～",
    "运动完的你...味道好像更浓了呢（捂鼻）",
    "这顿饭有点累但很饱！猫猫打了个健康的嗝",
  ],
  "学习": [
    "嚼嚼嚼...知识的味道，有点苦但回甘很好",
    "这本书好像有点硬...猫牙差点崩了📖",
    "墨水味的！猫猫舌头变黑了喵～",
    "学习是鱼罐头里最高级的那种，要细品",
    "嗯...这个知识点，需要反刍一下🐄等等我又不是牛",
  ],
  "社交": [
    "朋友的味道！暖暖的，像被窝一样舒服～",
    "miamiamia！这顿有人情味！是猫最爱的！",
    "和朋友在一起就像晒太阳，猫猫也想加入喵",
    "社交能量满满，猫猫也被感染了，呼噜呼噜",
    "咖啡味的友情，苦中带甜，上头！",
  ],
  "工作": [
    "嚼...这个...有点996的味道...",
    "打工人的饭，虽然不太好吃但很饱腹",
    "Excel 味的...猫猫不太喜欢，但尊重👔",
    "工作完成了！这顿加了绩效调料，不错不错",
    "会议的味道...无味...猫猫快睡着了zzz",
  ],
  "健康": [
    "冥想味的...安静...空灵...猫猫也闭眼了😌",
    "这个好清淡啊！但是对身体好！乖乖吃完",
    "健康是猫罐头里的营养膏，不好吃但必须吃",
    "呼吸的味道...原来空气也是有味道的喵",
    "养生局！猫猫也泡了枸杞水🧋",
  ],
  "记录": [
    "日记味的！有点甜，像回忆里加了蜜糖🍯",
    "文字的味道，每一笔都是生活的调味料",
    "写东西的时候特别安静，猫猫蹲在旁边看",
    "记录下来就不会忘了！猫猫帮你记住！",
    "miamiamia...这段文字入口即化，是好散文",
  ],
  "娱乐": [
    "好快乐的味道！猫猫也想一起玩！🎮",
    "音乐味的！猫猫耳朵竖起来了，在跟着打拍子",
    "这顿饭全是多巴胺！猫猫转圈圈了！",
    "快乐是小鱼干味的，怎么吃都不够",
    "电影味的爆米花！猫猫看得入迷了🍿",
  ],
  "美食": [
    "！！！这个！！猫猫闻到了！！是真的好吃的！！🤤",
    "miamiamia！终于不是抽象的味道了！是真·美食！",
    "猫猫流口水了...这顿饭有画面有味道📸🍜",
    "好吃到猫猫翻肚皮了！再来一份！",
    "人间烟火气，最抚猫猫心～🍲",
  ],
  "美景": [
    "哇...好漂亮...猫猫的瞳孔放大了✨",
    "这个风景！猫猫想住在里面！永远不出来！",
    "看到美景猫猫心情好好，呼噜呼噜呼噜～🏔️",
    "大自然的味道！有草的清香和风的自由🌿",
    "猫猫趴在窗台上看风景...这就是幸福吧",
  ],
};

const PHOTO_COMMENTS = [
  "让猫看看！这张照片闻起来有故事的味道📸",
  "拍照了！猫猫凑过去看...嗯这个画面很好吃",
  "有图有真相！猫猫认证：这是真实的美好",
  "照片的味道就像罐头开封的瞬间，鲜！",
  "这张照片，猫猫要裱起来挂墙上喵",
  "啊！大海啊，全是水，全是咸咸的水🌊",
  "好漂亮的饭！味道还不错！（舔屏中）",
];

/* DEFAULT_COMMENTS moved to catPersonality.ts idleLines */

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

/* ── 猫咪组件 ── */
interface CatPetProps {
  tasks: Task[];
}

/* ── 圆润度计算 ── */
const ROUNDNESS_TITLES = [
  { min: 0,   label: "骨瘦如柴", emoji: "🦴" },
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

// Generate or retrieve a stable client ID
const getClientId = (): string => {
  const key = "cat_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

const CatPet = ({ tasks }: CatPetProps) => {
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const completedCount = completedTasks.length;
  const photoCount = useMemo(() => completedTasks.filter(t => t.completionPhoto).length, [completedTasks]);

  const personality = useMemo(() => getCatPersonality(tasks), [tasks]);
  const stage = getCatStage(completedCount);
  const progress = stage.next
    ? Math.min(((completedCount - stage.min) / (stage.next.min - stage.min)) * 100, 100)
    : 100;

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

  // Sync stats to DB
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

  const levelIndex = CAT_STAGES.indexOf(stage) + 1;

  return (
    <>
      <div className="relative rounded-3xl border border-border/40 overflow-hidden">
        {/* Ghibli 背景 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ghibliBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <div className="relative z-10 p-5">
          {/* 顶部信息条 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm">
                Lv.{levelIndex} {stage.label}
              </span>
              {personality.label !== "杂食猫" && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                  {personality.emoji} {personality.label}
                </span>
              )}
              <span className="text-[10px] text-white/70">
                存活 {aliveDays} 天
              </span>
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 active:scale-95 transition-all"
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
              className="absolute bottom-0 animate-cat-walk active:scale-95 transition-transform bg-transparent border-none p-0"
              style={{ imageRendering: "pixelated" }}
            >
              <img
                src={pixelCatImg}
                alt="pixel cat"
                className="h-14 w-14 object-contain"
                style={{ imageRendering: "pixelated", mixBlendMode: "multiply" }}
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
              <span className="font-medium text-foreground">{completedCount} 顿饭</span>
            </div>
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

          {stage.next && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] text-white/80 whitespace-nowrap drop-shadow-sm">
                → {stage.next.emoji} {stage.next.label}
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
