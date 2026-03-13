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
  { id: "photo-grid", name: "拼图", icon: "", hasPhotos: true },
  { id: "photo-blur", name: "光影", icon: "", hasPhotos: true },
  { id: "text-only", name: "纯文字", icon: "", hasPhotos: false },
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
  const pad = 90;
  const contentW = POSTER_W - pad * 2;

  // === Letter paper background ===
  // Warm cream base
  ctx.fillStyle = "#F5F0E8";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // Paper grain noise texture
  const imageData = ctx.getImageData(0, 0, POSTER_W, POSTER_H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise - 2;
  }
  ctx.putImageData(imageData, 0, 0);

  // Subtle aged edge vignette
  const vignette = ctx.createRadialGradient(POSTER_W / 2, POSTER_H / 2, 300, POSTER_W / 2, POSTER_H / 2, POSTER_W);
  vignette.addColorStop(0, "rgba(245,240,232,0)");
  vignette.addColorStop(1, "rgba(200,190,170,0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // Horizontal ruled lines (letter paper style)
  const lineSpacing = 56;
  const lineStartY = 280;
  ctx.strokeStyle = "rgba(180,170,150,0.2)";
  ctx.lineWidth = 1;
  for (let y = lineStartY; y < POSTER_H - 120; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(pad - 10, y);
    ctx.lineTo(POSTER_W - pad + 10, y);
    ctx.stroke();
  }

  // Left margin line (red, like real letter paper)
  ctx.strokeStyle = "rgba(190,120,100,0.2)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad - 20, 0);
  ctx.lineTo(pad - 20, POSTER_H);
  ctx.stroke();

  // Ink colors
  const inkDark = "#2A2A24";
  const inkGreen = "#2F5E2E";
  const inkGreenLight = "rgba(47,94,46,0.55)";
  const inkGray = "rgba(60,55,45,0.4)";

  // Strip emoji helper
  const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").replace(/\s{2,}/g, " ").trim();

  // --- Pre-calculate content blocks ---
  const usablePhotos = (template !== "text-only") ? photos.slice(0, 9) : [];
  const hasPhotos = usablePhotos.length > 0;

  const titleSize = hasPhotos ? 64 : 76;
  const openingSize = hasPhotos ? 36 : 44;
  const summarySize = hasPhotos ? 34 : 40;
  const highlightSize = hasPhotos ? 32 : 36;

  ctx.font = `700 ${titleSize}px ${handFont}`;
  const titleLines = wrapText(ctx, stripEmoji(story.title), contentW);
  ctx.font = `italic ${openingSize}px ${handFont}`;
  const olLines = wrapText(ctx, `"${stripEmoji(story.openingLine)}"`, contentW - 40);
  ctx.font = `400 ${summarySize}px ${bodyFont}`;
  const summaryLines = wrapText(ctx, stripEmoji(story.summary), contentW);
  ctx.font = `400 ${highlightSize}px ${bodyFont}`;
  const highlightLines: string[] = [];
  for (const h of story.highlights.slice(0, 4)) {
    highlightLines.push(...wrapText(ctx, `· ${stripEmoji(h)}`, contentW - 20));
  }

  // Layout — generous spacing
  const headerH = 80;
  const titleH = titleLines.length * (titleSize + 18);
  const openingH = olLines.length * (openingSize + 16);
  const photoH = hasPhotos ? (usablePhotos.length <= 2 ? 400 : usablePhotos.length <= 4 ? 480 : 560) : 0;
  const summaryH = summaryLines.length * (summarySize + 20);
  const highlightH = highlightLines.length * (highlightSize + 14);
  const footerH = 120;

  const totalContentH = headerH + titleH + openingH + photoH + summaryH + highlightH + footerH;
  const availableH = POSTER_H - pad * 2;
  const extraSpace = Math.max(0, availableH - totalContentH);
  const sectionCount = hasPhotos ? 7 : 6;
  const gap = Math.max(extraSpace / sectionCount, 40);

  let curY = pad + 50;

  // === HEADER ===
  ctx.font = `500 28px ${bodyFont}`;
  ctx.fillStyle = inkGray;
  ctx.fillText(`${periodLabel} · ${timeRange}`, pad, curY);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(60,55,45,0.25)";
  ctx.fillText(`@${displayName}`, POSTER_W - pad, curY);
  ctx.textAlign = "left";
  curY += headerH + gap;

  // === TITLE ===
  ctx.font = `700 ${titleSize}px ${handFont}`;
  ctx.fillStyle = inkGreen;
  for (const line of titleLines) {
    ctx.fillText(line, pad, curY);
    curY += titleSize + 18;
  }
  curY += gap;

  // === OPENING LINE ===
  ctx.fillStyle = inkGreenLight;
  roundRect(ctx, pad, curY - openingSize + 6, 3, olLines.length * (openingSize + 16), 2);
  ctx.fill();

  ctx.font = `italic ${openingSize}px ${handFont}`;
  ctx.fillStyle = inkGreenLight;
  for (const line of olLines) {
    ctx.fillText(line, pad + 22, curY);
    curY += openingSize + 16;
  }
  curY += gap * 1.2;

  // === PHOTOS ===
  if (hasPhotos) {
    // Add subtle shadow behind photo area
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#F5F0E8";
    roundRect(ctx, pad, curY, contentW, photoH, 16);
    ctx.fill();
    ctx.restore();

    if (template === "photo-blur") {
      try {
        const bgImg = await loadImage(usablePhotos[0]);
        ctx.save();
        roundRect(ctx, pad, curY, contentW, photoH, 16);
        ctx.clip();
        ctx.filter = "blur(20px) brightness(0.6) saturate(0.8)";
        ctx.drawImage(bgImg, pad - 40, curY - 40, contentW + 80, photoH + 80);
        ctx.filter = "none";
        ctx.restore();
        const innerPad = 24;
        await drawPhotoGrid(ctx, usablePhotos, pad + innerPad, curY + innerPad, contentW - innerPad * 2, photoH - innerPad * 2, 10);
      } catch {
        await drawPhotoGrid(ctx, usablePhotos, pad, curY, contentW, photoH, 10);
      }
    } else {
      await drawPhotoGrid(ctx, usablePhotos, pad, curY, contentW, photoH, 10);
    }
    curY += photoH + gap;
  }

  // === SUMMARY (body text, dark ink) ===
  ctx.font = `400 ${summarySize}px ${bodyFont}`;
  ctx.fillStyle = inkDark;
  const sLineH = summarySize + 16;
  for (const line of summaryLines) {
    if (curY > POSTER_H - 280) break;
    ctx.fillText(line, pad, curY);
    curY += sLineH;
  }
  curY += gap * 0.7;

  // === HIGHLIGHTS ===
  if (highlightLines.length > 0 && curY < POSTER_H - 220) {
    // Small decorative leaf/dot
    ctx.fillStyle = inkGreenLight;
    ctx.beginPath();
    ctx.arc(pad + 4, curY - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `400 ${highlightSize}px ${bodyFont}`;
    ctx.fillStyle = inkGreen;
    for (const line of highlightLines) {
      if (curY > POSTER_H - 160) break;
      ctx.fillText(line, pad, curY);
      curY += highlightSize + 12;
    }
  }

  // === MOOD tag ===
  if (curY < POSTER_H - 160) {
    ctx.font = `500 28px ${bodyFont}`;
    ctx.fillStyle = "rgba(47,94,46,0.35)";
    ctx.fillText(story.mood, pad, POSTER_H - 140);
  }

  // === FOOTER ===
  ctx.strokeStyle = "rgba(180,170,150,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, POSTER_H - 100);
  ctx.lineTo(POSTER_W - pad, POSTER_H - 100);
  ctx.stroke();

  ctx.font = `400 24px ${bodyFont}`;
  ctx.fillStyle = "rgba(60,55,45,0.2)";
  ctx.textAlign = "right";
  ctx.fillText("Unfold · 展开你的生活", POSTER_W - pad, POSTER_H - 60);
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
