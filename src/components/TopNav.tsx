import React from 'react';
import { 
  Grid, 
  Paintbrush, 
  Gamepad2, 
  Sparkles, 
  Layers, 
  Plus, 
  Eye, 
  Command, 
  Star 
} from 'lucide-react';
import { MainTab } from '../types/icon';

interface TopNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  totalCount: number;
  favoriteCount: number;
  onOpenCustomModal: () => void;
  onOpenAccessibilityModal: () => void;
  onOpenShortcutsModal: () => void;
  showOnlyFavorites: boolean;
  onToggleFavoritesFilter: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  totalCount,
  favoriteCount,
  onOpenCustomModal,
  onOpenAccessibilityModal,
  onOpenShortcutsModal,
  showOnlyFavorites,
  onToggleFavoritesFilter,
}) => {
  const tabs = [
    { id: 'catalog' as MainTab, label: 'Catalogue & Inspecteur', icon: Grid },
    { id: 'studio' as MainTab, label: 'Pixel Studio', icon: Paintbrush },
    { id: 'simulator' as MainTab, label: 'Simulateur & Craft', icon: Gamepad2 },
    { id: 'promptlab' as MainTab, label: 'Prompt Lab & IA', icon: Sparkles },
    { id: 'export' as MainTab, label: 'Export Pipeline', icon: Layers },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#0E0E11]/95 backdrop-blur-md border-b border-[#2A2A2D] px-3 md:px-6 flex items-center justify-between gap-3">
      {/* Zone 1: Wordmark Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          onClick={() => onTabChange('catalog')}
          className="w-9 h-9 bg-[#1F1F22] border-2 border-[#5CDBD5] flex items-center justify-center shadow-inner cursor-pointer hover:border-[#7CF8F1] transition-colors"
          title="Retour au catalogue principal"
        >
          <Grid className="w-5 h-5 text-[#5CDBD5]" />
        </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('catalog')}>
          <span className="font-headline text-lg font-bold tracking-tight text-[#E4E1E6]">
            CraftGrid
          </span>
          <span className="font-mono-code text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-[#2A2A2D] text-[#BBC9C8] border border-[#3C4948]">
            Studio Pro
          </span>
        </div>
      </div>

      {/* Zone 2: Five Primary Workspace Navigation Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-[#1B1B1E] p-1 border border-[#2A2A2D]" aria-label="Espaces de travail principaux">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono-code text-xs uppercase transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#353438] text-[#5CDBD5] font-bold border-b-2 border-[#5CDBD5]'
                  : 'text-[#BBC9C8] hover:text-[#E4E1E6] hover:bg-[#2A2A2D]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5CDBD5]' : 'text-[#A3B1B0]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Select dropdown for small screens */}
      <div className="flex lg:hidden items-center">
        <select
          value={activeTab}
          aria-label="Sélectionner l'espace de travail"
          onChange={(e) => onTabChange(e.target.value as MainTab)}
          className="bg-[#1B1B1E] text-[#E4E1E6] text-xs font-mono-code p-1.5 border border-[#2A2A2D]"
        >
          {tabs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Zone 3: Actions & Quick Utilities */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Favorites quick toggle */}
        <button
          type="button"
          onClick={onToggleFavoritesFilter}
          aria-pressed={showOnlyFavorites}
          aria-label={showOnlyFavorites ? "Afficher toutes les icônes" : `Filtrer les favoris (${favoriteCount})`}
          className={`p-1.5 border transition-all ${
            showOnlyFavorites
              ? 'bg-[#FAEE4D]/20 border-[#FAEE4D] text-[#FAEE4D]'
              : 'bg-[#1F1F22] border-[#2A2A2D] text-[#A3B1B0] hover:text-[#FAEE4D]'
          }`}
          title={showOnlyFavorites ? "Afficher toutes les icônes" : `Filtrer les favoris (${favoriteCount})`}
        >
          <Star className={`w-4 h-4 ${showOnlyFavorites ? 'fill-[#FAEE4D]' : ''}`} />
        </button>

        {/* Accessibility Modal Button */}
        <button
          type="button"
          onClick={onOpenAccessibilityModal}
          aria-label="Tester l'accessibilité chromatique & le daltonisme"
          className="p-1.5 bg-[#1F1F22] border border-[#2A2A2D] hover:border-[#3C4948] text-[#BBC9C8] hover:text-[#E4E1E6] transition-colors"
          title="Tester l'accessibilité chromatique & le daltonisme"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          type="button"
          onClick={onOpenShortcutsModal}
          aria-label="Ouvrir la liste des raccourcis clavier"
          className="hidden sm:flex p-1.5 bg-[#1F1F22] border border-[#2A2A2D] hover:border-[#3C4948] text-[#BBC9C8] hover:text-[#E4E1E6] transition-colors"
          title="Raccourcis clavier"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Create Icon Button */}
        <button
          type="button"
          onClick={onOpenCustomModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F22] border border-[#5CDBD5]/70 hover:border-[#5CDBD5] text-[#5CDBD5] hover:bg-[#5CDBD5]/10 text-xs font-mono-code uppercase transition-all whitespace-nowrap font-medium"
          title="Créer une nouvelle icône personnalisée"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Créer</span>
        </button>
      </div>
    </header>
  );
};
