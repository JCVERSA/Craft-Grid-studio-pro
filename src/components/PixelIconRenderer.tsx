import React from 'react';
import { CraftGridIcon } from '../types/icon';

interface PixelIconRendererProps {
  icon: CraftGridIcon;
  sizeClassName?: string;
}

const PixelIconRendererComponent: React.FC<PixelIconRendererProps> = ({
  icon,
  sizeClassName = "w-12 h-12",
}) => {
  const c1 = icon.c1 || icon.colors[0] || "#707070";
  const c2 = icon.c2 || icon.colors[1] || icon.colors[0] || "#5CDBD5";
  const bgOutline = "#141417";

  const renderContent = () => {
    switch (icon.art) {
      case "cube-dual":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c2} />
            <rect x="8" y="8" width="48" height="18" fill={c1} />
            <rect x="14" y="26" width="6" height="8" fill={c1} />
            <rect x="28" y="26" width="8" height="6" fill={c1} />
            <rect x="42" y="26" width="6" height="10" fill={c1} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "cube-solid":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="12" y="12" width="12" height="12" fill={c2} opacity="0.8" />
            <rect x="36" y="20" width="10" height="10" fill={c2} opacity="0.6" />
            <rect x="20" y="38" width="16" height="8" fill={c2} opacity="0.7" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "pattern-cobble":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="10" y="10" width="18" height="12" fill={c2} />
            <rect x="32" y="10" width="22" height="14" fill={c2} />
            <rect x="10" y="26" width="24" height="14" fill={c2} />
            <rect x="38" y="28" width="16" height="24" fill={c2} />
            <rect x="10" y="44" width="24" height="10" fill={c2} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "pattern-planks":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <line x1="8" y1="20" x2="56" y2="20" stroke={c2} strokeWidth="3" />
            <line x1="8" y1="32" x2="56" y2="32" stroke={c2} strokeWidth="3" />
            <line x1="8" y1="44" x2="56" y2="44" stroke={c2} strokeWidth="3" />
            <line x1="30" y1="8" x2="30" y2="20" stroke={c2} strokeWidth="2" />
            <line x1="42" y1="20" x2="42" y2="32" stroke={c2} strokeWidth="2" />
            <line x1="22" y1="32" x2="22" y2="44" stroke={c2} strokeWidth="2" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "pattern-bricks":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c2} />
            <rect x="10" y="10" width="20" height="10" fill={c1} />
            <rect x="34" y="10" width="20" height="10" fill={c1} />
            <rect x="10" y="24" width="12" height="10" fill={c1} />
            <rect x="26" y="24" width="20" height="10" fill={c1} />
            <rect x="50" y="24" width="4" height="10" fill={c1} />
            <rect x="10" y="38" width="20" height="10" fill={c1} />
            <rect x="34" y="38" width="20" height="10" fill={c1} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "ore":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="14" y="16" width="8" height="8" fill={c2} />
            <rect x="20" y="20" width="6" height="6" fill="#FFFFFF" opacity="0.6" />
            <rect x="36" y="14" width="10" height="8" fill={c2} />
            <rect x="24" y="32" width="12" height="8" fill={c2} />
            <rect x="16" y="42" width="8" height="8" fill={c2} />
            <rect x="38" y="38" width="8" height="10" fill={c2} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "cube-log":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c2} />
            <line x1="16" y1="8" x2="16" y2="56" stroke={c1} strokeWidth="3" />
            <line x1="28" y1="8" x2="28" y2="56" stroke={c1} strokeWidth="4" />
            <line x1="40" y1="8" x2="40" y2="56" stroke={c1} strokeWidth="3" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "cube-tile":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="12" y="12" width="40" height="40" fill="none" stroke={c2} strokeWidth="4" />
            <rect x="24" y="24" width="16" height="16" fill={c2} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "cube-frame":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} fillOpacity="0.3" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={c2} strokeWidth="4" />
            <line x1="14" y1="14" x2="28" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="36" x2="48" y2="48" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "bookshelf":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="12" y="12" width="40" height="16" fill="#3D2918" />
            <rect x="12" y="32" width="40" height="16" fill="#3D2918" />
            <rect x="14" y="14" width="6" height="12" fill={c2} />
            <rect x="22" y="14" width="8" height="12" fill="#3C44AA" />
            <rect x="32" y="14" width="6" height="12" fill="#5E7C16" />
            <rect x="40" y="14" width="8" height="12" fill="#FAEE4D" />
            <rect x="14" y="34" width="8" height="12" fill="#5E7C16" />
            <rect x="24" y="34" width="6" height="12" fill={c2} />
            <rect x="32" y="34" width="10" height="12" fill="#3C44AA" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "furnace":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="16" y="24" width="32" height="24" fill="#202020" />
            <polygon points="24,44 32,30 40,44" fill={c2} />
            <polygon points="28,44 32,36 36,44" fill="#FFF275" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "chest":
        return (
          <>
            <rect x="10" y="12" width="44" height="40" fill={c1} />
            <line x1="10" y1="26" x2="54" y2="26" stroke="#221C14" strokeWidth="3" />
            <rect x="28" y="22" width="8" height="10" fill={c2} />
            <rect x="10" y="12" width="44" height="40" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "tnt":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="8" y="22" width="48" height="16" fill={c2} />
            <rect x="14" y="26" width="36" height="8" fill="#1D1D21" />
            <line x1="32" y1="8" x2="32" y2="3" stroke="#444444" strokeWidth="2" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "pumpkin":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <rect x="16" y="20" width="8" height="8" fill={c2} />
            <rect x="40" y="20" width="8" height="8" fill={c2} />
            <rect x="28" y="28" width="8" height="6" fill={c2} />
            <polygon points="16,42 22,36 28,42 34,36 40,42 46,36 46,44 16,44" fill={c2} />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "cube-striped":
        return (
          <>
            <rect x="8" y="8" width="48" height="48" fill={c1} />
            <line x1="18" y1="8" x2="18" y2="56" stroke={c2} strokeWidth="4" />
            <line x1="32" y1="8" x2="32" y2="56" stroke={c2} strokeWidth="5" />
            <line x1="46" y1="8" x2="46" y2="56" stroke={c2} strokeWidth="4" />
            <rect x="8" y="8" width="48" height="48" fill="none" stroke={bgOutline} strokeWidth="3" />
          </>
        );

      case "beacon":
        return (
          <>
            <rect x="10" y="10" width="44" height="44" fill="#A0EAE7" fillOpacity="0.2" stroke={c1} strokeWidth="3" />
            <rect x="14" y="44" width="36" height="8" fill="#1D1D21" />
            <polygon points="32,18 42,32 32,42 22,32" fill={c2} />
          </>
        );

      case "item-gem":
        return (
          <>
            <polygon points="32,10 50,24 42,52 22,52 14,24" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <polygon points="32,14 44,24 38,46 26,46 20,24" fill={c2} />
            <polygon points="28,18 36,18 32,26" fill="#FFFFFF" opacity="0.8" />
          </>
        );

      case "item-ingot":
        return (
          <>
            <polygon points="14,36 26,18 48,18 52,36 38,50 16,50" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <polygon points="26,18 48,18 44,30 22,30" fill={c2} />
          </>
        );

      case "item-dust":
        return (
          <>
            <rect x="28" y="24" width="8" height="8" fill={c1} />
            <rect x="20" y="32" width="10" height="10" fill={c1} />
            <rect x="34" y="30" width="12" height="12" fill={c2} />
            <rect x="16" y="42" width="32" height="10" fill={c1} />
            <rect x="30" y="18" width="4" height="4" fill="#FFFFFF" />
          </>
        );

      case "item-stick":
        return (
          <>
            <line x1="14" y1="50" x2="50" y2="14" stroke={c1} strokeWidth="6" strokeLinecap="square" />
            <line x1="16" y1="48" x2="48" y2="16" stroke={c2} strokeWidth="2" />
          </>
        );

      case "item-sword":
        return (
          <>
            <line x1="20" y1="44" x2="52" y2="12" stroke={c1} strokeWidth="7" strokeLinecap="square" />
            <line x1="22" y1="42" x2="50" y2="14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="square" opacity="0.6" />
            <line x1="14" y1="42" x2="26" y2="54" stroke={c2} strokeWidth="5" />
            <line x1="10" y1="54" x2="16" y2="48" stroke="#3D2918" strokeWidth="5" />
          </>
        );

      case "item-pick":
        return (
          <>
            <line x1="16" y1="48" x2="44" y2="20" stroke={c2} strokeWidth="4" />
            <path d="M22,12 Q44,14 52,36" fill="none" stroke={c1} strokeWidth="7" strokeLinecap="square" />
          </>
        );

      case "item-tool":
        return (
          <>
            <line x1="16" y1="48" x2="44" y2="20" stroke={c2} strokeWidth="4" />
            <rect x="36" y="14" width="14" height="14" fill={c1} stroke={bgOutline} strokeWidth="2" />
          </>
        );

      case "item-bow":
        return (
          <>
            <path d="M16,16 Q48,32 16,48" fill="none" stroke={c1} strokeWidth="5" />
            <line x1="16" y1="16" x2="16" y2="48" stroke={c2} strokeWidth="2" />
          </>
        );

      case "item-arrow":
        return (
          <>
            <line x1="14" y1="50" x2="46" y2="18" stroke={c2} strokeWidth="3" />
            <polygon points="46,14 52,14 52,20 44,28 38,22" fill={c1} />
            <polygon points="12,46 16,52 20,48 14,42" fill="#FFFFFF" />
          </>
        );

      case "item-shield":
        return (
          <>
            <path d="M16,14 L48,14 L48,34 Q32,54 32,54 Q16,34 16,34 Z" fill={c1} stroke={c2} strokeWidth="4" />
            <rect x="28" y="24" width="8" height="8" fill={c2} />
          </>
        );

      case "item-apple":
        return (
          <>
            <circle cx="32" cy="34" r="16" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="30" y="12" width="4" height="8" fill={c2} />
            <circle cx="26" cy="28" r="3" fill="#FFFFFF" opacity="0.6" />
          </>
        );

      case "item-food":
        return (
          <>
            <ellipse cx="32" cy="34" rx="20" ry="12" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <line x1="22" y1="28" x2="26" y2="40" stroke={c2} strokeWidth="2" />
            <line x1="32" y1="26" x2="36" y2="42" stroke={c2} strokeWidth="2" />
            <line x1="42" y1="28" x2="44" y2="38" stroke={c2} strokeWidth="2" />
          </>
        );

      case "item-potion":
        return (
          <>
            <rect x="28" y="10" width="8" height="6" fill="#8F7748" />
            <rect x="26" y="16" width="12" height="6" fill={c2} />
            <circle cx="32" cy="38" r="14" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <circle cx="28" cy="34" r="3" fill="#FFFFFF" opacity="0.7" />
          </>
        );

      case "item-orb":
        return (
          <>
            <circle cx="32" cy="32" r="18" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <circle cx="32" cy="32" r="10" fill={c2} />
            <circle cx="28" cy="28" r="4" fill="#FFFFFF" opacity="0.7" />
          </>
        );

      case "item-eye":
        return (
          <>
            <circle cx="32" cy="32" r="18" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <circle cx="32" cy="32" r="10" fill={c2} />
            <rect x="30" y="24" width="4" height="16" fill="#1D1D21" />
          </>
        );

      case "item-tear":
        return (
          <>
            <path d="M32,14 Q44,34 38,44 Q32,50 26,44 Q20,34 32,14 Z" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <circle cx="30" cy="38" r="3" fill="#FFFFFF" />
          </>
        );

      case "item-star":
        return (
          <>
            <polygon points="32,8 38,26 56,32 38,38 32,56 26,38 8,32 26,26" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <polygon points="32,16 36,28 48,32 36,36 32,48 28,36 16,32 28,28" fill={c2} />
          </>
        );

      case "item-totem":
        return (
          <>
            <rect x="22" y="12" width="20" height="38" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="14" y="20" width="36" height="8" fill={c1} />
            <rect x="24" y="18" width="6" height="6" fill={c2} />
            <rect x="34" y="18" width="6" height="6" fill={c2} />
          </>
        );

      case "item-wings":
        return (
          <>
            <polygon points="32,16 16,36 24,50 32,38 40,50 48,36" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <line x1="32" y1="16" x2="32" y2="46" stroke={c2} strokeWidth="2" />
          </>
        );

      case "item-gauge":
        return (
          <>
            <circle cx="32" cy="32" r="18" fill="#1D1D21" stroke={c1} strokeWidth="4" />
            <line x1="32" y1="32" x2="32" y2="18" stroke={c2} strokeWidth="3" />
          </>
        );

      case "item-map":
        return (
          <>
            <rect x="14" y="14" width="36" height="36" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <line x1="20" y1="20" x2="44" y2="20" stroke={c2} strokeWidth="2" />
            <line x1="20" y1="32" x2="40" y2="32" stroke={c2} strokeWidth="2" />
            <rect x="34" y="36" width="6" height="6" fill="#B02E26" />
          </>
        );

      case "item-bucket":
        return (
          <>
            <path d="M18,16 L46,16 L42,48 L22,48 Z" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <ellipse cx="32" cy="20" rx="10" ry="4" fill={c2} />
          </>
        );

      case "item-bed":
        return (
          <>
            <rect x="10" y="24" width="44" height="16" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="10" y="24" width="12" height="16" fill={c2} />
            <rect x="12" y="40" width="4" height="6" fill="#8F7748" />
            <rect x="48" y="40" width="4" height="6" fill="#8F7748" />
          </>
        );

      case "item-book":
        return (
          <>
            <rect x="14" y="12" width="36" height="42" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <polygon points="32,24 40,32 32,40 24,32" fill={c2} />
            <line x1="20" y1="12" x2="20" y2="54" stroke="#B55FF2" strokeWidth="3" />
          </>
        );

      case "mob-creeper":
        return (
          <>
            <rect x="16" y="8" width="32" height="32" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="22" y="16" width="6" height="6" fill="#1D1D21" />
            <rect x="36" y="16" width="6" height="6" fill="#1D1D21" />
            <rect x="28" y="22" width="8" height="10" fill="#1D1D21" />
            <rect x="24" y="26" width="4" height="12" fill="#1D1D21" />
            <rect x="36" y="26" width="4" height="12" fill="#1D1D21" />
            <rect x="20" y="40" width="10" height="14" fill={c2} />
            <rect x="34" y="40" width="10" height="14" fill={c2} />
          </>
        );

      case "mob-humanoid":
        return (
          <>
            <rect x="20" y="10" width="24" height="20" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="18" y="30" width="28" height="16" fill={c2} />
            <rect x="22" y="46" width="8" height="10" fill="#29385C" />
            <rect x="34" y="46" width="8" height="10" fill="#29385C" />
            <rect x="24" y="18" width="4" height="4" fill="#1D1D21" />
            <rect x="36" y="18" width="4" height="4" fill="#1D1D21" />
          </>
        );

      case "mob-skeleton":
        return (
          <>
            <rect x="20" y="10" width="24" height="22" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="24" y="16" width="6" height="6" fill={c2} />
            <rect x="34" y="16" width="6" height="6" fill={c2} />
            <rect x="28" y="24" width="8" height="4" fill={c2} />
            <line x1="32" y1="32" x2="32" y2="48" stroke={c1} strokeWidth="6" />
            <line x1="22" y1="38" x2="42" y2="38" stroke={c1} strokeWidth="3" />
            <line x1="26" y1="48" x2="26" y2="58" stroke={c1} strokeWidth="3" />
            <line x1="38" y1="48" x2="38" y2="58" stroke={c1} strokeWidth="3" />
          </>
        );

      case "mob-enderman":
        return (
          <>
            <rect x="22" y="8" width="20" height="16" fill={c1} stroke={bgOutline} strokeWidth="2" />
            <rect x="24" y="14" width="5" height="2" fill={c2} />
            <rect x="35" y="14" width="5" height="2" fill={c2} />
            <line x1="32" y1="24" x2="32" y2="60" stroke={c1} strokeWidth="5" />
            <line x1="20" y1="24" x2="20" y2="60" stroke={c1} strokeWidth="3" />
            <line x1="44" y1="24" x2="44" y2="60" stroke={c1} strokeWidth="3" />
          </>
        );

      case "mob-spider":
        return (
          <>
            <ellipse cx="32" cy="32" rx="14" ry="10" fill={c1} stroke={bgOutline} strokeWidth="2" />
            <circle cx="28" cy="30" r="2" fill={c2} />
            <circle cx="36" cy="30" r="2" fill={c2} />
            <line x1="22" y1="28" x2="8" y2="18" stroke={c1} strokeWidth="3" />
            <line x1="22" y1="34" x2="8" y2="42" stroke={c1} strokeWidth="3" />
            <line x1="42" y1="28" x2="56" y2="18" stroke={c1} strokeWidth="3" />
            <line x1="42" y1="34" x2="56" y2="42" stroke={c1} strokeWidth="3" />
          </>
        );

      case "mob-pig":
        return (
          <>
            <rect x="18" y="16" width="28" height="24" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="24" y="26" width="16" height="10" fill={c2} />
            <rect x="27" y="30" width="3" height="3" fill="#4A1817" />
            <rect x="34" y="30" width="3" height="3" fill="#4A1817" />
            <rect x="20" y="20" width="4" height="4" fill="#1D1D21" />
            <rect x="40" y="20" width="4" height="4" fill="#1D1D21" />
            <rect x="20" y="40" width="6" height="10" fill={c1} />
            <rect x="38" y="40" width="6" height="10" fill={c1} />
          </>
        );

      case "mob-cow":
        return (
          <>
            <rect x="18" y="14" width="28" height="26" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="22" y="18" width="8" height="8" fill={c2} />
            <rect x="24" y="28" width="16" height="10" fill="#E8B5B5" />
            <rect x="14" y="10" width="4" height="6" fill="#888888" />
            <rect x="46" y="10" width="4" height="6" fill="#888888" />
            <rect x="20" y="40" width="6" height="12" fill={c1} />
            <rect x="38" y="40" width="6" height="12" fill={c1} />
          </>
        );

      case "mob-sheep":
        return (
          <>
            <rect x="14" y="14" width="36" height="30" fill={c1} stroke={bgOutline} strokeWidth="3" rx="4" />
            <rect x="26" y="20" width="12" height="16" fill={c2} />
            <rect x="20" y="44" width="6" height="10" fill="#8F7748" />
            <rect x="38" y="44" width="6" height="10" fill="#8F7748" />
          </>
        );

      case "mob-chicken":
        return (
          <>
            <rect x="22" y="14" width="20" height="24" fill={c1} stroke={bgOutline} strokeWidth="2" />
            <rect x="28" y="22" width="8" height="6" fill="#E6B800" />
            <rect x="30" y="28" width="4" height="6" fill={c2} />
            <rect x="26" y="38" width="4" height="12" fill="#E6B800" />
            <rect x="34" y="38" width="4" height="12" fill="#E6B800" />
          </>
        );

      case "mob-wolf":
        return (
          <>
            <rect x="20" y="14" width="24" height="22" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <polygon points="20,14 24,6 28,14" fill={c1} />
            <polygon points="36,14 40,6 44,14" fill={c1} />
            <rect x="26" y="24" width="12" height="8" fill="#545454" />
            <rect x="20" y="36" width="24" height="4" fill={c2} />
            <rect x="22" y="40" width="6" height="12" fill={c1} />
            <rect x="36" y="40" width="6" height="12" fill={c1} />
          </>
        );

      case "mob-villager":
        return (
          <>
            <rect x="22" y="10" width="20" height="26" fill={c1} stroke={bgOutline} strokeWidth="2" />
            <rect x="28" y="24" width="8" height="14" fill="#B58D5C" />
            <rect x="20" y="36" width="24" height="20" fill={c2} />
          </>
        );

      case "mob-golem":
        return (
          <>
            <rect x="18" y="8" width="28" height="28" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="30" y="20" width="4" height="12" fill="#B02E26" />
            <line x1="20" y1="12" x2="26" y2="28" stroke={c2} strokeWidth="3" />
            <rect x="14" y="36" width="36" height="18" fill={c1} />
          </>
        );

      case "mob-ghast":
        return (
          <>
            <rect x="14" y="12" width="36" height="32" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <line x1="22" y1="22" x2="28" y2="22" stroke="#444444" strokeWidth="3" />
            <line x1="36" y1="22" x2="42" y2="22" stroke="#444444" strokeWidth="3" />
            <rect x="28" y="30" width="8" height="6" fill="#222222" />
            <line x1="18" y1="44" x2="18" y2="56" stroke={c2} strokeWidth="3" />
            <line x1="26" y1="44" x2="26" y2="58" stroke={c2} strokeWidth="3" />
            <line x1="38" y1="44" x2="38" y2="58" stroke={c2} strokeWidth="3" />
            <line x1="46" y1="44" x2="46" y2="56" stroke={c2} strokeWidth="3" />
          </>
        );

      case "mob-blaze":
        return (
          <>
            <rect x="24" y="14" width="16" height="16" fill={c2} stroke={bgOutline} strokeWidth="2" />
            <line x1="14" y1="10" x2="14" y2="34" stroke={c1} strokeWidth="4" />
            <line x1="50" y1="10" x2="50" y2="34" stroke={c1} strokeWidth="4" />
            <line x1="20" y1="36" x2="20" y2="54" stroke={c1} strokeWidth="4" />
            <line x1="44" y1="36" x2="44" y2="54" stroke={c1} strokeWidth="4" />
          </>
        );

      case "mob-dragon":
        return (
          <>
            <rect x="20" y="16" width="24" height="20" fill={c1} stroke={bgOutline} strokeWidth="2" />
            <rect x="24" y="22" width="4" height="4" fill={c2} />
            <rect x="36" y="22" width="4" height="4" fill={c2} />
            <polygon points="12,12 24,20 16,36" fill={c1} />
            <polygon points="52,12 40,20 48,36" fill={c1} />
            <rect x="26" y="36" width="12" height="18" fill={c1} />
          </>
        );

      default:
        return (
          <>
            <rect x="10" y="10" width="44" height="44" fill={c1} stroke={bgOutline} strokeWidth="3" />
            <rect x="20" y="20" width="24" height="24" fill={c2} />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${sizeClassName} shrink-0 pixel-crisp drop-shadow-sm select-none`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={icon.name}
    >
      {renderContent()}
    </svg>
  );
};

export const PixelIconRenderer = React.memo(PixelIconRendererComponent, (prev, next) => {
  return (
    prev.icon.id === next.icon.id &&
    prev.icon.art === next.icon.art &&
    prev.icon.c1 === next.icon.c1 &&
    prev.icon.c2 === next.icon.c2 &&
    prev.icon.name === next.icon.name &&
    prev.sizeClassName === next.sizeClassName
  );
});
