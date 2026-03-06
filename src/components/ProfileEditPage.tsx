import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PROFILE_KEY = "user_profile_data";
const NAME_KEY = "user_display_name";

const GENDER_OPTIONS = ["男", "女", "其他", "保密"];

const REGIONS = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "武汉",
  "南京", "苏州", "西安", "长沙", "天津", "青岛", "大连", "厦门",
  "其他"
];

interface ProfileData {
  name: string;
  gender: string;
  birthday: string;
  region: string;
}

const defaultProfile: ProfileData = {
  name: "探索者",
  gender: "",
  birthday: "",
  region: "",
};

interface Props {
  onBack: () => void;
}

const ProfileEditPage = ({ onBack }: Props) => {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [editField, setEditField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      const savedName = localStorage.getItem(NAME_KEY);
      if (savedName) setProfile(p => ({ ...p, name: savedName }));
    }
  }, []);

  const saveField = (field: keyof ProfileData, value: string) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    if (field === "name") localStorage.setItem(NAME_KEY, value);
    toast.success("已保存");
    setEditField(null);
  };

  const fields = [
    {
      key: "name" as const,
      label: "昵称",
      value: profile.name,
      type: "text",
    },
    {
      key: "gender" as const,
      label: "性别",
      value: profile.gender || "未设置",
      type: "select",
    },
    {
      key: "birthday" as const,
      label: "生日",
      value: profile.birthday
        ? format(new Date(profile.birthday), "yyyy年M月d日", { locale: zhCN })
        : "未设置",
      type: "date",
    },
    {
      key: "region" as const,
      label: "地区",
      value: profile.region || "未设置",
      type: "region",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft size={22} className="text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground">个人信息</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Fields */}
      <div className="max-w-lg mx-auto px-5 pt-4 pb-24">
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {fields.map((field, i) => (
            <button
              key={field.key}
              onClick={() => {
                setEditField(field.key);
                setTempValue(field.key === "birthday" ? "" : (profile[field.key] || ""));
                if (field.key === "birthday" && profile.birthday) {
                  setCalendarDate(new Date(profile.birthday));
                } else {
                  setCalendarDate(undefined);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-4 text-left transition-colors active:bg-muted/50",
                i < fields.length - 1 && "border-b border-border/30"
              )}
            >
              <span className="text-sm text-muted-foreground">{field.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-sm",
                  profile[field.key] ? "text-foreground" : "text-muted-foreground/60"
                )}>
                  {field.value}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editField === "name"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">修改昵称</DialogTitle>
          </DialogHeader>
          <input
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            maxLength={20}
            placeholder="输入昵称"
            autoFocus
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            disabled={!tempValue.trim()}
            onClick={() => saveField("name", tempValue.trim())}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            保存
          </button>
        </DialogContent>
      </Dialog>

      {/* Gender Dialog */}
      <Dialog open={editField === "gender"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">选择性别</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1 py-1">
            {GENDER_OPTIONS.map(g => (
              <button
                key={g}
                onClick={() => saveField("gender", g)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors",
                  profile.gender === g
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <span>{g}</span>
                {profile.gender === g && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Birthday Dialog - custom scroll picker */}
      <Dialog open={editField === "birthday"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">选择生日</DialogTitle>
          </DialogHeader>
          <BirthdayPicker
            value={profile.birthday}
            onConfirm={(dateStr) => saveField("birthday", dateStr)}
          />
        </DialogContent>
      </Dialog>

      {/* Region Dialog */}
      <Dialog open={editField === "region"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="text-center">选择地区</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1 py-1 max-h-[50vh] overflow-y-auto">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => saveField("region", r)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors shrink-0",
                  profile.region === r
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <span>{r}</span>
                {profile.region === r && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileEditPage;
