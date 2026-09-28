import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J / ↓', label: 'Icône suivante' },
    { key: 'K / ↑', label: 'Icône précédente' },
    { key: 'C', label: 'Copier le prompt de l\'icône active' },
    { key: 'G', label: 'Lancer la génération IA (Gemini)' },
    { key: '/', label: 'Focaliser la barre de recherche' },
    { key: 'F', label: 'Ajouter/retirer des favoris ⭐' },
    { key: '1 - 5', label: 'Changer d\'onglet principal' },
    { key: 'ESC', label: 'Fermer les modales' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1F1F22] border border-[#2A2A2D] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#2A2A2D] border-b border-[#353438] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#FAEE4D]" />
            <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
              Raccourcis Clavier CraftGrid
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

        <div className="p-5 flex flex-col gap-2.5 overflow-y-auto font-mono-code text-xs">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-[#0E0E11] border border-[#2A2A2D]"
            >
              <span className="text-[#BBC9C8]">{s.label}</span>
              <kbd className="px-2 py-1 bg-[#2A2A2D] text-[#FAEE4D] border border-[#3C4948] font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#1B1B1E] border-t border-[#2A2A2D] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2A2A2D] text-[#E4E1E6] hover:bg-[#353438] font-mono-code text-xs uppercase"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
