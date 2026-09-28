import React, { useState } from 'react';
import { 
  Gamepad2, 
  RotateCw, 
  Trash2, 
  Download, 
  Copy, 
  Sparkles, 
  ArrowRight, 
  Box 
} from 'lucide-react';
import { CraftGridIcon } from '../../types/icon';
import { PixelIconRenderer } from '../PixelIconRenderer';
import { generateCraftingRecipeJson, downloadFile } from '../../utils/promptCompiler';

interface SimulatorViewProps {
  icons: CraftGridIcon[];
  activeIcon: CraftGridIcon | null;
  onShowToast: (msg: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  icons,
  activeIcon,
  onShowToast,
}) => {
  // Hotbar state (9 slots)
  const [hotbarSlots, setHotbarSlots] = useState<(CraftGridIcon | null)[]>([
    icons[0] || null, // Grass
    icons[55] || null, // Diamond Sword
    icons[60] || null, // Diamond Pickaxe
    icons[61] || null, // Iron Axe
    icons[65] || null, // Apple
    icons[28] || null, // TNT
    icons[70] || null, // Ender Pearl
    icons[44] || null, // Beacon
    icons[80] || null, // Water Bucket
  ]);
  const [selectedHotbarIndex, setSelectedHotbarIndex] = useState<number>(0);

  // Chest slots (27 slots)
  const [chestSlots, setChestSlots] = useState<(CraftGridIcon | null)[]>(() => {
    return Array.from({ length: 27 }, (_, i) => icons[i % icons.length] || null);
  });

  // Item frame rotation
  const [frameRotation, setFrameRotation] = useState<number>(0);

  // 3x3 Crafting Table state
  const [craftingGrid, setCraftingGrid] = useState<(CraftGridIcon | null)[]>([
    null, icons[55] || null, null,
    null, icons[52] || null, null,
    null, icons[52] || null, null,
  ]);
  const [craftingOutput, setCraftingOutput] = useState<CraftGridIcon | null>(icons[53] || icons[0] || null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<CraftGridIcon | null>(icons[0] || null);
  const [recipeName, setRecipeName] = useState<string>('custom_sword_recipe');

  // Handle hotbar slot click
  const handleHotbarClick = (index: number) => {
    setSelectedHotbarIndex(index);
    const item = hotbarSlots[index];
    if (item) {
      onShowToast(`Slot #${index + 1} sélectionné: "${item.name}"`);
    }
  };

  // Set item to crafting slot
  const handleCraftSlotClick = (index: number) => {
    const updated = [...craftingGrid];
    updated[index] = selectedInventoryItem;
    setCraftingGrid(updated);
  };

  // Clear Crafting Grid
  const handleClearCrafting = () => {
    setCraftingGrid(Array(9).fill(null));
    onShowToast('Table de craft réinitialisée');
  };

  // Rotate Item in Frame
  const handleRotateFrame = () => {
    setFrameRotation((prev) => (prev + 45) % 360);
  };

  // Copy recipe JSON
  const handleCopyRecipeJson = () => {
    const json = generateCraftingRecipeJson(recipeName, craftingGrid, craftingOutput);
    navigator.clipboard.writeText(json);
    onShowToast('Fichier JSON de recette copié !');
  };

  // Download recipe JSON
  const handleDownloadRecipeJson = () => {
    const json = generateCraftingRecipeJson(recipeName, craftingGrid, craftingOutput);
    downloadFile(`${recipeName}.json`, json, 'application/json');
    onShowToast(`Recette "${recipeName}.json" téléchargée !`);
  };

  const selectedHotbarItem = hotbarSlots[selectedHotbarIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="bg-[#1F1F22] p-4 border border-[#2A2A2D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0E0E11] border border-[#FAEE4D] flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-[#FAEE4D]" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-[#E4E1E6]">
              Simulateur In-Game & Table de Crafting 3×3
            </h1>
            <p className="font-mono-code text-xs text-[#869392]">
              Testez la lisibilité de vos sprites dans les interfaces canoniques de Minecraft et composez des recettes réelles
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Minecraft Hotbar HUD & Item Frame Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Minecraft Hotbar HUD Simulator */}
        <div className="lg:col-span-8 bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="font-headline text-sm font-bold text-[#E4E1E6]">
              Simulateur Hotbar HUD (Barre d'action 9 slots)
            </span>
            <span className="font-mono-code text-xs text-[#869392]">
              Cliquez sur un slot pour le sélectionner
            </span>
          </div>

          {/* Minecraft Scenery Viewport */}
          <div className="relative h-64 bg-gradient-to-b from-[#25324D] via-[#3B4D66] to-[#456149] border-2 border-[#2A2A2D] flex flex-col justify-end p-6 overflow-hidden">
            {/* Voxel horizon line */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[#3B5435] border-t-2 border-[#263D22]" />

            {/* Active item tooltip popup */}
            {selectedHotbarItem && (
              <div className="self-center mb-3 px-3 py-1 bg-[#141417]/95 border-2 border-[#5CDBD5] text-[#FAEE4D] font-mono-code text-xs font-bold shadow-2xl animate-bounce">
                {selectedHotbarItem.name}
              </div>
            )}

            {/* The 9 Hotbar Slots */}
            <div className="relative z-10 self-center flex items-center bg-[#8F8F8F] p-1 border-2 border-[#373737] shadow-2xl">
              {hotbarSlots.map((item, idx) => {
                const isSelected = selectedHotbarIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleHotbarClick(idx)}
                    className={`w-12 h-12 bg-[#8B8B8B] border-2 flex items-center justify-center p-1.5 cursor-pointer relative transition-transform ${
                      isSelected
                        ? 'border-white ring-2 ring-white scale-110 z-20 shadow-2xl bg-[#A0A0A0]'
                        : 'border-[#373737] hover:bg-[#9E9E9E]'
                    }`}
                  >
                    {item ? (
                      <PixelIconRenderer icon={item} sizeClassName="w-8 h-8" />
                    ) : (
                      <div className="w-2 h-2 bg-[#707070]" />
                    )}
                    <span className="absolute bottom-0.5 right-1 font-mono-code text-[8px] text-[#373737] font-bold">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Item Frame Mockup */}
        <div className="lg:col-span-4 bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-headline text-sm font-bold text-[#E4E1E6]">
              Cadre d'Objet Mural (Item Frame)
            </span>
            <button
              type="button"
              onClick={handleRotateFrame}
              className="p-1 text-xs font-mono-code text-[#5CDBD5] flex items-center gap-1 hover:underline"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotation 45°</span>
            </button>
          </div>

          <div
            onClick={handleRotateFrame}
            className="h-64 bg-[#3B2818] border-4 border-[#22160C] flex flex-col items-center justify-center cursor-pointer relative shadow-inner group"
            title="Cliquer pour faire pivoter"
          >
            {/* Wooden Planks Wall Background */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(#000_2px,transparent_2px),linear-gradient(90deg,#000_2px,transparent_2px)] bg-[size:32px_32px]" />

            {/* The Leather Item Frame */}
            <div className="relative w-32 h-32 bg-[#855B32] border-4 border-[#472E16] shadow-2xl flex items-center justify-center">
              <div className="w-24 h-24 bg-[#B5854C] border-2 border-[#472E16] flex items-center justify-center shadow-inner">
                {activeIcon && (
                  <div
                    style={{
                      transform: `rotate(${frameRotation}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <PixelIconRenderer icon={activeIcon} sizeClassName="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            <span className="absolute bottom-2 font-mono-code text-[10px] text-[#BBC9C8]">
              {activeIcon?.name || 'Sélection'} • {frameRotation}°
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Interactive 3x3 Crafting Table Recipe Builder */}
      <div className="bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#5CDBD5]" />
            <div>
              <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
                Générateur de Recettes de Fabrication (Crafting Table 3×3)
              </h2>
              <p className="font-mono-code text-xs text-[#869392]">
                Composez un patron de craft, définissez l'objet produit et exportez le fichier JSON officiel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearCrafting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B1B1E] border border-[#2A2A2D] hover:bg-[#2A2A2D] text-xs font-mono-code text-[#FFB4AB]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider la grille</span>
            </button>
            <button
              type="button"
              onClick={handleCopyRecipeJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5CDBD5] text-[#003735] font-mono-code text-xs font-bold uppercase hover:bg-[#7CF8F1]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier JSON</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadRecipeJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAEE4D] text-[#353100] font-mono-code text-xs font-bold uppercase hover:bg-[#F2E746]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger JSON</span>
            </button>
          </div>
        </div>

        {/* Crafting Grid & Output Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3x3 Table Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3 bg-[#0E0E11] p-6 border-2 border-[#2A2A2D]">
            <span className="font-mono-code text-xs uppercase text-[#FAEE4D] font-bold">
              Grille de Fabrication (3×3)
            </span>

            <div className="grid grid-cols-3 gap-2 bg-[#8B8B8B] p-3 border-2 border-[#373737] shadow-xl">
              {craftingGrid.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCraftSlotClick(idx)}
                  className="w-16 h-16 bg-[#8B8B8B] border-2 border-[#373737] hover:border-[#5CDBD5] flex items-center justify-center p-2 cursor-pointer relative shadow-inner"
                  title="Cliquer pour placer l'ingrédient actif"
                >
                  {item ? (
                    <PixelIconRenderer icon={item} sizeClassName="w-10 h-10" />
                  ) : (
                    <span className="text-[#686868] font-mono-code text-xs">#{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>

            <span className="font-mono-code text-[11px] text-[#869392]">
              Sélectionnez un ingrédient ci-dessous puis cliquez sur un slot
            </span>
          </div>

          {/* Arrow */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center text-[#5CDBD5]">
            <ArrowRight className="w-8 h-8 hidden lg:block" />
            <span className="font-mono-code text-xs uppercase text-[#869392] mt-1">Produit</span>
          </div>

          {/* Result Slot */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3 bg-[#0E0E11] p-6 border-2 border-[#2A2A2D]">
            <span className="font-mono-code text-xs uppercase text-[#5CDBD5] font-bold">
              Objet Obtenu (Résultat)
            </span>

            <div className="w-20 h-20 bg-[#8B8B8B] border-4 border-[#373737] flex items-center justify-center p-2 shadow-2xl">
              {craftingOutput ? (
                <PixelIconRenderer icon={craftingOutput} sizeClassName="w-14 h-14" />
              ) : (
                <span className="text-[#373737] font-mono-code text-xs">Vide</span>
              )}
            </div>

            <div className="w-full flex flex-col gap-1.5 mt-2">
              <label className="font-mono-code text-[11px] uppercase text-[#869392]">
                Identifiant de la recette :
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="p-1.5 bg-[#1B1B1E] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
              />
            </div>
          </div>
        </div>

        {/* Quick Item Picker Palette from Catalog */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#2A2A2D]">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-xs uppercase text-[#BBC9C8]">
              Ingrédients disponibles (cliquez pour choisir) :
            </span>
            {selectedInventoryItem && (
              <span className="font-mono-code text-xs text-[#FAEE4D]">
                Actif : {selectedInventoryItem.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-[#0E0E11] border border-[#2A2A2D]">
            {icons.slice(0, 30).map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => setSelectedInventoryItem(icon)}
                className={`p-1.5 border shrink-0 transition-transform ${
                  selectedInventoryItem?.id === icon.id
                    ? 'border-[#FAEE4D] bg-[#353438] scale-105'
                    : 'border-[#2A2A2D] bg-[#1F1F22] hover:bg-[#2A2A2D]'
                }`}
                title={icon.name}
              >
                <PixelIconRenderer icon={icon} sizeClassName="w-8 h-8" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
