import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Pipette, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  Save, 
  Play, 
  Pause, 
  Plus, 
  Sparkles, 
  SunMedium, 
  Layers,
  Film,
  Flame,
  Wind,
  Waves,
  Swords,
  Wand2,
  FileSpreadsheet
} from 'lucide-react';
import { CraftGridIcon, AnimationFrame } from '../../types/icon';
import { matrixToPngDataUrl } from '../../utils/svgToPng';
import { downloadFile } from '../../utils/promptCompiler';
import { 
  generateHorizontalSpritesheet, 
  generateAnimatedGif, 
  downloadMediaFile 
} from '../../utils/animationExport';

interface PixelStudioViewProps {
  onSaveIcon: (icon: CraftGridIcon) => void;
  initialIcon?: CraftGridIcon | null;
  onShowToast: (msg: string) => void;
}

type Tool = 'pencil' | 'eraser' | 'bucket' | 'picker';
type CanvasSize = 16 | 32 | 64;

// Preset Palettes
const PALETTE_PRESETS = {
  minecraft: ['#7FB238', '#976D4D', '#707070', '#5CDBD5', '#FAEE4D', '#B02E26', '#3C44AA', '#1D1D21', '#F7E9A3', '#8932B8', '#FFFFFF', '#0E0E11'],
  pico8: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'],
  gameboy: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  nes: ['#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#FFFFFF', '#FC9838'],
};

export const PixelStudioView: React.FC<PixelStudioViewProps> = ({
  onSaveIcon,
  initialIcon,
  onShowToast,
}) => {
  const [gridSize, setGridSize] = useState<CanvasSize>(16);
  const [selectedTool, setSelectedTool] = useState<Tool>('pencil');
  const [selectedColor, setSelectedColor] = useState<string>('#5CDBD5');
  const [activePalette, setActivePalette] = useState<keyof typeof PALETTE_PRESETS>('minecraft');
  const [paletteColors, setPaletteColors] = useState<string[]>(PALETTE_PRESETS.minecraft);

  // Initialize canvas matrix
  const createEmptyMatrix = useCallback((size: number) => {
    return Array.from({ length: size }, () => Array(size).fill(''));
  }, []);

  const [matrix, setMatrix] = useState<string[][]>(() => createEmptyMatrix(16));
  const [history, setHistory] = useState<string[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  // Animation timeline state
  const [frames, setFrames] = useState<AnimationFrame[]>([
    { id: '1', pixels: createEmptyMatrix(16), durationMs: 250 },
  ]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(4);
  const [iconName, setIconName] = useState<string>('Custom Pixel Art');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleGenerateMatrixFromAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/generate-pixel-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          size: gridSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur serveur lors de la génération');
      }

      const data = await response.json();
      if (data && Array.isArray(data.matrix)) {
        setMatrix(data.matrix);

        // Save state to history for undo/redo
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(JSON.parse(JSON.stringify(data.matrix)));
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);

        // Sync with active frame
        const updatedFrames = [...frames];
        if (updatedFrames[activeFrameIndex]) {
          updatedFrames[activeFrameIndex].pixels = data.matrix;
          setFrames(updatedFrames);
        }

        // Auto name the sprite
        if (data.prompt) {
          const capitalized = data.prompt.charAt(0).toUpperCase() + data.prompt.slice(1);
          setIconName(capitalized);
        }

        // Auto extract unique colors and add to palette
        const uniqueColors = Array.from(new Set(data.matrix.flat().filter(Boolean) as string[]));
        if (uniqueColors.length > 0) {
          setPaletteColors((prev) => {
            const merged = [...new Set([...uniqueColors, ...prev])];
            return merged.slice(0, 24);
          });
          setSelectedColor(uniqueColors[0]);
        }

        onShowToast(`Sprite IA "${data.prompt || 'Généré'}" injecté ! ${data.warning ? `(${data.warning})` : ''}`);
      } else {
        throw new Error('Format de matrice invalide');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`Échec de la génération: ${err.message || err}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Animation states
  const [animSourceMode, setAnimSourceMode] = useState<'current' | 'scratch'>('current');
  const [animFrameCount, setAnimFrameCount] = useState<number>(4);
  const [animType, setAnimType] = useState<string>('shimmer');
  const [animPrompt, setAnimPrompt] = useState<string>('');
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState<boolean>(false);
  const [isExportingGif, setIsExportingGif] = useState<boolean>(false);

  const handleGenerateAnimationFromAI = async () => {
    setIsGeneratingAnimation(true);
    try {
      const hasDrawing = matrix.some((row) => row.some((c) => Boolean(c)));
      const payload = {
        currentMatrix: animSourceMode === 'current' && hasDrawing ? matrix : undefined,
        prompt: animPrompt.trim() || undefined,
        frameCount: animFrameCount,
        animationType: animType,
        size: gridSize,
      };

      const res = await fetch('/api/animate-pixel-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la génération de l animation.');
      }

      const data = await res.json();
      if (data && Array.isArray(data.frames) && data.frames.length >= 2) {
        const generatedFrames: AnimationFrame[] = data.frames.map((f: string[][], idx: number) => ({
          id: String(Date.now() + idx),
          pixels: f,
          durationMs: Math.round(1000 / fps),
        }));

        setFrames(generatedFrames);
        setActiveFrameIndex(0);
        setMatrix(generatedFrames[0].pixels);
        setIsPlaying(true); // Auto-play generated animation

        // Save first frame to history
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(JSON.parse(JSON.stringify(generatedFrames[0].pixels)));
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);

        // Update name
        if (data.prompt) {
          setIconName(data.prompt.charAt(0).toUpperCase() + data.prompt.slice(1));
        }

        // Add colors to palette
        const allColors = Array.from(new Set(data.frames.flat(2).filter(Boolean) as string[]));
        if (allColors.length > 0) {
          setPaletteColors((prev) => [...new Set([...allColors, ...prev])].slice(0, 24));
          setSelectedColor(allColors[0]);
        }

        onShowToast(`Animation IA générée (${data.frameCount} frames, style ${data.animationType}) !`);
      } else {
        throw new Error('Données de frames invalides reçues du serveur.');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`Échec de l'animation IA: ${err.message || err}`);
    } finally {
      setIsGeneratingAnimation(false);
    }
  };

  // Export Spritesheet
  const handleExportSpritesheet = (scale: number = 4) => {
    try {
      const dataUrl = generateHorizontalSpritesheet(frames, scale);
      if (!dataUrl) {
        throw new Error('Impossible de générer la spritesheet.');
      }
      downloadMediaFile(
        `${iconName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_spritesheet_${gridSize * scale}px.png`,
        dataUrl
      );
      onShowToast(`Spritesheet PNG (${frames.length} frames) exportée !`);
    } catch (err: any) {
      onShowToast(`Erreur export spritesheet: ${err.message || err}`);
    }
  };

  // Export Animated GIF
  const handleExportGif = async () => {
    setIsExportingGif(true);
    try {
      const blob = await generateAnimatedGif(frames, fps, 4);
      downloadMediaFile(
        `${iconName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_animated_${fps}fps.gif`,
        blob
      );
      onShowToast(`GIF animé exporté (${fps} FPS, ${frames.length} frames) !`);
    } catch (err: any) {
      console.error(err);
      onShowToast(`Erreur export GIF: ${err.message || err}`);
    } finally {
      setIsExportingGif(false);
    }
  };

  // Load initial icon if provided
  useEffect(() => {
    if (initialIcon) {
      setIconName(initialIcon.name);
      if (initialIcon.colors?.[0]) {
        setSelectedColor(initialIcon.colors[0]);
      }
    }
  }, [initialIcon]);

  // Handle grid size change
  const handleSizeChange = (newSize: CanvasSize) => {
    setGridSize(newSize);
    const newEmpty = createEmptyMatrix(newSize);
    setMatrix(newEmpty);
    setFrames([{ id: '1', pixels: newEmpty, durationMs: 250 }]);
    setActiveFrameIndex(0);
    setHistory([]);
    setHistoryIndex(-1);
    onShowToast(`Grille configurée en ${newSize}×${newSize}`);
  };

  // Push to history stack
  const saveStateToHistory = (newMatrix: string[][]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newMatrix)));
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  // Flood fill algorithm for bucket tool
  const floodFill = (startX: number, startY: number, targetColor: string, replacementColor: string) => {
    if (targetColor === replacementColor) return;
    const newMatrix = JSON.parse(JSON.stringify(matrix));
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
      if (newMatrix[y][x] === targetColor) {
        newMatrix[y][x] = replacementColor;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    setMatrix(newMatrix);
    saveStateToHistory(newMatrix);
  };

  // Paint pixel
  const handlePixelAction = (x: number, y: number) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    if (selectedTool === 'picker') {
      const picked = matrix[y][x];
      if (picked) {
        setSelectedColor(picked);
        setSelectedTool('pencil');
        onShowToast(`Couleur ${picked} pipettée !`);
      }
      return;
    }

    if (selectedTool === 'bucket') {
      const currentColor = matrix[y][x] || '';
      floodFill(x, y, currentColor, selectedColor);
      return;
    }

    const newColor = selectedTool === 'eraser' ? '' : selectedColor;
    if (matrix[y][x] === newColor) return;

    const newMatrix = JSON.parse(JSON.stringify(matrix));
    newMatrix[y][x] = newColor;
    setMatrix(newMatrix);

    // Sync with active frame
    const updatedFrames = [...frames];
    if (updatedFrames[activeFrameIndex]) {
      updatedFrames[activeFrameIndex].pixels = newMatrix;
      setFrames(updatedFrames);
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsMouseDown(true);
    saveStateToHistory(matrix);
    handlePixelAction(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown && selectedTool !== 'bucket' && selectedTool !== 'picker') {
      handlePixelAction(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setMatrix(JSON.parse(JSON.stringify(prev)));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setMatrix(JSON.parse(JSON.stringify(next)));
    }
  };

  // Clear Canvas
  const handleClear = () => {
    saveStateToHistory(matrix);
    const empty = createEmptyMatrix(gridSize);
    setMatrix(empty);
    onShowToast('Canevas effacé');
  };

  // 1-Click Shading (Auto-Bevel highlight on top/left, shadow on bottom/right)
  const handleAutoShading = () => {
    saveStateToHistory(matrix);
    const newMatrix = JSON.parse(JSON.stringify(matrix));
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (newMatrix[y][x]) {
          // If outer top or left, brighten slightly
          if (y === 0 || x === 0 || !newMatrix[y - 1]?.[x] || !newMatrix[y]?.[x - 1]) {
            newMatrix[y][x] = '#FFFFFF';
          } else if (y === gridSize - 1 || x === gridSize - 1 || !newMatrix[y + 1]?.[x] || !newMatrix[y]?.[x + 1]) {
            newMatrix[y][x] = '#141417';
          }
        }
      }
    }
    setMatrix(newMatrix);
    onShowToast('Ombrage biseauté automatique appliqué !');
  };

  // Animation timeline playback loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => {
        const next = (prev + 1) % frames.length;
        setMatrix(frames[next].pixels);
        return next;
      });
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlaying, frames, fps]);

  // Add frame to animation
  const handleAddFrame = () => {
    const newFrame: AnimationFrame = {
      id: String(Date.now()),
      pixels: JSON.parse(JSON.stringify(matrix)),
      durationMs: 250,
    };
    setFrames([...frames, newFrame]);
    setActiveFrameIndex(frames.length);
    onShowToast(`Frame #${frames.length + 1} ajoutée`);
  };

  // Save as Custom Icon
  const handleSaveToCatalog = () => {
    const pngDataUrl = matrixToPngDataUrl(matrix, 4);
    const uniqueColors = Array.from(new Set(matrix.flat().filter(Boolean)));

    const newIcon: CraftGridIcon = {
      id: Date.now(),
      name: iconName.trim() || 'Custom Pixel Sprite',
      cat: 'custom',
      colors: uniqueColors.length > 0 ? uniqueColors : [selectedColor],
      desc: `Sprite pixel art ${gridSize}x${gridSize} dessiné dans CraftGrid Studio`,
      art: 'cube-solid',
      c1: uniqueColors[0] || selectedColor,
      c2: uniqueColors[1] || selectedColor,
      isCustom: true,
      generatedImageUrl: pngDataUrl,
      customPixelMatrix: matrix,
    };

    onSaveIcon(newIcon);
    onShowToast(`Sprite "${newIcon.name}" enregistré dans le catalogue !`);
  };

  // Download PNG directly
  const handleDownloadPng = (scale: number = 8) => {
    const pngUrl = matrixToPngDataUrl(matrix, scale);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${iconName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${gridSize}x${gridSize}.png`;
    link.click();
    onShowToast(`Image PNG exportée (${gridSize * scale}x${gridSize * scale}px) !`);
  };

  return (
    <div 
      className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6"
      onMouseUp={handleMouseUp}
    >
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1F1F22] p-4 border border-[#2A2A2D]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0E0E11] border border-[#5CDBD5] flex items-center justify-center">
            <Pencil className="w-5 h-5 text-[#5CDBD5]" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-[#E4E1E6]">
              Pixel Studio — Éditeur Canvas & Sprites
            </h1>
            <p className="font-mono-code text-xs text-[#869392]">
              Dessinez pixel par pixel en 16×16, 32×32 ou 64×64 avec biseau automatique et timeline d'animation
            </p>
          </div>
        </div>

        {/* Resolution Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#0E0E11] p-0.5 border border-[#2A2A2D] font-mono-code text-xs">
            {([16, 32, 64] as CanvasSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-1 transition-colors ${
                  gridSize === size
                    ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                    : 'text-[#BBC9C8] hover:text-[#E4E1E6]'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveToCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs font-bold uppercase hover:bg-[#7CF8F1] transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer dans le Catalogue</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Tools + Center Canvas + Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Toolbar Column */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-[#1F1F22] p-4 border border-[#2A2A2D]">
          {/* Sprite Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sprite-name-input" className="font-mono-code text-xs uppercase text-[#A3B1B0]">
              Nom du sprite :
            </label>
            <input
              id="sprite-name-input"
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              aria-label="Nom du sprite"
              className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none"
            />
          </div>

          {/* AI Generator Section */}
          <div className="flex flex-col gap-2 p-3 bg-[#0E0E11] border border-[#5CDBD5]/30">
            <span className="font-mono-code text-xs uppercase text-[#5CDBD5] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générateur Pixel Art IA</span>
            </span>
            <p className="text-[10px] text-[#A3B1B0] leading-normal font-sans">
              Génère et injecte directement un sprite pixel art dans votre grille éditable. Laissez vide pour une surprise !
            </p>
            
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Épée magique violette scintillante..."
              aria-label="Prompt de génération de pixel art IA"
              className="p-2 bg-[#1B1B1E] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none h-14 resize-none placeholder:text-[#A3B1B0]"
            />

            {/* Inspiration presets */}
            <div className="flex flex-wrap gap-1" role="group" aria-label="Suggestions d'inspiration de sprites">
              {[
                { label: '⚔️ Épée', prompt: 'glowing diamond magic sword legendary icon' },
                { label: '🧪 Potion', prompt: 'mystical purple potion bottle sparking' },
                { label: '💎 Gemme', prompt: 'rare fiery red crystal ruby core' },
                { label: '🧱 Minerai', prompt: 'minecraft ore block with gold veins' },
                { label: '🛡️ Écu', prompt: 'ancient runed knight wood shield' },
                { label: '👾 Creeper', prompt: 'retro green creeper mob face snout' }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAiPrompt(preset.prompt)}
                  aria-label={`Inspiration ${preset.label}`}
                  className="px-1.5 py-0.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[9px] font-mono-code text-[#BBC9C8] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerateMatrixFromAI}
              disabled={isGeneratingAI}
              aria-label={isGeneratingAI ? 'Génération du pixel art en cours' : 'Générer le sprite pixel art via IA'}
              className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#5CDBD5]/10 hover:bg-[#5CDBD5]/20 border border-[#5CDBD5] text-[#5CDBD5] font-mono-code text-xs uppercase transition-all disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <span className="animate-spin text-sm">⌛</span>
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiPrompt.trim() ? 'Générer via IA' : 'Surprise / Aléatoire'}</span>
                </>
              )}
            </button>
          </div>

          {/* Tools Grid */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-code text-xs uppercase text-[#A3B1B0]">
              Outils de dessin :
            </label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Outils de dessin pixel art">
              <button
                type="button"
                onClick={() => setSelectedTool('pencil')}
                aria-pressed={selectedTool === 'pencil'}
                aria-label="Outil crayon"
                className={`flex items-center gap-2 p-2 border font-mono-code text-xs transition-colors ${
                  selectedTool === 'pencil'
                    ? 'bg-[#353438] border-[#5CDBD5] text-[#5CDBD5]'
                    : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                }`}
              >
                <Pencil className="w-4 h-4" />
                <span>Crayon</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('bucket')}
                aria-pressed={selectedTool === 'bucket'}
                aria-label="Outil pot de peinture"
                className={`flex items-center gap-2 p-2 border font-mono-code text-xs transition-colors ${
                  selectedTool === 'bucket'
                    ? 'bg-[#353438] border-[#5CDBD5] text-[#5CDBD5]'
                    : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                }`}
              >
                <PaintBucket className="w-4 h-4" />
                <span>Remplir</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('eraser')}
                aria-pressed={selectedTool === 'eraser'}
                aria-label="Outil gomme"
                className={`flex items-center gap-2 p-2 border font-mono-code text-xs transition-colors ${
                  selectedTool === 'eraser'
                    ? 'bg-[#353438] border-[#5CDBD5] text-[#5CDBD5]'
                    : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span>Gomme</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('picker')}
                aria-pressed={selectedTool === 'picker'}
                aria-label="Outil pipette de couleur"
                className={`flex items-center gap-2 p-2 border font-mono-code text-xs transition-colors ${
                  selectedTool === 'picker'
                    ? 'bg-[#353438] border-[#5CDBD5] text-[#5CDBD5]'
                    : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                }`}
              >
                <Pipette className="w-4 h-4" />
                <span>Pipette</span>
              </button>
            </div>
          </div>

          {/* Color Picker & Active Swatch */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="color-hex-input" className="font-mono-code text-xs uppercase text-[#A3B1B0]">
              Couleur active :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value.toUpperCase())}
                aria-label="Sélecteur visuel de couleur"
                className="w-10 h-10 bg-transparent border border-[#2A2A2D] cursor-pointer"
              />
              <input
                id="color-hex-input"
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value.toUpperCase())}
                aria-label="Code hexadécimal de la couleur active"
                className="flex-1 p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
              />
            </div>
          </div>

          {/* Quick Palette Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="palette-preset-select" className="font-mono-code text-xs uppercase text-[#A3B1B0]">
                Palettes rétro :
              </label>
              <select
                id="palette-preset-select"
                aria-label="Sélectionner une palette rétro prédéfinie"
                value={activePalette}
                onChange={(e) => {
                  const key = e.target.value as keyof typeof PALETTE_PRESETS;
                  setActivePalette(key);
                  setPaletteColors(PALETTE_PRESETS[key]);
                }}
                className="bg-[#0E0E11] text-[#BBC9C8] text-[11px] font-mono-code border border-[#2A2A2D] p-1"
              >
                <option value="minecraft">Minecraft Canon</option>
                <option value="pico8">PICO-8 (16c)</option>
                <option value="gameboy">Game Boy (4c)</option>
                <option value="nes">NES 8-Bit</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1 p-2 bg-[#0E0E11] border border-[#2A2A2D]">
              {paletteColors.map((hex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedColor(hex)}
                  className={`w-6 h-6 border transition-transform ${
                    selectedColor.toLowerCase() === hex.toLowerCase()
                      ? 'border-white scale-110 z-10'
                      : 'border-black/50'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Smart Shading & Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#2A2A2D]">
            <button
              type="button"
              onClick={handleAutoShading}
              className="flex items-center justify-center gap-1.5 p-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#FAEE4D] text-[#FAEE4D] font-mono-code text-xs uppercase"
              title="Ajoute automatiquement des biseaux clairs et sombres"
            >
              <SunMedium className="w-3.5 h-3.5" />
              <span>Biseautage Rétro 1-Clic</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[#BBC9C8] flex items-center justify-center disabled:opacity-30"
                title="Annuler (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[#BBC9C8] flex items-center justify-center disabled:opacity-30"
                title="Rétablir (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-[#1B1B1E] hover:bg-[#93000A]/30 border border-[#2A2A2D] text-[#FFB4AB] flex items-center justify-center"
                title="Effacer tout le canevas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Interactive Pixel Canvas Grid */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4 bg-[#1F1F22] p-4 md:p-6 border border-[#2A2A2D]">
          <div className="relative p-2 bg-[#0E0E11] border-2 border-[#2A2A2D] shadow-2xl select-none">
            {/* The Pixel Grid */}
            <div
              className="grid gap-[1px] bg-[#2A2A2D] border border-[#2A2A2D]"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: gridSize === 64 ? '448px' : gridSize === 32 ? '416px' : '384px',
                height: gridSize === 64 ? '448px' : gridSize === 32 ? '416px' : '384px',
              }}
            >
              {matrix.map((row, y) =>
                row.map((cellColor, x) => (
                  <div
                    key={`${x}-${y}`}
                    onMouseDown={() => handleMouseDown(x, y)}
                    onMouseEnter={() => handleMouseEnter(x, y)}
                    className="aspect-square cursor-crosshair transition-colors"
                    style={{
                      backgroundColor: cellColor || '#141417',
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <span className="font-mono-code text-[11px] text-[#869392]">
            Résolution active : {gridSize}×{gridSize} pixels • Clic maintenu pour dessiner en continu
          </span>
        </div>

        {/* Right: Live Preview & Sprite Animator Column */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-[#1F1F22] p-4 border border-[#2A2A2D]">
          <span className="font-headline text-sm font-bold text-[#E4E1E6]">
            Aperçus Réels & Animation
          </span>

          {/* Real Size Preview */}
          <div className="p-4 bg-[#0E0E11] border border-[#2A2A2D] flex flex-col items-center justify-center gap-3 min-h-[160px]">
            <span className="font-mono-code text-[10px] text-[#869392] uppercase">
              Rendu natif (64x64px & 24x24px)
            </span>
            <div className="flex items-center gap-6">
              <img
                src={matrixToPngDataUrl(matrix, 4)}
                alt="Aperçu 64"
                className="w-16 h-16 pixel-crisp border border-[#2A2A2D] bg-[#141417]"
              />
              <img
                src={matrixToPngDataUrl(matrix, 1.5)}
                alt="Aperçu 24"
                className="w-6 h-6 pixel-crisp border border-[#2A2A2D] bg-[#141417]"
              />
            </div>
          </div>

          {/* AI Animation Studio Box */}
          <div className="flex flex-col gap-2.5 p-3 bg-[#0E0E11] border border-[#FAEE4D]/30 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs uppercase text-[#FAEE4D] flex items-center gap-1.5 font-bold">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Animateur IA Multi-Frames</span>
              </span>
              <span className="text-[9px] font-mono-code px-1.5 py-0.5 bg-[#FAEE4D]/10 text-[#FAEE4D] border border-[#FAEE4D]/30">
                Boucle Rétro
              </span>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#1B1B1E] border border-[#2A2A2D]">
              <button
                type="button"
                onClick={() => setAnimSourceMode('current')}
                className={`py-1 text-[10px] font-mono-code transition-colors ${
                  animSourceMode === 'current'
                    ? 'bg-[#FAEE4D] text-[#141417] font-bold'
                    : 'text-[#BBC9C8] hover:text-[#E4E1E6]'
                }`}
              >
                Animer dessin
              </button>
              <button
                type="button"
                onClick={() => setAnimSourceMode('scratch')}
                className={`py-1 text-[10px] font-mono-code transition-colors ${
                  animSourceMode === 'scratch'
                    ? 'bg-[#FAEE4D] text-[#141417] font-bold'
                    : 'text-[#BBC9C8] hover:text-[#E4E1E6]'
                }`}
              >
                Créer de zéro
              </button>
            </div>

            {/* Frame Count Customizer (2 to 8 frames) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono-code text-[#869392]">
                <span>Nombre de frames :</span>
                <span className="text-[#FAEE4D] font-bold">{animFrameCount} frames</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[2, 3, 4, 6, 8].map((fc) => (
                  <button
                    key={fc}
                    type="button"
                    onClick={() => setAnimFrameCount(fc)}
                    className={`py-1 text-[10px] font-mono-code border transition-colors ${
                      animFrameCount === fc
                        ? 'bg-[#FAEE4D]/20 border-[#FAEE4D] text-[#FAEE4D] font-bold'
                        : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                    }`}
                  >
                    {fc}f
                  </button>
                ))}
              </div>
            </div>

            {/* Movement Presets */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono-code text-[#869392] uppercase">
                Style de mouvement :
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'shimmer', label: '✨ Brillance' },
                  { id: 'float', label: '🌊 Lévitation' },
                  { id: 'breathe', label: '💨 Respiration' },
                  { id: 'fire', label: '🔥 Flamme' },
                  { id: 'swing', label: '⚔️ Attaque' },
                  { id: 'custom', label: '✍️ Custom' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAnimType(preset.id)}
                    className={`py-1 px-1 text-[9px] font-mono-code truncate border transition-colors ${
                      animType === preset.id
                        ? 'bg-[#5CDBD5]/20 border-[#5CDBD5] text-[#5CDBD5] font-bold'
                        : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Prompt Input */}
            {(animSourceMode === 'scratch' || animType === 'custom') && (
              <input
                type="text"
                value={animPrompt}
                onChange={(e) => setAnimPrompt(e.target.value)}
                placeholder={
                  animSourceMode === 'scratch'
                    ? 'Ex: Cœur 8-bit qui bat avec lueur...'
                    : 'Ex: Fais battre les ailes doucement...'
                }
                className="p-1.5 bg-[#1B1B1E] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#FAEE4D] focus:outline-none placeholder:text-[#556463]"
              />
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleGenerateAnimationFromAI}
              disabled={isGeneratingAnimation}
              className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#FAEE4D]/15 hover:bg-[#FAEE4D]/25 border border-[#FAEE4D] text-[#FAEE4D] font-mono-code text-xs uppercase font-bold transition-all disabled:opacity-50"
            >
              {isGeneratingAnimation ? (
                <>
                  <span className="animate-spin text-sm">⌛</span>
                  <span>Génération ({animFrameCount}f)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {animSourceMode === 'current'
                      ? `Animer le dessin (${animFrameCount}f)`
                      : `Créer l'animation (${animFrameCount}f)`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Frame Animator Timeline */}
          <div className="flex flex-col gap-2 p-3 bg-[#0E0E11] border border-[#2A2A2D]">
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs uppercase text-[#FAEE4D] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Animation ({frames.length} frames)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1 text-xs font-mono-code flex items-center gap-1 ${
                  isPlaying ? 'text-[#FFB4AB]' : 'text-[#5CDBD5]'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Lire'}</span>
              </button>
            </div>

            {/* Frames list */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {frames.map((f, idx) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setActiveFrameIndex(idx);
                    setMatrix(f.pixels);
                  }}
                  className={`relative p-1 border cursor-pointer shrink-0 ${
                    activeFrameIndex === idx ? 'border-[#5CDBD5] bg-[#353438]' : 'border-[#2A2A2D] bg-[#1B1B1E]'
                  }`}
                >
                  <img
                    src={matrixToPngDataUrl(f.pixels, 1)}
                    alt={`Frame ${idx + 1}`}
                    className="w-8 h-8 pixel-crisp bg-[#141417]"
                  />
                  <span className="absolute bottom-0 right-1 text-[8px] font-mono-code text-[#BBC9C8]">
                    #{idx + 1}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFrame}
                className="w-10 h-10 border border-dashed border-[#2A2A2D] hover:border-[#5CDBD5] text-[#869392] hover:text-[#5CDBD5] flex items-center justify-center shrink-0"
                title="Dupliquer le dessin actuel en nouvelle frame"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* FPS Speed Slider */}
            <div className="flex items-center justify-between text-xs font-mono-code text-[#869392] pt-1">
              <span>Vitesse: {fps} FPS</span>
              <input
                type="range"
                min={1}
                max={12}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-24 accent-[#5CDBD5]"
              />
            </div>
          </div>

          {/* Export Downloads */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#2A2A2D]">
            <span className="font-mono-code text-[11px] uppercase text-[#869392] flex items-center justify-between">
              <span>Exports & Téléchargements :</span>
              <span className="text-[#5CDBD5] text-[9px]">{frames.length} frames</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportGif}
                disabled={isExportingGif}
                className="p-2 bg-[#1B1B1E] hover:bg-[#FAEE4D]/15 border border-[#FAEE4D]/50 text-xs font-mono-code text-[#FAEE4D] flex items-center justify-center gap-1.5 font-bold transition-colors disabled:opacity-50"
                title="Exporter un GIF animé direct à la vitesse FPS courante"
              >
                <Film className="w-3.5 h-3.5 text-[#FAEE4D]" />
                <span>{isExportingGif ? 'Encodage...' : 'GIF Animé'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSpritesheet(4)}
                className="p-2 bg-[#1B1B1E] hover:bg-[#5CDBD5]/15 border border-[#5CDBD5]/50 text-xs font-mono-code text-[#5CDBD5] flex items-center justify-center gap-1.5 font-bold transition-colors"
                title="Exporter une spritesheet PNG horizontale compatible moteurs de jeux"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#5CDBD5]" />
                <span>Spritesheet</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPng(4)}
                className="p-1.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[11px] font-mono-code text-[#BBC9C8] flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-[#BBC9C8]" />
                <span>Frame (64px)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPng(16)}
                className="p-1.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[11px] font-mono-code text-[#BBC9C8] flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-[#BBC9C8]" />
                <span>Frame (HD)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
