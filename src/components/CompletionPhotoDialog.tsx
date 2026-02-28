import { useState, useRef, useMemo } from "react";
import { Camera, X, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const CELEBRATION_MESSAGES = [
  { title: "太棒了！🎉", sub: "你做到了，给自己一个拥抱吧" },
  { title: "了不起！✨", sub: "又完成了一件事，你在发光" },
  { title: "厉害啊！🔥", sub: "这份坚持，未来的你会感谢" },
  { title: "好样的！💪", sub: "每一步都在让生活更精彩" },
  { title: "漂亮！🌟", sub: "这就是鲜活的生命力" },
  { title: "完美！🦋", sub: "又一个美好的瞬间被你创造了" },
];

interface CompletionPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (photo?: string) => void;
}

const CompletionPhotoDialog = ({ open, onOpenChange, taskTitle, onConfirm }: CompletionPhotoDialogProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const message = useMemo(() => CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)], [open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    onConfirm(photo || undefined);
    setPhoto(null);
  };

  const handleSkip = () => {
    onConfirm(undefined);
    setPhoto(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-sm p-0 gap-0 overflow-hidden">
        {/* Celebration header */}
        <div className="relative px-5 pt-6 pb-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="relative">
            <div className="text-4xl mb-2 animate-bounce-in">
              <PartyPopper className="inline-block text-primary" size={40} />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-serif text-foreground">{message.title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {message.sub}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 px-3 py-1.5 rounded-full bg-muted/60 inline-block">
              <span className="text-xs text-foreground/80 font-medium">✅ {taskTitle}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <p className="text-xs text-center text-muted-foreground">拍张照记录这一刻吧 📸</p>
          
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
              <img src={photo} alt="打卡" className="w-full h-48 object-cover rounded-xl" />
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
              className="w-full h-36 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 text-primary/60 hover:border-primary/50 hover:text-primary/80 transition-all bg-muted/30 active:scale-[0.98]"
            >
              <Camera size={28} />
              <span className="text-sm font-medium">拍照 / 选择照片</span>
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-muted text-muted-foreground active:scale-[0.98] transition-all"
            >
              跳过
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                photo
                  ? "gradient-warm text-primary-foreground shadow-md"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {photo ? "保存打卡 ✨" : "直接完成 ✓"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionPhotoDialog;
