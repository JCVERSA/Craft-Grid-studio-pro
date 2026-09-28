/**
 * Converts an SVG string or element into a crisp, non-antialiased pixel art PNG Blob or Data URL
 */
export async function svgToPngBlob(
  svgElementOrString: string | SVGSVGElement,
  targetSize: number = 64
): Promise<Blob> {
  let svgString = '';
  if (typeof svgElementOrString === 'string') {
    svgString = svgElementOrString;
  } else {
    svgString = new XMLSerializer().serializeToString(svgElementOrString);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Ensure nearest-neighbor scaling for pixel art
  ctx.imageSmoothingEnabled = false;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        // Free backing store memory
        canvas.width = 0;
        canvas.height = 0;
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('PNG conversion failed'));
        }
      }, 'image/png');
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      canvas.width = 0;
      canvas.height = 0;
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Convert pixel matrix (2D hex color array) directly to Canvas PNG Data URL
 */
export function matrixToPngDataUrl(matrix: string[][], scale: number = 4): string {
  const height = matrix.length;
  const width = matrix[0]?.length || 0;
  if (!width || !height) return '';

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = matrix[y][x];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  const result = canvas.toDataURL('image/png');
  // Free backing store memory
  canvas.width = 0;
  canvas.height = 0;
  return result;
}
