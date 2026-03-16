import { useState, useRef, useMemo } from "react";
import { Camera, X, Sparkles, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { uploadTaskPhoto, dataUrlToFile } from "@/lib/uploadPhoto";
import { toast } from "sonner";

interface CompletionPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (photo?: string, note?: string) => void;
}

const CompletionPhotoDialog = ({ open, onOpenChange, taskTitle, onConfirm }: CompletionPhotoDialogProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MOMENT_EMOJIS = ["🌿", "☀️", "🍃", "🌸", "✨", "🦋"];
  const message = useMemo(() => {
    const i = Math.floor(Math.random() * 6);
    return { emoji: MOMENT_EMOJIS[i], title: t(`moment.${i}.title`), sub: t(`moment.${i}.sub`) };
  }, [open, t]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    let photoUrl: string | undefined;
    if (photo && user) {
      try {
        setUploading(true);
        const file = dataUrlToFile(photo);
        photoUrl = await uploadTaskPhoto(user.id, file);
      } catch (e) {
        console.error("Upload failed:", e);
        toast.error(t("complete.uploadFailed"));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onConfirm(photoUrl, note || undefined);
    setPhoto(null);
    setNote("");
  };
  const handleSkip = () => { onConfirm(undefined, undefined); setPhoto(null); setNote(""); };
  const hasContent = photo || note.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/50 bg-card max-w-[92vw] sm:max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-5 pt-6 pb-2 text-center">
          <div className="text-3xl mb-1.5">{message.emoji}</div>
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-lg font-serif text-foreground">{message.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">{message.sub}</DialogDescription>
          </DialogHeader>
          <div className="mt-2.5 px-3 py-1.5 rounded-full bg-muted/50 inline-block">
            <span className="text-xs text-foreground/70">{taskTitle}</span>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("complete.notePlaceholder")}
            className="w-full h-28 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-muted/30 transition-all leading-relaxed" />

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          {photo ? (
            <div className="relative rounded-xl overflow-hidden animate-fade-in">
              <img src={photo} alt="" className="w-full h-40 object-cover rounded-xl" />
              <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                <X size={14} className="text-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => cameraInputRef.current?.click()} className="flex-1 py-3 rounded-xl border border-dashed border-border/40 flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/60 transition-all active:scale-[0.98]">
                <Camera size={16} />
                <span className="text-xs">{t("complete.takePhoto")}</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-xl border border-dashed border-border/40 flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/60 transition-all active:scale-[0.98]">
                <ImagePlus size={16} />
                <span className="text-xs">{t("complete.fromAlbum")}</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleSkip} disabled={uploading} className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">{t("complete.skip")}</button>
            <button onClick={handleConfirm} disabled={uploading} className={cn("flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]", hasContent && !uploading ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground")}>
              {uploading ? (<span className="flex items-center justify-center gap-1.5"><Loader2 size={14} className="animate-spin" />{t("complete.uploading")}</span>) : hasContent ? (<span className="flex items-center justify-center gap-1.5"><Sparkles size={14} />{t("complete.record")}</span>) : t("complete.done")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionPhotoDialog;
