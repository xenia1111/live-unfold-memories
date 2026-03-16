/**
 * Extract the dominant color from an image URL using canvas sampling.
 * Returns an HSL string for easy integration with CSS.
 */
export function extractDominantColor(imageUrl: string): Promise<{ h: number; s: number; l: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64; // sample at low res for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Simple color bucketing to find dominant color
        const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue; // skip transparent

          // Quantize to reduce noise (bucket by 32)
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;

          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
          buckets[key].count++;
        }

        // Score each bucket: prioritize vibrant, saturated colors over dull grays
        let best: { r: number; g: number; b: number; count: number } | null = null;
        let bestScore = -1;
        for (const b of Object.values(buckets)) {
          const avgR = b.r / b.count, avgG = b.g / b.count, avgB = b.b / b.count;
          const brightness = (avgR + avgG + avgB) / 3;
          // Skip near-white and near-black
          if (brightness > 230 || brightness < 25) continue;

          // Calculate saturation: higher spread between RGB channels = more vivid
          const maxC = Math.max(avgR, avgG, avgB);
          const minC = Math.min(avgR, avgG, avgB);
          const chroma = maxC - minC; // 0-255, higher = more colorful

          // Score = chroma weight (vibrance) + modest count weight
          // Strongly favor vivid colors even if they're not the largest bucket
          const score = (chroma * 3) + Math.sqrt(b.count);

          if (score > bestScore) { bestScore = score; best = b; }
        }

        if (!best) {
          // Fallback: just use most frequent regardless
          for (const b of Object.values(buckets)) {
            if (!best || b.count > best.count) best = b;
          }
        }

        if (!best) { resolve(null); return; }

        const avgR = best.r / best.count;
        const avgG = best.g / best.count;
        const avgB = best.b / best.count;

        const hsl = rgbToHsl(avgR, avgG, avgB);
        resolve(hsl);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Convert HSL to a CSS color string with optional adjustments */
export function hslToString(hsl: { h: number; s: number; l: number }, opts?: { s?: number; l?: number; a?: number }): string {
  const s = opts?.s ?? hsl.s;
  const l = opts?.l ?? hsl.l;
  const a = opts?.a;
  if (a !== undefined) {
    return `hsla(${hsl.h}, ${s}%, ${l}%, ${a})`;
  }
  return `hsl(${hsl.h}, ${s}%, ${l}%)`;
}
