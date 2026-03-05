import { useState, useRef, useCallback } from "react";
import { Plus, X, Coffee, Dumbbell, BookOpen, Music, Heart, Star, ImagePlus, CalendarOff, Mic, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";

const iconOptions = [
  { key: "coffee", icon: Coffee, label: "咖啡" },
  { key: "dumbbell", icon: Dumbbell, label: "运动" },
  { key: "book", icon: BookOpen, label: "阅读" },
  { key: "music", icon: Music, label: "音乐" },
  { key: "heart", icon: Heart, label: "生活" },
  { key: "star", icon: Star, label: "特别" },
];

const categoryOptions = ["美食", "学习", "运动", "社交", "工作", "美景", "娱乐", "记录", "健康", "美丽"];

import TimePicker from "@/components/TimePicker";

interface AddTaskDialogProps {
  onAdd: (task: { title: string; time: string; icon: string; category: string; date?: Date; coverImage?: string; deadline?: Date }) => void;
}

const AddTaskDialog = ({ onAdd }: AddTaskDialogProps) => {
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
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("您的浏览器不支持语音识别");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setVoiceText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("语音识别出错，请重试");
    };

    setIsListening(true);
    setVoiceText("");
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const parseVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-voice-task", {
        body: { text: text.trim() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Auto-fill fields
      if (data.title) setTitle(data.title);
      if (data.icon) setSelectedIcon(data.icon);
      if (data.category) setSelectedCategory(data.category);
      if (data.time) setSelectedTime(data.time);
      if (data.dayOffset !== undefined && data.dayOffset !== null) {
        setSelectedDayOffset(data.dayOffset);
      }
      setVoiceMode(false);
      toast.success("已智能填入，请确认后提交 ✨");
    } catch (e: any) {
      console.error("Voice parse error:", e);
      toast.error(e.message || "解析失败，请重试");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const today = new Date();
  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    offset: i,
    date: addDays(today, i),
    label: i === 0 ? "今天" : i === 1 ? "明天" : format(addDays(today, i), "E", { locale: zhCN }),
  }));

  const deadlineOptions = [3, 5, 7, 14, 30];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setTitle("");
    setSelectedIcon("star");
    setSelectedCategory("记录");
    setSelectedTime("09:00");
    setSelectedDayOffset(0);
    setCoverImage(null);
    setDeadlineOffset(null);
    setVoiceText("");
    setVoiceMode(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      time: selectedTime,
      icon: selectedIcon,
      category: selectedCategory,
      date: selectedDayOffset !== null ? addDays(today, selectedDayOffset) : undefined,
      coverImage: coverImage || undefined,
      deadline: deadlineOffset !== null ? addDays(today, deadlineOffset) : undefined,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all animate-breathe hover:shadow-xl">
          <Plus size={28} />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-serif text-foreground">
              {voiceMode ? "语音输入 🎙️" : "记录一件想做的事 ✨"}
            </DialogTitle>
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                voiceMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Mic size={16} />
            </button>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {voiceMode ? "说一句话，AI 帮你自动填写" : "给未来的自己安排一件美好的事吧"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Voice input mode */}
          {voiceMode && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isParsing}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
                      : isParsing
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                  )}
                >
                  {isParsing ? <Loader2 size={28} className="animate-spin" /> : <Mic size={28} />}
                </button>
                <p className="text-xs text-muted-foreground">
                  {isListening ? "正在听...点击停止" : isParsing ? "AI 正在分析..." : "点击开始说话"}
                </p>
              </div>

              {voiceText && (
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">识别结果：</p>
                  {voiceText}
                </div>
              )}

              {voiceText && !isListening && !isParsing && (
                <button
                  onClick={() => parseVoiceInput(voiceText)}
                  className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-[0.98] transition-all"
                >
                  AI 智能填写 ✨
                </button>
              )}

              {/* Manual text input fallback */}
              <div className="pt-2 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground mb-1.5">或直接输入文字：</p>
                <div className="flex gap-2">
                  <input
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="明天下午三点和朋友去咖啡馆..."
                    className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <button
                    onClick={() => parseVoiceInput(voiceText)}
                    disabled={!voiceText.trim() || isParsing}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      voiceText.trim() && !isParsing
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    解析
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual form fields */}
          {!voiceMode && (
          <>
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="比如：和朋友去看日落 🌅"
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors"
              autoFocus
            />
          </div>

          {/* Cover image */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">📷 配一张图（可选）</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={coverImage} alt="封面" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                  <X size={14} className="text-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all">
                <ImagePlus size={22} />
                <span className="text-xs">添加封面图片</span>
              </button>
            )}
          </div>

          {/* Day selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">📅 哪一天？</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {/* "不指定" option */}
              <button
                onClick={() => setSelectedDayOffset(null)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all",
                  selectedDayOffset === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <CalendarOff size={14} className="mb-0.5" />
                <span className="font-medium">不定</span>
              </button>
              {dayOptions.map((day) => (
                <button
                  key={day.offset}
                  onClick={() => setSelectedDayOffset(day.offset)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all",
                    selectedDayOffset === day.offset
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="font-medium">{day.label}</span>
                  <span className="text-[10px] mt-0.5">{format(day.date, "M/d")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time selector — only when date is set */}
          {selectedDayOffset !== null && (
            <TimePicker value={selectedTime} onChange={setSelectedTime} />
          )}

          {/* Deadline selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">⏳ 截止日期（可选）</p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setDeadlineOffset(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all",
                  deadlineOffset === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                无
              </button>
              {deadlineOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDeadlineOffset(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-all",
                    deadlineOffset === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d}天后
                </button>
              ))}
            </div>
            {deadlineOffset !== null && (
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                截止于 {format(addDays(today, deadlineOffset), "M月d日 EEEE", { locale: zhCN })}
              </p>
            )}
          </div>

          {/* Icon selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">🎨 选个图标</p>
            <div className="flex gap-2">
              {iconOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedIcon(opt.key)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      selectedIcon === opt.key
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">📂 分类</p>
            <div className="flex gap-1.5 flex-wrap">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-all",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          </>
          )}

        </div>

        {/* Parsed result preview in voice mode */}
        {voiceMode && title.trim() && (
          <div className="px-5 pb-2 space-y-2">
            <p className="text-xs text-muted-foreground">🤖 AI 解析结果：</p>
            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">标题：</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 bg-transparent border-b border-border/30 focus:outline-none focus:border-primary/40 px-1 py-0.5" />
              </div>
              <div className="flex gap-4">
                <span><span className="text-muted-foreground">分类：</span>{selectedCategory}</span>
                <span><span className="text-muted-foreground">时间：</span>{selectedTime}</span>
              </div>
              <div>
                <span className="text-muted-foreground">日期：</span>
                {selectedDayOffset === null ? "不指定" : selectedDayOffset === 0 ? "今天" : selectedDayOffset === 1 ? "明天" : `${selectedDayOffset}天后`}
              </div>
            </div>
          </div>
        )}

        {/* Sticky submit */}
        <div className="px-5 py-4 border-t border-border/30 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-medium transition-all",
              title.trim()
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {voiceMode && title.trim() ? "确认添加 ✅" : "添加到生活 💫"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
