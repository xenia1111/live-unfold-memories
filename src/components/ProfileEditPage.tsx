import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

const GENDER_KEYS = ["male", "female", "other", "secret"] as const;
const GENDER_DB_VALUES = ["男", "女", "其他", "保密"];
const REGION_KEYS = ["beijing","shanghai","guangzhou","shenzhen","hangzhou","chengdu","chongqing","wuhan","nanjing","suzhou","xian","changsha","tianjin","qingdao","dalian","xiamen","other"] as const;
const REGION_DB_VALUES = ["北京","上海","广州","深圳","杭州","成都","重庆","武汉","南京","苏州","西安","长沙","天津","青岛","大连","厦门","其他"];

interface ProfileData { name: string; gender: string; birthday: string; region: string; }
const defaultProfile: ProfileData = { name: "探索者", gender: "", birthday: "", region: "" };

interface Props { onBack: () => void; }

const ProfileEditPage = ({ onBack }: Props) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [editField, setEditField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [bdYear, setBdYear] = useState(2000);
  const [bdMonth, setBdMonth] = useState(1);
  const [bdDay, setBdDay] = useState(1);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile({
          name: data.display_name || "探索者",
          gender: data.gender || "",
          birthday: data.birthday || "",
          region: data.region || "",
        });
      }
    });
  }, [user]);

  const saveField = async (field: keyof ProfileData, value: string) => {
    if (!user) return;
    const updated = { ...profile, [field]: value };
    setProfile(updated);

    const dbUpdate: Record<string, any> = {};
    if (field === "name") dbUpdate.display_name = value;
    else if (field === "gender") dbUpdate.gender = value;
    else if (field === "birthday") dbUpdate.birthday = value.split("T")[0];
    else if (field === "region") dbUpdate.region = value;

    await supabase.from("profiles").update(dbUpdate).eq("id", user.id);
    toast.success(t("profileEdit.saved"));
    setEditField(null);
  };

  const getGenderDisplay = (dbVal: string) => {
    const idx = GENDER_DB_VALUES.indexOf(dbVal);
    return idx >= 0 ? t(`profileEdit.${GENDER_KEYS[idx]}`) : dbVal || t("profileEdit.notSet");
  };

  const getRegionDisplay = (dbVal: string) => {
    const idx = REGION_DB_VALUES.indexOf(dbVal);
    return idx >= 0 ? t(`region.${REGION_KEYS[idx]}`) : dbVal || t("profileEdit.notSet");
  };

  const bdDays = useMemo(() => {
    const max = getDaysInMonth(bdYear, bdMonth);
    if (bdDay > max) setBdDay(max);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [bdYear, bdMonth]);

  const fields = [
    { key: "name" as const, label: t("profileEdit.nickname"), value: profile.name, type: "text" },
    { key: "gender" as const, label: t("profileEdit.gender"), value: getGenderDisplay(profile.gender), type: "select" },
    { key: "birthday" as const, label: t("profileEdit.birthday"), value: profile.birthday ? format(new Date(profile.birthday), "yyyy-MM-dd") : t("profileEdit.notSet"), type: "date" },
    { key: "region" as const, label: t("profileEdit.region"), value: getRegionDisplay(profile.region), type: "region" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center px-4 py-3 max-w-lg mx-auto">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><ChevronLeft size={22} className="text-foreground" /></button>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground">{t("profileEdit.title")}</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-4 pb-24">
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {fields.map((field, i) => (
            <button key={field.key}
              onClick={() => {
                setEditField(field.key); setTempValue(field.key === "birthday" ? "" : (profile[field.key] || ""));
                if (field.key === "birthday" && profile.birthday) { const d = new Date(profile.birthday); setBdYear(d.getFullYear()); setBdMonth(d.getMonth() + 1); setBdDay(d.getDate()); }
              }}
              className={cn("w-full flex items-center justify-between px-4 py-4 text-left transition-colors active:bg-muted/50", i < fields.length - 1 && "border-b border-border/30")}>
              <span className="text-sm text-muted-foreground">{field.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-sm", profile[field.key] ? "text-foreground" : "text-muted-foreground/60")}>{field.value}</span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={editField === "name"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-center">{t("profileEdit.editNickname")}</DialogTitle></DialogHeader>
          <input value={tempValue} onChange={e => setTempValue(e.target.value)} maxLength={20} placeholder={t("profileEdit.nickPlaceholder")} autoFocus
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          <button disabled={!tempValue.trim()} onClick={() => saveField("name", tempValue.trim())}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50">{t("profileEdit.save")}</button>
        </DialogContent>
      </Dialog>

      <Dialog open={editField === "gender"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-center">{t("profileEdit.selectGender")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-1 py-1">
            {GENDER_KEYS.map((gKey, i) => (
              <button key={gKey} onClick={() => saveField("gender", GENDER_DB_VALUES[i])}
                className={cn("flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors", profile.gender === GENDER_DB_VALUES[i] ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground")}>
                <span>{t(`profileEdit.${gKey}`)}</span>
                {profile.gender === GENDER_DB_VALUES[i] && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editField === "birthday"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-center">{t("profileEdit.selectBirthday")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select value={bdYear} onChange={e => setBdYear(Number(e.target.value))} className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground appearance-none text-center">
                {years.map(y => <option key={y} value={y}>{y}{t("profileEdit.year")}</option>)}
              </select>
              <select value={bdMonth} onChange={e => setBdMonth(Number(e.target.value))} className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground appearance-none text-center">
                {months.map(m => <option key={m} value={m}>{m}{t("profileEdit.monthUnit")}</option>)}
              </select>
              <select value={bdDay} onChange={e => setBdDay(Number(e.target.value))} className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground appearance-none text-center">
                {bdDays.map(d => <option key={d} value={d}>{d}{t("profileEdit.day")}</option>)}
              </select>
            </div>
            <button onClick={() => { const date = new Date(bdYear, bdMonth - 1, bdDay); if (date > new Date()) { toast.error(t("profileEdit.futureBirthday")); return; } saveField("birthday", date.toISOString()); }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">{t("profileEdit.confirm")}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editField === "region"} onOpenChange={open => !open && setEditField(null)}>
        <DialogContent className="max-w-[300px] rounded-2xl max-h-[70vh]">
          <DialogHeader><DialogTitle className="text-center">{t("profileEdit.selectRegion")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-1 py-1 max-h-[50vh] overflow-y-auto">
            {REGION_KEYS.map((rKey, i) => (
              <button key={rKey} onClick={() => saveField("region", REGION_DB_VALUES[i])}
                className={cn("flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors shrink-0", profile.region === REGION_DB_VALUES[i] ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground")}>
                <span>{t(`region.${rKey}`)}</span>
                {profile.region === REGION_DB_VALUES[i] && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileEditPage;
