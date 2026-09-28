import React, { useState } from 'react';
import { X, Copy, Download, Layers } from 'lucide-react';
import { CraftGridIcon, BatchExportFormat } from '../types/icon';
import { generateBatchPayload, downloadFile } from '../utils/promptCompiler';

interface BatchMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  icons: CraftGridIcon[];
  onCopySuccess: (msg: string) => void;
}

export const BatchMatrixModal: React.FC<BatchMatrixModalProps> = ({
  isOpen,
  onClose,
  icons,
  onCopySuccess,
}) => {
  const [format, setFormat] = useState<BatchExportFormat>('standard');

  if (!isOpen) return null;

  const payload = generateBatchPayload(icons, format);

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    onCopySuccess(`Données de la matrice (${format.toUpperCase()}) copiées !`);
  };

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
    const mime = format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/plain';
    downloadFile(`craftgrid-matrix-100.${ext}`, payload, mime);
    onCopySuccess(`Fichier craftgrid-matrix-100.${ext} téléchargé !`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#1F1F22] border border-[#2A2A2D] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#2A2A2D] border-b border-[#353438] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#FAEE4D]" />
            <div>
              <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
                Matrice d'Exportation Groupée ({icons.length} Icônes)
              </h2>
              <p className="font-mono-code text-[11px] text-[#BBC9C8]">
                Compilateur prêt pour l'automatisation, les scripts et la génération en masse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#869392] hover:text-[#E4E1E6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Switcher Ribbon */}
        <div className="px-4 py-2 bg-[#0E0E11] border-b border-[#2A2A2D] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono-code text-[11px] text-[#869392] uppercase mr-1">
              Format cible :
            </span>
            <button
              type="button"
              onClick={() => setFormat('standard')}
              className={`px-3 py-1 font-mono-code text-xs transition-colors ${
                format === 'standard'
                  ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                  : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6]'
              }`}
            >
              Texte Multi-Prompts
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`px-3 py-1 font-mono-code text-xs transition-colors ${
                format === 'json'
                  ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                  : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6]'
              }`}
            >
              Manifeste JSON
            </button>
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`px-3 py-1 font-mono-code text-xs transition-colors ${
                format === 'csv'
                  ? 'bg-[#5CDBD5] text-[#003735] font-bold'
                  : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6]'
              }`}
            >
              Dataset CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#FAEE4D] text-[#353100] font-mono-code text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-[#F2E746] transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier les données</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#1B1B1E] border border-[#2A2A2D] text-[#E4E1E6] hover:bg-[#2A2A2D] font-mono-code text-xs uppercase flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#5CDBD5]" />
              <span>Télécharger</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#0E0E11] max-h-[550px]">
          <pre className="font-mono-code text-[11px] text-[#E4E1E6] whitespace-pre-wrap select-all leading-normal">
            {payload}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1B1B1E] border-t border-[#2A2A2D] flex items-center justify-between text-xs font-mono-code text-[#869392]">
          <span>{icons.length} entrées validées • Couleurs canoniques vérifiées</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#2A2A2D] text-[#E4E1E6] hover:bg-[#353438] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
