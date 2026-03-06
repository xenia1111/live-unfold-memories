import { ArrowLeft, BookOpen, Sparkles, Heart, Star } from "lucide-react";

interface Props {
  onBack: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: "记录每一天",
    desc: "创建任务，规划你的日常生活，让每天都充实而有序。",
  },
  {
    icon: BookOpen,
    title: "生成故事",
    desc: "完成任务后，AI 会为你生成专属的生活故事回顾。",
  },
  {
    icon: Heart,
    title: "养育小猫",
    desc: "坚持完成任务，你的小猫会慢慢成长，解锁新的性格特征。",
  },
  {
    icon: Star,
    title: "分享回忆",
    desc: "用照片记录完成瞬间，未来回顾时会更加珍贵。",
  },
];

const ProductIntroPage = ({ onBack }: Props) => {
  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">产品介绍</h1>
      </div>

      {/* Placeholder for future comic */}
      <div className="bg-card rounded-2xl p-6 card-glow border border-border/50 mb-6 text-center">
        <p className="text-4xl mb-3">📖</p>
        <h2 className="text-base font-bold text-foreground mb-1">欢迎使用</h2>
        <p className="text-xs text-muted-foreground">漫画教程即将上线，敬请期待！</p>
      </div>

      {/* Feature steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="flex items-start gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductIntroPage;
