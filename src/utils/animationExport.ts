import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { AnimationFrame } from '../types/icon';

/**
 * Renders an array of frames into a horizontal spritesheet PNG.
 * Layout: [Frame 1][Frame 2][Frame 3]...[Frame N]
 */
export function generateHorizontalSpritesheet(
  frames: AnimationFrame[],
  scale: number = 4
): string {
  if (!frames || frames.length === 0) return '';
  const firstFrame = frames[0].pixels;
  const gridSize = firstFrame.length;
  const frameWidth = gridSize * scale;
  const frameHeight = gridSize * scale;
  const totalWidth = frameWidth * frames.length;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = frameHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  frames.forEach((frame, frameIdx) => {
    const offsetX = frameIdx * frameWidth;
    const matrix = frame.pixels;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = matrix[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + x * scale, y * scale, scale, scale);
        }
      }
    }
  });

  const result = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

/**
 * Encodes an animated GIF from the provided frames and FPS rate.
 * Returns a Blob suitable for download or preview URL.
 */
export async function generateAnimatedGif(
  frames: AnimationFrame[],
  fps: number = 4,
  scale: number = 4
): Promise<Blob> {
  if (!frames || frames.length === 0) {
    throw new Error('Aucune frame à encoder.');
  }

  const firstFrame = frames[0].pixels;
  const gridSize = firstFrame.length;
  const width = gridSize * scale;
  const height = gridSize * scale;
  const delay = Math.round(1000 / Math.max(1, fps)); // delay in milliseconds

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Impossible d initialiser le contexte canvas 2D.');
  }
  ctx.imageSmoothingEnabled = false;

  const gif = GIFEncoder();

  for (const frame of frames) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Optional dark background to preserve crisp pixel look if transparent
    // If all pixels are transparent, paint a subtle dark background
    const hasPixels = frame.pixels.some(row => row.some(cell => Boolean(cell)));
    if (!hasPixels) {
      ctx.fillStyle = '#141417';
      ctx.fillRect(0, 0, width, height);
    }

    const matrix = frame.pixels;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = matrix[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const { data } = imgData;

    // Quantize palette to max 256 colors
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0, // loop indefinitely
      transparent: true,
      transparentIndex: 0,
    });
  }

  gif.finish();
  // Free canvas backing store memory
  canvas.width = 0;
  canvas.height = 0;
  const bytes = gif.bytes();
  return new Blob([bytes as any], { type: 'image/gif' });
}

/**
 * Triggers a download of any blob or data URL.
 */
export function downloadMediaFile(filename: string, blobOrUrl: Blob | string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
