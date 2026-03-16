import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n, type Language } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, getDay, getDaysInMonth } from "date-fns";

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
  // Calendar data for journal-style poster
  calendarData?: {
    year: number;
    month: number; // 0-indexed
    monthName: string;
    completedDates: Set<string>;
    taskDates?: Set<string>;
    themeColor?: { h: number; s: number; l: number } | null;
  };
}

const POSTER_W = 1080;
const POSTER_H = 1920;

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];

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

const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

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

// Draw paper texture
function drawPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Base cream color
  ctx.fillStyle = "#F5F0E8";
  ctx.fillRect(0, 0, w, h);

  // Subtle noise grain for paper feel
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    pixels[i] = Math.min(255, Math.max(0, pixels[i] + n));
    pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + n));
    pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + n - 2));
  }
  ctx.putImageData(imageData, 0, 0);
}

// Draw mini calendar grid
function drawCalendarGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  year: number,
  month: number,
  completedDates: Set<string>,
  taskDates: Set<string> | undefined,
  themeColor: { h: number; s: number; l: number } | null | undefined,
  lang: Language,
) {
  const firstDay = startOfMonth(new Date(year, month));
  const startDow = getDay(firstDay);
  const daysInMonth = getDaysInMonth(firstDay);

  const cellSize = 42;
  const gap = 4;
  const gridW = 7 * (cellSize + gap) - gap;

  // Accent color from theme
  const accentH = themeColor?.h ?? 120;
  const accentS = themeColor ? Math.min(themeColor.s + 10, 55) : 25;
  const accentL = themeColor ? Math.max(themeColor.l - 5, 35) : 40;
  const accentColor = `hsl(${accentH}, ${accentS}%, ${accentL}%)`;
  const accentLightBg = `hsla(${accentH}, ${Math.min(accentS, 20)}%, ${Math.min(accentL + 35, 88)}%, 0.6)`;

  // Weekday headers
  const labels = lang === "zh" ? WEEKDAY_LABELS : WEEKDAY_LABELS_EN;
  ctx.font = `500 20px 'Noto Sans SC', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let d = 0; d < 7; d++) {
    const cx = x + d * (cellSize + gap) + cellSize / 2;
    ctx.fillStyle = "rgba(100,95,85,0.4)";
    ctx.fillText(labels[d], cx, y);
  }

  // Day cells
  let curY = y + 36;
  let col = startDow;
  ctx.font = `600 22px 'Noto Sans SC', sans-serif`;

  for (let day = 1; day <= daysInMonth; day++) {
    const cx = x + col * (cellSize + gap) + cellSize / 2;
    const cy = curY + cellSize / 2;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isCompleted = completedDates.has(dateStr);
    const hasTask = taskDates?.has(dateStr) ?? false;

    if (isCompleted) {
      // Filled circle with accent color
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.75;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(String(day), cx, cy + 1);
    } else if (hasTask) {
      // Light bg circle
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = accentLightBg;
      ctx.fill();
      ctx.fillStyle = "rgba(80,75,65,0.6)";
      ctx.fillText(String(day), cx, cy + 1);
    } else {
      ctx.fillStyle = "rgba(80,75,65,0.45)";
      ctx.fillText(String(day), cx, cy + 1);
    }

    col++;
    if (col >= 7) { col = 0; curY += cellSize + gap; }
  }

  return { gridW, gridH: curY + cellSize - y };
}

async function generatePoster(
  story: SharePosterDialogProps["story"],
  periodLabel: string,
  photos: string[],
  displayName: string,
  lang: Language,
  calendarData?: SharePosterDialogProps["calendarData"],
): Promise<string> {
  const handFont = HANDWRITING_FONTS[lang];
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d")!;

  const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2B50}\u{2728}\u{270A}-\u{270D}\u{2764}]/gu, "").replace(/\s{2,}/g, " ").trim();

  const hasPhotos = photos.length > 0;
  const hasCal = !!calendarData;

  // Accent color
  const tc = calendarData?.themeColor;
  const accentH = tc?.h ?? 120;
  const accentS = tc ? Math.min(tc.s + 10, 55) : 25;
  const accentL = tc ? Math.max(tc.l - 5, 40) : 40;
  const accentColor = `hsl(${accentH}, ${accentS}%, ${accentL}%)`;

  // Layout: calculate highlights height to determine top section size dynamically
  const highlights = story.highlights.slice(0, 4).map(h => stripEmoji(h));

  const marginX = 80;
  const contentW = POSTER_W - marginX * 2;

  // === Measure content to compute top section height ===
  // Month name + year: ~140px, highlights: ~50px each, padding: ~80px
  const calGridH = 280; // approximate calendar height
  const highlightsH = highlights.length * 58 + 20;
  const monthHeaderH = 140;
  const topPadding = 80;
  const bottomPad = 40;
  const minTopH = topPadding + Math.max(monthHeaderH + highlightsH, calGridH + 30) + bottomPad;
  const topSectionH = hasPhotos ? Math.min(Math.max(minTopH, 520), Math.round(POSTER_H * 0.42)) : POSTER_H;
  const photoSectionH = hasPhotos ? POSTER_H - topSectionH : 0;

  // === TOP SECTION: Paper texture ===
  drawPaperTexture(ctx, POSTER_W, topSectionH);

  // Month name - large handwriting, top-left
  let curY = topPadding;
  const monthLabel = hasCal
    ? (lang === "zh" ? calendarData.monthName : MONTH_EN[calendarData.month])
    : periodLabel;

  ctx.font = `700 100px ${handFont}`;
  ctx.fillStyle = accentColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(monthLabel, marginX, curY);

  // Year - smaller, right after month name on same line or just below
  if (hasCal) {
    curY += 110;
    ctx.font = `300 28px 'Noto Sans SC', sans-serif`;
    ctx.fillStyle = "rgba(80,75,65,0.4)";
    ctx.fillText(String(calendarData.year), marginX + 4, curY);
    curY += 44;
  } else {
    curY += 120;
  }

  // Calendar grid - right side, anchored to right margin
  if (hasCal) {
    const calGridW = 7 * (36 + 3) - 3; // matches cellSize+gap in drawCalendarGrid
    const calX = POSTER_W - marginX - calGridW;
    drawCalendarGrid(
      ctx, calX, topPadding + 10,
      calendarData.year, calendarData.month,
      calendarData.completedDates,
      calendarData.taskDates,
      calendarData.themeColor,
      lang,
    );
  }

  // Highlights - left column, below year
  const highlightMaxW = hasCal ? contentW * 0.55 : contentW;

  ctx.textBaseline = "alphabetic";
  if (highlights.length > 0) {
    const hlSize = 42;
    ctx.font = `400 ${hlSize}px ${handFont}`;

    for (const h of highlights) {
      if (curY > topSectionH - 60) break;

      // ✽ marker
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.7;
      ctx.fillText("✽", marginX, curY + hlSize);
      ctx.globalAlpha = 1;

      // Text
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.85;
      const hLines = wrapText(ctx, h, highlightMaxW - 60);
      for (const hl of hLines) {
        ctx.fillText(hl, marginX + 52, curY + hlSize);
        curY += hlSize + 14;
      }
      ctx.globalAlpha = 1;
      curY += 8;
    }
  }

  // === BOTTOM SECTION: Photo ===
  if (hasPhotos && photoSectionH > 0) {
    try {
      const heroImg = await loadImage(photos[0]);
      // Cover-fit the photo
      const imgRatio = heroImg.width / heroImg.height;
      const sectionRatio = POSTER_W / photoSectionH;
      let sx = 0, sy = 0, sw = heroImg.width, sh = heroImg.height;
      if (imgRatio > sectionRatio) {
        sw = heroImg.height * sectionRatio;
        sx = (heroImg.width - sw) / 2;
      } else {
        sh = heroImg.width / sectionRatio;
        sy = (heroImg.height - sh) / 2;
      }
      ctx.drawImage(heroImg, sx, sy, sw, sh, 0, topSectionH, POSTER_W, photoSectionH);

      // Small stacked photos in bottom-right corner
      if (photos.length > 1) {
        const smallPhotos = photos.slice(1, 4);
        const smallSize = 160;
        const startX = POSTER_W - marginX - smallSize;
        const startY = POSTER_H - 280;

        for (let i = 0; i < smallPhotos.length; i++) {
          try {
            const smallImg = await loadImage(smallPhotos[i]);
            const px = startX - i * 20;
            const py = startY - i * (smallSize + 16);
            const rot = (i % 2 === 0 ? 3 : -2) * Math.PI / 180;

            ctx.save();
            ctx.translate(px + smallSize / 2, py + smallSize / 2);
            ctx.rotate(rot);

            // White border
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = "rgba(0,0,0,0.2)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            roundRect(ctx, -smallSize / 2 - 6, -smallSize / 2 - 6, smallSize + 12, smallSize + 12, 8);
            ctx.fill();
            ctx.shadowColor = "transparent";

            // Photo
            roundRect(ctx, -smallSize / 2, -smallSize / 2, smallSize, smallSize, 4);
            ctx.clip();
            const sImgRatio = smallImg.width / smallImg.height;
            let ssx = 0, ssy = 0, ssw = smallImg.width, ssh = smallImg.height;
            if (sImgRatio > 1) { ssw = smallImg.height; ssx = (smallImg.width - ssw) / 2; }
            else { ssh = smallImg.width; ssy = (smallImg.height - ssh) / 2; }
            ctx.drawImage(smallImg, ssx, ssy, ssw, ssh, -smallSize / 2, -smallSize / 2, smallSize, smallSize);

            ctx.restore();
          } catch { /* skip */ }
        }
      }
    } catch {
      // Photo load failed, fill with gradient
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, topSectionH, POSTER_W, photoSectionH);
      ctx.globalAlpha = 1;
    }
  }

  // === USER NICKNAME BADGE at bottom center ===
  const badgeText = displayName.toUpperCase();
  ctx.font = `700 28px 'Noto Sans SC', sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + 48;
  const badgeH = 50;
  const badgeX = (POSTER_W - badgeW) / 2;
  const badgeY = POSTER_H - 90;

  // Badge background
  ctx.fillStyle = "rgba(30,30,25,0.65)";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();

  // Badge text
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, POSTER_W / 2, badgeY + badgeH / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  return canvas.toDataURL("image/png");
}

const SharePosterDialog = ({ open, onClose, story, periodLabel, timeRange, photos, calendarData }: SharePosterDialogProps) => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [displayName, setDisplayName] = useState("探索者");
  const posterRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setPosterUrl(null);
    try {
      const url = await generatePoster(story, periodLabel, photos, displayName, lang, calendarData);
      setPosterUrl(url);
    } catch (e) {
      console.error("Poster generation failed:", e);
      toast.error("海报生成失败");
    } finally {
      setGenerating(false);
    }
  }, [story, periodLabel, photos, displayName, lang, calendarData]);

  useEffect(() => {
    if (open) handleGenerate();
  }, [open]);

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
          <span className="text-sm font-medium text-foreground">分享海报</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/40 transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
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
