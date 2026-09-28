import React, { useState } from 'react';
import { 
  Layers, 
  Download, 
  Package, 
  Palette, 
  Code, 
  Upload, 
  Copy, 
  Check, 
  FileJson, 
  Loader2 
} from 'lucide-react';
import { CraftGridIcon } from '../../types/icon';
import { 
  generateBedrockMcpack, 
  generateJavaResourcePack, 
  generateAtlas 
} from '../../utils/packGenerator';
import { 
  downloadFile, 
  generateGplPalette, 
  generateCssVariables, 
  generateReactComponentCode 
} from '../../utils/promptCompiler';
import { svgToPngBlob } from '../../utils/svgToPng';

interface ExportPipelineViewProps {
  icons: CraftGridIcon[];
  activeIcon: CraftGridIcon | null;
  onShowToast: (msg: string) => void;
  onRestoreBackup: (restoredIcons: CraftGridIcon[]) => void;
}

export const ExportPipelineView: React.FC<ExportPipelineViewProps> = ({
  icons,
  activeIcon,
  onShowToast,
  onRestoreBackup,
}) => {
  // Bedrock pack options
  const [packName, setPackName] = useState<string>('CraftGrid 64x Canon Pack');
  const [packDesc, setPackDesc] = useState<string>('100 Pixel Art Icons Canoniques');
  const [isGeneratingPack, setIsGeneratingPack] = useState<boolean>(false);

  // Atlas options
  const [atlasSize, setAtlasSize] = useState<number>(512);
  const [atlasPreviewUrl, setAtlasPreviewUrl] = useState<string | null>(null);
  const [atlasJsonMap, setAtlasJsonMap] = useState<string>('');
  const [isGeneratingAtlas, setIsGeneratingAtlas] = useState<boolean>(false);

  // Selected icon for single exports
  const targetIcon = activeIcon || icons[0];

  // Generate Minecraft Bedrock .mcpack
  const handleExportBedrockMcpack = async () => {
    setIsGeneratingPack(true);
    try {
      const mcpackBlob = await generateBedrockMcpack(icons, packName, packDesc);
      const safeFilename = `${packName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.mcpack`;
      downloadFile(safeFilename, mcpackBlob, 'application/octet-stream');
      onShowToast(`Pack Bedrock "${safeFilename}" généré et téléchargé !`);
    } catch (e: any) {
      console.error(e);
      onShowToast(`Erreur lors de la génération du pack Bedrock: ${e.message}`);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  // Generate Java Resource Pack
  const handleExportJavaPack = async () => {
    setIsGeneratingPack(true);
    try {
      const javaBlob = await generateJavaResourcePack(icons, packName);
      downloadFile(`${packName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_java.zip`, javaBlob, 'application/zip');
      onShowToast(`Resource Pack Java Edition téléchargé !`);
    } catch (e: any) {
      console.error(e);
      onShowToast(`Erreur: ${e.message}`);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  // Generate Texture Atlas
  const handleGenerateAtlas = async () => {
    setIsGeneratingAtlas(true);
    try {
      const result = await generateAtlas(icons, atlasSize, 64);
      setAtlasPreviewUrl(result.atlasDataUrl);
      setAtlasJsonMap(result.jsonMap);
      onShowToast(`Texture Atlas ${atlasSize}×${atlasSize} généré !`);
    } catch (e: any) {
      console.error(e);
      onShowToast(`Erreur Atlas: ${e.message}`);
    } finally {
      setIsGeneratingAtlas(false);
    }
  };

  // Download Spritesheet Atlas PNG
  const handleDownloadAtlasPng = () => {
    if (!atlasPreviewUrl) return;
    const a = document.createElement('a');
    a.href = atlasPreviewUrl;
    a.download = `craftgrid_atlas_${atlasSize}x${atlasSize}.png`;
    a.click();
    onShowToast(`Spritesheet PNG téléchargé !`);
  };

  // Export Palettes (.GPL, CSS variables)
  const handleDownloadGpl = () => {
    const allUniqueColors = Array.from(new Set(icons.flatMap((i) => i.colors)));
    const gpl = generateGplPalette('CraftGrid 100 Canon Colors', allUniqueColors);
    downloadFile('craftgrid-palette.gpl', gpl, 'text/plain');
    onShowToast('Palette .GPL pour Aseprite / GIMP téléchargée !');
  };

  const handleCopyCssVars = () => {
    const allUniqueColors = Array.from(new Set(icons.flatMap((i) => i.colors))).slice(0, 30);
    const css = generateCssVariables('craftgrid', allUniqueColors);
    navigator.clipboard.writeText(css);
    onShowToast('Variables CSS copiées dans le presse-papier !');
  };

  const handleCopyReactCode = () => {
    const code = generateReactComponentCode(targetIcon);
    navigator.clipboard.writeText(code);
    onShowToast(`Composant React pour "${targetIcon.name}" copié !`);
  };

  // Export Multi-res PNG
  const handleExportResolutionPng = async (res: number) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges">
      <rect x="0" y="0" width="64" height="64" fill="${targetIcon.c1 || targetIcon.colors[0]}"/>
      <rect x="14" y="14" width="36" height="36" fill="${targetIcon.c2 || targetIcon.colors[1]}"/>
    </svg>`;

    try {
      const blob = await svgToPngBlob(svgString, res);
      downloadFile(`${targetIcon.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${res}px.png`, blob, 'image/png');
      onShowToast(`PNG ${res}×${res}px téléchargé !`);
    } catch {
      onShowToast('Échec de la conversion');
    }
  };

  // Backup & Restore
  const handleDownloadBackup = () => {
    const backupJson = JSON.stringify(icons, null, 2);
    downloadFile('craftgrid-backup-complete.json', backupJson, 'application/json');
    onShowToast('Sauvegarde complète du projet téléchargée !');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onRestoreBackup(parsed);
          onShowToast(`Sauvegarde restaurée avec succès (${parsed.length} icônes) !`);
        } else {
          onShowToast('Format de fichier de sauvegarde non valide.');
        }
      } catch {
        onShowToast('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="bg-[#1F1F22] p-4 border border-[#2A2A2D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0E0E11] border border-[#5CDBD5] flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#5CDBD5]" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-[#E4E1E6]">
              Pipeline d'Exportation & Packs Professionnels
            </h1>
            <p className="font-mono-code text-xs text-[#869392]">
              Générez des Resource Packs Minecraft Bedrock (.mcpack) et Java, des Texture Atlas, des palettes .GPL et des sauvegardes
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Minecraft Bedrock .mcpack & Java Resource Packs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bedrock Pack Generator */}
        <div className="bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#5CDBD5]" />
            <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
              Générateur Minecraft Bedrock (.mcpack)
            </h2>
          </div>
          <p className="font-mono-code text-xs text-[#869392]">
            Crée une archive .mcpack avec manifest UUID v4, icône de pack et arborescence de textures compatible avec Windows 10/11, iOS, Android et consoles.
          </p>

          <div className="flex flex-col gap-2">
            <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">Nom du Pack :</label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono-code text-xs uppercase text-[#BBC9C8]">Description :</label>
            <input
              type="text"
              value={packDesc}
              onChange={(e) => setPackDesc(e.target.value)}
              className="p-2 bg-[#0E0E11] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isGeneratingPack}
              onClick={handleExportBedrockMcpack}
              className="flex-1 py-2.5 bg-[#5CDBD5] text-[#003735] hover:bg-[#7CF8F1] font-mono-code text-xs uppercase font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGeneratingPack ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compression...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Télécharger .mcpack ({icons.length} textures)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGeneratingPack}
              onClick={handleExportJavaPack}
              className="px-4 py-2.5 bg-[#1B1B1E] border border-[#2A2A2D] hover:bg-[#2A2A2D] text-[#BBC9C8] font-mono-code text-xs uppercase"
              title="Exporter pour Java Edition (pack.mcmeta)"
            >
              Format Java .zip
            </button>
          </div>
        </div>

        {/* Spritesheet & Texture Atlas Generator */}
        <div className="bg-[#1F1F22] p-6 border border-[#2A2A2D] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FAEE4D]" />
              <h2 className="font-headline text-base font-bold text-[#E4E1E6]">
                Texture Atlas / Spritesheet (Moteurs de jeu)
              </h2>
            </div>
            <select
              value={atlasSize}
              onChange={(e) => setAtlasSize(Number(e.target.value))}
              className="p-1 bg-[#0E0E11] text-xs font-mono-code text-[#E4E1E6] border border-[#2A2A2D]"
            >
              <option value={512}>512×512 px</option>
              <option value={1024}>1024×1024 px</option>
            </select>
          </div>

          <p className="font-mono-code text-xs text-[#869392]">
            Assemble l'ensemble des sprites dans une feuille unique pour Unity, Godot ou CSS Sprites.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingAtlas}
              onClick={handleGenerateAtlas}
              className="py-2 px-4 bg-[#FAEE4D] text-[#353100] font-mono-code text-xs font-bold uppercase hover:bg-[#F2E746] transition-colors"
            >
              {isGeneratingAtlas ? 'Génération...' : 'Compiler l\'Atlas'}
            </button>

            {atlasPreviewUrl && (
              <button
                type="button"
                onClick={handleDownloadAtlasPng}
                className="py-2 px-4 bg-[#1B1B1E] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] hover:bg-[#2A2A2D]"
              >
                Télécharger PNG Atlas
              </button>
            )}
          </div>

          {atlasPreviewUrl && (
            <div className="flex items-center gap-4 p-2 bg-[#0E0E11] border border-[#2A2A2D]">
              <img
                src={atlasPreviewUrl}
                alt="Atlas Preview"
                className="w-20 h-20 object-contain pixel-crisp border border-[#2A2A2D]"
              />
              <div className="flex flex-col gap-1 text-xs font-mono-code text-[#869392]">
                <span className="text-[#E4E1E6]">Atlas compilé avec succès</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(atlasJsonMap);
                    onShowToast('Coordonnées JSON copiées !');
                  }}
                  className="text-left text-[#5CDBD5] hover:underline"
                >
                  Copier le mapping JSON des coordonnées
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Multi-Resolution & Code Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Resolution PNG Export */}
        <div className="bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-3">
          <span className="font-headline text-sm font-bold text-[#E4E1E6]">
            Export Multi-Résolutions PNG
          </span>
          <span className="font-mono-code text-xs text-[#869392]">
            Actif sélectionné : "{targetIcon.name}"
          </span>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {[16, 32, 64, 128, 512].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => handleExportResolutionPng(res)}
                className="p-2 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] flex items-center justify-between"
              >
                <span>{res}×{res}px</span>
                <Download className="w-3.5 h-3.5 text-[#5CDBD5]" />
              </button>
            ))}
          </div>
        </div>

        {/* Palettes (.GPL, CSS) */}
        <div className="bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#FAEE4D]" />
            <span className="font-headline text-sm font-bold text-[#E4E1E6]">
              Export de Nuanciers & Palettes
            </span>
          </div>
          <span className="font-mono-code text-xs text-[#869392]">
            Compatible avec Aseprite, GIMP, Photoshop et CSS
          </span>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadGpl}
              className="p-2.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] flex items-center justify-between"
            >
              <span>Format .GPL (Aseprite / GIMP)</span>
              <Download className="w-3.5 h-3.5 text-[#FAEE4D]" />
            </button>
            <button
              type="button"
              onClick={handleCopyCssVars}
              className="p-2.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] flex items-center justify-between"
            >
              <span>Variables CSS (:root)</span>
              <Copy className="w-3.5 h-3.5 text-[#5CDBD5]" />
            </button>
          </div>
        </div>

        {/* Developer React & Project Backup */}
        <div className="bg-[#1F1F22] p-5 border border-[#2A2A2D] flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#5CDBD5]" />
            <span className="font-headline text-sm font-bold text-[#E4E1E6]">
              Code Web & Sauvegardes
            </span>
          </div>
          <span className="font-mono-code text-xs text-[#869392]">
            Composants React TSX et archivage JSON du studio
          </span>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyReactCode}
              className="p-2.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs font-mono-code text-[#E4E1E6] flex items-center justify-between"
            >
              <span>Composant React TypeScript</span>
              <Copy className="w-3.5 h-3.5 text-[#5CDBD5]" />
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="p-2.5 bg-[#1B1B1E] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs font-mono-code text-[#FAEE4D] flex items-center justify-between"
            >
              <span>Télécharger Sauvegarde JSON</span>
              <FileJson className="w-3.5 h-3.5" />
            </button>
            <label className="p-2.5 bg-[#0E0E11] hover:bg-[#1B1B1E] border border-dashed border-[#2A2A2D] text-xs font-mono-code text-[#BBC9C8] flex items-center justify-between cursor-pointer">
              <span>Restaurer fichier JSON</span>
              <Upload className="w-3.5 h-3.5 text-[#869392]" />
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
