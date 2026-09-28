import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Sparkles } from 'lucide-react';
import { CraftGridIcon, IconCategory } from '../types/icon';
import { PixelIconRenderer } from './PixelIconRenderer';
import { compileIconPrompt } from '../utils/promptCompiler';

interface CustomIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (icon: CraftGridIcon) => void;
  editingIcon?: CraftGridIcon | null;
  nextId: number;
}

const ART_PRESETS = [
  { id: 'cube-solid', label: 'Cube Solide (Pierre/Terre)' },
  { id: 'cube-dual', label: 'Cube Bicolore (Herbe)' },
  { id: 'ore', label: 'Minerai Précieux' },
  { id: 'pattern-cobble', label: 'Pavés / Roche fêlée' },
  { id: 'pattern-planks', label: 'Planches de bois' },
  { id: 'pattern-bricks', label: 'Briques cuites' },
  { id: 'cube-tile', label: 'Bloc Sculpté / Dalle' },
  { id: 'item-gem', label: 'Gemme / Cristal Facetté' },
  { id: 'item-ingot', label: 'Lingot Métallique' },
  { id: 'item-sword', label: 'Épée / Lame' },
  { id: 'item-pick', label: 'Pioche de minage' },
  { id: 'item-tool', label: 'Outil / Hache' },
  { id: 'item-potion', label: 'Fiole de Potion' },
  { id: 'item-orb', label: 'Orbe / Perle Mystique' },
  { id: 'item-book', label: 'Livre Enchanté' },
  { id: 'mob-creeper', label: 'Entité Creeper' },
  { id: 'mob-humanoid', label: 'Créature Humanoïde' },
  { id: 'mob-dragon', label: 'Créature Ailée' },
];

export const CustomIconModal: React.FC<CustomIconModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIcon,
  nextId,
}) => {
  const [name, setName] = useState('');
  const [cat, setCat] = useState<IconCategory>('block');
  const [art, setArt] = useState('cube-solid');
  const [c1, setC1] = useState('#5CDBD5');
  const [c2, setC2] = useState('#1D1D21');
  const [colors, setColors] = useState<string[]>(['#5CDBD5', '#1D1D21']);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (editingIcon) {
      setName(editingIcon.name);
      setCat(editingIcon.cat);
      setArt(editingIcon.art);
      setC1(editingIcon.c1);
      setC2(editingIcon.c2);
      setColors(editingIcon.colors);
      setDesc(editingIcon.desc);
    } else {
      setName('');
      setCat('block');
      setArt('cube-solid');
      setC1('#5CDBD5');
      setC2('#1D1D21');
      setColors(['#5CDBD5', '#1D1D21']);
      setDesc('');
    }
  }, [editingIcon, isOpen]);

  if (!isOpen) return null;

  const currentIconPreview: CraftGridIcon = {
    id: editingIcon?.id ?? nextId,
    name: name || 'Nouvelle Icône',
    cat,
    colors: colors.length > 0 ? colors : [c1, c2],
    desc: desc || `Icône personnalisée avec nuances ${c1} et ${c2}`,
    art,
    c1,
    c2,
    isCustom: true,
  };

  const handleAddColor = (hex: string) => {
    if (colors.length < 5 && !colors.includes(hex)) {
      setColors([...colors, hex]);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...currentIconPreview,
      name: name.trim(),
      desc: desc.trim() || `Icône ${name} avec nuances ${c1} et ${c2}`,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1F1F22] border border-[#2A2A2D] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#2A2A2D] border-b border-[#353438] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#5CDBD5]" />
            <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
              {editingIcon ? `Modifier l'icône #${editingIcon.id}` : 'Créer une nouvelle icône pixel art'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {/* Top Preview Card */}
          <div className="p-4 bg-[#0E0E11] border border-[#2A2A2D] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1B1B1E] border border-[#2A2A2D] flex items-center justify-center p-2 relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#7cf8f1_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none" />
                <PixelIconRenderer icon={currentIconPreview} sizeClassName="w-12 h-12" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono-code text-[11px] text-[#FAEE4D]">#{currentIconPreview.id}</span>
                <span className="font-headline text-lg font-bold text-[#E4E1E6]">{currentIconPreview.name}</span>
                <span className="font-mono-code text-xs text-[#869392] uppercase">Catégorie: {currentIconPreview.cat}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 items-end">
              <span className="font-mono-code text-[10px] text-[#869392] uppercase">Nuances actives</span>
              <div className="flex items-center gap-1">
                {colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 inline-block border border-black/50"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Nom de l'icône *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sculk Catalyst, Lapis Block..."
                className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Catégorie *
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as IconCategory)}
                className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none"
              >
                <option value="block">Bloc</option>
                <option value="item">Objet / Item</option>
                <option value="mob">Mob / Entité</option>
                <option value="custom">Autre / Spécial</option>
              </select>
            </div>

            {/* Artwork preset */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Structure visuelle pixel art (Modèle SVG)
              </label>
              <select
                value={art}
                onChange={(e) => setArt(e.target.value)}
                className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none"
              >
                {ART_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color 1 */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Couleur Primaire (c1)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={c1}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setC1(val);
                    if (!colors.includes(val)) {
                      setColors([val, ...colors.slice(1)]);
                    }
                  }}
                  className="w-10 h-8 bg-transparent border border-[#2A2A2D] cursor-pointer"
                />
                <input
                  type="text"
                  value={c1}
                  onChange={(e) => setC1(e.target.value.toUpperCase())}
                  className="flex-1 p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
                />
              </div>
            </div>

            {/* Color 2 */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Couleur Secondaire (c2)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={c2}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setC2(val);
                    if (colors.length > 1) {
                      setColors([colors[0], val, ...colors.slice(2)]);
                    }
                  }}
                  className="w-10 h-8 bg-transparent border border-[#2A2A2D] cursor-pointer"
                />
                <input
                  type="text"
                  value={c2}
                  onChange={(e) => setC2(e.target.value.toUpperCase())}
                  className="flex-1 p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
                />
              </div>
            </div>

            {/* Extended Color Palette list */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                  Nuancier complet ({colors.length}/5)
                </label>
                <button
                  type="button"
                  onClick={() => handleAddColor('#FFFFFF')}
                  disabled={colors.length >= 5}
                  className="text-xs font-mono-code text-[#5CDBD5] hover:underline disabled:opacity-40"
                >
                  + Ajouter couleur
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {colors.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-[#0E0E11] px-2 py-1 border border-[#2A2A2D]"
                  >
                    <span
                      className="w-3.5 h-3.5 inline-block"
                      style={{ backgroundColor: col }}
                    />
                    <span className="font-mono-code text-xs text-[#E4E1E6]">{col}</span>
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="text-[#869392] hover:text-[#FFB4AB] ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">
                Description & Détails de texture (pour le prompt)
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Ex: Deep dark blue sculk matrix with pulsating teal tendrils and bone speckles"
                className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] focus:border-[#5CDBD5] focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-2 pt-3 border-t border-[#2A2A2D] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2A2A2D] text-[#E4E1E6] hover:bg-[#353438] text-xs font-mono-code uppercase transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5CDBD5] text-[#003735] hover:bg-[#7CF8F1] text-xs font-mono-code font-bold uppercase flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{editingIcon ? 'Enregistrer les modifications' : 'Ajouter à la suite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
