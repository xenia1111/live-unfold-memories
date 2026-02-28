import { useState, useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface CompletionPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (photo?: string) => void;
}

const CompletionPhotoDialog = ({ open, onOpenChange, taskTitle, onConfirm }: CompletionPhotoDialogProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-sm p-0 gap-0">
        <DialogHeader className="p-5 pb-2 text-center">
          <DialogTitle className="text-lg font-serif text-foreground">🎉 做到了！</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            「{taskTitle}」已完成，拍张照记录这一刻吧
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          {photo ? (
            <div className="relative rounded-xl overflow-hidden">
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
              className="w-full h-40 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 text-primary/60 hover:border-primary/50 hover:text-primary/80 transition-all bg-muted/30"
            >
              <Camera size={32} />
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {photo ? "保存打卡 ✨" : "直接完成"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionPhotoDialog;
