import { useState, useRef, useCallback } from "react";
import { PawPrint, X, Coffee, Dumbbell, BookOpen, Music, Heart, Star, ImagePlus, CalendarOff, Mic, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import TimePicker from "@/components/TimePicker";
import { useI18n, interpolate, useCategoryName } from "@/lib/i18n";
import { autoCategory } from "@/lib/autoCategory";

const categoryOptions = ["美食", "学习", "运动", "社交", "工作", "美景", "娱乐", "记录", "健康", "美丽"];

interface AddTaskDialogProps {
  onAdd: (task: { title: string; time: string; icon: string; category: string; date?: Date; coverImage?: string; deadline?: Date }) => void;
}

const AddTaskDialog = ({ onAdd }: AddTaskDialogProps) => {
  const { t, locale, dateFormat } = useI18n();
  const catName = useCategoryName();

  const iconOptions = [
    { key: "coffee", icon: Coffee, label: t("icon.coffee") },
    { key: "dumbbell", icon: Dumbbell, label: t("icon.dumbbell") },
    { key: "book", icon: BookOpen, label: t("icon.book") },
    { key: "music", icon: Music, label: t("icon.music") },
    { key: "heart", icon: Heart, label: t("icon.heart") },
    { key: "star", icon: Star, label: t("icon.star") },
  ];

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedCategory, setSelectedCategory] = useState("记录");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(0);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [deadlineOffset, setDeadlineOffset] = useState<number | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error(t("add.voiceNotSupported")); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN"; recognition.continuous = false; recognition.interimResults = true;
    recognitionRef.current = recognition;
    recognition.onresult = (event: any) => { const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(""); setVoiceText(transcript); };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error(t("add.voiceError")); };
    setIsListening(true); setVoiceText(""); recognition.start();
  }, [t]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  const parseVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-voice-task", { body: { text: text.trim() } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      if (data.title) setTitle(data.title); if (data.icon) setSelectedIcon(data.icon);
      if (data.category) setSelectedCategory(data.category); if (data.time) setSelectedTime(data.time);
      if (data.dayOffset !== undefined && data.dayOffset !== null) setSelectedDayOffset(data.dayOffset);
      setVoiceMode(false); toast.success(t("add.voiceParsed"));
    } catch (e: any) { console.error("Voice parse error:", e); toast.error(e.message || t("add.parseFailed")); }
    finally { setIsParsing(false); }
  }, [t]);

  const today = new Date();
  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    offset: i, date: addDays(today, i),
    label: i === 0 ? t("add.today") : i === 1 ? t("home.tomorrow") : format(addDays(today, i), "E", { locale }),
  }));
  const deadlineOptions = [3, 5, 7, 14, 30];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setCoverImage(ev.target?.result as string); reader.readAsDataURL(file); } };

  const reset = () => { setTitle(""); setSelectedIcon("star"); setSelectedCategory("记录"); setSelectedTime("09:00"); setSelectedDayOffset(0); setCoverImage(null); setDeadlineOffset(null); setVoiceText(""); setVoiceMode(false); setCategoryManuallySet(false); };

  const handleSubmit = () => {
    if (!title.trim()) return;
    let finalCategory = selectedCategory;
    let finalIcon = selectedIcon;
    if (!categoryManuallySet) {
      const auto = autoCategory(title.trim());
      finalCategory = auto.category;
      finalIcon = auto.icon;
    }
    onAdd({ title: title.trim(), time: selectedTime, icon: finalIcon, category: finalCategory, date: selectedDayOffset !== null ? addDays(today, selectedDayOffset) : undefined, coverImage: coverImage || undefined, deadline: deadlineOffset !== null ? addDays(today, deadlineOffset) : undefined });
    reset(); setOpen(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all animate-breathe hover:shadow-xl"><PawPrint size={26} /></button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg font-serif text-foreground">{t("add.title")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{t("add.desc")}</DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="flex gap-2">
            <input value={voiceMode ? voiceText : title} onChange={(e) => voiceMode ? setVoiceText(e.target.value) : setTitle(e.target.value)}
              placeholder={voiceMode ? t("add.voicePlaceholder") : t("add.placeholder")}
              className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors" autoFocus />
            <button onClick={() => { if (isListening) stopListening(); else if (voiceMode && voiceText.trim()) parseVoiceInput(voiceText); else { const hasUsedVoice = localStorage.getItem("voice_tip_shown"); if (!hasUsedVoice) { setShowVoiceTip(true); localStorage.setItem("voice_tip_shown", "1"); } else { setVoiceMode(true); startListening(); } } }}
              disabled={isParsing} className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0", isListening ? "bg-destructive text-destructive-foreground animate-pulse" : isParsing ? "bg-muted text-muted-foreground" : voiceMode && voiceText.trim() ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20")}>
              {isParsing ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
            </button>
          </div>

          {(isListening || isParsing || voiceMode) && (
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground flex-1">{isListening ? t("add.listening") : isParsing ? t("add.analyzing") : voiceText ? t("add.clickToFill") : t("add.clickMic")}</p>
              {voiceMode && !isListening && !isParsing && <button onClick={() => { setVoiceMode(false); setVoiceText(""); }} className="text-[10px] text-muted-foreground/60 underline">{t("add.cancel")}</button>}
            </div>
          )}

          {voiceMode && title.trim() && !isParsing && (
            <div className="bg-primary/5 rounded-xl p-3 space-y-1.5 text-xs border border-primary/15">
              <p className="text-primary font-medium text-[10px]">{t("add.aiConfirmHint")}</p>
              <div className="flex items-center gap-2 text-foreground">
                <span className="text-muted-foreground">{t("add.aiTitle")}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 bg-transparent border-b border-border/30 focus:outline-none focus:border-primary/40 px-1 py-0.5 text-sm" />
              </div>
              <div className="flex gap-4 text-foreground">
                <span><span className="text-muted-foreground">{t("add.aiCategory")}</span>{catName(selectedCategory)}</span>
                <span><span className="text-muted-foreground">{t("add.aiTime")}</span>{selectedTime}</span>
                <span><span className="text-muted-foreground">{t("add.aiDate")}</span>
                  {selectedDayOffset === null ? t("add.noDate") : selectedDayOffset === 0 ? t("add.today") : selectedDayOffset === 1 ? t("home.tomorrow") : interpolate(t("add.daysLater"), { n: selectedDayOffset })}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("add.coverLabel")}</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={coverImage} alt="" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"><X size={14} className="text-foreground" /></button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all">
                <ImagePlus size={22} /><span className="text-xs">{t("add.addCover")}</span>
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("add.dayLabel")}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setSelectedDayOffset(null)} className={cn("flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all", selectedDayOffset === null ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                <CalendarOff size={14} className="mb-0.5" /><span className="font-medium">{t("add.noDate")}</span>
              </button>
              {dayOptions.map((day) => (
                <button key={day.offset} onClick={() => setSelectedDayOffset(day.offset)} className={cn("flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all", selectedDayOffset === day.offset ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                  <span className="font-medium">{day.label}</span><span className="text-[10px] mt-0.5">{format(day.date, "M/d")}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedDayOffset !== null && <TimePicker value={selectedTime} onChange={setSelectedTime} />}

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("add.deadlineLabel")}</p>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setDeadlineOffset(null)} className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", deadlineOffset === null ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{t("add.none")}</button>
              {deadlineOptions.map((d) => (
                <button key={d} onClick={() => setDeadlineOffset(d)} className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", deadlineOffset === d ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                  {interpolate(t("add.daysLater"), { n: d })}
                </button>
              ))}
            </div>
            {deadlineOffset !== null && <p className="text-[10px] text-muted-foreground/60 mt-1.5">{interpolate(t("add.deadlineOn"), { date: format(addDays(today, deadlineOffset), dateFormat, { locale }) })}</p>}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("add.iconLabel")}</p>
            <div className="flex gap-2">
              {iconOptions.map((opt) => { const Icon = opt.icon; return (
                <button key={opt.key} onClick={() => setSelectedIcon(opt.key)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", selectedIcon === opt.key ? "bg-primary text-primary-foreground scale-110" : "bg-muted/50 text-muted-foreground hover:bg-muted")}><Icon size={18} /></button>
              ); })}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("add.categoryLabel")}</p>
            <div className="flex gap-1.5 flex-wrap">
              {categoryOptions.map((cat) => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setCategoryManuallySet(true); }} className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{catName(cat)}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/30 flex-shrink-0">
          <button onClick={handleSubmit} disabled={!title.trim()} className={cn("w-full py-3 rounded-xl text-sm font-medium transition-all", title.trim() ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed")}>
            {voiceMode && title.trim() ? t("add.confirmAdd") : t("add.submit")}
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showVoiceTip} onOpenChange={setShowVoiceTip}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[85vw] sm:max-w-sm p-6 gap-4">
        <DialogHeader>
          <DialogTitle className="text-base font-serif text-foreground">{t("add.voiceTipTitle")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{t("add.voiceTipDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground">
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span><p className="text-muted-foreground">{t("add.voiceTip1")}<span className="text-foreground font-medium">{t("add.voiceTip1b")}</span></p></div>
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span><p className="text-muted-foreground">{t("add.voiceTip2")}<span className="text-foreground font-medium">{t("add.voiceTip2b")}</span></p></div>
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span><p className="text-muted-foreground">{t("add.voiceTip3")}<span className="text-foreground font-medium">{t("add.voiceTip3b")}</span></p></div>
          <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">{t("add.voiceTipExample")}</div>
        </div>
        <button onClick={() => { setShowVoiceTip(false); setVoiceMode(true); startListening(); }} className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-[0.98] transition-all">{t("add.voiceTipStart")}</button>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AddTaskDialog;
