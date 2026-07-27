/**
 * Adaptive Studio Background Remover (Chroma Key & Edge Alpha Extractor)
 * Samples the border of any product image to find the true background color, then
 * flood-fills connected regions of that color. Only regions large enough to plausibly
 * BE the backdrop (or an enclosed gap, like a necklace's neck-hole) are erased — this
 * keeps small same-colored highlights inside the piece itself (e.g. white/cream beads)
 * from being punched full of holes, which a flat brightness/distance threshold would do.
 */

export function createAdaptiveTransparentImage(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cvs = document.createElement('canvas');
      const w = img.width;
      const h = img.height;
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext('2d');
      if (!ctx) return resolve(imageSrc);

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Si la imagen ya tiene pixeles transparentes (canal alfa), asumimos que
      // ya está recortada y evitamos el algoritmo de eliminación de fondo.
      let alreadyHasAlpha = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 200) {
          alreadyHasAlpha = true;
          break;
        }
      }
      if (alreadyHasAlpha) {
        return resolve(imageSrc);
      }

      // Sample along the full border (not just 5 points) to determine the true
      // background color, robust to gradients/vignettes across the backdrop.
      const samplePoints: Array<[number, number]> = [];
      const step = Math.max(1, Math.floor(Math.min(w, h) / 40));
      for (let x = 0; x < w; x += step) {
        samplePoints.push([x, 0]);
        samplePoints.push([x, h - 1]);
      }
      for (let y = 0; y < h; y += step) {
        samplePoints.push([0, y]);
        samplePoints.push([w - 1, y]);
      }

      let bgR = 0, bgG = 0, bgB = 0;
      samplePoints.forEach(([cx, cy]) => {
        const idx = (cy * w + cx) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / samplePoints.length);
      bgG = Math.round(bgG / samplePoints.length);
      bgB = Math.round(bgB / samplePoints.length);

      const CORE_THRESHOLD = 40; // confidently background-colored
      const EDGE_THRESHOLD = 60; // soft anti-aliased edge band
      const MIN_REGION_SIZE = Math.max(300, Math.round(w * h * 0.004));

      const n = w * h;
      const colorDist = (p: number) => {
        const i = p * 4;
        return Math.hypot(data[i] - bgR, data[i + 1] - bgG, data[i + 2] - bgB);
      };

      const isCandidate = new Uint8Array(n);
      for (let p = 0; p < n; p++) {
        isCandidate[p] = colorDist(p) < EDGE_THRESHOLD ? 1 : 0;
      }

      // Flood-fill connected components of background-colored pixels.
      const visited = new Uint8Array(n);
      const toErase = new Uint8Array(n);
      const stack = new Int32Array(n);

      for (let start = 0; start < n; start++) {
        if (!isCandidate[start] || visited[start]) continue;

        let sp = 0;
        stack[sp++] = start;
        visited[start] = 1;
        const region: number[] = [start];

        while (sp > 0) {
          const p = stack[--sp];
          const x = p % w;
          const y = (p - x) / w;

          if (x > 0 && !visited[p - 1] && isCandidate[p - 1]) {
            visited[p - 1] = 1;
            stack[sp++] = p - 1;
            region.push(p - 1);
          }
          if (x < w - 1 && !visited[p + 1] && isCandidate[p + 1]) {
            visited[p + 1] = 1;
            stack[sp++] = p + 1;
            region.push(p + 1);
          }
          if (y > 0 && !visited[p - w] && isCandidate[p - w]) {
            visited[p - w] = 1;
            stack[sp++] = p - w;
            region.push(p - w);
          }
          if (y < h - 1 && !visited[p + w] && isCandidate[p + w]) {
            visited[p + w] = 1;
            stack[sp++] = p + w;
            region.push(p + w);
          }
        }

        if (region.length >= MIN_REGION_SIZE) {
          for (const p of region) toErase[p] = 1;
        }
      }

      for (let p = 0; p < n; p++) {
        if (!toErase[p]) continue;
        const i = p * 4;
        const dist = colorDist(p);
        if (dist < CORE_THRESHOLD) {
          data[i + 3] = 0; // 100% transparent
        } else {
          // Smooth edge anti-aliasing between CORE and EDGE thresholds
          data[i + 3] = Math.round(((dist - CORE_THRESHOLD) / (EDGE_THRESHOLD - CORE_THRESHOLD)) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(cvs.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
