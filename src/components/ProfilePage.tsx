import {
  User, Settings, Bell, Shield, Moon, ChevronRight,
  LogOut, Heart, Award, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "完成计划", value: "280", icon: TrendingUp },
  { label: "连续天数", value: "23", icon: Award },
  { label: "生活指数", value: "92", icon: Heart },
];

const menuItems = [
  { icon: Bell, label: "通知设置", desc: "管理提醒和推送" },
  { icon: Shield, label: "隐私设置", desc: "数据安全与隐私" },
  { icon: Moon, label: "外观设置", desc: "主题与显示" },
  { icon: Settings, label: "通用设置", desc: "语言、存储等" },
];

const ProfilePage = () => {
  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mb-3 shadow-lg">
          <User size={36} className="text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground font-serif">探索者</h1>
        <p className="text-sm text-muted-foreground mt-0.5">让每一天都鲜活</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-2xl p-4 card-glow border border-border/50 text-center">
              <Icon size={18} className="text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Menu */}
      <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 mt-8 py-3 rounded-xl bg-muted text-muted-foreground hover:text-destructive transition-colors text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <LogOut size={16} />
        <span>退出登录</span>
      </button>
    </div>
  );
};

export default ProfilePage;
