import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Copy, 
  Download, 
  Layers, 
  SearchX, 
  Terminal, 
  Star, 
  Paintbrush, 
  Gamepad2, 
  Sparkles, 
  Plus 
} from 'lucide-react';
import { CraftGridIcon, ViewMode, MainTab, ColorblindMode } from './types/icon';
import { CANONICAL_ICONS } from './data/canonicalIcons';
import { PixelIconRenderer } from './components/PixelIconRenderer';
import { TopNav } from './components/TopNav';
import { Toolbar } from './components/Toolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { BatchMatrixModal } from './components/BatchMatrixModal';
import { CustomIconModal } from './components/CustomIconModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { PixelStudioView } from './components/PixelStudio/PixelStudioView';
import { SimulatorView } from './components/GameSimulator/SimulatorView';
import { PromptLabView } from './components/PromptLab/PromptLabView';
import { ExportPipelineView } from './components/ExportPipeline/ExportPipelineView';
import { Toast } from './components/Toast';
import { compileIconPrompt, downloadFile, generateBatchPayload } from './utils/promptCompiler';

const DELTA_STORAGE_KEY = 'craftgrid_studio_delta_v1';
const LEGACY_STORAGE_KEY = 'craftgrid_studio_pro_icons_v2';

interface IconsDeltaStorage {
  favorites?: number[];
  customIcons?: CraftGridIcon[];
  overrides?: Record<number, Partial<CraftGridIcon>>;
}

export default function App() {
  // Main Tab Navigation state
  const [activeTab, setActiveTab] = useState<MainTab>('catalog');

  // Icons state with high-efficiency delta persistence
  const [icons, setIcons] = useState<CraftGridIcon[]>(() => {
    try {
      // 1. Try delta storage first
      const deltaSaved = localStorage.getItem(DELTA_STORAGE_KEY);
      if (deltaSaved) {
        const delta: IconsDeltaStorage = JSON.parse(deltaSaved);
        const canonicalMap = new Map(CANONICAL_ICONS.map((i) => [i.id, { ...i }]));

        // Apply favorites
        if (Array.isArray(delta.favorites)) {
          const favSet = new Set(delta.favorites);
          for (const icon of canonicalMap.values()) {
            if (favSet.has(icon.id)) {
              icon.isFavorite = true;
            }
          }
        }

        // Apply overrides (e.g. customized colors or art)
        if (delta.overrides && typeof delta.overrides === 'object') {
          for (const [idStr, override] of Object.entries(delta.overrides)) {
            const id = Number(idStr);
            const base = canonicalMap.get(id);
            if (base && override) {
              canonicalMap.set(id, { ...base, ...override });
            }
          }
        }

        const restored = Array.from(canonicalMap.values());
        if (Array.isArray(delta.customIcons) && delta.customIcons.length > 0) {
          restored.push(...delta.customIcons);
        }
        return restored;
      }

      // 2. Migration from legacy bulky storage
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        const parsed = JSON.parse(legacySaved);
        if (Array.isArray(parsed) && parsed.length >= 100) {
          // Immediately remove bulky legacy key to reclaim browser quota
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des deltas d icônes:', e);
    }
    return CANONICAL_ICONS;
  });

  // Active selected icon
  const [activeIconId, setActiveIconId] = useState<number>(1);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  // Modals & Toast State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<CraftGridIcon | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>('normal');

  // Search input ref for keyboard shortcut '/'
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Persist only deltas (favorites, custom icons, modifications) to avoid 5MB localStorage quota
  useEffect(() => {
    try {
      const canonicalMap = new Map(CANONICAL_ICONS.map((i) => [i.id, i]));
      const favorites: number[] = [];
      const customIcons: CraftGridIcon[] = [];
      const overrides: Record<number, Partial<CraftGridIcon>> = {};

      for (const icon of icons) {
        if (icon.isFavorite) {
          favorites.push(icon.id);
        }

        if (icon.isCustom || icon.id >= 1000) {
          customIcons.push(icon);
        } else {
          const canonical = canonicalMap.get(icon.id);
          if (canonical) {
            const hasChanged =
              icon.name !== canonical.name ||
              icon.desc !== canonical.desc ||
              icon.art !== canonical.art ||
              icon.c1 !== canonical.c1 ||
              icon.c2 !== canonical.c2;
            if (hasChanged) {
              overrides[icon.id] = {
                name: icon.name,
                desc: icon.desc,
                art: icon.art,
                c1: icon.c1,
                c2: icon.c2,
                colors: icon.colors,
              };
            }
          }
        }
      }

      const deltaPayload: IconsDeltaStorage = {
        favorites: favorites.length > 0 ? favorites : undefined,
        customIcons: customIcons.length > 0 ? customIcons : undefined,
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
      };

      localStorage.setItem(DELTA_STORAGE_KEY, JSON.stringify(deltaPayload));
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde delta:', e);
    }
  }, [icons]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const copyToClipboard = (text: string, msg: string = 'Copié dans le presse-papier !') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(msg);
    }).catch(() => {
      showToast(msg);
    });
  };

  // Current active icon
  const currentIcon = useMemo(() => {
    return icons.find((i) => i.id === activeIconId) || icons[0] || null;
  }, [icons, activeIconId]);

  // Toggle favorite for an icon
  const handleToggleFavorite = (iconId: number) => {
    setIcons((prev) =>
      prev.map((i) => {
        if (i.id === iconId) {
          const nextFav = !i.isFavorite;
          showToast(nextFav ? `"${i.name}" ajouté aux favoris ⭐` : `"${i.name}" retiré des favoris`);
          return { ...i, isFavorite: nextFav };
        }
        return i;
      })
    );
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        setIsBatchModalOpen(false);
        setIsCustomModalOpen(false);
        setIsAccessibilityModalOpen(false);
        setIsShortcutsModalOpen(false);
        return;
      }

      // Tab shortcuts 1-5
      if (e.key === '1') setActiveTab('catalog');
      if (e.key === '2') setActiveTab('studio');
      if (e.key === '3') setActiveTab('simulator');
      if (e.key === '4') setActiveTab('promptlab');
      if (e.key === '5') setActiveTab('export');

      // Next / Previous icon
      if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = icons.findIndex((i) => i.id === activeIconId);
        const nextIndex = (currentIndex + 1) % icons.length;
        setActiveIconId(icons[nextIndex].id);
      }
      if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = icons.findIndex((i) => i.id === activeIconId);
        const prevIndex = (currentIndex - 1 + icons.length) % icons.length;
        setActiveIconId(icons[prevIndex].id);
      }

      // Copy Prompt with 'C'
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && currentIcon) {
        copyToClipboard(compileIconPrompt(currentIcon), `Prompt pour "${currentIcon.name}" copié !`);
      }

      // Toggle Favorite with 'F'
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && currentIcon) {
        handleToggleFavorite(currentIcon.id);
      }

      // Search focus with '/'
      if (e.key === '/') {
        e.preventDefault();
        setActiveTab('catalog');
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [icons, activeIconId, currentIcon]);

  // Filtered list of icons
  const filteredIcons = useMemo(() => {
    return icons.filter((item) => {
      // Favorite filter
      if (showOnlyFavorites && !item.isFavorite) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'custom' && !item.isCustom) return false;
        if (selectedCategory !== 'custom' && item.cat !== selectedCategory) return false;
      }

      // Search query (name, category, colors, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.cat.toLowerCase().includes(q);
        const matchColors = item.colors.some((c) => c.toLowerCase().includes(q));
        const matchDesc = item.desc.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchColors && !matchDesc) return false;
      }

      // Color filter
      if (selectedColor) {
        const matchColor = item.colors.some(
          (c) => c.toLowerCase() === selectedColor.toLowerCase()
        );
        if (!matchColor) return false;
      }

      return true;
    });
  }, [icons, selectedCategory, searchQuery, selectedColor, showOnlyFavorites]);

  // Counts for header & categories
  const counts = useMemo(() => {
    const block = icons.filter((i) => i.cat === 'block').length;
    const item = icons.filter((i) => i.cat === 'item').length;
    const mob = icons.filter((i) => i.cat === 'mob').length;
    const custom = icons.filter((i) => i.isCustom).length;
    const favorites = icons.filter((i) => i.isFavorite).length;
    return {
      all: icons.length,
      block,
      item,
      mob,
      custom,
      favorites,
    };
  }, [icons]);

  // Handle icon selection
  const handleSelectIcon = (id: number) => {
    setActiveIconId(id);
  };

  // Handle next icon
  const handleNextIcon = () => {
    const currentIndex = icons.findIndex((i) => i.id === activeIconId);
    const nextIndex = (currentIndex + 1) % icons.length;
    setActiveIconId(icons[nextIndex].id);
  };

  // Handle saving newly created or edited icon
  const handleSaveIcon = (savedIcon: CraftGridIcon) => {
    const existingIndex = icons.findIndex((i) => i.id === savedIcon.id);
    if (existingIndex >= 0) {
      const updated = [...icons];
      updated[existingIndex] = savedIcon;
      setIcons(updated);
      showToast(`Icône "${savedIcon.name}" mise à jour !`);
    } else {
      setIcons([...icons, savedIcon]);
      setActiveIconId(savedIcon.id);
      showToast(`Nouvelle icône "${savedIcon.name}" ajoutée !`);
    }
  };

  // Update icon after AI generation
  const handleIconUpdated = (updatedIcon: CraftGridIcon) => {
    setIcons((prev) =>
      prev.map((i) => (i.id === updatedIcon.id ? updatedIcon : i))
    );
  };

  // Copy all prompts
  const handleCopyAllPrompts = () => {
    const text = icons
      .map(
        (item) =>
          `/* #${item.id} ${item.name} [${item.cat.toUpperCase()}] */\n${compileIconPrompt(
            item
          )}`
      )
      .join('\n\n---\n\n');
    copyToClipboard(text, `L'ensemble des ${icons.length} prompts a été copié !`);
  };

  // Download complete JSON spec
  const handleDownloadSpecJson = () => {
    const jsonPayload = generateBatchPayload(icons, 'json');
    downloadFile('craftgrid-minecraft-spec-v2.4.json', jsonPayload, 'application/json');
    showToast('Fichier JSON de spécification téléchargé !');
  };

  return (
    <div className={`min-h-screen bg-[#131316] text-[#E4E1E6] flex flex-col font-['Geist',sans-serif] ${colorblindMode !== 'normal' ? `filter-${colorblindMode}` : ''}`}>
      {/* SVG Filters for Colorblindness simulation */}
      <svg className="hidden">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Bar with Primary Navigation Tabs */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={counts.all}
        favoriteCount={counts.favorites}
        onOpenCustomModal={() => {
          setEditingIcon(null);
          setIsCustomModalOpen(true);
        }}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesFilter={() => setShowOnlyFavorites(!showOnlyFavorites)}
      />

      {/* Active Tab View */}
      <main className="w-full pt-16 flex-1 flex flex-col">
        {/* TAB 1: CATALOGUE & INSPECTOR */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col w-full">
            {/* Hero Section & Canonical Metric Cards */}
            <section className="w-full bg-[#0E0E11] border-b border-[#2A2A2D] px-4 md:px-8 py-8">
              <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex flex-col gap-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#1F1F22] text-[#5CDBD5] font-mono-code text-[11px] uppercase tracking-wider border border-[#2A2A2D]">
                        Ground Truth Suite Pro
                      </span>
                      <span className="text-[#869392] font-mono-code text-xs">
                        Spécification v2.4 • Pixel Art 64x64px
                      </span>
                    </div>
                    <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-[#E4E1E6]">
                      100 Icônes Pixel Art Minecraft — Suite de Prompts Canoniques
                    </h1>
                    <p className="text-sm text-[#BBC9C8] leading-relaxed max-w-3xl">
                      Icônes 2D plates, 64x64px, vue de face avec palettes de couleurs officielles extraites des textures canoniques du jeu.
                      Cliquez sur n'importe quelle icône pour examiner son prompt d'ingénierie, copier ses nuances hexadécimales en 1 clic ou lancer la génération d'image en direct via Gemini IA.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsBatchModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1F1F22] hover:bg-[#2A2A2D] text-[#FAEE4D] font-mono-code text-xs uppercase transition-colors border border-[#2A2A2D] shadow-sm font-semibold"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Matrice Batch</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAllPrompts}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#5CDBD5] text-[#003735] hover:bg-[#7CF8F1] font-mono-code text-xs uppercase transition-all shadow-md font-bold"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copier les 100 Prompts</span>
                    </button>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                  <div className="bg-[#1B1B1E] p-3 border border-[#2A2A2D] flex flex-col gap-1">
                    <span className="font-mono-code text-[11px] text-[#869392] uppercase">
                      Total Icônes
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline text-xl font-bold text-[#5CDBD5]">
                        {counts.all}
                      </span>
                      <span className="font-mono-code text-[11px] text-[#869392]">
                        / 100 Spec
                      </span>
                    </div>
                    <span className="font-mono-code text-[10px] text-[#BBC9C8]">
                      Entièrement Mappées
                    </span>
                  </div>

                  <div className="bg-[#1B1B1E] p-3 border border-[#2A2A2D] flex flex-col gap-1">
                    <span className="font-mono-code text-[11px] text-[#869392] uppercase">
                      Blocs
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline text-xl font-bold text-[#7CF8F1]">
                        {counts.block}
                      </span>
                      <span className="font-mono-code text-[11px] text-[#869392]">
                        entrées
                      </span>
                    </div>
                    <span className="font-mono-code text-[10px] text-[#BBC9C8] truncate">
                      Grass #7FB238 → Beacon
                    </span>
                  </div>

                  <div className="bg-[#1B1B1E] p-3 border border-[#2A2A2D] flex flex-col gap-1">
                    <span className="font-mono-code text-[11px] text-[#869392] uppercase">
                      Objets & Outils
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline text-xl font-bold text-[#FAEE4D]">
                        {counts.item}
                      </span>
                      <span className="font-mono-code text-[11px] text-[#869392]">
                        entrées
                      </span>
                    </div>
                    <span className="font-mono-code text-[10px] text-[#BBC9C8] truncate">
                      Diamond → Ench. Book
                    </span>
                  </div>

                  <div className="bg-[#1B1B1E] p-3 border border-[#2A2A2D] flex flex-col gap-1">
                    <span className="font-mono-code text-[11px] text-[#869392] uppercase">
                      Mobs & Entités
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline text-xl font-bold text-[#FFB6B1]">
                        {counts.mob}
                      </span>
                      <span className="font-mono-code text-[11px] text-[#869392]">
                        entités
                      </span>
                    </div>
                    <span className="font-mono-code text-[10px] text-[#BBC9C8] truncate">
                      Creeper → Ender Dragon
                    </span>
                  </div>

                  <div className="col-span-2 md:col-span-1 bg-[#1B1B1E] p-3 border border-[#2A2A2D] flex flex-col gap-1">
                    <span className="font-mono-code text-[11px] text-[#869392] uppercase">
                      Favoris Épinglés
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-headline text-xl font-bold text-[#FAEE4D]">
                        {counts.favorites}
                      </span>
                      <span className="font-mono-code text-[11px] text-[#869392]">
                        étoiles
                      </span>
                    </div>
                    <span className="font-mono-code text-[10px] text-[#BBC9C8]">
                      Accès prioritaire
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Studio Workspace Area (3-Column Docked Layout) */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start">
              {/* Main Working Grid / List Area */}
              <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
                {/* Toolbar Ribbon */}
                <Toolbar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalFiltered={filteredIcons.length}
                  totalItems={icons.length}
                  showOnlyFavorites={showOnlyFavorites}
                  onToggleFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  favoriteCount={counts.favorites}
                  categoryCounts={counts}
                />

                {/* Empty State */}
                {filteredIcons.length === 0 && (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-[#1F1F22] border border-[#2A2A2D] p-6">
                    <SearchX className="w-10 h-10 text-[#869392]" />
                    <h3 className="font-headline text-lg font-bold text-[#E4E1E6]">
                      Aucune icône ne correspond à votre filtre
                    </h3>
                    <p className="text-xs font-mono-code text-[#869392] max-w-md">
                      Essayez avec un autre nom, désactivez le filtre favoris ou sélectionnez la catégorie "Tous".
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedColor('');
                        setShowOnlyFavorites(false);
                      }}
                      className="mt-2 px-4 py-2 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs uppercase font-bold"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && filteredIcons.length > 0 && (
                  <div className="bg-[#1F1F22] border border-[#2A2A2D] overflow-x-auto shadow-sm">
                    <table className="w-full text-left font-mono-code text-xs">
                      <thead className="bg-[#2A2A2D] text-[#BBC9C8] uppercase border-b border-[#353438]">
                        <tr>
                          <th className="p-3 w-10 text-center">⭐</th>
                          <th className="p-3 w-12 text-center">#</th>
                          <th className="p-3 w-16">Aperçu</th>
                          <th className="p-3">Nom de l'icône</th>
                          <th className="p-3">Catégorie</th>
                          <th className="p-3">Nuances Hexadécimales</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2D]">
                        {filteredIcons.map((item) => {
                          const isSelected = item.id === activeIconId;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => handleSelectIcon(item.id)}
                              className={`hover:bg-[#2A2A2D]/80 transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#2A2A2D] ring-1 ring-inset ring-[#5CDBD5]' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(item.id);
                                  }}
                                  className="text-[#869392] hover:text-[#FAEE4D]"
                                >
                                  <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-[#FAEE4D] text-[#FAEE4D]' : ''}`} />
                                </button>
                              </td>
                              <td className="p-3 text-center text-[#869392]">#{item.id}</td>
                              <td className="p-3">
                                <div className="w-10 h-10 bg-[#0E0E11] border border-[#2A2A2D] flex items-center justify-center p-1">
                                  {item.generatedImageUrl ? (
                                    <img
                                      src={item.generatedImageUrl}
                                      alt={item.name}
                                      className="w-8 h-8 object-contain pixel-crisp"
                                    />
                                  ) : (
                                    <PixelIconRenderer icon={item} sizeClassName="w-8 h-8" />
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-[#E4E1E6]">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  {item.isCustom && (
                                    <span className="text-[9px] px-1 bg-[#131316] text-[#7CF8F1] border border-[#7CF8F1]/40">
                                      PERSO
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 text-[10px] uppercase bg-[#1B1B1E] text-[#BBC9C8] border border-[#2A2A2D]">
                                  {item.cat}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.colors.map((c) => (
                                    <span
                                      key={c}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(c, `Code ${c} copié !`);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] bg-[#0E0E11] px-1.5 py-0.5 text-[#BBC9C8] hover:text-[#5CDBD5] border border-[#2A2A2D]"
                                      title={`Copier ${c}`}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 inline-block shrink-0 border border-black/40"
                                        style={{ backgroundColor: c }}
                                      />
                                      <span>{c}</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(
                                      compileIconPrompt(item),
                                      `Prompt pour "${item.name}" copié !`
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-[#1B1B1E] hover:bg-[#5CDBD5] hover:text-[#003735] border border-[#2A2A2D] text-[11px] uppercase transition-colors font-medium"
                                >
                                  Copier Prompt
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grid & Compact Views */}
                {viewMode !== 'table' && filteredIcons.length > 0 && (
                  <div
                    className={`grid gap-2 ${
                      viewMode === 'compact'
                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
                        : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6'
                    }`}
                  >
                    {filteredIcons.map((item) => {
                      const isSelected = item.id === activeIconId;
                      const isLarge = viewMode === 'compact';
                      const svgSize = isLarge ? 'w-16 h-16' : 'w-12 h-12';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectIcon(item.id)}
                          className={`group relative bg-[#1F1F22] hover:bg-[#2A2A2D] transition-all cursor-pointer flex flex-col justify-between p-2.5 border ${
                            isSelected
                              ? 'border-[#5CDBD5] ring-2 ring-[#5CDBD5] bg-[#2A2A2D]'
                              : 'border-[#2A2A2D]'
                          } shadow-sm`}
                        >
                          {/* Tile Top Label: ID & Category & Favorite */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono-code text-[11px] text-[#869392]">
                              #{item.id}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(item.id);
                                }}
                                className="text-[#869392] hover:text-[#FAEE4D]"
                              >
                                <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-[#FAEE4D] text-[#FAEE4D]' : ''}`} />
                              </button>
                              {item.isCustom && (
                                <span className="font-mono-code text-[8px] text-[#7CF8F1] bg-[#131316] px-1 py-0.2 uppercase border border-[#7CF8F1]/40">
                                  PERSO
                                </span>
                              )}
                              <span className="font-mono-code text-[9px] text-[#FAEE4D] bg-[#0E0E11] px-1.5 py-0.2 uppercase border border-[#2A2A2D]">
                                {item.cat}
                              </span>
                            </div>
                          </div>

                          {/* Crisp 64x64 Slot Preview Well */}
                          <div className="w-full aspect-square bg-[#0E0E11] border border-[#2A2A2D] flex items-center justify-center p-2 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                            
                            {item.generatedImageUrl ? (
                              <div className="relative">
                                <img
                                  src={item.generatedImageUrl}
                                  alt={item.name}
                                  className={`${svgSize} object-contain pixel-crisp`}
                                />
                                <span className="absolute -bottom-1 -right-1 px-1 bg-[#5CDBD5] text-[#003735] font-mono-code text-[8px] font-bold">
                                  IA
                                </span>
                              </div>
                            ) : (
                              <PixelIconRenderer icon={item} sizeClassName={svgSize} />
                            )}
                          </div>

                          {/* Name & Hex Swatches */}
                          <div className="mt-2 flex flex-col gap-1">
                            <span
                              className="font-mono-code text-xs text-[#E4E1E6] font-semibold truncate"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1 overflow-hidden">
                              {item.colors.slice(0, 3).map((col) => (
                                <span
                                  key={col}
                                  className="w-3 h-2.5 inline-block shrink-0 border border-black/40"
                                  style={{ backgroundColor: col }}
                                  title={col}
                                />
                              ))}
                              <span className="font-mono-code text-[10px] text-[#869392] ml-auto shrink-0 truncate">
                                {item.colors[0]}
                              </span>
                            </div>
                          </div>

                          {/* Prompt Fast Action Button */}
                          <div className="mt-2 pt-1.5 border-t border-[#2A2A2D] flex items-center justify-between">
                            <span className="font-mono-code text-[10px] text-[#5CDBD5] hover:text-[#7CF8F1] uppercase flex items-center gap-1">
                              <Terminal className="w-3 h-3" />
                              Prompt
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  compileIconPrompt(item),
                                  `Prompt pour "${item.name}" copié !`
                                );
                              }}
                              className="p-1 text-[#869392] hover:text-[#5CDBD5] transition-colors"
                              title="Copier le prompt instantanément"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Inspector Dock */}
              <InspectorPanel
                icon={currentIcon}
                onCopyText={copyToClipboard}
                onNextIcon={handleNextIcon}
                onEditIcon={(target) => {
                  setEditingIcon(target);
                  setIsCustomModalOpen(true);
                }}
                onIconUpdated={handleIconUpdated}
                onToggleFavorite={handleToggleFavorite}
                onOpenStudio={() => setActiveTab('studio')}
                onOpenSimulator={() => setActiveTab('simulator')}
                onOpenPromptLab={() => setActiveTab('promptlab')}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PIXEL STUDIO CANVAS */}
        {activeTab === 'studio' && (
          <PixelStudioView
            initialIcon={currentIcon}
            onSaveIcon={handleSaveIcon}
            onShowToast={showToast}
          />
        )}

        {/* TAB 3: GAME SIMULATOR & CRAFTING */}
        {activeTab === 'simulator' && (
          <SimulatorView
            icons={icons}
            activeIcon={currentIcon}
            onShowToast={showToast}
          />
        )}

        {/* TAB 4: PROMPT LAB & ADVANCED AI */}
        {activeTab === 'promptlab' && (
          <PromptLabView
            icons={icons}
            activeIcon={currentIcon}
            onShowToast={showToast}
            onIconUpdated={handleIconUpdated}
          />
        )}

        {/* TAB 5: EXPORT PIPELINE & PACKS */}
        {activeTab === 'export' && (
          <ExportPipelineView
            icons={icons}
            activeIcon={currentIcon}
            onShowToast={showToast}
            onRestoreBackup={(restored) => {
              setIcons(restored);
              setActiveIconId(restored[0]?.id || 1);
            }}
          />
        )}
      </main>

      {/* Batch Matrix Modal */}
      <BatchMatrixModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        icons={icons}
        onCopySuccess={(msg) => showToast(msg)}
      />

      {/* Custom Icon Creator & Editor Modal */}
      <CustomIconModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingIcon(null);
        }}
        onSave={handleSaveIcon}
        editingIcon={editingIcon}
        nextId={icons.length > 0 ? Math.max(...icons.map((i) => i.id)) + 1 : 101}
      />

      {/* Accessibility Daltonism Simulator Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
        activeIcon={currentIcon}
        currentMode={colorblindMode}
        onSetMode={setColorblindMode}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full bg-[#0E0E11] border-t border-[#2A2A2D] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#5CDBD5]" />
            <span className="font-mono-code text-xs text-[#869392]">
              CraftGrid Studio Pro • Suite Complète de Création, Simulation & Export Pixel Art
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono-code text-xs text-[#869392]">
            <span>Minecraft Bedrock & Java Compatible</span>
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="text-[#5CDBD5] hover:underline"
            >
              Raccourcis clavier (cmd)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
