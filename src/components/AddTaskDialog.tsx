import { useState, useRef } from "react";
import { Plus, X, Coffee, Dumbbell, BookOpen, Music, Heart, Star, ImagePlus, CalendarOff } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

const categoryOptions = ["运动", "学习", "社交", "工作", "健康", "记录", "娱乐"];

const timeOptions = ["07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00", "22:00", "全天"];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-md p-0 gap-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="text-lg font-serif text-foreground">记录一件想做的事 ✨</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">给未来的自己安排一件美好的事吧</DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-5">
          {/* Title input */}
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
            <div>
              <p className="text-xs text-muted-foreground mb-2">⏰ 什么时候？</p>
              <div className="flex gap-1.5 flex-wrap">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs transition-all",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
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

          {/* Submit */}
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
            添加到生活 💫
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
