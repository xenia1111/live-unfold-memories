import { useState, useRef, useEffect } from "react";
import { X, Coffee, Dumbbell, BookOpen, Music, Heart, Star, ImagePlus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { Task } from "@/hooks/useTasks";

const iconOptions = [
  { key: "coffee", icon: Coffee, label: "咖啡" },
  { key: "dumbbell", icon: Dumbbell, label: "运动" },
  { key: "book", icon: BookOpen, label: "阅读" },
  { key: "music", icon: Music, label: "音乐" },
  { key: "heart", icon: Heart, label: "生活" },
  { key: "star", icon: Star, label: "特别" },
];

const categoryOptions = ["运动", "学习", "社交", "工作", "健康", "记录", "娱乐", "美食", "美景"];

const timeOptions = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "全天"];

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EditTaskDialog = ({ task, open, onOpenChange, onSave, onDelete }: EditTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedCategory, setSelectedCategory] = useState("记录");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setSelectedIcon(task.icon);
      setSelectedCategory(task.category);
      setSelectedTime(task.time);
      setCompletionPhoto(task.completionPhoto || null);
      setCompletionNote(task.completionNote || "");
      setConfirmDelete(false);
    }
  }, [task, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCompletionPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!task || !title.trim() || saving) return;
    setSaving(true);
    await onSave(task.id, {
      title: title.trim(),
      icon: selectedIcon,
      category: selectedCategory,
      time: selectedTime,
      completionPhoto: completionPhoto || undefined,
      completionNote: completionNote || undefined,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(task.id);
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg font-serif text-foreground">编辑记录 ✏️</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {task.date ? format(task.date, "M月d日 EEEE", { locale: zhCN }) : "未指定日期"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Completion photo */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">📷 完成照片</p>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            {completionPhoto ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={completionPhoto} alt="完成照片" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setCompletionPhoto(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                  <X size={14} className="text-foreground" />
                </button>
                <button onClick={() => photoInputRef.current?.click()} className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/80 text-[10px] text-foreground">
                  更换
                </button>
              </div>
            ) : (
              <button onClick={() => photoInputRef.current?.click()} className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all">
                <ImagePlus size={22} />
                <span className="text-xs">添加完成照片</span>
              </button>
            )}
          </div>

          {/* Completion note */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">📝 随笔</p>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="记录当时的感受..."
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors resize-none min-h-[80px]"
            />
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">✨ 标题</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Time */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">⏰ 时间</p>
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

          {/* Icon */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">🎨 图标</p>
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

          {/* Category */}
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
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/30 flex-shrink-0 flex gap-3">
          <button
            onClick={handleDelete}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
              confirmDelete
                ? "bg-destructive text-destructive-foreground"
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            )}
          >
            <Trash2 size={14} />
            {confirmDelete ? "确认删除" : "删除"}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              title.trim() && !saving
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {saving ? "保存中..." : "保存修改 💫"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
