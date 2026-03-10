import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Task } from "@/hooks/useTasks";
import RoundnessLeaderboard from "@/components/RoundnessLeaderboard";
import CatRadarDialog from "@/components/CatRadarDialog";
import { getCatPersonality } from "@/lib/catPersonality";
import { calcCatFood, calcStreak, getCatStage, getCurrentBackground, STREAK_REWARDS } from "@/lib/catGrowth";
import catWalkSprite from "@/assets/cat-walk-sprite.png";
import eggNest from "@/assets/egg-nest.png";
import catLv0 from "@/assets/cat-lv0.png";
import catLv1 from "@/assets/cat-lv1.png";
import catLv2 from "@/assets/cat-lv2.png";
import catLv3 from "@/assets/cat-lv3.png";
import catLv4 from "@/assets/cat-lv4.png";
import catLv5 from "@/assets/cat-lv5.png";
import catLv6 from "@/assets/cat-lv6.png";
import catScholarLv0 from "@/assets/cat-scholar-lv0.png";
import catScholarLv1 from "@/assets/cat-scholar-lv1.png";
import catScholarLv2 from "@/assets/cat-scholar-lv2.png";
import catScholarLv3 from "@/assets/cat-scholar-lv3.png";
import catScholarLv4 from "@/assets/cat-scholar-lv4.png";
import catScholarLv5 from "@/assets/cat-scholar-lv5.png";
import catScholarLv6 from "@/assets/cat-scholar-lv6.png";
import catSportLv0 from "@/assets/cat-sport-lv0.png";
import catSportLv1 from "@/assets/cat-sport-lv1.png";
import catSportLv2 from "@/assets/cat-sport-lv2.png";
import catSportLv3 from "@/assets/cat-sport-lv3.png";
import catSportLv4 from "@/assets/cat-sport-lv4.png";
import catSportLv5 from "@/assets/cat-sport-lv5.png";
import catSportLv6 from "@/assets/cat-sport-lv6.png";
import catSocialLv0 from "@/assets/cat-social-lv0.png";
import catSocialLv1 from "@/assets/cat-social-lv1.png";
import catSocialLv2 from "@/assets/cat-social-lv2.png";
import catSocialLv3 from "@/assets/cat-social-lv3.png";
import catSocialLv4 from "@/assets/cat-social-lv4.png";
import catSocialLv5 from "@/assets/cat-social-lv5.png";
import catSocialLv6 from "@/assets/cat-social-lv6.png";
import catSceneryLv0 from "@/assets/cat-scenery-lv0.png";
import catSceneryLv1 from "@/assets/cat-scenery-lv1.png";
import catSceneryLv2 from "@/assets/cat-scenery-lv2.png";
import catSceneryLv3 from "@/assets/cat-scenery-lv3.png";
import catSceneryLv4 from "@/assets/cat-scenery-lv4.png";
import catSceneryLv5 from "@/assets/cat-scenery-lv5.png";
import catSceneryLv6 from "@/assets/cat-scenery-lv6.png";
import catFunLv0 from "@/assets/cat-fun-lv0.png";
import catFunLv1 from "@/assets/cat-fun-lv1.png";
import catFunLv2 from "@/assets/cat-fun-lv2.png";
import catFunLv3 from "@/assets/cat-fun-lv3.png";
import catFunLv4 from "@/assets/cat-fun-lv4.png";
import catFunLv5 from "@/assets/cat-fun-lv5.png";
import catFunLv6 from "@/assets/cat-fun-lv6.png";
import catDiaryLv0 from "@/assets/cat-diary-lv0.png";
import catDiaryLv1 from "@/assets/cat-diary-lv1.png";
import catDiaryLv2 from "@/assets/cat-diary-lv2.png";
import catDiaryLv3 from "@/assets/cat-diary-lv3.png";
import catDiaryLv4 from "@/assets/cat-diary-lv4.png";
import catDiaryLv5 from "@/assets/cat-diary-lv5.png";
import catDiaryLv6 from "@/assets/cat-diary-lv6.png";
import catHealthLv0 from "@/assets/cat-health-lv0.png";
import catHealthLv1 from "@/assets/cat-health-lv1.png";
import catHealthLv2 from "@/assets/cat-health-lv2.png";
import catHealthLv3 from "@/assets/cat-health-lv3.png";
import catHealthLv4 from "@/assets/cat-health-lv4.png";
import catHealthLv5 from "@/assets/cat-health-lv5.png";
import catHealthLv6 from "@/assets/cat-health-lv6.png";
import catBeautyLv0 from "@/assets/cat-beauty-lv0.png";
import catBeautyLv1 from "@/assets/cat-beauty-lv1.png";
import catBeautyLv2 from "@/assets/cat-beauty-lv2.png";
import catBeautyLv3 from "@/assets/cat-beauty-lv3.png";
import catBeautyLv4 from "@/assets/cat-beauty-lv4.png";
import catBeautyLv5 from "@/assets/cat-beauty-lv5.png";
import catBeautyLv6 from "@/assets/cat-beauty-lv6.png";

const CAT_IMAGES: Record<string, Record<number, string>> = {
  default: { 0: catLv0, 1: catLv1, 2: catLv2, 3: catLv3, 4: catLv4, 5: catLv5, 6: catLv6 },
  "美食": { 0: catLv0, 1: catLv1, 2: catLv2, 3: catLv3, 4: catLv4, 5: catLv5, 6: catLv6 },
  "学习": { 0: catScholarLv0, 1: catScholarLv1, 2: catScholarLv2, 3: catScholarLv3, 4: catScholarLv4, 5: catScholarLv5, 6: catScholarLv6 },
  "运动": { 0: catSportLv0, 1: catSportLv1, 2: catSportLv2, 3: catSportLv3, 4: catSportLv4, 5: catSportLv5, 6: catSportLv6 },
  "社交": { 0: catSocialLv0, 1: catSocialLv1, 2: catSocialLv2, 3: catSocialLv3, 4: catSocialLv4, 5: catSocialLv5, 6: catSocialLv6 },
  "美景": { 0: catSceneryLv0, 1: catSceneryLv1, 2: catSceneryLv2, 3: catSceneryLv3, 4: catSceneryLv4, 5: catSceneryLv5, 6: catSceneryLv6 },
  "娱乐": { 0: catFunLv0, 1: catFunLv1, 2: catFunLv2, 3: catFunLv3, 4: catFunLv4, 5: catFunLv5, 6: catFunLv6 },
  "记录": { 0: catDiaryLv0, 1: catDiaryLv1, 2: catDiaryLv2, 3: catDiaryLv3, 4: catDiaryLv4, 5: catDiaryLv5, 6: catDiaryLv6 },
  "健康": { 0: catHealthLv0, 1: catHealthLv1, 2: catHealthLv2, 3: catHealthLv3, 4: catHealthLv4, 5: catHealthLv5, 6: catHealthLv6 },
  "美丽": { 0: catBeautyLv0, 1: catBeautyLv1, 2: catBeautyLv2, 3: catBeautyLv3, 4: catBeautyLv4, 5: catBeautyLv5, 6: catBeautyLv6 },
};

const getCatImage = (level: number, category: string): string => {
  const images = CAT_IMAGES[category] || CAT_IMAGES.default;
  return images[level] || CAT_IMAGES.default[0];
};
import bgGrassland from "@/assets/bg-grassland.png";
import bgCottage from "@/assets/bg-cottage.png";
import bgGarden from "@/assets/bg-garden.png";
import bgCardboardBox from "@/assets/bg-cardboard-box.png";
import EggHatchEffect from "@/components/EggHatchEffect";
import { useI18n, interpolate } from "@/lib/i18n";
import { removeWhiteBackground } from "@/lib/imageUtils";

const TransparentImage = ({ src, alt, className, style }: any) => {
  const [tSrc, setTSrc] = useState(src);
  useEffect(() => {
    let mounted = true;
    setTSrc(src);
    removeWhiteBackground(src).then(res => {
      if (mounted) setTSrc(res);
    });
    return () => { mounted = false; };
  }, [src]);
  return <img src={tSrc} alt={alt} className={className} style={style} />;
};

const BG_IMAGES: Record<string, string> = { grassland: bgGrassland, cottage: bgCottage, garden: bgGarden, cardboard: bgCardboardBox };

const TASTE_COMMENTS: Record<string, string[]> = {
  "运动": ["miamiamia~汗水味的！咸咸的！但是很提神！","呼...这个有肌肉的味道，猫猫也想变壮💪","运动完的你...味道好像更浓了呢（捂鼻）"],
  "学习": ["嚼嚼嚼...知识的味道，有点苦但回甘很好","墨水味的！猫猫舌头变黑了喵～","学习是鱼罐头里最高级的那种，要细品"],
  "社交": ["朋友的味道！暖暖的，像被窝一样舒服～","miamiamia！这顿有人情味！是猫最爱的！","咖啡味的友情，苦中带甜，上头！"],
  "工作": ["嚼...这个...有点996的味道...","打工人的饭，虽然不太好吃但很饱腹","工作完成了！这顿加了绩效调料，不错不错"],
  "健康": ["冥想味的...安静...空灵...猫猫也闭眼了😌","健康是猫罐头里的营养膏，不好吃但必须吃","养生局！猫猫也泡了枸杞水🧋"],
  "记录": ["日记味的！有点甜，像回忆里加了蜜糖🍯","文字的味道，每一笔都是生活的调味料","miamiamia...这段文字入口即化，是好散文"],
  "娱乐": ["好快乐的味道！猫猫也想一起玩！🎮","这顿饭全是多巴胺！猫猫转圈圈了！","快乐是小鱼干味的，怎么吃都不够"],
  "美食": ["！！！这个！！猫猫闻到了！！是真的好吃的！！🤤","miamiamia！终于不是抽象的味道了！是真·美食！","好吃到猫猫翻肚皮了！再来一份！"],
  "美景": ["哇...好漂亮...猫猫的瞳孔放大了✨","这个风景！猫猫想住在里面！永远不出来！","大自然的味道！有草的清香和风的自由🌿"],
  "美丽": ["哇！变漂亮了！猫猫也想做个美甲💅","美美的味道！猫猫照镜子去了🪞","精致的味道，猫猫觉得自己也变好看了✨"],
};
const PHOTO_COMMENTS = ["让猫看看！这张照片闻起来有故事的味道📸","拍照了！猫猫凑过去看...嗯这个画面很好吃","有图有真相！猫猫认证：这是真实的美好","照片的味道就像罐头开封的瞬间，鲜！","这张照片，猫猫要裱起来挂墙上喵"];

const getComment = (task?: Task, idleLines?: string[]): string => {
  if (!task) { const pool = idleLines && idleLines.length > 0 ? idleLines : ["喵...猫猫饿了...快去做点什么喂猫猫吧～"]; return pool[Math.floor(Math.random() * pool.length)]; }
  if (task.completionPhoto) return PHOTO_COMMENTS[Math.floor(Math.random() * PHOTO_COMMENTS.length)];
  const pool = TASTE_COMMENTS[task.category] || TASTE_COMMENTS["记录"];
  return pool[Math.floor(Math.random() * pool.length)];
};

const ROUNDNESS_TITLES = [
  { min: 0, key: "roundness.0", emoji: "🦴" }, { min: 0.3, key: "roundness.1", emoji: "🫧" },
  { min: 0.6, key: "roundness.2", emoji: "🍡" }, { min: 1.0, key: "roundness.3", emoji: "🟠" },
  { min: 1.5, key: "roundness.4", emoji: "⚽" }, { min: 2.5, key: "roundness.5", emoji: "🎈" },
  { min: 4.0, key: "roundness.6", emoji: "🪐" },
];

interface CatPetProps { tasks: Task[]; }

const CatPet = ({ tasks }: CatPetProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const completedCount = completedTasks.length;
  const photoCount = useMemo(() => completedTasks.filter(t => t.completionPhoto).length, [completedTasks]);
  const personality = useMemo(() => getCatPersonality(tasks), [tasks]);
  const catFood = useMemo(() => calcCatFood(tasks), [tasks]);
  const streak = useMemo(() => calcStreak(tasks), [tasks]);
  const { current: stage, next: nextStage, progress } = useMemo(() => getCatStage(catFood, tasks), [catFood, tasks]);
  const background = useMemo(() => getCurrentBackground(stage.level), [stage.level]);

  // Fixed cat category from DB (determined by first task, never changes)
  const [fixedCategory, setFixedCategory] = useState<string | null>(null);

  // Use fixedCategory for display, fall back to personality for idle lines only
  const fixedPersonalityLabel = fixedCategory ? t(`personality.${fixedCategory}`) : null;
  const stageLabel = t(`stage.${["egg","cracked","kitten","playful","explorer","adventurer","philosopher","cosmic"][stage.level + 1] || "egg"}`);
  const personalityLabel = fixedPersonalityLabel || (personality.category ? t(`personality.${personality.category}`) : t("personality.default"));
  const getRoundnessTitle = (rate: number) => {
    let title = ROUNDNESS_TITLES[0];
    for (const tt of ROUNDNESS_TITLES) { if (rate >= tt.min) title = tt; }
    return { ...title, label: t(title.key) };
  };

  const [catProfileId, setCatProfileId] = useState<string | null>(null);
  const [bornAt, setBornAt] = useState<Date | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data } = await supabase.from("cat_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setBornAt(new Date(data.born_at));
        setCatProfileId(data.id);
        if ((data as any).cat_category) {
          setFixedCategory((data as any).cat_category);
        }
      } else {
        const { data: newCat } = await supabase.from("cat_profiles").insert({ user_id: user.id, cat_name: "小猫咪" }).select().single();
        if (newCat) {
          setBornAt(new Date(newCat.born_at));
          setCatProfileId(newCat.id);
        }
      }
    };
    init();
  }, [user]);

  // When first task exists and cat_category not yet set, lock it in
  useEffect(() => {
    if (!user || fixedCategory || tasks.length === 0) return;
    const firstTask = [...tasks].sort((a, b) => {
      const aTime = a.date ? a.date.getTime() : new Date(a.id).getTime();
      const bTime = b.date ? b.date.getTime() : new Date(b.id).getTime();
      return aTime - bTime;
    })[0];
    if (!firstTask) return;
    const category = firstTask.category;
    setFixedCategory(category);
    supabase.from("cat_profiles").update({ cat_category: category } as any).eq("user_id", user.id).then(() => {});
  }, [user, fixedCategory, tasks]);

  useEffect(() => {
    if (!bornAt || !user) return;
    supabase.from("cat_profiles").update({ completed_count: completedCount, photo_count: photoCount }).eq("user_id", user.id).then(() => {});
  }, [completedCount, photoCount, user, bornAt]);

  const aliveDays = bornAt ? Math.max(differenceInCalendarDays(new Date(), bornAt), 1) : 1;
  const roundnessRate = aliveDays > 0 ? completedCount / aliveDays : 0;
  const roundness = getRoundnessTitle(roundnessRate);

  const lastCompleted = useMemo(() => { const sorted = [...completedTasks].sort((a, b) => { if (a.date && b.date) return b.date.getTime() - a.date.getTime(); return b.id.localeCompare(a.id); }); return sorted[0] || undefined; }, [completedTasks]);

  const [comment, setComment] = useState(() => getComment(lastCompleted, personality.idleLines));
  const [showBubble, setShowBubble] = useState(true);
  const [isEating, setIsEating] = useState(false);
  const [isHatching, setIsHatching] = useState(false);
  const [prevStageLevel, setPrevStageLevel] = useState<number | null>(null);

  useEffect(() => {
    setComment(getComment(lastCompleted, personality.idleLines));
    if (lastCompleted) { setIsEating(true); setShowBubble(true); const timer = setTimeout(() => setIsEating(false), 2000); return () => clearTimeout(timer); }
  }, [lastCompleted?.id, personality.label]);

  // Detect level-up from egg (-1) to cracked (0) → trigger hatching
  useEffect(() => {
    if (prevStageLevel === null) {
      setPrevStageLevel(stage.level);
      return;
    }
    if (prevStageLevel === -1 && stage.level >= 0) {
      setIsHatching(true);
    }
    setPrevStageLevel(stage.level);
  }, [stage.level]);

  const isDarkBg = stage.level >= 5;
  const nextStageLabel = nextStage ? t(`stage.${["egg","cracked","kitten","playful","explorer","adventurer","philosopher","cosmic"][nextStage.level + 1] || "cosmic"}`) : null;

  return (
    <>
      <div className="relative rounded-3xl border border-border/40 overflow-hidden">
        {/* Background */}
        {stage.level < 0 ? (
          /* 蛋阶段：纸箱内部背景 */
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgCardboardBox})` }} />
        ) : background.imageKey && BG_IMAGES[background.imageKey] ? (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${BG_IMAGES[background.imageKey!]})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: background.gradient }} />
        )}
        {stage.level >= 5 && <div className="absolute inset-0 overflow-hidden">{[...Array(12)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`, animationDelay: `${Math.random() * 3}s`, opacity: 0.3 + Math.random() * 0.5 }} />))}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Hatching effect overlay */}
        {isHatching && <EggHatchEffect onComplete={() => setIsHatching(false)} />}

        <div className="relative z-10 p-5">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap bg-black/60 text-white shadow-sm">
              {stage.level >= 0 ? `Lv.${stage.level}` : ""} {stage.emoji} {stageLabel}
            </span>
            {(fixedCategory || personality.category) && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap bg-black/50 text-white shadow-sm">
                {personalityLabel}
              </span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap bg-black/50 text-white shadow-sm">
              {interpolate(t("cat.alive"), { n: aliveDays })}
            </span>
            <button onClick={() => setShowLeaderboard(true)} className="ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md hover:bg-black/70 active:scale-95 transition-all whitespace-nowrap bg-black/50 text-white shadow-sm">
              <span>{roundness.emoji}</span><span className="font-medium">{roundness.label}</span><span className="text-white/60 ml-0.5">›</span>
            </button>
          </div>

          <div className="relative h-24 mb-2 flex items-end justify-center">
            {stage.level < 0 ? (
              /* 蛋阶段：巢里的蛋左右晃动 */
              <button onClick={() => setShowRadar(true)} className="animate-egg-wobble active:scale-95 transition-transform bg-transparent border-none p-0 cursor-pointer">
                <TransparentImage src={eggNest} alt="egg" className="w-24 h-24 object-contain" style={{ imageRendering: "pixelated" }} />
              </button>
            ) : (
              /* 猫阶段：走来走去 */
              <button onClick={() => setShowRadar(true)} className="absolute bottom-0 animate-cat-walk active:scale-95 transition-transform bg-transparent border-none p-0 cursor-pointer">
                <TransparentImage src={getCatImage(stage.level, fixedCategory || "default")} alt="cat" className="w-16 h-16 object-contain" style={{ imageRendering: "pixelated" }} />
              </button>
            )}
          </div>

          {showBubble && (
            <div className="relative mb-2.5 animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-white/50 shadow-sm">
                <p className="text-xs text-foreground/90 leading-relaxed">{comment}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] shadow-sm">
              <span>🍖</span><span className="font-medium text-white">{interpolate(t("cat.food"), { n: catFood })}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] shadow-sm">
                <span>🔥</span><span className="font-medium text-white">{interpolate(t("cat.streak"), { n: streak })}</span>
              </div>
            )}
            {photoCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] shadow-sm">
                <span>📸</span><span className="font-medium text-white">{interpolate(t("cat.photos"), { n: photoCount })}</span>
              </div>
            )}
            <button onClick={() => setShowLeaderboard(true)} className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] hover:bg-black/70 active:scale-95 transition-all shadow-sm">
              <span>🏆</span><span className="font-medium text-white">{t("cat.leaderboard")}</span>
            </button>
          </div>

          {nextStage && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <span className={cn("text-[9px] whitespace-nowrap drop-shadow-sm", isDarkBg ? "text-white/80" : "text-white/80")}>
                → {nextStage.emoji} {nextStageLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      <RoundnessLeaderboard open={showLeaderboard} onOpenChange={setShowLeaderboard} myUserId={user?.id || ""} />
      <CatRadarDialog open={showRadar} onOpenChange={setShowRadar} tasks={tasks} />
    </>
  );
};

export default CatPet;
