import { ArrowLeft, BookOpen, Sparkles, Heart, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  onBack: () => void;
}

const ProductIntroPage = ({ onBack }: Props) => {
  const { t } = useI18n();

  const steps = [
    { icon: Sparkles, title: t("intro.step1Title"), desc: t("intro.step1Desc") },
    { icon: BookOpen, title: t("intro.step2Title"), desc: t("intro.step2Desc") },
    { icon: Heart, title: t("intro.step3Title"), desc: t("intro.step3Desc") },
    { icon: Star, title: t("intro.step4Title"), desc: t("intro.step4Desc") },
  ];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{t("intro.title")}</h1>
      </div>

      <div className="bg-card rounded-2xl p-6 card-glow border border-border/50 mb-6 text-center">
        <p className="text-4xl mb-3">📖</p>
        <h2 className="text-base font-bold text-foreground mb-1">{t("intro.welcome")}</h2>
        <p className="text-xs text-muted-foreground">{t("intro.comingSoon")}</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
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
