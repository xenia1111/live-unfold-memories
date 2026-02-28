import { useState } from "react";
import { BookOpen, Clock, ChevronRight, Sparkles } from "lucide-react";
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
}

const stories: Story[] = [
  {
    period: "week",
    label: "过去一周",
    title: "充满活力的七天",
    summary: "这一周你完成了 12 件事情，跑步了 3 次，读完了《人类简史》的最后三章，还和许久不见的老朋友喝了杯咖啡。你在忙碌中找到了属于自己的节奏。",
    highlights: ["连续三天晨跑", "读完《人类简史》", "和老朋友重逢"],
    mood: "充实",
    emoji: "🌟",
  },
  {
    period: "month",
    label: "过去一个月",
    title: "成长的印记",
    summary: "这个月你一共完成了 47 项计划，运动了 14 次，阅读了 2 本书。你开始学习 React，每天进步一点点。月中的那次远足让你重新感受到了大自然的力量。",
    highlights: ["开始学习 React", "完成一次远足", "养成了冥想习惯", "认识了 3 位新朋友"],
    mood: "进取",
    emoji: "🚀",
  },
  {
    period: "quarter",
    label: "过去一季度",
    title: "蜕变的季节",
    summary: "三个月的时间里，你从一个编程小白成长为能独立开发小项目的开发者。你坚持运动，体重减轻了 5 公斤。最重要的是，你学会了如何更好地管理时间。",
    highlights: ["完成第一个独立项目", "减重 5 公斤", "读完 6 本书", "养成了规律作息", "完成了一次志愿者活动"],
    mood: "蜕变",
    emoji: "🦋",
  },
  {
    period: "half",
    label: "过去半年",
    title: "半年，一场小小的冒险",
    summary: "回顾过去六个月，你完成了 280 项计划，这些看似普通的日常串联起来，就是一场属于你的冒险。你更健康了、更聪明了，也更懂得珍惜身边的人了。",
    highlights: ["运动超过 60 次", "读完 12 本书", "学会了一门新技能", "去了 3 个新地方旅行", "和家人相处的时间增加了 30%"],
    mood: "圆满",
    emoji: "🌈",
  },
];

const StoryPage = () => {
  const [activePeriod, setActivePeriod] = useState<Period>("week");
  const activeStory = stories.find(s => s.period === activePeriod)!;

  const periodTabs: { id: Period; label: string }[] = [
    { id: "week", label: "一周" },
    { id: "month", label: "一月" },
    { id: "quarter", label: "一季" },
    { id: "half", label: "半年" },
  ];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">你的生活故事</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-serif">故事</h1>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {periodTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePeriod(tab.id)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
              activePeriod === tab.id
                ? "gradient-warm text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Story Card */}
      <div className="animate-slide-up" key={activePeriod}>
        <div className="bg-card rounded-2xl p-6 card-glow border border-border/50 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs text-muted-foreground">{activeStory.label}</span>
              <h2 className="text-xl font-bold text-foreground font-serif mt-1">
                {activeStory.emoji} {activeStory.title}
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-forest-light text-secondary text-xs font-medium">
              {activeStory.mood}
            </div>
          </div>

          <p className="text-sm text-foreground leading-relaxed mb-5">
            {activeStory.summary}
          </p>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">亮点时刻</span>
            </div>
            <div className="space-y-2">
              {activeStory.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-muted/60 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full gradient-warm flex-shrink-0" />
                  <span className="text-sm text-foreground">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm">
          <span>分享我的故事</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default StoryPage;
