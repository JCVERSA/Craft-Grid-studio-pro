import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Sliders, 
  Layers, 
  Upload, 
  Image as ImageIcon, 
  GitCompare, 
  Terminal, 
  Check 
} from 'lucide-react';
import { CraftGridIcon, AiEngine, PromptStyleModifiers } from '../../types/icon';
import { compileIconPrompt } from '../../utils/promptCompiler';
import { PixelIconRenderer } from '../PixelIconRenderer';

interface PromptLabViewProps {
  icons: CraftGridIcon[];
  activeIcon: CraftGridIcon | null;
  onShowToast: (msg: string) => void;
  onIconUpdated: (icon: CraftGridIcon) => void;
}

export const PromptLabView: React.FC<PromptLabViewProps> = ({
  icons,
  activeIcon,
  onShowToast,
  onIconUpdated,
}) => {
  const [engine, setEngine] = useState<AiEngine>('midjourney');
  const [modifiers, setModifiers] = useState<PromptStyleModifiers>({
    detailLevel: 50,
    weathering: 0,
    lighting: 'flat',
  });

  // Prompt Remix states
  const [remixItemA, setRemixItemA] = useState<CraftGridIcon | null>(icons[55] || null); // Diamond Sword
  const [remixItemB, setRemixItemB] = useState<CraftGridIcon | null>(icons[16] || null); // Netherrack

  // Image-to-prompt state
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [imagePromptResult, setImagePromptResult] = useState<string>('');

  const currentTargetIcon = activeIcon || icons[0];
  const compiledPrompt = currentTargetIcon
    ? compileIconPrompt(currentTargetIcon, engine, modifiers)
    : '';

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`${label} copié !`);
  };

  // Image-to-prompt file upload & palette extraction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImagePreview(dataUrl);

      // Extract colors using Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        const hexColors: string[] = [];
        for (let i = 0; i < data.length; i += 64) {
          const r = data[i].toString(16).padStart(2, '0');
          const g = data[i + 1].toString(16).padStart(2, '0');
          const b = data[i + 2].toString(16).padStart(2, '0');
          const hex = `#${r}${g}${b}`.toUpperCase();
          if (!hexColors.includes(hex) && hexColors.length < 4) {
            hexColors.push(hex);
          }
        }

        setExtractedColors(hexColors);
        const autoPrompt = `Generate a single standalone icon: ITEM — "${file.name.replace(/\.[^/.]+$/, '')}", Minecraft-inspired.
RESEARCHED REFERENCE COLORS FOR THIS ICON:
- Primary & secondary swatches: ${hexColors.join(', ')}
STYLE: Flat 2D pixel-art, 64x64px, transparent background, thin uniform dark outline.`;
        setImagePromptResult(autoPrompt);
        onShowToast('Nuancier extrait et prompt compilé !');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Build hybrid prompt
  const buildRemixPrompt = () => {
    if (!remixItemA || !remixItemB) return '';
    const combinedColors = Array.from(new Set([...remixItemA.colors, ...remixItemB.colors])).slice(0, 5);
    return `Generate a single standalone hybrid icon: "${remixItemA.name} fused with ${remixItemB.name}", Minecraft-inspired.
FUSED PALETTE: ${combinedColors.join(', ')}
CONCEPT: Hybridization of ${remixItemA.desc} with the elemental textures of ${remixItemB.desc}.
STYLE: Flat 2D pixel-art, 64x64px canvas, no 3D shading, straight-on front perspective, sharp retro outline.`;
  };

  const remixPromptText = buildRemixPrompt();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="bg-[#1F1F22] p-4 border border-[#2A2A2D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0E0E11] border border-[#5CDBD5] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#5CDBD5]" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-[#E4E1E6]">
              Prompt Lab & IA Avancée — Compilateur Multi-Moteurs
            </h1>
            <p className="font-mono-code text-xs text-[#869392]">
              Optimisez vos prompts pour Midjourney, SDXL, DALL-E et Flux, appliquez des modificateurs de patine et hybridez des icônes
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: AI Engine Presets & Style Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Engine Selector & Sliders */}
        <div className="lg:col-span-5 bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FAEE4D]" />
            <h2 className="font-headline text-sm font-bold text-[#E4E1E6]">
              Modificateurs de Style & Cible Moteur
            </h2>
          </div>

          {/* Engine Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-code text-xs uppercase text-[#869392]">
              Modèle d'IA cible :
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'standard' as AiEngine, label: 'Standard' },
                { id: 'midjourney' as AiEngine, label: 'Midjourney v6' },
                { id: 'sdxl' as AiEngine, label: 'SDXL / LoRA' },
                { id: 'dalle3' as AiEngine, label: 'DALL-E 3' },
                { id: 'flux' as AiEngine, label: 'Flux 1.1' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEngine(m.id)}
                  className={`p-2 font-mono-code text-xs uppercase border transition-colors ${
                    engine === m.id
                      ? 'bg-[#353438] border-[#5CDBD5] text-[#5CDBD5] font-bold'
                      : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-mono-code text-xs text-[#BBC9C8]">
              <span>Niveau de détail pixel :</span>
              <span className="text-[#5CDBD5]">{modifiers.detailLevel}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={modifiers.detailLevel}
              onChange={(e) =>
                setModifiers({ ...modifiers, detailLevel: Number(e.target.value) })
              }
              className="accent-[#5CDBD5]"
            />
            <div className="flex justify-between text-[9px] font-mono-code text-[#869392]">
              <span>Minimaliste (16c)</span>
              <span>Micro-dithering</span>
            </div>
          </div>

          {/* Weathering Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-mono-code text-xs text-[#BBC9C8]">
              <span>Usure & Craquelé (Weathering) :</span>
              <span className="text-[#FAEE4D]">{modifiers.weathering}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={modifiers.weathering}
              onChange={(e) =>
                setModifiers({ ...modifiers, weathering: Number(e.target.value) })
              }
              className="accent-[#FAEE4D]"
            />
            <div className="flex justify-between text-[9px] font-mono-code text-[#869392]">
              <span>Neuf & Pur</span>
              <span>Érodé & Craquelé</span>
            </div>
          </div>

          {/* Lighting Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-code text-xs uppercase text-[#869392]">
              Ambiance Lumineuse :
            </label>
            <select
              value={modifiers.lighting}
              onChange={(e) =>
                setModifiers({ ...modifiers, lighting: e.target.value as any })
              }
              className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
            >
              <option value="flat">Plat Rétro (Sans dégradé)</option>
              <option value="warm">Chaud & Naturel (Overworld)</option>
              <option value="dramatic">Ombres Dramatiques (Chiaroscuro)</option>
              <option value="nether">Incandescent (Nether Fire)</option>
              <option value="glow">Bioluminescent (Sculk / Glow)</option>
            </select>
          </div>
        </div>

        {/* Right: Compiled Prompt Output Area */}
        <div className="lg:col-span-7 bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5CDBD5]" />
              <span className="font-headline text-sm font-bold text-[#E4E1E6]">
                Prompt Compilé pour "{currentTargetIcon.name}" [{engine.toUpperCase()}]
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(compiledPrompt, `Prompt ${engine.toUpperCase()}`)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs uppercase font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </button>
          </div>

          <textarea
            readOnly
            value={compiledPrompt}
            rows={10}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            className="w-full p-3 bg-[#0E0E11] text-[#E4E1E6] font-mono-code text-xs resize-none border border-[#2A2A2D] focus:ring-1 focus:ring-[#5CDBD5] focus:outline-none leading-relaxed select-all"
          />

          <div className="flex items-center justify-between text-xs font-mono-code text-[#869392]">
            <span>Longueur: {compiledPrompt.length} caractères</span>
            <span>Optimisé pour les paramètres de génération 64x64</span>
          </div>
        </div>
      </div>

      {/* Section 2: Prompt Remix (Hybridation d'icônes) */}
      <div className="bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-[#FAEE4D]" />
          <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
            Prompt Remix — Hybridation & Fusion de Deux Icônes
          </h2>
        </div>
        <p className="font-mono-code text-xs text-[#869392]">
          Sélectionnez deux entités du catalogue pour fusionner leurs palettes de couleurs et leurs caractéristiques en un nouveau prompt conceptuel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Item A */}
          <div className="md:col-span-3 p-3 bg-[#0E0E11] border border-[#2A2A2D] flex flex-col items-center gap-2">
            <span className="font-mono-code text-[11px] text-[#5CDBD5] uppercase">Composant A</span>
            {remixItemA && <PixelIconRenderer icon={remixItemA} sizeClassName="w-12 h-12" />}
            <select
              value={remixItemA?.id || ''}
              onChange={(e) => {
                const found = icons.find((i) => i.id === Number(e.target.value));
                if (found) setRemixItemA(found);
              }}
              className="w-full p-1 bg-[#1B1B1E] text-xs font-mono-code text-[#E4E1E6] border border-[#2A2A2D]"
            >
              {icons.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 text-center font-headline text-2xl font-bold text-[#FAEE4D]">+</div>

          {/* Item B */}
          <div className="md:col-span-3 p-3 bg-[#0E0E11] border border-[#2A2A2D] flex flex-col items-center gap-2">
            <span className="font-mono-code text-[11px] text-[#FAEE4D] uppercase">Composant B</span>
            {remixItemB && <PixelIconRenderer icon={remixItemB} sizeClassName="w-12 h-12" />}
            <select
              value={remixItemB?.id || ''}
              onChange={(e) => {
                const found = icons.find((i) => i.id === Number(e.target.value));
                if (found) setRemixItemB(found);
              }}
              className="w-full p-1 bg-[#1B1B1E] text-xs font-mono-code text-[#E4E1E6] border border-[#2A2A2D]"
            >
              {icons.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* Resulting Hybrid Prompt */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs uppercase text-[#5CDBD5]">
                Prompt Hybride Compilé :
              </span>
              <button
                type="button"
                onClick={() => handleCopy(remixPromptText, 'Prompt hybride')}
                className="p-1 text-xs font-mono-code text-[#5CDBD5] hover:underline"
              >
                Copier
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={remixPromptText}
              className="p-2 bg-[#0E0E11] text-[#E4E1E6] font-mono-code text-[11px] border border-[#2A2A2D] resize-none select-all"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Image-to-Prompt (Rétro-ingénierie par import d'image) */}
      <div className="bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#5CDBD5]" />
          <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
            Image-to-Prompt — Rétro-Ingénierie Chromatique
          </h2>
        </div>
        <p className="font-mono-code text-xs text-[#869392]">
          Téléversez une image de référence pour en extraire instantanément le nuancier hexadécimal dominant et compiler le prompt 64×64 correspondant.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#0E0E11] border-2 border-dashed border-[#2A2A2D] hover:border-[#5CDBD5] transition-colors relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {uploadedImagePreview ? (
              <img
                src={uploadedImagePreview}
                alt="Import"
                className="max-h-32 object-contain pixel-crisp"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#869392]">
                <ImageIcon className="w-8 h-8" />
                <span className="font-mono-code text-xs">Glisser une image ou cliquer ici</span>
              </div>
            )}
          </div>

          <div className="md:col-span-8 flex flex-col gap-3">
            {extractedColors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-xs text-[#869392]">Couleurs extraites :</span>
                {extractedColors.map((c) => (
                  <div key={c} className="flex items-center gap-1 bg-[#0E0E11] px-2 py-0.5 border border-[#2A2A2D]">
                    <span className="w-3 h-3 inline-block" style={{ backgroundColor: c }} />
                    <span className="font-mono-code text-xs text-[#E4E1E6]">{c}</span>
                  </div>
                ))}
              </div>
            )}

            <textarea
              readOnly
              rows={4}
              placeholder="Le prompt rétro-ingénieré apparaîtra ici après importation d'une image..."
              value={imagePromptResult}
              className="w-full p-2 bg-[#0E0E11] text-[#E4E1E6] font-mono-code text-[11px] border border-[#2A2A2D] resize-none select-all"
            />

            {imagePromptResult && (
              <button
                type="button"
                onClick={() => handleCopy(imagePromptResult, 'Prompt image-to-prompt')}
                className="self-end px-3 py-1 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs font-bold uppercase"
              >
                Copier ce prompt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
