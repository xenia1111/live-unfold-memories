import { useState } from "react";
import { ArrowLeft, ChevronRight, Globe, Lock, Info, FileText, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

const APP_VERSION = "1.0.0";

const languages = [
  { code: "en" as Language, label: "English", flag: "🇬🇧" },
  { code: "fr" as Language, label: "Français", flag: "🇫🇷" },
  { code: "es" as Language, label: "Español", flag: "🇪🇸" },
  { code: "zh" as Language, label: "中文", flag: "🇨🇳" },
  { code: "ja" as Language, label: "日本語", flag: "🇯🇵" },
];

interface Props {
  onBack: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

const GeneralSettingsPage = ({ onBack, onOpenPrivacy, onOpenTerms }: Props) => {
  const { lang, setLang, t } = useI18n();
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLangChange = (code: Language) => {
    setLang(code);
    setShowLangDialog(false);
    toast.success(t("settings.langChanged"));
  };

  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      toast.error(t("settings.fillAll"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("settings.minLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.mismatch"));
      return;
    }

    setLoading(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("未找到用户");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (signInError) {
        toast.error("当前密码不正确");
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success(t("settings.passwordUpdated"));
      setShowPasswordDialog(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  const currentLangLabel = languages.find(l => l.code === lang);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{t("settings.title")}</h1>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => setShowPasswordDialog(true)}
          className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Lock size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("settings.password")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.passwordDesc")}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowLangDialog(true)}
          className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Globe size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("settings.language")}</p>
            <p className="text-xs text-muted-foreground">
              {currentLangLabel ? `${currentLangLabel.flag} ${currentLangLabel.label}` : "中文"}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        <div className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Info size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("settings.version")}</p>
            <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
          </div>
        </div>

        {onOpenPrivacy && (
          <button onClick={onOpenPrivacy} className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Shield size={18} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{lang === "zh" || lang === "ja" ? "隐私政策" : "Privacy Policy"}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        )}

        {onOpenTerms && (
          <button onClick={onOpenTerms} className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText size={18} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{lang === "zh" || lang === "ja" ? "用户协议" : "Terms of Service"}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <Dialog open={showLangDialog} onOpenChange={setShowLangDialog}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{t("settings.selectLang")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                  lang === l.code
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="text-sm font-medium text-foreground">{l.label}</span>
                {lang === l.code && (
                  <span className="ml-auto text-xs text-primary font-medium">✓</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{t("settings.changePassword")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input type="password" placeholder={t("settings.oldPassword")} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="rounded-xl" />
            <Input type="password" placeholder={t("settings.newPassword")} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-xl" />
            <Input type="password" placeholder={t("settings.confirmPassword")} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-xl" />
            <Button onClick={handlePasswordChange} disabled={loading} className="rounded-xl mt-1">
              {loading ? "处理中..." : t("settings.confirmChange")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralSettingsPage;
