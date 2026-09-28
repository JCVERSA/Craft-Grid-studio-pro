import React, { useState } from 'react';
import { X, Eye, Check } from 'lucide-react';
import { ColorblindMode, CraftGridIcon } from '../types/icon';
import { PixelIconRenderer } from './PixelIconRenderer';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIcon: CraftGridIcon | null;
  currentMode: ColorblindMode;
  onSetMode: (mode: ColorblindMode) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  activeIcon,
  currentMode,
  onSetMode,
}) => {
  if (!isOpen || !activeIcon) return null;

  const modes: { id: ColorblindMode; label: string; desc: string }[] = [
    { id: 'normal', label: 'Vision Standard', desc: 'Perception normale sans altération chromatique' },
    { id: 'protanopia', label: 'Protanopie (Rouge faible)', desc: 'Insensibilité aux longueurs d\'onde rouges (~1% des hommes)' },
    { id: 'deuteranopia', label: 'Deutéranopie (Vert faible)', desc: 'Insensibilité aux longueurs d\'onde vertes (~6% des hommes)' },
    { id: 'tritanopia', label: 'Tritanopie (Bleu faible)', desc: 'Insensibilité rare aux nuances bleues et jaunes' },
    { id: 'achromatopsia', label: 'Achromatopsie (Niveaux de gris)', desc: 'Monochromie totale sans perception des couleurs' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#1F1F22] border border-[#2A2A2D] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#2A2A2D] border-b border-[#353438] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#5CDBD5]" />
            <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
              Testeur d'Accessibilité Chromatique & Daltonisme
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#869392] hover:text-[#E4E1E6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
          {/* Live comparison slot */}
          <div className="p-4 bg-[#0E0E11] border border-[#2A2A2D] flex items-center justify-around gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-mono-code text-[11px] text-[#869392] uppercase">Original</span>
              <div className="w-20 h-20 bg-[#1B1B1E] border border-[#2A2A2D] flex items-center justify-center p-2">
                <PixelIconRenderer icon={activeIcon} sizeClassName="w-14 h-14" />
              </div>
              <span className="font-mono-code text-[10px] text-[#BBC9C8]">{activeIcon.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span className="font-mono-code text-[11px] text-[#FAEE4D] uppercase">Simulé ({currentMode})</span>
              <div className={`w-20 h-20 bg-[#1B1B1E] border border-[#FAEE4D] flex items-center justify-center p-2 filter-${currentMode}`}>
                <PixelIconRenderer icon={activeIcon} sizeClassName="w-14 h-14" />
              </div>
              <span className="font-mono-code text-[10px] text-[#FAEE4D]">Lisibilité 64px</span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col gap-2">
            <span className="font-mono-code text-xs uppercase text-[#BBC9C8]">
              Profils de daltonisme :
            </span>
            <div className="grid grid-cols-1 gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSetMode(m.id)}
                  className={`p-3 text-left border flex items-center justify-between transition-colors ${
                    currentMode === m.id
                      ? 'bg-[#353438] border-[#5CDBD5] text-[#E4E1E6]'
                      : 'bg-[#1B1B1E] border-[#2A2A2D] text-[#BBC9C8] hover:bg-[#2A2A2D]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono-code text-xs font-bold text-[#E4E1E6]">{m.label}</span>
                    <span className="font-mono-code text-[11px] text-[#869392]">{m.desc}</span>
                  </div>
                  {currentMode === m.id && <Check className="w-4 h-4 text-[#5CDBD5] shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Colors contrast summary */}
          <div className="p-3 bg-[#1B1B1E] border border-[#2A2A2D] flex flex-col gap-1.5 text-xs font-mono-code">
            <span className="text-[#869392] uppercase">Nuances testées pour cet actif :</span>
            <div className="flex items-center gap-2 flex-wrap">
              {activeIcon.colors.map((c) => (
                <div key={c} className="flex items-center gap-1.5 bg-[#0E0E11] px-2 py-1 border border-[#2A2A2D]">
                  <span className="w-3 h-3 inline-block" style={{ backgroundColor: c }} />
                  <span className="text-[#E4E1E6] text-[11px]">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1B1B1E] border-t border-[#2A2A2D] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs uppercase font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
