import { CraftGridIcon, BatchExportFormat, AiEngine, PromptStyleModifiers } from '../types/icon';

/**
 * Compiles the standardized flat 2D pixel-art prompt for a given icon.
 */
export function compileIconPrompt(item: CraftGridIcon, engine: AiEngine = 'standard', modifiers?: PromptStyleModifiers): string {
  const categoryName = item.cat.toUpperCase();
  const colorList = item.colors.join(", ");
  
  // Style modifiers text
  let modifierText = "";
  if (modifiers) {
    if (modifiers.weathering > 50) {
      modifierText += ", weathered chipped texture, subtle erosion cracks";
    }
    if (modifiers.detailLevel < 30) {
      modifierText += ", ultra-minimalist pixel count, high abstraction";
    } else if (modifiers.detailLevel > 70) {
      modifierText += ", intricate micro-dithered shading, fine pixel work";
    }
    if (modifiers.lighting === 'glow') {
      modifierText += ", bioluminescent core with vivid neon emission";
    } else if (modifiers.lighting === 'nether') {
      modifierText += ", brimstone embers and fiery crimson backlight";
    } else if (modifiers.lighting === 'dramatic') {
      modifierText += ", high-contrast chiaroscuro pixel shadows";
    }
  }

  // Base prompt components
  if (engine === 'midjourney') {
    return `Minecraft-style 64x64 flat 2D pixel art icon of ${categoryName} — "${item.name}"${modifierText}, authentic game colors (${colorList}), crisp square pixels, straight-on front view, isolated clean solid dark background, retro 16-bit video game asset --ar 1:1 --no 3d, isometric, blurry, realistic, smooth, gradients, watermark, text --v 6.1`;
  }

  if (engine === 'sdxl') {
    return `Positive:
masterpiece, pixelart, 64x64 pixel art sprite of ${item.name} (${categoryName})${modifierText}, retro game inventory icon, sharp square pixels, pure flat colors: ${colorList}, uniform outline, game asset on transparent background, <lora:pixel-art-xl:1.0>

Negative:
3d render, isometric, smooth gradient, antialiasing, blurry, realistic, photo, noise, watermark, signature, border`;
  }

  if (engine === 'dalle3') {
    return `A crisp retro 64x64 flat 2D pixel art icon of "${item.name}" inspired by Minecraft (${categoryName}). Hand-placed square pixels, strictly adhering to colors ${colorList}${modifierText}. Front-facing flat sprite, no 3D depth, no blur, centered on a neutral dark background.`;
  }

  if (engine === 'flux') {
    return `Pixel art sprite, 64x64 resolution, "${item.name}" ${categoryName} icon${modifierText}. Palette restricted to canon colors: ${colorList}. Distinct 1-pixel dark border, zero antialiasing, straight-on front view, video game item asset.`;
  }

  // Standard Prompt
  return `Generate a single standalone icon: ${categoryName} — "${item.name}", Minecraft-inspired.

RESEARCHED REFERENCE COLORS FOR THIS ICON (use these as ground truth, not a guess):
- Primary & secondary swatches: ${colorList} (${item.desc}${modifierText})

STYLE (identical across every icon in this set):
- Flat 2D pixel-art, simplified — NOT isometric, NOT 3D-shaded
- Straight-on, front-facing 2D perspective
- Canvas: 64x64px, transparent background, no shadow
- Flat fills, at most 1-2 tone bands for shading, no gradients
- Thin uniform dark outline, same weight across the whole set
- Centered, consistent padding
- Recognizable even at 24x24px
- Output ONLY this one icon — no label, no scene, no other icons`;
}

/**
 * Generates the full batch export payload in the requested syntax.
 */
export function generateBatchPayload(icons: CraftGridIcon[], format: BatchExportFormat, engine: AiEngine = 'standard'): string {
  if (format === 'json') {
    return JSON.stringify(
      icons.map(item => ({
        id: item.id,
        name: item.name,
        category: item.cat,
        canon_colors: item.colors,
        description: item.desc,
        template_prompt: compileIconPrompt(item, engine),
        is_custom: !!item.isCustom,
        is_favorite: !!item.isFavorite,
      })),
      null,
      2
    );
  } else if (format === 'csv') {
    const header = 'ID,Name,Category,Colors,Description,Prompt\n';
    const rows = icons.map(i => {
      const cleanPrompt = compileIconPrompt(i, engine).replace(/"/g, '""');
      const cleanDesc = i.desc.replace(/"/g, '""');
      return `${i.id},"${i.name}","${i.cat}","${i.colors.join(' ')}","${cleanDesc}","${cleanPrompt}"`;
    }).join('\n');
    return header + rows;
  } else {
    return icons.map(item => (
      `// ================================================\n` +
      `// ICON #${item.id}: ${item.name.toUpperCase()} [${item.cat.toUpperCase()}]\n` +
      `// ================================================\n` +
      `${compileIconPrompt(item, engine)}\n`
    )).join('\n');
  }
}

/**
 * Generate GIMP / Aseprite Palette file (.gpl)
 */
export function generateGplPalette(paletteName: string, colors: string[]): string {
  let gpl = `GIMP Palette\nName: ${paletteName}\nColumns: 8\n#\n`;
  colors.forEach(hex => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    gpl += `${r.toString().padStart(3, ' ')} ${g.toString().padStart(3, ' ')} ${b.toString().padStart(3, ' ')}  ${hex}\n`;
  });
  return gpl;
}

/**
 * Generate CSS variables for colors
 */
export function generateCssVariables(paletteName: string, colors: string[]): string {
  const safeName = paletteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const vars = colors.map((col, idx) => `  --color-${safeName}-${idx + 1}: ${col};`).join('\n');
  return `:root {\n${vars}\n}`;
}

/**
 * Generate a standalone React Component TSX file for an icon
 */
export function generateReactComponentCode(icon: CraftGridIcon): string {
  const componentName = icon.name.replace(/[^a-zA-Z0-9]/g, '') + 'Icon';
  return `import React from 'react';

/**
 * ${icon.name} Pixel Art Icon
 * Category: ${icon.cat}
 * Canon Colors: ${icon.colors.join(', ')}
 */
export const ${componentName}: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="8" width="48" height="48" fill="${icon.colors[0]}" />
      <rect x="14" y="14" width="20" height="20" fill="${icon.colors[1] || icon.colors[0]}" />
      <rect x="8" y="8" width="48" height="48" fill="none" stroke="#141417" strokeWidth="3" />
    </svg>
  );
};
`;
}

/**
 * Generate a Minecraft Bedrock/Java shaped crafting recipe JSON
 */
export function generateCraftingRecipeJson(
  recipeName: string,
  grid: (CraftGridIcon | null)[],
  output: CraftGridIcon | null
): string {
  const safeId = recipeName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const keyMap: Record<string, string> = {};
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  let letterIndex = 0;

  // Build pattern
  const patternRows: string[] = [];
  for (let r = 0; r < 3; r++) {
    let row = '';
    for (let c = 0; c < 3; c++) {
      const item = grid[r * 3 + c];
      if (!item) {
        row += ' ';
      } else {
        const itemIdentifier = `minecraft:${item.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
        let char = Object.keys(keyMap).find(k => keyMap[k] === itemIdentifier);
        if (!char) {
          char = letters[letterIndex++];
          keyMap[char] = itemIdentifier;
        }
        row += char;
      }
    }
    patternRows.push(row);
  }

  const recipe = {
    type: "minecraft:crafting_shaped",
    pattern: patternRows,
    key: Object.entries(keyMap).reduce((acc, [char, id]) => {
      acc[char] = { item: id };
      return acc;
    }, {} as Record<string, { item: string }>),
    result: {
      item: `minecraft:${output ? output.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'custom_item'}`,
      count: 1
    }
  };

  return JSON.stringify(recipe, null, 2);
}

/**
 * Trigger browser file download helper
 */
export function downloadFile(filename: string, content: string | Blob, mimeType: string = 'text/plain') {
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else {
    blob = new Blob([content], { type: mimeType });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
