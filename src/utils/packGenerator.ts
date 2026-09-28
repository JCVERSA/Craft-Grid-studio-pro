import JSZip from 'jszip';
import { CraftGridIcon } from '../types/icon';
import { svgToPngBlob } from './svgToPng';

// Helper to generate UUID v4
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate simple SVG for icon to use in pack
function createIconSvg(icon: CraftGridIcon): string {
  const c1 = icon.c1 || icon.colors[0] || '#7FB238';
  const c2 = icon.c2 || icon.colors[1] || '#976D4D';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges">
    <rect x="0" y="0" width="64" height="64" fill="${c1}"/>
    <rect x="8" y="8" width="48" height="48" fill="${c2}"/>
    <rect x="16" y="16" width="32" height="32" fill="${c1}"/>
  </svg>`;
}

/**
 * Generates a Minecraft Bedrock Edition (.mcpack) zip archive
 */
export async function generateBedrockMcpack(
  icons: CraftGridIcon[],
  packName: string = 'CraftGrid Suite',
  description: string = 'Textures pixel art 64x64 générées avec CraftGrid Studio'
): Promise<Blob> {
  const zip = new JSZip();

  const headerUuid = generateUuid();
  const moduleUuid = generateUuid();

  // 1. Bedrock manifest.json
  const manifest = {
    format_version: 2,
    header: {
      name: packName,
      description: description,
      uuid: headerUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [
      {
        type: 'resources',
        uuid: moduleUuid,
        version: [1, 0, 0],
      },
    ],
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Pack Icon
  const packIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" fill="#131316"/>
    <rect x="8" y="8" width="112" height="112" fill="#1F1F22" stroke="#5CDBD5" stroke-width="4"/>
    <rect x="32" y="32" width="64" height="64" fill="#5CDBD5"/>
    <text x="64" y="112" font-family="monospace" font-size="12" fill="#FAEE4D" text-anchor="middle">CRAFTGRID</text>
  </svg>`;
  try {
    const iconBlob = await svgToPngBlob(packIconSvg, 128);
    zip.file('pack_icon.png', iconBlob);
  } catch (e) {
    zip.file('pack_icon.svg', packIconSvg);
  }

  // 3. Textures folders
  const itemsFolder = zip.folder('textures/items');
  const blocksFolder = zip.folder('textures/blocks');

  // Add textures
  for (const icon of icons) {
    const safeName = icon.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const svgCode = createIconSvg(icon);

    try {
      const pngBlob = await svgToPngBlob(svgCode, 64);
      if (icon.cat === 'block') {
        blocksFolder?.file(`${safeName}.png`, pngBlob);
      } else {
        itemsFolder?.file(`${safeName}.png`, pngBlob);
      }
    } catch {
      // Fallback SVG if canvas fails
      if (icon.cat === 'block') {
        blocksFolder?.file(`${safeName}.svg`, svgCode);
      } else {
        itemsFolder?.file(`${safeName}.svg`, svgCode);
      }
    }
  }

  // Generate .mcpack (which is a standard zip format)
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates a Java Edition Resource Pack (.zip)
 */
export async function generateJavaResourcePack(
  icons: CraftGridIcon[],
  packName: string = 'CraftGrid Java Pack',
  packFormat: number = 34 // 1.20.5 - 1.21+
): Promise<Blob> {
  const zip = new JSZip();

  const mcmeta = {
    pack: {
      pack_format: packFormat,
      description: `${packName} - 64x64 Pixel Art Spec`,
    },
  };

  zip.file('pack.mcmeta', JSON.stringify(mcmeta, null, 2));

  const itemsFolder = zip.folder('assets/minecraft/textures/item');
  const blocksFolder = zip.folder('assets/minecraft/textures/block');

  for (const icon of icons) {
    const safeName = icon.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const svgCode = createIconSvg(icon);

    try {
      const pngBlob = await svgToPngBlob(svgCode, 64);
      if (icon.cat === 'block') {
        blocksFolder?.file(`${safeName}.png`, pngBlob);
      } else {
        itemsFolder?.file(`${safeName}.png`, pngBlob);
      }
    } catch {
      if (icon.cat === 'block') {
        blocksFolder?.file(`${safeName}.svg`, svgCode);
      } else {
        itemsFolder?.file(`${safeName}.svg`, svgCode);
      }
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates a Texture Atlas spritesheet canvas and CSS/JSON map
 */
export async function generateAtlas(
  icons: CraftGridIcon[],
  atlasSize: number = 512,
  itemSize: number = 64
): Promise<{ atlasDataUrl: string; jsonMap: string; cssMap: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = atlasSize;
  canvas.height = atlasSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.imageSmoothingEnabled = false;

  const cols = Math.floor(atlasSize / itemSize);
  const mapping: Record<string, { x: number; y: number; width: number; height: number }> = {};
  let css = `/* CraftGrid Spritesheet Atlas (${atlasSize}x${atlasSize}) */\n.pixel-sprite { background-image: url('atlas.png'); background-repeat: no-repeat; display: inline-block; }\n`;

  for (let i = 0; i < icons.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * itemSize;
    const y = row * itemSize;

    if (y + itemSize > atlasSize) break; // Out of bounds for atlas size

    const icon = icons[i];
    const safeName = icon.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    // Draw item directly on canvas
    ctx.fillStyle = icon.c1 || icon.colors[0] || '#7FB238';
    ctx.fillRect(x + 4, y + 4, itemSize - 8, itemSize - 8);
    ctx.fillStyle = icon.c2 || icon.colors[1] || '#976D4D';
    ctx.fillRect(x + 12, y + 12, itemSize - 24, itemSize - 24);
    ctx.strokeStyle = '#141417';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, itemSize - 8, itemSize - 8);

    mapping[icon.name] = { x, y, width: itemSize, height: itemSize };
    css += `.sprite-${safeName} { width: ${itemSize}px; height: ${itemSize}px; background-position: -${x}px -${y}px; }\n`;
  }

  return {
    atlasDataUrl: canvas.toDataURL('image/png'),
    jsonMap: JSON.stringify(mapping, null, 2),
    cssMap: css,
  };
}
