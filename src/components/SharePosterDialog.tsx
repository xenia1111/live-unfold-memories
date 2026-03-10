import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n, type Language } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SharePosterDialogProps {
  open: boolean;
  onClose: () => void;
  story: {
    emoji: string;
    title: string;
    openingLine: string;
    summary: string;
    highlights: string[];
    mood: string;
  };
  periodLabel: string;
  timeRange: string;
  photos: string[];
}

type TemplateId = "photo-grid" | "photo-blur" | "text-only";

interface Template {
  id: TemplateId;
  name: string;
  icon: string;
  hasPhotos: boolean;
}

const TEMPLATES: Template[] = [
  { id: "photo-grid", name: "拼图", icon: "🖼️", hasPhotos: true },
  { id: "photo-blur", name: "光影", icon: "✨", hasPhotos: true },
  { id: "text-only", name: "纯文字", icon: "📝", hasPhotos: false },
];

const POSTER_W = 1080;
const POSTER_H = 1920;

// Language-aware handwriting fonts
const HANDWRITING_FONTS: Record<Language, string> = {
  zh: "'Ma Shan Zheng', cursive",
  en: "'Caveat', cursive",
  fr: "'Caveat', cursive",
  es: "'Caveat', cursive",
  ja: "'Yuji Syuku', serif",
};

const BODY_FONTS: Record<Language, string> = {
  zh: "'Noto Sans SC', sans-serif",
  en: "'Noto Sans SC', sans-serif",
  fr: "'Noto Sans SC', sans-serif",
  es: "'Noto Sans SC', sans-serif",
  ja: "'Yuji Syuku', 'Noto Sans SC', sans-serif",
};

// Load image helper
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// Wrap text helper
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = "";
  for (const char of text) {
    const test = currentLine + char;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Draw rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Draw photo grid on canvas
async function drawPhotoGrid(ctx: CanvasRenderingContext2D, photos: string[], x: number, y: number, w: number, h: number, gap: number) {
  const count = Math.min(photos.length, 9);
  if (count === 0) return;

  const imgs: HTMLImageElement[] = [];
  for (const p of photos.slice(0, count)) {
    try { imgs.push(await loadImage(p)); } catch { /* skip */ }
  }
  if (imgs.length === 0) return;

  let cells: { cx: number; cy: number; cw: number; ch: number }[] = [];

  if (imgs.length === 1) {
    cells = [{ cx: x, cy: y, cw: w, ch: h }];
  } else if (imgs.length === 2) {
    const cw = (w - gap) / 2;
    cells = [{ cx: x, cy: y, cw, ch: h }, { cx: x + cw + gap, cy: y, cw, ch: h }];
  } else if (imgs.length <= 4) {
    const cols = 2;
    const rows = Math.ceil(imgs.length / cols);
    const cw = (w - gap * (cols - 1)) / cols;
    const ch2 = (h - gap * (rows - 1)) / rows;
    for (let i = 0; i < imgs.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      cells.push({ cx: x + col * (cw + gap), cy: y + row * (ch2 + gap), cw, ch: ch2 });
    }
  } else {
    const cols = 3;
    const rows = Math.ceil(imgs.length / cols);
    const cw = (w - gap * (cols - 1)) / cols;
    const ch2 = (h - gap * (rows - 1)) / rows;
    for (let i = 0; i < imgs.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      cells.push({ cx: x + col * (cw + gap), cy: y + row * (ch2 + gap), cw, ch: ch2 });
    }
  }

  for (let i = 0; i < imgs.length; i++) {
    const { cx, cy, cw, ch } = cells[i];
    const img = imgs[i];
    ctx.save();
    roundRect(ctx, cx, cy, cw, ch, 20);
    ctx.clip();
    // Cover fit
    const imgRatio = img.width / img.height;
    const cellRatio = cw / ch;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (imgRatio > cellRatio) { sw = img.height * cellRatio; sx = (img.width - sw) / 2; }
    else { sh = img.width / cellRatio; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cw, ch);
    ctx.restore();
  }
}

async function generatePoster(
  template: TemplateId,
  story: SharePosterDialogProps["story"],
  periodLabel: string,
  timeRange: string,
  photos: string[],
  displayName: string,
  lang: Language,
): Promise<string> {
  const handFont = HANDWRITING_FONTS[lang];
  const bodyFont = BODY_FONTS[lang];
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d")!;
  const pad = 80;
  const contentW = POSTER_W - pad * 2;

  // Background
  ctx.fillStyle = "#0B0B0D";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // Subtle glow effects
  const glow = ctx.createRadialGradient(200, 400, 50, 200, 400, 700);
  glow.addColorStop(0, "rgba(140, 220, 60, 0.07)");
  glow.addColorStop(1, "rgba(140, 220, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  const glow2 = ctx.createRadialGradient(POSTER_W - 200, POSTER_H - 400, 50, POSTER_W - 200, POSTER_H - 400, 600);
  glow2.addColorStop(0, "rgba(140, 220, 60, 0.04)");
  glow2.addColorStop(1, "rgba(140, 220, 60, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // --- Pre-calculate content blocks to distribute evenly ---
  const usablePhotos = (template !== "text-only") ? photos.slice(0, 9) : [];
  const hasPhotos = usablePhotos.length > 0;

  // Measure all text blocks
  const titleSize = hasPhotos ? 72 : 88;
  const openingSize = hasPhotos ? 42 : 50;
  const summarySize = hasPhotos ? 40 : 48;
  const highlightSize = hasPhotos ? 36 : 42;

  ctx.font = `700 ${titleSize}px ${handFont}`;
  const titleLines = wrapText(ctx, story.title, contentW);
  ctx.font = `italic ${openingSize}px ${handFont}`;
  const olLines = wrapText(ctx, `"${story.openingLine}"`, contentW);
  ctx.font = `400 ${summarySize}px ${handFont}`;
  const summaryLines = wrapText(ctx, story.summary, contentW);
  ctx.font = `400 ${highlightSize}px ${handFont}`;
  const highlightLines: string[] = [];
  for (const h of story.highlights.slice(0, 4)) {
    highlightLines.push(...wrapText(ctx, `✦ ${h}`, contentW));
  }

  // Calculate total content height
  const headerH = 80; // period + username
  const emojiH = 100;
  const titleH = titleLines.length * (titleSize + 12);
  const openingH = olLines.length * (openingSize + 10);
  const photoH = hasPhotos ? (usablePhotos.length <= 2 ? 420 : usablePhotos.length <= 4 ? 520 : 620) : 0;
  const summaryH = summaryLines.length * (summarySize + 14);
  const highlightH = highlightLines.length * (highlightSize + 10);
  const moodH = 40;
  const footerH = 100;

  const totalContentH = headerH + emojiH + titleH + openingH + photoH + summaryH + highlightH + moodH + footerH;
  const availableH = POSTER_H - pad * 2;
  const extraSpace = Math.max(0, availableH - totalContentH);

  // Distribute extra space as gaps between sections
  const sectionCount = hasPhotos ? 7 : 6;
  const gap = Math.min(extraSpace / sectionCount, 80); // cap gap

  let curY = pad + 50;

  // === HEADER: Period + Username ===
  ctx.font = `500 34px ${bodyFont}`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText(`${periodLabel} · ${timeRange}`, pad, curY);
  ctx.font = `400 30px ${bodyFont}`;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "right";
  ctx.fillText(`@${displayName}`, POSTER_W - pad, curY);
  ctx.textAlign = "left";
  curY += headerH + gap;

  // === EMOJI ===
  ctx.font = `${hasPhotos ? 80 : 100}px sans-serif`;
  ctx.fillText(story.emoji, pad, curY + 70);
  curY += emojiH + gap * 0.3;

  // === TITLE ===
  ctx.font = `700 ${titleSize}px ${handFont}`;
  ctx.fillStyle = "#8CDC3C";
  for (const line of titleLines) {
    ctx.fillText(line, pad, curY);
    curY += titleSize + 12;
  }
  curY += gap * 0.6;

  // === OPENING LINE ===
  ctx.font = `italic ${openingSize}px ${handFont}`;
  ctx.fillStyle = "rgba(140, 220, 60, 0.65)";
  for (const line of olLines) {
    ctx.fillText(line, pad, curY);
    curY += openingSize + 10;
  }
  curY += gap;

  // === PHOTOS ===
  if (hasPhotos) {
    if (template === "photo-blur") {
      try {
        const bgImg = await loadImage(usablePhotos[0]);
        ctx.save();
        roundRect(ctx, pad, curY, contentW, photoH, 24);
        ctx.clip();
        ctx.filter = "blur(20px) brightness(0.4)";
        ctx.drawImage(bgImg, pad - 40, curY - 40, contentW + 80, photoH + 80);
        ctx.filter = "none";
        ctx.restore();
        const innerPad = 30;
        await drawPhotoGrid(ctx, usablePhotos, pad + innerPad, curY + innerPad, contentW - innerPad * 2, photoH - innerPad * 2, 12);
      } catch {
        await drawPhotoGrid(ctx, usablePhotos, pad, curY, contentW, photoH, 12);
      }
    } else {
      await drawPhotoGrid(ctx, usablePhotos, pad, curY, contentW, photoH, 12);
    }
    curY += photoH + gap;
  }

  // === SUMMARY ===
  ctx.font = `400 ${summarySize}px ${handFont}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const lineHeight = summarySize + 14;
  for (const line of summaryLines) {
    if (curY > POSTER_H - 300) break;
    ctx.fillText(line, pad, curY);
    curY += lineHeight;
  }
  curY += gap * 0.8;

  // === HIGHLIGHTS ===
  if (highlightLines.length > 0 && curY < POSTER_H - 250) {
    // Divider
    ctx.strokeStyle = "rgba(140, 220, 60, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, curY - gap * 0.3);
    ctx.lineTo(pad + 200, curY - gap * 0.3);
    ctx.stroke();

    ctx.font = `400 ${highlightSize}px ${handFont}`;
    ctx.fillStyle = "rgba(140, 220, 60, 0.65)";
    for (const line of highlightLines) {
      if (curY > POSTER_H - 180) break;
      ctx.fillText(line, pad, curY);
      curY += highlightSize + 10;
    }
  }

  // === MOOD (bottom area) ===
  ctx.font = `500 32px ${bodyFont}`;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText(`💭 ${story.mood}`, pad, POSTER_H - 130);

  // === FOOTER ===
  ctx.strokeStyle = "rgba(140, 220, 60, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, POSTER_H - 95);
  ctx.lineTo(POSTER_W - pad, POSTER_H - 95);
  ctx.stroke();

  ctx.font = `400 26px ${bodyFont}`;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.textAlign = "right";
  ctx.fillText("Unfold · 展开你的生活", POSTER_W - pad, POSTER_H - 55);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

const SharePosterDialog = ({ open, onClose, story, periodLabel, timeRange, photos }: SharePosterDialogProps) => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(photos.length > 0 ? "photo-grid" : "text-only");
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [displayName, setDisplayName] = useState("探索者");
  const posterRef = useRef<HTMLImageElement>(null);

  // Load display name
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  // Filter templates: hide photo templates if no photos
  const availableTemplates = photos.length > 0 ? TEMPLATES : TEMPLATES.filter(t => !t.hasPhotos);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setPosterUrl(null);
    try {
      const url = await generatePoster(selectedTemplate, story, periodLabel, timeRange, photos, displayName, lang);
      setPosterUrl(url);
    } catch (e) {
      console.error("Poster generation failed:", e);
      toast.error("海报生成失败");
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, story, periodLabel, timeRange, photos, displayName]);

  // Auto-generate when template changes
  useEffect(() => {
    if (open) handleGenerate();
  }, [open, selectedTemplate]);

  const handleDownload = useCallback(() => {
    if (!posterUrl) return;
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = `unfold-${periodLabel}-${Date.now()}.png`;
    a.click();
    toast.success("已保存到相册");
  }, [posterUrl, periodLabel]);

  const handleShare = useCallback(async () => {
    if (!posterUrl) return;
    try {
      const res = await fetch(posterUrl);
      const blob = await res.blob();
      const file = new File([blob], "unfold-poster.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: story.title });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  }, [posterUrl, story.title, handleDownload]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-sm mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-foreground">选择模板</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/40 transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Template selector */}
        <div className="flex gap-2 px-4 pb-3">
          {availableTemplates.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all border",
                selectedTemplate === tmpl.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-card/60 border-border/30 text-muted-foreground hover:border-primary/20"
              )}
            >
              <span className="text-lg">{tmpl.icon}</span>
              <span>{tmpl.name}</span>
              {selectedTemplate === tmpl.id && <Check size={12} className="text-primary" />}
            </button>
          ))}
        </div>

        {/* Poster preview */}
        <div className="flex-1 overflow-y-auto px-4 pb-3">
          <div className="rounded-2xl overflow-hidden bg-card/30 border border-border/20">
            {generating ? (
              <div className="aspect-[9/16] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">生成海报中...</span>
                </div>
              </div>
            ) : posterUrl ? (
              <img ref={posterRef} src={posterUrl} alt="Share poster" className="w-full" />
            ) : (
              <div className="aspect-[9/16] flex items-center justify-center">
                <span className="text-xs text-muted-foreground">点击生成</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 pb-4 pt-2">
          <button onClick={handleDownload} disabled={!posterUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border/30 text-foreground text-sm font-medium disabled:opacity-40 hover:bg-muted/40 transition-all active:scale-[0.98]">
            <Download size={16} /><span>保存</span>
          </button>
          <button onClick={handleShare} disabled={!posterUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-all active:scale-[0.98]">
            <Share2 size={16} /><span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePosterDialog;
