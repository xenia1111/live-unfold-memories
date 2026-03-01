import { useState } from "react";
import { BookOpen, Sparkles, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "quarter" | "half";

interface Story {
  period: Period;
  label: string;
  timeRange: string;
  title: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
  openingLine: string;
  color: string;
}

// Generate stories with time ranges for current and past periods
const generateStories = (): { period: Period; label: string; emoji: string; stories: Story[] }[] => {
  return [
    {
      period: "week", label: "一周", emoji: "📅",
      stories: [
        {
          period: "week", label: "本周", timeRange: "2/24 - 3/1", title: "充满活力的七天",
          openingLine: "亲爱的你，这一周过得怎么样？",
          summary: "让我来帮你回忆一下吧——你跑步了 3 次，感受清晨的风从耳边掠过；你读完了《人类简史》的最后三章，和古人来了一场穿越时空的对话；你还和许久不见的老朋友喝了杯咖啡，那些温暖的笑声还回荡在空气中。",
          highlights: ["🏃 连续三天晨跑，身体在变强", "📖 读完《人类简史》，思想在生长", "☕ 和老朋友重逢，友情在发光"],
          mood: "充实", emoji: "🌟", color: "from-primary/20 to-accent/10",
        },
        {
          period: "week", label: "上周", timeRange: "2/17 - 2/23", title: "安静沉淀的一周",
          openingLine: "有时候慢下来，也是一种进步。",
          summary: "这周你完成了 8 项计划，虽然没有上周那么多，但每一项都很有质量。你花了更多时间陪伴家人，周末做了一顿丰盛的晚餐。",
          highlights: ["🍳 亲手做了一顿家宴", "📝 写了 3 篇日记", "🎵 发现了一张喜欢的专辑"],
          mood: "平和", emoji: "🍃", color: "from-secondary/15 to-muted/20",
        },
        {
          period: "week", label: "两周前", timeRange: "2/10 - 2/16", title: "探索新领域",
          openingLine: "好奇心是你最好的驱动力。",
          summary: "你开始接触冥想，第一次体验 15 分钟的专注。你报名了一个线上课程，给自己的技能树点亮了新枝。",
          highlights: ["🧘 第一次完整冥想 15 分钟", "💻 报名了新课程", "🏃 跑步突破 5 公里"],
          mood: "好奇", emoji: "🔭", color: "from-accent/15 to-primary/10",
        },
      ],
    },
    {
      period: "month", label: "一月", emoji: "🗓️",
      stories: [
        {
          period: "month", label: "本月", timeRange: "2026年3月", title: "成长的印记",
          openingLine: "一个月说长不长，但你做了好多事呢。",
          summary: "这个月你完成了 47 项计划——是的，47 项！你运动了 14 次，身体在感谢你。你开始学习 React，每天一点点进步，未来的你一定会感谢现在的努力。",
          highlights: ["💻 开始学习 React，勇敢迈出了第一步", "🏔️ 一次远足，重新和大自然连接", "🧘 养成了冥想习惯，内心更平静"],
          mood: "进取", emoji: "🚀", color: "from-secondary/20 to-primary/10",
        },
        {
          period: "month", label: "上个月", timeRange: "2026年2月", title: "春天的序曲",
          openingLine: "二月虽短，你的收获却不少。",
          summary: "你完成了 38 项计划，读完了 2 本书。你开始养成早起的习惯，每天多出来的一小时让生活变得更从容。",
          highlights: ["📚 读完《原子习惯》和《深度工作》", "⏰ 养成 7 点起床的习惯", "🎯 完成了年度目标的第一个里程碑"],
          mood: "从容", emoji: "🌸", color: "from-primary/15 to-accent/15",
        },
        {
          period: "month", label: "两个月前", timeRange: "2026年1月", title: "新年新起点",
          openingLine: "新的一年，你给自己定下了美好的承诺。",
          summary: "一月是充满期待的开始。你制定了年度计划，完成了 42 项任务，运动 12 次。",
          highlights: ["📋 制定了清晰的年度计划", "💪 连续运动 12 次", "🎉 和朋友们庆祝了新年"],
          mood: "希望", emoji: "✨", color: "from-accent/20 to-secondary/10",
        },
      ],
    },
    {
      period: "quarter", label: "一季", emoji: "🍂",
      stories: [
        {
          period: "quarter", label: "本季度", timeRange: "2026年1月 - 3月", title: "蜕变的季节",
          openingLine: "三个月前的你，一定想不到现在的自己吧？",
          summary: "你从一个编程小白成长为能独立开发小项目的开发者。你坚持运动，体重减轻了 5 公斤。最重要的是，你学会了如何更好地管理时间。",
          highlights: ["🎯 完成第一个独立项目", "💪 减重 5 公斤", "📚 读完 6 本书", "⏰ 养成了规律作息"],
          mood: "蜕变", emoji: "🦋", color: "from-accent/20 to-secondary/10",
        },
        {
          period: "quarter", label: "上季度", timeRange: "2025年10月 - 12月", title: "收获的秋冬",
          openingLine: "秋天播种，冬天收获，你做到了。",
          summary: "上个季度你完成了 120 项计划。你学会了做饭、坚持了运动、读了很多好书。最温暖的是那些和朋友家人在一起的时光。",
          highlights: ["🍂 完成 120 项计划", "🎄 度过了温暖的节日", "📖 读完 5 本书", "🏃 运动超过 30 次"],
          mood: "丰收", emoji: "🌾", color: "from-primary/20 to-accent/10",
        },
      ],
    },
    {
      period: "half", label: "半年", emoji: "🌍",
      stories: [
        {
          period: "half", label: "近半年", timeRange: "2025年10月 - 2026年3月", title: "半年，一场小小的冒险",
          openingLine: "半年前的那个你，和现在的你握个手吧。",
          summary: "280 项计划被你一个个变成了现实。这些看似普通的日常串联起来，就是一场属于你的人生冒险。",
          highlights: ["🏃 运动超过 60 次", "📚 读完 12 本书", "🎓 学会了一门新技能", "❤️ 和家人的时光增加了 30%"],
          mood: "圆满", emoji: "🌈", color: "from-primary/15 to-forest/10",
        },
        {
          period: "half", label: "上半年", timeRange: "2025年4月 - 9月", title: "打好基础的半年",
          openingLine: "那时的你还在探索，现在回头看，每一步都值得。",
          summary: "这半年你开始建立生活的节奏。从最初的迷茫到后来的坚定，你完成了 200 多项计划，找到了属于自己的节奏。",
          highlights: ["🌱 建立了稳定的生活节奏", "📚 读完 8 本书", "🏃 开始了运动习惯", "🤝 拓展了社交圈"],
          mood: "奠基", emoji: "🏗️", color: "from-secondary/15 to-accent/10",
        },
      ],
    },
  ];
};

const allPeriodData = generateStories();

const StoryPage = () => {
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const activeData = allPeriodData.find(p => p.period === activePeriod)!;

  const periodTabs = allPeriodData.map(p => ({ id: p.period, label: p.label, emoji: p.emoji }));

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

      {/* Stories List */}
      <div className="space-y-6" key={activePeriod}>
        {activeData.stories.map((story, storyIndex) => (
          <div key={storyIndex} className="animate-slide-up" style={{ animationDelay: `${storyIndex * 0.1}s` }}>
            {/* Period time badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-primary">{story.label}</span>
              <span className="text-[10px] text-muted-foreground">{story.timeRange}</span>
              <div className="flex-1 h-px bg-border/40" />
              {storyIndex === 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">当前</span>
              )}
            </div>

            {/* Story Card */}
            <div className={cn("rounded-t-2xl px-6 pt-5 pb-4 bg-gradient-to-br", story.color)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{story.emoji}</span>
                  <h2 className="text-lg font-bold text-foreground font-serif">{story.title}</h2>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-[11px] font-medium text-foreground">
                  {story.mood}
                </div>
              </div>
              <p className="text-sm text-primary font-medium italic font-serif mt-1">"{story.openingLine}"</p>
            </div>
            <div className="bg-card rounded-b-2xl px-6 py-4 border border-t-0 border-border/50">
              <p className="text-sm text-foreground leading-[1.8] mb-4">{story.summary}</p>
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">亮点时刻</span>
                </div>
                <div className="space-y-2">
                  {story.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2 bg-muted/40 rounded-xl">
                      <span className="text-sm text-foreground leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share button */}
      <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border/50 card-glow text-foreground hover:text-primary transition-colors text-sm font-medium mt-6">
        <Share2 size={16} />
        <span>分享我的故事</span>
      </button>
    </div>
  );
};

export default StoryPage;
