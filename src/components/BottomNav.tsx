import { Home, CalendarDays, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { t } = useI18n();

  const tabs = [
    { id: "home", label: t("nav.home"), icon: Home },
    { id: "calendar", label: t("nav.calendar"), icon: CalendarDays },
    { id: "story", label: t("nav.story"), icon: BookOpen },
    { id: "profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,12%)] backdrop-blur-xl border-t border-[hsl(0,0%,20%)]">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300",
                isActive
                  ? "text-white scale-105"
                  : "text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,80%)]"
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="transition-all duration-300"
              />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
