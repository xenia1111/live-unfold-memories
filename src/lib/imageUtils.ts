export function removeWhiteBackground(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const getIdx = (x: number, y: number) => (y * canvas.width + x) * 4;
      
      const isWhite = (x: number, y: number) => {
        const i = getIdx(x, y);
        // Already transparent or mostly transparent
        if (data[i+3] < 10) return true; 
        // White or near white
        return data[i] > 230 && data[i+1] > 230 && data[i+2] > 230;
      };

      const stack: [number, number][] = [
        [0, 0], [canvas.width - 1, 0], 
        [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
      ];
      
      const visited = new Set<number>();

      while(stack.length > 0) {
        const [x, y] = stack.pop()!;
        const key = y * canvas.width + x;
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        if (visited.has(key)) continue;
        
        visited.add(key);
        
        if (isWhite(x, y)) {
          const i = getIdx(x, y);
          data[i+3] = 0; // make transparent
          
          stack.push([x+1, y]);
          stack.push([x-1, y]);
          stack.push([x, y+1]);
          stack.push([x, y-1]);
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}