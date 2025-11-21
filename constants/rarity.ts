import { Rarity } from "../types/game";

export type GlowLevel = "none" | "soft" | "medium" | "strong" | "radiant" | "cosmic";

export interface RarityStyle {
  color: string;
  borderWidth: number;
  glow: GlowLevel;
  icon: string;
  label: string;
  dropChance?: number;
}

export const RARITY_STYLE_MAP: Record<Rarity, RarityStyle> = {
  common: {
    color: "#9CA3AF",
    borderWidth: 1,
    glow: "none",
    icon: "circle",
    label: "Common",
    dropChance: 0.12,
  },
  uncommon: {
    color: "#10B981",
    borderWidth: 1,
    glow: "soft",
    icon: "sparkle",
    label: "Uncommon",
    dropChance: 0.03,
  },
  rare: {
    color: "#3B82F6",
    borderWidth: 1,
    glow: "medium",
    icon: "zap",
    label: "Rare",
    dropChance: 0.006,
  },
  epic: {
    color: "#8B5CF6",
    borderWidth: 2,
    glow: "strong",
    icon: "star",
    label: "Epic",
    dropChance: 0.0015,
  },
  legendary: {
    color: "#F59E0B",
    borderWidth: 2,
    glow: "radiant",
    icon: "crown",
    label: "Legendary",
    dropChance: 0.0002,
  },
};

export function getGlowStyles(glow: GlowLevel, color: string) {
  switch (glow) {
    case "none":
      return {};
    case "soft":
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
      };
    case "medium":
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
      };
    case "strong":
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
        elevation: 6,
      };
    case "radiant":
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 16,
        elevation: 8,
      };
    case "cosmic":
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 20,
        elevation: 10,
      };
    default:
      return {};
  }
}
