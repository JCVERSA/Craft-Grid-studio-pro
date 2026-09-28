import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Initialize GoogleGenAI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '10mb' }));

// 1.1 Security Headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Allow safe embedding in Google AI Studio preview & runner while securing against clickjacking
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.google.com https://*.run.app;");
  next();
});

// 1.2 In-memory Rate Limiting for /api/* routes (60 requests per minute per IP)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

const apiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  const current = rateLimitMap.get(ip);
  if (!current || now > current.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Limite de requêtes atteinte (60 req/min). Veuillez patienter quelques secondes.',
      retryAfter,
    });
  }

  current.count++;
  next();
};

app.use('/api', apiRateLimiter);

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Procedural fallback generator when external APIs are 503 or rate-limited.
 * Constructs an authentic 16x16 pixel art SVG sprite matching the prompt's hex colors.
 */
function generateProceduralPixelArt(prompt: string): string {
  // Extract hex colors from prompt
  const hexMatches = prompt.match(/#[0-9A-Fa-f]{6}/g) || ['#5CDBD5', '#1D1D21', '#8F7748'];
  const c1 = hexMatches[0] || '#5CDBD5';
  const c2 = hexMatches[1] || '#976D4D';
  const c3 = hexMatches[2] || '#141417';

  const isItem = /sword|pickaxe|axe|shovel|hoe|bow|arrow|gem|diamond|ingot|potion|orb/i.test(prompt);
  const isMob = /creeper|zombie|skeleton|enderman|spider|pig|cow|sheep|chicken|wolf|dragon/i.test(prompt);

  const rects: string[] = [];

  // Generate 16x16 grid (each pixel is 4x4 coordinate in 64x64 canvas)
  if (isMob) {
    // Mob silhouette
    for (let y = 2; y <= 13; y++) {
      for (let x = 3; x <= 12; x++) {
        // Eyes
        if ((y === 5 || y === 6) && (x === 5 || x === 10)) {
          rects.push(`<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="#141417"/>`);
        } else if ((y === 8 || y === 9) && (x >= 7 && x <= 8)) {
          // Snout / mouth
          rects.push(`<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="${c2}"/>`);
        } else {
          // Shading jitter
          const color = (x + y) % 3 === 0 ? c2 : c1;
          rects.push(`<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="${color}"/>`);
        }
      }
    }
  } else if (isItem) {
    // Diagonal tool/gem sprite
    for (let i = 0; i < 11; i++) {
      const x = 3 + i;
      const y = 13 - i;
      rects.push(`<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="${c1}"/>`);
      rects.push(`<rect x="${(x + 1) * 4}" y="${y * 4}" width="4" height="4" fill="${c2}"/>`);
      if (i > 3 && i < 9) {
        rects.push(`<rect x="${x * 4}" y="${(y + 1) * 4}" width="4" height="4" fill="${c1}"/>`);
      }
    }
    // Handle/hilt
    rects.push(`<rect x="12" y="52" width="8" height="8" fill="#594323"/>`);
    rects.push(`<rect x="20" y="44" width="8" height="8" fill="${c3}"/>`);
  } else {
    // 3D-shaded flat cube block
    for (let y = 2; y <= 13; y++) {
      for (let x = 2; x <= 13; x++) {
        let fill = c1;
        if (y <= 5 && prompt.toLowerCase().includes('grass')) {
          fill = c1; // grass top
        } else if (prompt.toLowerCase().includes('grass')) {
          fill = (x + y) % 4 === 0 ? c3 : c2; // dirt body
        } else {
          // Texture variation
          if (x === 2 || y === 2) {
            fill = c1;
          } else if (x === 13 || y === 13) {
            fill = c3;
          } else {
            fill = (x * 3 + y * 5) % 7 === 0 ? c2 : c1;
          }
        }
        rects.push(`<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="${fill}"/>`);
      }
    }
  }

  const svg = `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="0" y="0" width="64" height="64" fill="#0E0E11"/>
    <rect x="4" y="4" width="56" height="56" fill="none" stroke="#1D1D21" stroke-width="2"/>
    ${rects.join('\n')}
  </svg>`;

  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Model rate-limit / quota cooldown tracker (prevents 429 cascades and console spam)
const modelCooldowns = new Map<string, number>();

function isModelAvailable(model: string): boolean {
  const expiry = modelCooldowns.get(model);
  if (!expiry) return true;
  if (Date.now() > expiry) {
    modelCooldowns.delete(model);
    return true;
  }
  return false;
}

function handleModelError(model: string, err: any) {
  const errMsg = String(err?.message || err || '');
  const status = err?.status || err?.code;
  const isQuota =
    status === 429 ||
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota') ||
    errMsg.includes('Quota exceeded');

  const isHighDemand =
    status === 503 ||
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('temporarily unavailable');

  if (isQuota) {
    let cooldownSec = 45;
    const match = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retryDelay["']?\s*:\s*["']?([0-9]+)s/i);
    if (match && match[1]) {
      cooldownSec = Math.max(10, Math.ceil(parseFloat(match[1])) + 2);
    }
    modelCooldowns.set(model, Date.now() + cooldownSec * 1000);
    console.log(`[Gemini] Model ${model} quota reached. Cooling down for ${cooldownSec}s.`);
  } else if (isHighDemand) {
    // 503 high demand spike from Gemini API
    const cooldownSec = 30;
    modelCooldowns.set(model, Date.now() + cooldownSec * 1000);
    console.log(`[Gemini] Model ${model} experiencing temporary high demand (503). Cooling down for ${cooldownSec}s.`);
  } else {
    // Quiet fallback without dumping raw JSON payloads
    modelCooldowns.set(model, Date.now() + 15 * 1000);
    console.log(`[Gemini] Model ${model} temporary fallback activated.`);
  }
}

/**
 * Bulletproof JSON parser for LLM responses.
 * Cleans code fences, C-style comments, trailing commas, and boundary garbage.
 */
function safeParseJson<T>(raw: string): T | null {
  if (!raw || typeof raw !== 'string') return null;

  try {
    return JSON.parse(raw.trim());
  } catch {
    // Continue with cleaners
  }

  // Strip markdown code fences
  let cleaned = raw.replace(/```(?:json|javascript|xml|svg)?/gi, '').replace(/```/g, '').trim();

  // Strip single-line and multi-line comments
  cleaned = cleaned.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Strip trailing commas before closing brackets or braces (e.g. [ "a", ] -> [ "a" ])
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // Extract from first { to last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const fixed = candidate.replace(/,\s*([\]}])/g, '$1');
      try {
        return JSON.parse(fixed);
      } catch {
        // Fall through
      }
    }
  }

  // Extract from first [ to last ]
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = cleaned.substring(firstBracket, lastBracket + 1).replace(/,\s*([\]}])/g, '$1');
    try {
      return JSON.parse(candidate);
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Nearest-neighbor matrix scaling for pixel art grids (e.g. 16x16 -> 32x32 or 64x64)
 */
function upscaleMatrix(grid: string[][], targetSize: number): string[][] {
  const currentSize = grid.length;
  if (!currentSize || currentSize === targetSize) return grid;
  const result: string[][] = Array.from({ length: targetSize }, () => Array(targetSize).fill(''));
  const scale = targetSize / currentSize;
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcY = Math.min(currentSize - 1, Math.floor(y / scale));
      const srcX = Math.min(currentSize - 1, Math.floor(x / scale));
      result[y][x] = grid[srcY]?.[srcX] || '';
    }
  }
  return result;
}

// Generate pixel art using Gemini Models (with fallback cascade)
async function generatePixelArtWithGemini(prompt: string): Promise<{ imageUrl: string; model: string }> {
  // If API key is available, attempt Gemini text/vision model
  if (process.env.GEMINI_API_KEY) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const model of modelsToTry) {
      if (!isModelAvailable(model)) {
        continue;
      }
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `You are an expert retro 2D pixel art generator for Minecraft-style icons.
Given this icon prompt:
"${prompt}"

Generate a clean, high-contrast, crisp 2D standalone pixel-art SVG icon.
CRITICAL SVG SPECIFICATIONS:
- viewBox="0 0 64 64"
- width="64" height="64"
- xmlns="http://www.w3.org/2000/svg"
- shape-rendering="crispEdges"
- Constructed with pixel rectangles (<rect x="..." y="..." width="4" height="4" fill="..."/>) on a strict 16x16 grid (each pixel is 4x4 coordinate units)
- Authentic color shades matching the prompt
- Centered on dark background (#0E0E11) with a dark border
- DO NOT wrap in backticks, markdown codeblocks or quotes.
- Return ONLY the raw valid <svg>...</svg> XML markup.`,
        });

        const raw = response.text || '';
        let svg = raw.replace(/```(xml|svg)?/gi, '').replace(/```/g, '').trim();

        const startIdx = svg.indexOf('<svg');
        const endIdx = svg.lastIndexOf('</svg>');
        if (startIdx !== -1 && endIdx !== -1) {
          svg = svg.substring(startIdx, endIdx + 6);
        }

        if (svg.startsWith('<svg') && svg.endsWith('</svg>')) {
          const base64 = Buffer.from(svg, 'utf-8').toString('base64');
          return {
            imageUrl: `data:image/svg+xml;base64,${base64}`,
            model,
          };
        }
      } catch (err: any) {
        handleModelError(model, err);
      }
    }
  }

  // High-availability procedural pixel art fallback
  const proceduralDataUrl = generateProceduralPixelArt(prompt);
  return {
    imageUrl: proceduralDataUrl,
    model: 'craftgrid-pixel-engine',
  };
}

// Pool of random Minecraft and retro item concepts for prompt-free generation
const RANDOM_CONCEPTS = [
  "Golden Sword with glowing blue gem in the hilt",
  "Mystical Purple Potion bottle sparkling with stardust",
  "Red Diamond Core ore block with glowing lava veins",
  "Creeper head icon with pixelated green skin and dark empty eyes",
  "Magical Fireball orb with orange, red and yellow flames",
  "Pixelated Ender Eye or ender pearl in teal and purple shades",
  "Authentic Retro Golden Apple with shiny white glare highlights",
  "Runed Shield made of ancient dark wood and gold borders",
  "Minecraft Redstone dust trail glowing with vibrant ruby colors",
  "Enchanted Spellbook bound in leather with a glowing cyan rune symbol",
  "Necromancer Skull with glowing lime-green magical eye sockets",
  "Vibrant Rainbow Crystal shard casting pristine pixel-art light",
  "Steaming Bowl of Mushroom Stew with red and brown spots",
  "Lapis Lazuli gem shard with dark blue facets and gold flecks",
  "Golden Crown with ruby, emerald and sapphire gemstones",
  "Cute Pink Pig snout face icon with dark nostrils",
  "Phoenix Feather with warm crimson, orange and yellow pixel gradients",
  "Glow Lichen block with soft cyan fluorescent dots on gray stone",
  "Magma Cream globule with swirling fire-orange and slime-green spots",
  "Prismarine Shard with shifting aquatic turquoise and sea-green hues",
  "Netherite Ingot with dark graphite and obsidian luster",
  "Enchanted Bow strung with glowing silk thread",
  "Spectral Arrow glowing with ethereal golden aura",
  "Dragon Egg with shifting obsidian and cosmic purple veins",
  "Elytra Wings with subtle slate gray feathers and cyan lining",
  "Trident of the Depths with three glowing sea-prism spikes",
  "Diamond Chestplate with shimmering cyan and sapphire edges",
  "Totem of Undying with emerald eyes and gold wings",
  "Heart of the Sea orb with oceanic blue radiance",
  "Amethyst Cluster block with purple crystalline spikes"
];

// Procedural generator to guarantee pristine pixel-grid matrix results at any resolution
function generateProceduralPixelMatrix(prompt: string, size: number): string[][] {
  const matrix: string[][] = Array.from({ length: size }, () => Array(size).fill(''));

  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const promptLower = prompt.toLowerCase();
  
  // Custom theme palettes
  const palettes = [
    { p: "#5CDBD5", s: "#23807C", a: "#E6FFFF" }, // Diamond
    { p: "#FAEE4D", s: "#9A7E14", a: "#FF5E5E" }, // Gold
    { p: "#FA5A5A", s: "#911D1D", a: "#FFC2C2" }, // Ruby
    { p: "#CE72FF", s: "#691E96", a: "#5CDBD5" }, // Amethyst / Void
    { p: "#5EFF5E", s: "#1F851F", a: "#FAEE4D" }, // Emerald / Slime
    { p: "#FFA8D3", s: "#B8497F", a: "#FFFFFF" }, // Pink pig
    { p: "#FFA64D", s: "#9C4C00", a: "#FAEE4D" }, // Copper
  ];
  
  const selectedPal = palettes[absHash % palettes.length];
  const c1 = selectedPal.p;
  const c2 = selectedPal.s;
  const c3 = selectedPal.a;

  const tempGrid: string[][] = Array.from({ length: 16 }, () => Array(16).fill(''));

  const isSword = promptLower.includes('sword') || promptLower.includes('blade') || promptLower.includes('weapon') || promptLower.includes('épée');
  const isTool = promptLower.includes('pickaxe') || promptLower.includes('axe') || promptLower.includes('shovel') || promptLower.includes('hoe') || promptLower.includes('pioche') || promptLower.includes('outil');
  const isPotion = promptLower.includes('potion') || promptLower.includes('bottle') || promptLower.includes('flask') || promptLower.includes('fioles');
  const isMob = promptLower.includes('creeper') || promptLower.includes('zombie') || promptLower.includes('head') || promptLower.includes('face') || promptLower.includes('pig') || promptLower.includes('monster') || promptLower.includes('skull') || promptLower.includes('crâne') || promptLower.includes('tête');
  const isBlock = promptLower.includes('block') || promptLower.includes('ore') || promptLower.includes('brick') || promptLower.includes('stone') || promptLower.includes('bloc') || promptLower.includes('minerai');

  if (isSword) {
    for (let i = 0; i < 16; i++) {
      const x = i;
      const y = 15 - i;
      if (i >= 5 && i <= 13) {
        if (x < 16 && y < 16) tempGrid[y][x] = c1;
        if (x + 1 < 16 && y < 16) tempGrid[y][x + 1] = c3;
        if (x < 16 && y - 1 >= 0) tempGrid[y - 1][x] = c2;
      } else if (i === 4) {
        if (x < 16 && y < 16) tempGrid[y][x] = "#3A3A3D";
        if (x + 1 < 16 && y < 16) tempGrid[y][x + 1] = c2;
        if (x - 1 >= 0 && y < 16) tempGrid[y][x - 1] = c2;
        if (x < 16 && y + 1 < 16) tempGrid[y + 1][x] = c2;
        if (x < 16 && y - 1 >= 0) tempGrid[y - 1][x] = c2;
      } else if (i < 4 && i > 0) {
        if (x < 16 && y < 16) tempGrid[y][x] = "#59402A";
      } else if (i === 0) {
        if (x < 16 && y < 16) tempGrid[y][x] = c2;
      }
    }
  } else if (isTool) {
    for (let i = 0; i < 12; i++) {
      const x = i + 1;
      const y = 14 - i;
      if (x < 16 && y < 16) tempGrid[y][x] = "#59402A";
    }
    const headX = 12;
    const headY = 3;
    for (let d = -3; d <= 3; d++) {
      const px = headX + d;
      const py = headY + Math.abs(d);
      if (px >= 0 && px < 16 && py >= 0 && py < 16) {
        tempGrid[py][px] = c1;
        if (py + 1 < 16) tempGrid[py + 1][px] = c2;
      }
    }
    if (headY < 16 && headX < 16) tempGrid[headY][headX] = c3;
  } else if (isPotion) {
    for (let y = 3; y <= 5; y++) {
      tempGrid[y][7] = "#8C929C";
      tempGrid[y][8] = "#BDC3C7";
    }
    tempGrid[2][7] = "#5E3E24";
    tempGrid[2][8] = "#5E3E24";

    for (let y = 6; y <= 12; y++) {
      const width = y <= 7 ? 4 : (y <= 10 ? 6 : 4);
      const startX = 8 - Math.floor(width / 2);
      for (let x = startX; x < startX + width; x++) {
        if (y === 6) {
          tempGrid[y][x] = "#AAB0BE";
        } else {
          const randColor = (x + y) % 3 === 0 ? c3 : ((x * 2 + y) % 2 === 0 ? c1 : c2);
          tempGrid[y][x] = randColor;
        }
      }
    }
    tempGrid[7][6] = "#FFFFFF";
    tempGrid[8][5] = "#FFFFFF";
  } else if (isMob) {
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 12; x++) {
        tempGrid[y][x] = (x * 3 + y * 7) % 2 === 0 ? c1 : c2;
      }
    }
    tempGrid[5][5] = "#141417";
    tempGrid[5][6] = "#141417";
    tempGrid[5][9] = "#141417";
    tempGrid[5][10] = "#141417";
    tempGrid[7][7] = "#141417";
    tempGrid[7][8] = "#141417";
    tempGrid[8][6] = "#141417";
    tempGrid[8][7] = "#141417";
    tempGrid[8][8] = "#141417";
    tempGrid[8][9] = "#141417";
    tempGrid[9][6] = "#141417";
    tempGrid[9][9] = "#141417";
  } else if (isBlock) {
    for (let y = 2; y <= 13; y++) {
      for (let x = 2; x <= 13; x++) {
        tempGrid[y][x] = (x + y) % 5 === 0 ? "#4D4D52" : "#303033";
      }
    }
    const crystalCoords = [
      [3, 4], [4, 4], [4, 5],
      [8, 3], [9, 4],
      [11, 8], [11, 9], [10, 9],
      [6, 11], [5, 10], [6, 10]
    ];
    crystalCoords.forEach(([cy, cx]) => {
      tempGrid[cy][cx] = c1;
      if (tempGrid[cy + 1]?.[cx] === "#4D4D52" || tempGrid[cy + 1]?.[cx] === "#303033") {
        tempGrid[cy + 1][cx] = c2;
      }
    });
    tempGrid[7][7] = c3;
    tempGrid[7][8] = c1;
    tempGrid[8][7] = c1;
  } else {
    for (let y = 3; y <= 12; y++) {
      const distToCenter = Math.abs(7.5 - y);
      const rowWidth = Math.max(1, Math.round(10 - distToCenter * 2));
      const startX = 8 - Math.floor(rowWidth / 2);
      for (let x = startX; x < startX + rowWidth; x++) {
        if (x === startX + 1 && y === 4) {
          tempGrid[y][x] = "#FFFFFF";
        } else {
          tempGrid[y][x] = (x + y) % 3 === 0 ? c3 : ((x * 2 + y) % 2 === 0 ? c1 : c2);
        }
      }
    }
  }

  // Draw black outlines
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      if (tempGrid[y][x] === '') {
        const neighbors = [
          tempGrid[y-1]?.[x], tempGrid[y+1]?.[x],
          tempGrid[y]?.[x-1], tempGrid[y]?.[x+1]
        ];
        if (neighbors.some(n => n && n !== '')) {
          tempGrid[y][x] = "#141417";
        }
      }
    }
  }

  // Scale tempGrid to matrix size
  const scale = size / 16;
  if (scale === 1) {
    return tempGrid;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcY = Math.floor(y / scale);
      const srcX = Math.floor(x / scale);
      matrix[y][x] = tempGrid[srcY]?.[srcX] || '';
    }
  }

  return matrix;
}

// Endpoint for AI pixel art generation
app.post('/api/generate-pixel-art', async (req, res) => {
  try {
    let { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Un prompt textuel est requis.' });
    }
    prompt = prompt.trim().slice(0, 500);

    const result = await generatePixelArtWithGemini(prompt);
    return res.json(result);
  } catch (_error: any) {
    // Fallback guaranteed
    const rawPrompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 500) : 'Pixel Block';
    const fallbackUrl = generateProceduralPixelArt(rawPrompt);
    return res.json({
      imageUrl: fallbackUrl,
      model: 'craftgrid-fallback',
      warning: 'Génération en mode de secours suite à une indisponibilité temporaire.',
    });
  }
});

// Endpoint for AI pixel matrix generation (directly editable grid injection)
app.post('/api/generate-pixel-matrix', async (req, res) => {
  let prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 500) : '';
  const rawSize = parseInt(req.body?.size, 10);
  const size = [16, 32, 64].includes(rawSize) ? rawSize : 16;

  const isRandom = !prompt || prompt === '';

  if (isRandom) {
    // Select random concept
    const randomIndex = Math.floor(Math.random() * RANDOM_CONCEPTS.length);
    prompt = RANDOM_CONCEPTS[randomIndex];
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const model of modelsToTry) {
        if (!isModelAvailable(model)) {
          continue;
        }

        try {
          const response = await ai.models.generateContent({
            model,
            contents: `You are a professional retro pixel art generator specializing in Minecraft and RPG game sprites.
Generate a 2D pixel art grid of 16 rows by 16 columns for the prompt: "${prompt}"

Return strict valid JSON with this structure:
{
  "matrix": [
    ["#hex", ""]
  ]
}

CRITICAL RULES:
1. "matrix" must be an array of exactly 16 rows.
2. Each row must contain exactly 16 strings.
3. Use vibrant retro/Minecraft hex colors (e.g. "#5CDBD5", "#FFA64D", "#141417").
4. Transparent background pixels must be empty string "".
5. Tools and weapons should be drawn diagonally; faces and items centered.
6. Return strictly valid JSON only. Do NOT include comments, trailing commas, or markdown code fences.`,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const raw = response.text || '';
          const parsed = safeParseJson<{ matrix: string[][] }>(raw);

          if (parsed && Array.isArray(parsed.matrix) && parsed.matrix.length >= 12) {
            const finalMatrix = size === 16 ? parsed.matrix : upscaleMatrix(parsed.matrix, size);
            return res.json({
              matrix: finalMatrix,
              prompt,
              model,
              isRandom,
            });
          }
        } catch (err: any) {
          handleModelError(model, err);
        }
      }
    }
  } catch (_error) {
    // Seamless fallback to procedural matrix
  }

  // Ultimate guaranteed procedural fallback
  const proceduralMatrix = generateProceduralPixelMatrix(prompt, size);
  return res.json({
    matrix: proceduralMatrix,
    prompt,
    model: 'craftgrid-matrix-engine',
    isRandom,
    warning: 'Moteur de secours rétro activé',
  });
});

// Helper for procedural multi-frame animation synthesis
function generateProceduralAnimation(
  baseMatrix: string[][],
  frameCount: number,
  animationType: string,
  size: number
): string[][][] {
  const frames: string[][][] = [];
  const safeCount = Math.min(Math.max(2, frameCount), 8);
  const type = (animationType || 'shimmer').toLowerCase();

  // Find colored pixels bounding box
  const coloredPoints: { x: number; y: number; color: string }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (baseMatrix[y]?.[x]) {
        coloredPoints.push({ x, y, color: baseMatrix[y][x] });
      }
    }
  }

  for (let f = 0; f < safeCount; f++) {
    // Clone base matrix
    const frame: string[][] = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => baseMatrix[y]?.[x] || '')
    );

    const progress = f / safeCount;
    const sinVal = Math.sin(progress * 2 * Math.PI);

    if (type.includes('float') || type.includes('lévitation') || type.includes('levitation') || type.includes('hover')) {
      // Smooth vertical sine displacement
      const dy = Math.round(sinVal * (size >= 32 ? 2 : 1));
      const shifted: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const targetY = y + dy;
          if (targetY >= 0 && targetY < size && baseMatrix[y]?.[x]) {
            shifted[targetY][x] = baseMatrix[y][x];
          }
        }
      }
      frames.push(shifted);
    } else if (type.includes('breathe') || type.includes('respiration') || type.includes('pulse')) {
      // Radial breathing pulse with edge highlight
      const isExpanded = f === 1 || f === 2;
      if (isExpanded) {
        for (const pt of coloredPoints) {
          if (pt.y > 1 && pt.y < size - 2) {
            if ((pt.x + f) % 4 === 0 && pt.x + 1 < size && !frame[pt.y][pt.x + 1]) {
              frame[pt.y][pt.x + 1] = pt.color;
            }
          }
        }
      }
      frames.push(frame);
    } else if (type.includes('fire') || type.includes('flamme') || type.includes('glow') || type.includes('lueur')) {
      // Dynamic dancing flame particles on top
      const minY = coloredPoints.reduce((acc, p) => Math.min(acc, p.y), size);
      const topPoints = coloredPoints.filter((p) => p.y <= minY + 2);
      const flameColors = ['#FAEE4D', '#FFA64D', '#FF3E3E', '#FFFFFF'];

      topPoints.forEach((p, idx) => {
        const flameOffset = (f + idx) % 3;
        const fy = p.y - flameOffset - 1;
        const fx = p.x + ((f % 2 === 0 ? 1 : -1) * (idx % 2));
        if (fy >= 0 && fy < size && fx >= 0 && fx < size) {
          frame[fy][fx] = flameColors[(f + idx) % flameColors.length];
        }
      });
      frames.push(frame);
    } else if (type.includes('swing') || type.includes('slash') || type.includes('attaque') || type.includes('coup')) {
      // Diagonal angular tilt back and forth
      const dx = Math.round(sinVal * (size >= 32 ? 2 : 1));
      const dy = Math.round(-Math.abs(sinVal) * (size >= 32 ? 2 : 1));
      const swung: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && baseMatrix[y]?.[x]) {
            swung[ny][nx] = baseMatrix[y][x];
          }
        }
      }
      frames.push(swung);
    } else if (type.includes('bounce') || type.includes('rebond') || type.includes('saut')) {
      // Vertical bounce motion
      const bounceDy = Math.round(-Math.abs(Math.sin(progress * Math.PI)) * (size >= 32 ? 3 : 2));
      const bounced: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const ny = y + bounceDy;
          if (ny >= 0 && ny < size && baseMatrix[y]?.[x]) {
            bounced[ny][x] = baseMatrix[y][x];
          }
        }
      }
      frames.push(bounced);
    } else {
      // Default: Shimmer / Magic Sparkles on facets
      if (coloredPoints.length > 0) {
        const sparkCount = Math.max(2, Math.floor(coloredPoints.length / 14));
        for (let i = 0; i < sparkCount; i++) {
          const pointIndex = (f * 7 + i * 11) % coloredPoints.length;
          const pt = coloredPoints[pointIndex];
          if (pt) {
            frame[pt.y][pt.x] = '#FFFFFF'; // White star glint
            if (f % 2 === 0) {
              if (pt.y > 0 && !frame[pt.y - 1][pt.x]) frame[pt.y - 1][pt.x] = '#5CDBD5';
              if (pt.y < size - 1 && !frame[pt.y + 1][pt.x]) frame[pt.y + 1][pt.x] = '#5CDBD5';
            }
          }
        }
      }
      frames.push(frame);
    }
  }

  return frames;
}

// Endpoint for AI Multi-Frame Animation Synthesis
app.post('/api/animate-pixel-matrix', async (req, res) => {
  let { currentMatrix, prompt, frameCount, animationType, size } = req.body;
  const rawSize = parseInt(size, 10);
  const validatedSize = [16, 32, 64].includes(rawSize) ? rawSize : 16;
  const validatedFrameCount = Math.min(Math.max(2, parseInt(frameCount, 10) || 4), 8);
  const allowedTypes = ['shimmer', 'float', 'breathe', 'flame', 'swing', 'bounce', 'rotate'];
  const sanitizedType = typeof animationType === 'string' && allowedTypes.includes(animationType.toLowerCase().trim())
    ? animationType.toLowerCase().trim()
    : 'shimmer';

  let sanitizedPrompt = typeof prompt === 'string' ? prompt.trim().slice(0, 500) : '';

  // Validate currentMatrix dimensions if provided
  const hasExistingDrawing =
    Array.isArray(currentMatrix) &&
    currentMatrix.length <= 64 &&
    currentMatrix.some((row: any) => Array.isArray(row) && row.some((c: any) => typeof c === 'string' && Boolean(c)));

  let baseMatrix: string[][];

  if (hasExistingDrawing) {
    baseMatrix = currentMatrix;
    if (!sanitizedPrompt) {
      sanitizedPrompt = `Animation ${sanitizedType} du sprite existant`;
    }
  } else {
    // Mode B: Generate base matrix first
    const isRandom = !sanitizedPrompt || sanitizedPrompt === '';
    if (isRandom) {
      const randomIndex = Math.floor(Math.random() * RANDOM_CONCEPTS.length);
      sanitizedPrompt = RANDOM_CONCEPTS[randomIndex];
    }
    baseMatrix = generateProceduralPixelMatrix(sanitizedPrompt, validatedSize);
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const model of modelsToTry) {
        if (!isModelAvailable(model)) {
          continue;
        }

        try {
          const response = await ai.models.generateContent({
            model,
            contents: `You are an expert 2D pixel-art animator for retro and Minecraft-style games.
Create a looping animation of exactly ${validatedFrameCount} frames for:
Theme: "${sanitizedPrompt}"
Motion style: "${sanitizedType}"

Return strict valid JSON with this structure:
{
  "frames": [
    [
      ["#hex", ""]
    ]
  ]
}

CRITICAL RULES:
1. "frames" must be an array of exactly ${validatedFrameCount} frames.
2. Each frame must be an array of 16 rows, with each row having exactly 16 strings.
3. Colors must be hex codes or empty string "" for transparent.
4. Seamless loop: frame ${validatedFrameCount} connects smoothly back into frame 1.
5. Return strictly valid JSON only. Do NOT include comments, trailing commas, or markdown code fences.`,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const raw = response.text || '';
          const parsed = safeParseJson<{ frames: string[][][] }>(raw);

          if (
            parsed &&
            Array.isArray(parsed.frames) &&
            parsed.frames.length >= 2 &&
            Array.isArray(parsed.frames[0]) &&
            parsed.frames[0].length >= 12
          ) {
            const finalFrames =
              validatedSize === 16
                ? parsed.frames
                : parsed.frames.map((f) => upscaleMatrix(f, validatedSize));

            return res.json({
              frames: finalFrames,
              prompt: sanitizedPrompt,
              animationType: sanitizedType,
              frameCount: finalFrames.length,
              model,
            });
          }
        } catch (err: any) {
          handleModelError(model, err);
        }
      }
    }
  } catch (_error) {
    // Seamless fallback to procedural animation
  }

  // Guaranteed procedural animation engine fallback
  const proceduralFrames = generateProceduralAnimation(baseMatrix, validatedFrameCount, sanitizedType, validatedSize);
  return res.json({
    frames: proceduralFrames,
    prompt: sanitizedPrompt,
    animationType: sanitizedType,
    frameCount: proceduralFrames.length,
    model: 'craftgrid-anim-engine',
    warning: 'Mode procédural rétro fluide activé',
  });
});

// Express & Vite server integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CraftGrid Studio server running at http://localhost:${port}`);
  });
}

startServer();
