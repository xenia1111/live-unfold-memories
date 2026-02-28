import { useState } from "react";
import { BookOpen, Sparkles, Share2, Camera, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";

type ViewMode = "story" | "timeline" | "photos";

interface MemoryCard {
  id: string;
  title: string;
  date: Date;
  emoji: string;
  photo?: string;
  category: string;
  mood: string;
}

// Mock memories with completion photos
const mockMemories: MemoryCard[] = [
  { id: "m1", title: "晨跑 30 分钟", date: subDays(new Date(), 5), emoji: "🏃", category: "运动", mood: "energetic" },
  { id: "m2", title: "阅读《人类简史》", date: subDays(new Date(), 4), emoji: "📖", category: "学习", mood: "thoughtful" },
  { id: "m3", title: "和朋友喝咖啡", date: subDays(new Date(), 3), emoji: "☕", category: "社交", mood: "happy" },
  { id: "m4", title: "听播客学英语", date: subDays(new Date(), 2), emoji: "🎧", category: "学习", mood: "focused" },
  { id: "m5", title: "健身房力量训练", date: subDays(new Date(), 1), emoji: "💪", category: "运动", mood: "strong" },
];

type Period = "week" | "month" | "quarter" | "half";

interface Story {
  period: Period;
  label: string;
  title: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
  openingLine: string;
  color: string;
}

const stories: Story[] = [
  {
    period: "week", label: "过去一周", title: "充满活力的七天",
    openingLine: "亲爱的你，这一周过得怎么样？",
    summary: "让我来帮你回忆一下吧——你跑步了 3 次，感受清晨的风从耳边掠过；你读完了《人类简史》的最后三章，和古人来了一场穿越时空的对话；你还和许久不见的老朋友喝了杯咖啡，那些温暖的笑声还回荡在空气中。",
    highlights: ["🏃 连续三天晨跑，身体在变强", "📖 读完《人类简史》，思想在生长", "☕ 和老朋友重逢，友情在发光"],
    mood: "充实", emoji: "🌟", color: "from-primary/20 to-accent/10",
  },
  {
    period: "month", label: "过去一个月", title: "成长的印记",
    openingLine: "一个月说长不长，但你做了好多事呢。",
    summary: "这个月你完成了 47 项计划——是的，47 项！你运动了 14 次，身体在感谢你。你开始学习 React，每天一点点进步，未来的你一定会感谢现在的努力。",
    highlights: ["💻 开始学习 React，勇敢迈出了第一步", "🏔️ 一次远足，重新和大自然连接", "🧘 养成了冥想习惯，内心更平静"],
    mood: "进取", emoji: "🚀", color: "from-secondary/20 to-primary/10",
  },
  {
    period: "quarter", label: "过去一季度", title: "蜕变的季节",
    openingLine: "三个月前的你，一定想不到现在的自己吧？",
    summary: "你从一个编程小白成长为能独立开发小项目的开发者。你坚持运动，体重减轻了 5 公斤。最重要的是，你学会了如何更好地管理时间。",
    highlights: ["🎯 完成第一个独立项目", "💪 减重 5 公斤", "📚 读完 6 本书", "⏰ 养成了规律作息"],
    mood: "蜕变", emoji: "🦋", color: "from-accent/20 to-secondary/10",
  },
  {
    period: "half", label: "过去半年", title: "半年，一场小小的冒险",
    openingLine: "半年前的那个你，和现在的你握个手吧。",
    summary: "280 项计划被你一个个变成了现实。这些看似普通的日常串联起来，就是一场属于你的人生冒险。",
    highlights: ["🏃 运动超过 60 次", "📚 读完 12 本书", "🎓 学会了一门新技能", "❤️ 和家人的时光增加了 30%"],
    mood: "圆满", emoji: "🌈", color: "from-primary/15 to-forest/10",
  },
];

const StoryPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("story");
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const activeStory = stories.find(s => s.period === activePeriod)!;

  const periodTabs: { id: Period; label: string; emoji: string }[] = [
    { id: "week", label: "一周", emoji: "📅" },
    { id: "month", label: "一月", emoji: "🗓️" },
    { id: "quarter", label: "一季", emoji: "🍂" },
    { id: "half", label: "半年", emoji: "🌍" },
  ];

  const viewTabs: { id: ViewMode; label: string; icon: any }[] = [
    { id: "story", label: "故事", icon: BookOpen },
    { id: "timeline", label: "时间轴", icon: MapPin },
    { id: "photos", label: "照片墙", icon: Camera },
  ];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">回忆是最美的礼物</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">你的故事</h1>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-xl animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {viewTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                viewMode === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {viewMode === "story" && (
        <>
          {/* Period Tabs */}
          <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {periodTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePeriod(tab.id)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center gap-0.5",
                  activePeriod === tab.id
                    ? "gradient-warm text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-base">{tab.emoji}</span>
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Story Card */}
          <div className="animate-slide-up" key={activePeriod}>
            <div className={cn("rounded-t-2xl px-6 pt-6 pb-4 bg-gradient-to-br", activeStory.color)}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground">{activeStory.label}</span>
                <div className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs font-medium text-foreground">
                  {activeStory.mood}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl animate-float">{activeStory.emoji}</span>
                <h2 className="text-xl font-bold text-foreground font-serif">{activeStory.title}</h2>
              </div>
              <p className="text-sm text-primary font-medium italic font-serif">"{activeStory.openingLine}"</p>
            </div>
            <div className="bg-card rounded-b-2xl px-6 py-5 card-glow border border-t-0 border-border/50 mb-4">
              <p className="text-sm text-foreground leading-[1.8] mb-6">{activeStory.summary}</p>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-primary animate-pulse-warm" />
                  <span className="text-xs font-semibold text-foreground">亮点时刻</span>
                </div>
                <div className="space-y-2.5">
                  {activeStory.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 rounded-xl animate-fade-in"
                      style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                    >
                      <span className="text-sm text-foreground leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border/50 card-glow text-foreground hover:text-primary transition-colors text-sm font-medium">
              <Share2 size={16} />
              <span>分享我的故事</span>
            </button>
          </div>
        </>
      )}

      {viewMode === "timeline" && (
        <div className="animate-fade-in">
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/40 to-accent/40 rounded-full" />
            
            {mockMemories.map((memory, i) => (
              <div key={memory.id} className="relative mb-6 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Timeline dot */}
                <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                
                {/* Card */}
                <div className="bg-card rounded-2xl p-4 card-glow border border-border/50 hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground">
                      {format(memory.date, "M月d日 EEEE", { locale: zhCN })}
                    </span>
                    <span className="text-lg">{memory.emoji}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{memory.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted/60 rounded-md text-muted-foreground">{memory.category}</span>
                    <span className="text-[10px] text-secondary">✓ 已完成</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "photos" && (
        <div className="animate-fade-in">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-sm text-foreground font-medium mb-1">你的照片墙</p>
            <p className="text-xs text-muted-foreground mb-6">完成任务时拍照，这里就会出现你的回忆</p>
          </div>
          
          {/* Mock photo grid */}
          <div className="grid grid-cols-2 gap-3">
            {mockMemories.map((memory, i) => (
              <div
                key={memory.id}
                className={cn(
                  "rounded-2xl overflow-hidden card-glow border border-border/50 animate-fade-in",
                  i === 0 && "col-span-2"
                )}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={cn(
                  "bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center",
                  i === 0 ? "h-40" : "h-32"
                )}>
                  <span className="text-3xl mb-2">{memory.emoji}</span>
                  <p className="text-xs font-medium text-foreground">{memory.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(memory.date, "M/d", { locale: zhCN })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-2xl border border-dashed border-border/50 text-center">
            <Heart size={20} className="mx-auto text-primary/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              完成更多事情，收集更多美好回忆吧
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPage;
