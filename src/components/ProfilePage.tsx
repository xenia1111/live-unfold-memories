import { useState, useRef, useEffect, useMemo } from "react";
import {
  User, Settings, Bell, Shield, Moon, ChevronRight,
  LogOut, Cat, PawPrint, Fish, Camera, ImagePlus, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileEditPage from "@/components/ProfileEditPage";
import GeneralSettingsPage from "@/components/GeneralSettingsPage";
import ProductIntroPage from "@/components/ProductIntroPage";
import NotificationSettingsPage from "@/components/NotificationSettingsPage";
import AppearanceSettingsPage from "@/components/AppearanceSettingsPage";
import PrivacyPolicyPage from "@/components/PrivacyPolicyPage";
import TermsOfServicePage from "@/components/TermsOfServicePage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import type { Task } from "@/hooks/useTasks";
import { calcStreak } from "@/lib/catGrowth";

interface ProfilePageProps { tasks?: Task[]; }

const ProfilePage = ({ tasks = [] }: ProfilePageProps) => {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showProductIntro, setShowProductIntro] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("探索者");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setDisplayName(data.display_name || "探索者");
      setAvatarUrl(data.avatar_url || null);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const realStats = useMemo(() => {
    const completedCount = tasks.filter(t => t.completed).length;
    const streak = calcStreak(tasks);
    const totalRecords = tasks.length;
    return { completedCount, streak, totalRecords };
  }, [tasks]);

  const stats = [
    { label: t("profile.plans"), value: String(realStats.completedCount), icon: Fish },
    { label: t("profile.streak"), value: String(realStats.streak), icon: PawPrint },
    { label: t("profile.lifeIndex"), value: String(realStats.totalRecords), icon: Cat },
  ];

  const menuItems = [
    { icon: Bell, label: t("profile.notifications"), desc: t("profile.notificationsDesc"), key: "notifications" },
    { icon: Shield, label: t("profile.privacy"), desc: t("profile.privacyDesc"), key: "privacy" },
    { icon: Moon, label: t("profile.appearance"), desc: t("profile.appearanceDesc"), key: "appearance" },
    { icon: Settings, label: t("profile.general"), desc: t("profile.generalDesc"), key: "general" },
    { icon: BookOpen, label: t("profile.intro"), desc: t("profile.introDesc"), key: "intro" },
  ];

  const uploadAvatar = async (file: File) => {
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("profile.imageTooLarge")); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const url = urlData.publicUrl;
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setShowDialog(false);
      toast.success(t("profile.avatarUpdated"));
    } catch (e: any) {
      toast.error(t("profile.uploadFailed") + (e.message || ""));
    } finally { setUploading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
    e.target.value = "";
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("已退出登录");
  };

  if (showProfileEdit) return <ProfileEditPage onBack={() => { setShowProfileEdit(false); loadProfile(); }} />;
  if (showGeneralSettings) return <GeneralSettingsPage onBack={() => setShowGeneralSettings(false)} />;
  if (showProductIntro) return <ProductIntroPage onBack={() => setShowProductIntro(false)} />;
  if (showNotifications) return <NotificationSettingsPage onBack={() => setShowNotifications(false)} />;
  if (showAppearance) return <AppearanceSettingsPage onBack={() => setShowAppearance(false)} />;
  if (showPrivacy) return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />;
  if (showTerms) return <TermsOfServicePage onBack={() => setShowTerms(false)} />;

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <button onClick={() => setShowDialog(true)} className="relative group w-20 h-20 rounded-full mb-3 shadow-lg overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-warm flex items-center justify-center"><User size={36} className="text-primary-foreground" /></div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <button onClick={() => setShowProfileEdit(true)} className="flex items-center gap-1.5 group/name">
          <h1 className="text-xl font-bold text-foreground font-serif">{displayName}</h1>
          <ChevronRight size={14} className="text-muted-foreground" />
        </button>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[280px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-center">{t("profile.changeAvatar")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <button disabled={uploading} onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-[0.98] disabled:opacity-50">
              <Camera size={20} className="text-primary" /><span className="text-sm font-medium text-foreground">{t("profile.takePhoto")}</span>
            </button>
            <button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-[0.98] disabled:opacity-50">
              <ImagePlus size={20} className="text-primary" /><span className="text-sm font-medium text-foreground">{t("profile.fromAlbum")}</span>
            </button>
          </div>
          {uploading && <p className="text-xs text-center text-muted-foreground animate-pulse">{t("profile.uploading")}</p>}
        </DialogContent>
      </Dialog>

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

      <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => { if (item.key === "general") setShowGeneralSettings(true); if (item.key === "intro") setShowProductIntro(true); }}
              className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 card-glow border border-border/50 text-left transition-all active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Icon size={18} className="text-foreground" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 mt-8 py-3 rounded-xl bg-muted text-muted-foreground hover:text-destructive transition-colors text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <LogOut size={16} /><span>{t("profile.logout")}</span>
      </button>
    </div>
  );
};

export default ProfilePage;
