import React, { useState } from 'react';
import { 
  Copy, 
  Terminal, 
  ChevronRight, 
  Sparkles, 
  Loader2, 
  Edit3, 
  Star, 
  Paintbrush, 
  Gamepad2, 
  Flame 
} from 'lucide-react';
import { CraftGridIcon } from '../types/icon';
import { PixelIconRenderer } from './PixelIconRenderer';
import { compileIconPrompt } from '../utils/promptCompiler';

interface InspectorPanelProps {
  icon: CraftGridIcon | null;
  onCopyText: (text: string, msg: string) => void;
  onNextIcon: () => void;
  onEditIcon: (icon: CraftGridIcon) => void;
  onIconUpdated: (updatedIcon: CraftGridIcon) => void;
  onToggleFavorite?: (iconId: number) => void;
  onOpenStudio?: (icon: CraftGridIcon) => void;
  onOpenSimulator?: (icon: CraftGridIcon) => void;
  onOpenPromptLab?: (icon: CraftGridIcon) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  icon,
  onCopyText,
  onNextIcon,
  onEditIcon,
  onIconUpdated,
  onToggleFavorite,
  onOpenStudio,
  onOpenSimulator,
  onOpenPromptLab,
}) => {
  const [is24pxScale, setIs24pxScale] = useState(false);
  const [showAiImage, setShowAiImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!icon) {
    return (
      <div className="w-full lg:w-[380px] bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col items-center justify-center text-center text-[#869392] min-h-[300px]">
        <p className="font-mono-code text-xs">Sélectionnez une icône pour afficher ses spécifications.</p>
      </div>
    );
  }

  const promptText = compileIconPrompt(icon);

  // Trigger Gemini API image generation
  const handleGenerateAiImage = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/generate-pixel-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, iconId: icon.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération de l\'image');
      }

      if (data.imageUrl) {
        const updated = {
          ...icon,
          generatedImageUrl: data.imageUrl,
          generatedAt: new Date().toLocaleTimeString(),
        };
        onIconUpdated(updated);
        setShowAiImage(true);
        const engineLabel = data.model === 'craftgrid-pixel-engine' ? 'Moteur pixel CraftGrid' : 'Gemini IA';
        onCopyText('', `Image pixel art générée avec succès via ${engineLabel} !`);
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError("Impossible de contacter le service de génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <aside className="w-full lg:w-[380px] shrink-0 sticky top-20 bg-[#1F1F22] p-4 border border-[#2A2A2D] flex flex-col gap-4 shadow-xl">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#5CDBD5] inline-block shadow-sm" />
          <h2 className="font-headline text-base font-bold text-[#E4E1E6] tracking-tight">
            Inspecteur de Prompt
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(icon.id)}
              className="p-1 hover:text-[#FAEE4D] text-[#869392] transition-colors"
              title={icon.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={`w-4 h-4 ${icon.isFavorite ? 'fill-[#FAEE4D] text-[#FAEE4D]' : ''}`} />
            </button>
          )}
          {icon.isCustom && (
            <span className="font-mono-code text-[10px] text-[#7CF8F1] bg-[#131316] px-1.5 py-0.5 border border-[#7CF8F1]/40">
              PERSO
            </span>
          )}
          <span className="font-mono-code text-[11px] text-[#FAEE4D] bg-[#2A2A2D] px-2 py-0.5 font-bold border border-[#3C4948]">
            #{icon.id}
          </span>
        </div>
      </div>

      {/* Main Preview Box & HUD */}
      <div className="flex flex-col gap-2">
        <div className="relative bg-[#0E0E11] p-4 flex flex-col items-center justify-center min-h-[210px] border border-[#2A2A2D] overflow-hidden group">
          {/* Subtle 8px pixel grid overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#7cf8f1_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

          {/* Asset Display */}
          <div
            className={`relative z-10 transition-transform duration-150 flex items-center justify-center ${
              is24pxScale ? 'scale-75' : ''
            }`}
          >
            {showAiImage && icon.generatedImageUrl ? (
              <div className="relative flex flex-col items-center">
                <img
                  src={icon.generatedImageUrl}
                  alt={`Génération IA ${icon.name}`}
                  className="w-24 h-24 object-contain pixel-crisp border border-[#5CDBD5]/50 shadow-md"
                />
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#5CDBD5] text-[#003735] font-mono-code text-[9px] font-bold">
                  IA
                </span>
              </div>
            ) : (
              <PixelIconRenderer
                icon={icon}
                sizeClassName={is24pxScale ? "w-6 h-6" : "w-24 h-24"}
              />
            )}
          </div>

          {/* Toggle between SVG and AI image if available */}
          {icon.generatedImageUrl && (
            <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
              <button
                type="button"
                onClick={() => setShowAiImage(false)}
                className={`px-1.5 py-0.5 text-[10px] font-mono-code transition-colors ${
                  !showAiImage
                    ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                    : 'bg-[#1F1F22] text-[#BBC9C8] hover:text-[#E4E1E6]'
                }`}
              >
                SVG
              </button>
              <button
                type="button"
                onClick={() => setShowAiImage(true)}
                className={`px-1.5 py-0.5 text-[10px] font-mono-code transition-colors ${
                  showAiImage
                    ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                    : 'bg-[#1F1F22] text-[#BBC9C8] hover:text-[#E4E1E6]'
                }`}
              >
                IA
              </button>
            </div>
          )}

          {/* Bottom HUD Bar */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 bg-[#1F1F22]/95 border border-[#2A2A2D] text-[#BBC9C8] font-mono-code text-[11px]">
            <span className="text-[#E4E1E6] font-bold truncate max-w-[150px]">
              {icon.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span>{is24pxScale ? "24x24px" : "64x64px"}</span>
              <button
                type="button"
                onClick={() => setIs24pxScale(!is24pxScale)}
                className="text-[#5CDBD5] hover:text-[#7CF8F1] uppercase underline"
              >
                {is24pxScale ? "64px" : "Test 24px"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[#869392] font-mono-code text-[11px] px-1">
          <span className="uppercase">Catégorie: {icon.cat}</span>
          <span>{icon.colors.length} Couleurs de référence</span>
        </div>
      </div>

      {/* Canon Reference Swatches */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono-code text-[11px] uppercase text-[#869392]">
          Nuances chromatiques de référence :
        </span>
        <div className="flex flex-wrap gap-1.5">
          {icon.colors.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onCopyText(hex, `Code hexadécimal ${hex} copié !`)}
              className="px-2 py-1 bg-[#0E0E11] hover:bg-[#2A2A2D] border border-[#2A2A2D] transition-colors flex items-center gap-1.5 font-mono-code text-xs text-[#E4E1E6]"
              title={`Cliquer pour copier ${hex}`}
            >
              <span
                className="w-3.5 h-3.5 inline-block shrink-0 border border-black/30"
                style={{ backgroundColor: hex }}
              />
              <span>{hex}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Direct Workspace Action Links */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#2A2A2D]">
        {onOpenStudio && (
          <button
            type="button"
            onClick={() => onOpenStudio(icon)}
            className="p-1.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[10px] font-mono-code text-[#5CDBD5] flex items-center justify-center gap-1"
            title="Ouvrir ce sprite dans le studio de dessin"
          >
            <Paintbrush className="w-3 h-3" />
            <span>Studio</span>
          </button>
        )}
        {onOpenSimulator && (
          <button
            type="button"
            onClick={() => onOpenSimulator(icon)}
            className="p-1.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[10px] font-mono-code text-[#FAEE4D] flex items-center justify-center gap-1"
            title="Tester dans la hotbar et l'inventaire"
          >
            <Gamepad2 className="w-3 h-3" />
            <span>Simulateur</span>
          </button>
        )}
        {onOpenPromptLab && (
          <button
            type="button"
            onClick={() => onOpenPromptLab(icon)}
            className="p-1.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[10px] font-mono-code text-[#FFB6B1] flex items-center justify-center gap-1"
            title="Tester dans le laboratoire multi-moteurs IA"
          >
            <Flame className="w-3 h-3" />
            <span>Lab IA</span>
          </button>
        )}
      </div>

      {/* AI Live Generation Trigger */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-[#2A2A2D]">
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerateAiImage}
          className="w-full py-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#5CDBD5] text-[#5CDBD5] font-mono-code text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#5CDBD5]" />
              <span>Génération IA en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#FAEE4D]" />
              <span>Générer l'icône avec Gemini IA</span>
            </>
          )}
        </button>

        {generationError && (
          <div className="p-2 bg-[#93000A]/20 border border-[#FFB4AB]/40 text-[#FFB4AB] text-xs font-mono-code">
            {generationError}
          </div>
        )}
      </div>

      {/* Compiled Generator Prompt Output */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono-code text-[11px] uppercase text-[#869392]">
            Prompt Compilé :
          </span>
          <button
            type="button"
            onClick={() => onCopyText(promptText, `Prompt pour "${icon.name}" copié !`)}
            className="flex items-center gap-1 font-mono-code text-xs text-[#5CDBD5] hover:text-[#7CF8F1]"
          >
            <Copy className="w-3 h-3" />
            <span>Copier</span>
          </button>
        </div>
        <textarea
          readOnly
          value={promptText}
          rows={6}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          className="w-full p-2.5 bg-[#0E0E11] text-[#E4E1E6] font-mono-code text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-[#5CDBD5] border border-[#2A2A2D] leading-relaxed shadow-inner select-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#2A2A2D]">
        <button
          type="button"
          onClick={() => onCopyText(promptText, `Prompt complet copié dans le presse-papier !`)}
          className="w-full py-2.5 bg-[#5CDBD5] text-[#003735] hover:bg-[#7CF8F1] font-mono-code text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-bold shadow-md"
        >
          <Terminal className="w-4 h-4" />
          <span>Copier le prompt complet</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEditIcon(icon)}
            className="py-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[#E4E1E6] font-mono-code text-xs uppercase transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3 h-3 text-[#FAEE4D]" />
            <span>Modifier</span>
          </button>

          <button
            type="button"
            onClick={onNextIcon}
            className="py-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[#E4E1E6] font-mono-code text-xs uppercase transition-colors flex items-center justify-center gap-1"
          >
            <span>Suivante</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
