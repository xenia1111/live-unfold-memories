import { useState, useRef, useMemo } from "react";
import { Camera, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const MOMENT_MESSAGES = [
  { emoji: "🌿", title: "记录这一刻", sub: "生活值得被好好感受" },
  { emoji: "☀️", title: "此刻的你", sub: "每个瞬间都是独一无二的" },
  { emoji: "🍃", title: "留住这份感觉", sub: "文字和画面，都是生活的痕迹" },
  { emoji: "🌸", title: "生活碎片", sub: "拼凑起来，就是你的故事" },
  { emoji: "✨", title: "值得记住的", sub: "这一刻，你在认真生活" },
  { emoji: "🦋", title: "写给自己", sub: "让感受流淌在文字里" },
];

interface CompletionPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (photo?: string, note?: string) => void;
}

const CompletionPhotoDialog = ({ open, onOpenChange, taskTitle, onConfirm }: CompletionPhotoDialogProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const message = useMemo(() => MOMENT_MESSAGES[Math.floor(Math.random() * MOMENT_MESSAGES.length)], [open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    onConfirm(photo || undefined, note || undefined);
    setPhoto(null);
    setNote("");
  };

  const handleSkip = () => {
    onConfirm(undefined, undefined);
    setPhoto(null);
    setNote("");
  };

  const hasContent = photo || note.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-sm p-0 gap-0 overflow-hidden">
        {/* Gentle header */}
        <div className="px-5 pt-6 pb-2 text-center">
          <div className="text-3xl mb-1.5">{message.emoji}</div>
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-lg font-serif text-foreground">{message.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {message.sub}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2.5 px-3 py-1.5 rounded-full bg-muted/50 inline-block">
            <span className="text-xs text-foreground/70">{taskTitle}</span>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-3">
          {/* 随笔优先 — 核心区域 */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="此刻你在想什么？感受到了什么？"
            className="w-full h-28 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-muted/30 transition-all leading-relaxed"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          {photo ? (
            <div className="relative rounded-xl overflow-hidden animate-fade-in">
              <img src={photo} alt="此刻" className="w-full h-40 object-cover rounded-xl" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X size={14} className="text-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl border border-dashed border-border/40 flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/60 transition-all active:scale-[0.98]"
            >
              <Camera size={16} />
              <span className="text-xs">配一张照片</span>
            </button>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
            >
              直接完成
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                hasContent
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {hasContent ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles size={14} />
                  记录下来
                </span>
              ) : "完成"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionPhotoDialog;
