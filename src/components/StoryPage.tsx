import { useState } from "react";
import { BookOpen, Sparkles, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    period: "week",
    label: "过去一周",
    title: "充满活力的七天",
    openingLine: "亲爱的你，这一周过得怎么样？",
    summary: "让我来帮你回忆一下吧——你跑步了 3 次，感受清晨的风从耳边掠过；你读完了《人类简史》的最后三章，和古人来了一场穿越时空的对话；你还和许久不见的老朋友喝了杯咖啡，那些温暖的笑声还回荡在空气中。",
    highlights: ["🏃 连续三天晨跑，身体在变强", "📖 读完《人类简史》，思想在生长", "☕ 和老朋友重逢，友情在发光"],
    mood: "充实",
    emoji: "🌟",
    color: "from-primary/20 to-accent/10",
  },
  {
    period: "month",
    label: "过去一个月",
    title: "成长的印记",
    openingLine: "一个月说长不长，但你做了好多事呢。",
    summary: "这个月你完成了 47 项计划——是的，47 项！你运动了 14 次，身体在感谢你。你开始学习 React，每天一点点进步，未来的你一定会感谢现在的努力。月中的那次远足，你站在山顶感受的风，还记得吗？",
    highlights: ["💻 开始学习 React，勇敢迈出了第一步", "🏔️ 一次远足，重新和大自然连接", "🧘 养成了冥想习惯，内心更平静", "🤝 认识了 3 位新朋友，世界在变大"],
    mood: "进取",
    emoji: "🚀",
    color: "from-secondary/20 to-primary/10",
  },
  {
    period: "quarter",
    label: "过去一季度",
    title: "蜕变的季节",
    openingLine: "三个月前的你，一定想不到现在的自己吧？",
    summary: "你从一个编程小白成长为能独立开发小项目的开发者。你坚持运动，体重减轻了 5 公斤，那条紧身裤终于穿得下了。最重要的是，你学会了如何更好地管理时间——原来，每一天都可以被好好安排。",
    highlights: ["🎯 完成第一个独立项目，太酷了", "💪 减重 5 公斤，更健康的自己", "📚 读完 6 本书，眼界更开阔了", "⏰ 养成了规律作息，不再是夜猫子", "🤗 完成了一次志愿者活动，给予也是收获"],
    mood: "蜕变",
    emoji: "🦋",
    color: "from-accent/20 to-secondary/10",
  },
  {
    period: "half",
    label: "过去半年",
    title: "半年，一场小小的冒险",
    openingLine: "半年前的那个你，和现在的你握个手吧。",
    summary: "280 项计划被你一个个变成了现实。这些看似普通的日常——每一次晨跑、每一页书、每一杯和朋友分享的咖啡——串联起来，就是一场属于你的人生冒险。你更健康了、更聪明了，也更懂得珍惜身边的人了。这就是鲜活的生命啊。",
    highlights: ["🏃 运动超过 60 次，生命力满满", "📚 读完 12 本书，像走过 12 个世界", "🎓 学会了一门新技能，了不起", "✈️ 去了 3 个新地方旅行，世界那么大", "❤️ 和家人的时光增加了 30%，这才是最重要的"],
    mood: "圆满",
    emoji: "🌈",
    color: "from-primary/15 to-forest/10",
  },
];

const StoryPage = () => {
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const activeStory = stories.find(s => s.period === activePeriod)!;

  const periodTabs: { id: Period; label: string; emoji: string }[] = [
    { id: "week", label: "一周", emoji: "📅" },
    { id: "month", label: "一月", emoji: "🗓️" },
    { id: "quarter", label: "一季", emoji: "🍂" },
    { id: "half", label: "半年", emoji: "🌍" },
  ];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">回忆是最美的礼物</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">你的故事</h1>
      </div>

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

      {/* Story Card - narrative style */}
      <div className="animate-slide-up" key={activePeriod}>
        {/* Story header with gradient */}
        <div className={cn(
          "rounded-t-2xl px-6 pt-6 pb-4 bg-gradient-to-br",
          activeStory.color
        )}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-muted-foreground">{activeStory.label}</span>
            <div className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs font-medium text-foreground">
              {activeStory.mood}
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl animate-float">{activeStory.emoji}</span>
            <h2 className="text-xl font-bold text-foreground font-serif">
              {activeStory.title}
            </h2>
          </div>
          <p className="text-sm text-primary font-medium italic font-serif">
            "{activeStory.openingLine}"
          </p>
        </div>

        {/* Story body */}
        <div className="bg-card rounded-b-2xl px-6 py-5 card-glow border border-t-0 border-border/50 mb-4">
          <p className="text-sm text-foreground leading-[1.8] mb-6">
            {activeStory.summary}
          </p>

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

        {/* Share CTA */}
        <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border/50 card-glow text-foreground hover:text-primary transition-colors text-sm font-medium">
          <Share2 size={16} />
          <span>分享我的故事</span>
        </button>
      </div>
    </div>
  );
};

export default StoryPage;
