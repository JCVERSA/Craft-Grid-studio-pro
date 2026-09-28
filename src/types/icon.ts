export type IconCategory = 'block' | 'item' | 'mob' | 'custom';

export type MainTab = 'catalog' | 'studio' | 'simulator' | 'promptlab' | 'export';

export type ViewMode = 'grid' | 'compact' | 'table';

export type BatchExportFormat = 'standard' | 'json' | 'csv';

export type AiEngine = 'standard' | 'midjourney' | 'sdxl' | 'dalle3' | 'flux';

export type ColorblindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface CraftGridIcon {
  id: number;
  name: string;
  cat: IconCategory;
  colors: string[];
  desc: string;
  art: string;
  c1: string;
  c2: string;
  isCustom?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  generatedImageUrl?: string;
  generatedAt?: string;
  customPixelMatrix?: string[][]; // Custom canvas grid if edited pixel-by-pixel
}

export interface CraftingRecipeSlot {
  index: number;
  item: CraftGridIcon | null;
}

export interface PromptStyleModifiers {
  detailLevel: number; // 0 to 100
  weathering: number; // 0 to 100 (clean to worn/cracked)
  lighting: 'flat' | 'warm' | 'dramatic' | 'nether' | 'glow';
}

export interface AnimationFrame {
  id: string;
  pixels: string[][]; // 2D hex grid
  durationMs: number;
}
