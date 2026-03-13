import { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props { onBack: () => void; }

type ThemeMode = "light" | "dark" | "system";
const THEME_KEY = "app_theme";

const AppearanceSettingsPage = ({ onBack }: Props) => {
  const { lang } = useI18n();
  const isZh = lang === "zh" || lang === "ja";

  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem(THEME_KEY) as ThemeMode) || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const options = [
    { key: "light" as ThemeMode, icon: Sun, label: isZh ? "浅色" : "Light" },
    { key: "dark" as ThemeMode, icon: Moon, label: isZh ? "深色" : "Dark" },
    { key: "system" as ThemeMode, icon: Monitor, label: isZh ? "跟随系统" : "System" },
  ];

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{isZh ? "外观设置" : "Appearance"}</h1>
      </div>

      <div className="space-y-2">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.key} onClick={() => { setTheme(opt.key); toast.success(opt.label); }}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl p-4 border text-left transition-all active:scale-[0.98]",
                theme === opt.key ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 card-glow"
              )}>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon size={18} className={theme === opt.key ? "text-primary" : "text-foreground"} />
              </div>
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              {theme === opt.key && <span className="ml-auto text-primary text-sm font-medium">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceSettingsPage;
