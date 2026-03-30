import { useState, useEffect } from "react";
import { ArrowLeft, Bell, BellOff, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface Props { onBack: () => void; }

const NOTIF_KEY = "app_notifications_enabled";

const NotificationSettingsPage = ({ onBack }: Props) => {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(() => localStorage.getItem(NOTIF_KEY) !== "false");
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "default"
  );

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [enabled]);

  const toggle = async () => {
    const next = !enabled;
    if (next && "Notification" in window && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "denied") {
        toast.error(t("notif.permissionDenied"));
        return;
      }
    }
    setEnabled(next);
    localStorage.setItem(NOTIF_KEY, String(next));
    toast.success(next ? t("notif.enabled") : t("notif.disabled"));
  };

  const permissionText = permission === "granted"
    ? t("notif.permissionGranted")
    : permission === "denied"
    ? t("notif.permissionDenied")
    : t("notif.permissionDefault");

  const notSupported = !("Notification" in window);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{t("notif.title")}</h1>
      </div>

      <div className="space-y-3">
        <button onClick={toggle} disabled={notSupported} className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98] disabled:opacity-50">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            {enabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("notif.taskReminders")}</p>
            <p className="text-xs text-muted-foreground">{t("notif.taskRemindersDesc")}</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </div>
        </button>

        {/* Permission status */}
        <div className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ShieldAlert size={18} className={permission === "granted" ? "text-green-500" : permission === "denied" ? "text-destructive" : "text-muted-foreground"} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("notif.browserPermission")}</p>
            <p className={`text-xs ${permission === "granted" ? "text-green-500" : permission === "denied" ? "text-destructive" : "text-muted-foreground"}`}>
              {notSupported ? t("notif.notSupported") : permissionText}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 px-2 leading-relaxed">
        {t("notif.note")}
      </p>
    </div>
  );
};

export default NotificationSettingsPage;
