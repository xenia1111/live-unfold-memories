import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Globe, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LANG_KEY = "app_language";
const APP_VERSION = "1.0.0";

const languages = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

interface Props {
  onBack: () => void;
}

const GeneralSettingsPage = ({ onBack }: Props) => {
  const [currentLang, setCurrentLang] = useState("zh");
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved) setCurrentLang(saved);
  }, []);

  const handleLangChange = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem(LANG_KEY, code);
    setShowLangDialog(false);
    toast.success("语言已切换 🌍");
  };

  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword) {
      toast.error("请填写完整");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次密码不一致");
      return;
    }
    // Placeholder — no real auth yet
    toast.success("密码已更新 🔒");
    setShowPasswordDialog(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const currentLangLabel = languages.find(l => l.code === currentLang);

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
        <h1 className="text-lg font-bold text-foreground font-serif">通用设置</h1>
      </div>

      <div className="space-y-2">
        {/* Password */}
        <button
          onClick={() => setShowPasswordDialog(true)}
          className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Lock size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">账户密码</p>
            <p className="text-xs text-muted-foreground">修改登录密码</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Language */}
        <button
          onClick={() => setShowLangDialog(true)}
          className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Globe size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">语言</p>
            <p className="text-xs text-muted-foreground">
              {currentLangLabel ? `${currentLangLabel.flag} ${currentLangLabel.label}` : "中文"}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Version */}
        <div className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Info size={18} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">版本号</p>
            <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
          </div>
        </div>
      </div>

      {/* Language Dialog */}
      <Dialog open={showLangDialog} onOpenChange={setShowLangDialog}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">选择语言</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                  currentLang === lang.code
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium text-foreground">{lang.label}</span>
                {currentLang === lang.code && (
                  <span className="ml-auto text-xs text-primary font-medium">✓</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">修改密码</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              type="password"
              placeholder="当前密码"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="password"
              placeholder="新密码（至少6位）"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="password"
              placeholder="确认新密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="rounded-xl"
            />
            <Button onClick={handlePasswordChange} className="rounded-xl mt-1">
              确认修改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralSettingsPage;
