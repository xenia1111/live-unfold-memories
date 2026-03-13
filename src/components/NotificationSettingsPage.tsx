import { useState } from "react";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface Props { onBack: () => void; }

const NOTIF_KEY = "app_notifications_enabled";

const NotificationSettingsPage = ({ onBack }: Props) => {
  const { lang } = useI18n();
  const isZh = lang === "zh" || lang === "ja";
  const [enabled, setEnabled] = useState(() => localStorage.getItem(NOTIF_KEY) !== "false");

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(NOTIF_KEY, String(next));
    toast.success(next ? (isZh ? "已开启通知" : "Notifications enabled") : (isZh ? "已关闭通知" : "Notifications disabled"));
  };

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{isZh ? "通知设置" : "Notifications"}</h1>
      </div>

      <div className="space-y-2">
        <button onClick={toggle} className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            {enabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{isZh ? "任务提醒" : "Task Reminders"}</p>
            <p className="text-xs text-muted-foreground">{isZh ? "在任务时间到达时收到提醒" : "Get reminded when task time arrives"}</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 px-2 leading-relaxed">
        {isZh
          ? "注意：推送通知功能需要在设备系统设置中允许本应用发送通知。原生推送将在后续版本中支持。"
          : "Note: Push notifications require allowing this app to send notifications in your device settings. Native push will be supported in a future update."
        }
      </p>
    </div>
  );
};

export default NotificationSettingsPage;
