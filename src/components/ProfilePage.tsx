import { useState, useRef, useEffect } from "react";
import {
  User, Settings, Bell, Shield, Moon, ChevronRight,
  LogOut, Heart, Award, TrendingUp, Camera, ImagePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const AVATAR_KEY = "user_avatar_url";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AVATAR_KEY);
    if (saved) setAvatarUrl(saved);
  }, []);

  const uploadAvatar = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片不能超过 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const url = urlData.publicUrl;
      setAvatarUrl(url);
      localStorage.setItem(AVATAR_KEY, url);
      setShowDialog(false);
      toast.success("头像已更新 🎉");
    } catch (e: any) {
      toast.error("上传失败: " + (e.message || "请重试"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
    e.target.value = "";
  };

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Avatar & Name */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <button
          onClick={() => setShowDialog(true)}
          className="relative group w-20 h-20 rounded-full mb-3 shadow-lg overflow-hidden"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-warm flex items-center justify-center">
              <User size={36} className="text-primary-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <h1 className="text-xl font-bold text-foreground font-serif">探索者</h1>
        <p className="text-sm text-muted-foreground mt-0.5">让每一天都鲜活</p>
      </div>

      {/* Avatar upload dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[280px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">修改头像</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <button
              disabled={uploading}
              onClick={() => { cameraInputRef.current?.click(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <Camera size={20} className="text-primary" />
              <span className="text-sm font-medium text-foreground">拍照</span>
            </button>
            <button
              disabled={uploading}
              onClick={() => { fileInputRef.current?.click(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <ImagePlus size={20} className="text-primary" />
              <span className="text-sm font-medium text-foreground">从相册选择</span>
            </button>
          </div>
          {uploading && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">上传中…</p>
          )}
        </DialogContent>
      </Dialog>

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
