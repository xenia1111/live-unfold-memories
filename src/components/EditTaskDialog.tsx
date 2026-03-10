import { useState, useRef, useEffect } from "react";
import { X, Coffee, Dumbbell, BookOpen, Music, Heart, Star, ImagePlus, Trash2, Camera } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { Task } from "@/hooks/useTasks";
import TimePicker from "@/components/TimePicker";
import { useI18n, useCategoryName } from "@/lib/i18n";

const categoryOptions = ["运动", "学习", "社交", "工作", "健康", "记录", "娱乐", "美食", "美景"];

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EditTaskDialog = ({ task, open, onOpenChange, onSave, onDelete }: EditTaskDialogProps) => {
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

  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedCategory, setSelectedCategory] = useState("记录");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title); setSelectedIcon(task.icon); setSelectedCategory(task.category);
      setSelectedTime(task.time); setCompletionPhoto(task.completionPhoto || null);
      setCompletionNote(task.completionNote || ""); setConfirmDelete(false);
    }
  }, [task, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (ev) => setCompletionPhoto(ev.target?.result as string); reader.readAsDataURL(file); }
  };

  const handleSave = async () => {
    if (!task || !title.trim() || saving) return;
    setSaving(true);
    await onSave(task.id, { title: title.trim(), icon: selectedIcon, category: selectedCategory, time: selectedTime, completionPhoto: completionPhoto || undefined, completionNote: completionNote || undefined });
    setSaving(false); onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await onDelete(task.id); onOpenChange(false);
  };

  return (
    <Dialog open={open && !!task} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg font-serif text-foreground">{t("edit.title")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {task?.date ? format(task.date, dateFormat, { locale }) : t("edit.noDate")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("edit.photoLabel")}</p>
            <input ref={cameraPhotoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            {completionPhoto ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={completionPhoto} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setCompletionPhoto(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"><X size={14} className="text-foreground" /></button>
                <button onClick={() => photoInputRef.current?.click()} className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/80 text-[10px] text-foreground">{t("edit.replace")}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => cameraPhotoInputRef.current?.click()} className="flex-1 h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all">
                  <Camera size={22} /><span className="text-xs">{t("complete.takePhoto")}</span>
                </button>
                <button onClick={() => photoInputRef.current?.click()} className="flex-1 h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all">
                  <ImagePlus size={22} /><span className="text-xs">{t("complete.fromAlbum")}</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("edit.noteLabel")}</p>
            <textarea value={completionNote} onChange={(e) => setCompletionNote(e.target.value)} placeholder={t("edit.notePlaceholder")}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors resize-none min-h-[80px]" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("edit.titleLabel")}</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none focus:border-primary/40 transition-colors" />
          </div>

          <TimePicker value={selectedTime} onChange={setSelectedTime} />

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("edit.iconLabel")}</p>
            <div className="flex gap-2">
              {iconOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.key} onClick={() => setSelectedIcon(opt.key)}
                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", selectedIcon === opt.key ? "bg-primary text-primary-foreground scale-110" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("edit.categoryLabel")}</p>
            <div className="flex gap-1.5 flex-wrap">
              {categoryOptions.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                  {catName(cat)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/30 flex-shrink-0 flex gap-3">
          <button onClick={handleDelete} className={cn("px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5", confirmDelete ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive hover:bg-destructive/20")}>
            <Trash2 size={14} />{confirmDelete ? t("edit.confirmDelete") : t("edit.delete")}
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className={cn("flex-1 py-3 rounded-xl text-sm font-medium transition-all", title.trim() && !saving ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed")}>
            {saving ? t("edit.saving") : t("edit.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
