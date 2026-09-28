import React from 'react';
import { Search, X, Grid, LayoutGrid, Table, Star } from 'lucide-react';
import { IconCategory, ViewMode } from '../types/icon';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFiltered: number;
  totalItems: number;
  showOnlyFavorites?: boolean;
  onToggleFavorites?: () => void;
  favoriteCount?: number;
  categoryCounts: {
    all: number;
    block: number;
    item: number;
    mob: number;
    custom: number;
  };
}

const PALETTE_CHIPS = [
  { name: 'Cyan Diamant', hex: '#5CDBD5' },
  { name: 'Minerai d\'Or', hex: '#FAEE4D' },
  { name: 'Émeraude', hex: '#5E7C16' },
  { name: 'Redstone', hex: '#B02E26' },
  { name: 'Améthyste', hex: '#8932B8' },
  { name: 'Chêne Bois', hex: '#8F7748' },
  { name: 'Obsidienne/Noir', hex: '#1D1D21' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedColor,
  onColorChange,
  viewMode,
  onViewModeChange,
  totalFiltered,
  totalItems,
  showOnlyFavorites,
  onToggleFavorites,
  favoriteCount,
  categoryCounts,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Primary Toolbar Container */}
      <div className="bg-[#1F1F22] p-2 md:p-3 border border-[#2A2A2D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* Live Search */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#BBC9C8]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, couleur (#7FB238) ou catégorie..."
            aria-label="Rechercher des icônes par nom, couleur ou catégorie"
            className="w-full pl-9 pr-8 py-2 bg-[#0E0E11] text-[#E4E1E6] placeholder:text-[#A3B1B0] font-mono-code text-xs focus:outline-none focus:ring-1 focus:ring-[#5CDBD5] border border-[#2A2A2D] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Effacer la recherche"
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#A3B1B0] hover:text-[#E4E1E6]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Filtrer par catégorie">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#353438] text-[#FAEE4D] font-bold border-b-2 border-[#FAEE4D]'
                : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
            }`}
          >
            Tous ({categoryCounts.all})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'block'}
            onClick={() => onCategoryChange('block')}
            className={`px-3 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap ${
              selectedCategory === 'block'
                ? 'bg-[#353438] text-[#5CDBD5] font-bold border-b-2 border-[#5CDBD5]'
                : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
            }`}
          >
            Blocs ({categoryCounts.block})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'item'}
            onClick={() => onCategoryChange('item')}
            className={`px-3 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap ${
              selectedCategory === 'item'
                ? 'bg-[#353438] text-[#FAEE4D] font-bold border-b-2 border-[#FAEE4D]'
                : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
            }`}
          >
            Objets ({categoryCounts.item})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'mob'}
            onClick={() => onCategoryChange('mob')}
            className={`px-3 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap ${
              selectedCategory === 'mob'
                ? 'bg-[#353438] text-[#FFB6B1] font-bold border-b-2 border-[#FFB6B1]'
                : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
            }`}
          >
            Mobs ({categoryCounts.mob})
          </button>
          {categoryCounts.custom > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'custom'}
              onClick={() => onCategoryChange('custom')}
              className={`px-3 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap ${
                selectedCategory === 'custom'
                  ? 'bg-[#353438] text-[#7CF8F1] font-bold border-b-2 border-[#7CF8F1]'
                  : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
              }`}
            >
              Perso ({categoryCounts.custom})
            </button>
          )}

          {onToggleFavorites && (
            <button
              type="button"
              role="tab"
              aria-selected={showOnlyFavorites}
              onClick={onToggleFavorites}
              className={`px-2.5 py-1.5 font-mono-code text-xs uppercase transition-colors whitespace-nowrap flex items-center gap-1 ${
                showOnlyFavorites
                  ? 'bg-[#FAEE4D]/20 text-[#FAEE4D] font-bold border-b-2 border-[#FAEE4D]'
                  : 'bg-[#1B1B1E] text-[#BBC9C8] hover:text-[#FAEE4D] hover:bg-[#2A2A2D]'
              }`}
              title="Filtrer uniquement les favoris"
              aria-label="Filtrer uniquement les favoris"
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-[#FAEE4D]' : ''}`} />
              <span>Favoris ({favoriteCount ?? 0})</span>
            </button>
          )}
        </div>

        {/* View Switchers & Counter */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="font-mono-code text-xs text-[#BBC9C8] px-2 py-1 bg-[#1B1B1E] border border-[#2A2A2D]">
            {totalFiltered} / {totalItems}
          </span>
          <div className="flex items-center bg-[#1B1B1E] p-0.5 border border-[#2A2A2D]" role="group" aria-label="Mode d'affichage">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grille standard 64 pixels"
              className={`p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#353438] text-[#5CDBD5]'
                  : 'text-[#A3B1B0] hover:text-[#E4E1E6]'
              }`}
              title="Grille 64px standard"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('compact')}
              aria-pressed={viewMode === 'compact'}
              aria-label="Grille large 96 pixels"
              className={`p-1.5 transition-colors ${
                viewMode === 'compact'
                  ? 'bg-[#353438] text-[#5CDBD5]'
                  : 'text-[#A3B1B0] hover:text-[#E4E1E6]'
              }`}
              title="Grille large 96px"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="Vue tableau des spécifications"
              className={`p-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#353438] text-[#5CDBD5]'
                  : 'text-[#A3B1B0] hover:text-[#E4E1E6]'
              }`}
              title="Tableau des spécifications"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Color Palette Filters */}
      <div className="flex items-center gap-2 overflow-x-auto py-1" role="toolbar" aria-label="Filtres de couleur rapide">
        <span className="font-mono-code text-[11px] text-[#A3B1B0] uppercase shrink-0">
          Nuancier :
        </span>
        {PALETTE_CHIPS.map((chip) => {
          const isSelected = selectedColor.toLowerCase() === chip.hex.toLowerCase();
          return (
            <button
              key={chip.hex}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onColorChange(isSelected ? '' : chip.hex)}
              className={`px-2.5 py-1 bg-[#1B1B1E] hover:bg-[#2A2A2D] flex items-center gap-1.5 font-mono-code text-[11px] text-[#E4E1E6] transition-all border ${
                isSelected
                  ? 'border-[#5CDBD5] ring-1 ring-[#5CDBD5] text-[#5CDBD5] bg-[#353438]'
                  : 'border-[#2A2A2D]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 inline-block shrink-0"
                style={{ backgroundColor: chip.hex }}
              />
              <span className="whitespace-nowrap">{chip.name}</span>
            </button>
          );
        })}
        {selectedColor && (
          <button
            type="button"
            onClick={() => onColorChange('')}
            className="px-2 py-1 bg-[#1B1B1E] hover:bg-[#2A2A2D] text-[#A3B1B0] hover:text-[#E4E1E6] font-mono-code text-[11px] underline"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};
