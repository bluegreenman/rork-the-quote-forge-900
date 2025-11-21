import { Boon, CharacterStats, PrimaryClass, Rarity, ItemType } from "../types/game";

type ThemeFamily =
  | "fire"
  | "light"
  | "shadow"
  | "cosmic"
  | "water"
  | "earth"
  | "wind"
  | "mind";

const THEME_ELEMENTS: Record<ThemeFamily, string[]> = {
  fire: [
    "emberforged",
    "celestial fire",
    "inner flame",
    "dawnfire",
    "sacred ember",
    "burning light",
    "flame hymn",
    "eternal blaze",
    "phoenix spark",
    "starfire core",
  ],
  light: [
    "radiant path",
    "shining horizon",
    "starborn glow",
    "halo light",
    "dawn radiance",
    "luminous veil",
    "crystal beacon",
    "pure brilliance",
    "silver gleam",
    "golden aura",
  ],
  shadow: [
    "silent dusk",
    "deep shadow",
    "hidden eclipse",
    "whispering dark",
    "twilight veil",
    "midnight shroud",
    "quiet gloom",
    "umbral whisper",
    "moonless night",
    "shadow dance",
  ],
  cosmic: [
    "frozen starlight",
    "voidlight nebula",
    "cosmic hymn",
    "ancient constellation",
    "stellar whisper",
    "galaxy spiral",
    "void essence",
    "celestial dream",
    "aurora cascade",
    "infinity spark",
  ],
  water: [
    "tidal memory",
    "deepwater calm",
    "moonlit tide",
    "sea of glass",
    "oceanic whisper",
    "flowing current",
    "mirror pool",
    "sacred spring",
    "cascading grace",
    "depth reflection",
  ],
  earth: [
    "stonebound oath",
    "rooted strength",
    "iron earth",
    "mountain calm",
    "ancient stone",
    "bedrock heart",
    "granite will",
    "mossy foundation",
    "crystal vein",
    "earthen power",
  ],
  wind: [
    "wandering gale",
    "roaming wind",
    "traveling breeze",
    "skyway current",
    "hurricane whisper",
    "gentle zephyr",
    "storm blessing",
    "air's breath",
    "cloudborne spirit",
    "eternal drift",
  ],
  mind: [
    "quiet mind",
    "deep knowing",
    "inner vision",
    "silent clarity",
    "thought essence",
    "mental fortress",
    "cognitive spark",
    "wisdom flow",
    "contemplative void",
    "mindful echo",
  ],
};

const STAT_TO_THEME_FAMILIES: Record<string, ThemeFamily[]> = {
  insight: ["mind", "cosmic", "shadow"],
  devotion: ["fire", "light", "earth"],
  wonder: ["cosmic", "wind", "water"],
  clarity: ["light", "mind", "cosmic"],
  fortune: ["wind", "light", "cosmic"],
  endurance: ["earth", "fire", "shadow"],
  focus: ["mind", "earth", "fire"],
};

const CLASS_TO_THEME_FAMILIES: Record<PrimaryClass, ThemeFamily[]> = {
  Fateweaver: ["cosmic", "light", "wind"],
  Lorekeeper: ["mind", "shadow", "earth"],
  "Devotion Sage": ["fire", "light", "earth"],
  Soulwanderer: ["wind", "cosmic", "water"],
  Lightbearer: ["light", "fire", "cosmic"],
  Mindforged: ["mind", "earth", "shadow"],
  Fortunebound: ["wind", "light", "cosmic"],
  Endureborn: ["earth", "fire", "shadow"],
};

const SLOT_THEME_HINTS: Record<ItemType, ThemeFamily[]> = {
  crown: ["light", "cosmic", "fire"],
  ring: ["light", "cosmic", "shadow"],
  amulet: ["light", "fire", "shadow"],
  cloak: ["wind", "shadow", "earth"],
  tome: ["mind", "shadow", "earth"],
  blade: ["fire", "wind", "shadow"],
  lamp: ["light", "fire", "cosmic"],
  lantern: ["light", "fire", "cosmic"],
  quill: ["wind", "mind", "light"],
  orb: ["cosmic", "light", "mind"],
  mirror: ["light", "cosmic", "shadow"],
  scroll: ["mind", "wind", "earth"],
  tablet: ["earth", "mind", "shadow"],
  staff: ["cosmic", "fire", "earth"],
  chalice: ["water", "light", "fire"],
  key: ["shadow", "mind", "cosmic"],
  rune: ["cosmic", "mind", "fire"],
  sigil: ["cosmic", "shadow", "mind"],
  compass: ["wind", "cosmic", "light"],
  relic: ["earth", "cosmic", "shadow"],
};

const RARITY_MODIFIERS: Record<Rarity, { simple?: boolean; prefix?: string; suffix?: string }> = {
  common: { simple: true },
  uncommon: {},
  rare: {},
  epic: { prefix: "ancient" },
  legendary: { prefix: "eternal" },
};

function selectThemeFamilies(
  itemType: ItemType,
  rarity: Rarity,
  dominantStat?: string,
  playerClass?: PrimaryClass
): ThemeFamily[] {
  const families = new Set<ThemeFamily>();

  const slotHints = SLOT_THEME_HINTS[itemType] || [];
  slotHints.forEach((f) => families.add(f));

  if (dominantStat && STAT_TO_THEME_FAMILIES[dominantStat]) {
    const statFamilies = STAT_TO_THEME_FAMILIES[dominantStat];
    statFamilies.forEach((f) => families.add(f));
  }

  if (playerClass && CLASS_TO_THEME_FAMILIES[playerClass]) {
    const classFamilies = CLASS_TO_THEME_FAMILIES[playerClass];
    classFamilies.forEach((f) => families.add(f));
  }

  if (families.size === 0) {
    return ["cosmic", "light"];
  }

  return Array.from(families);
}

function getDominantStat(stats: CharacterStats): string {
  const entries = Object.entries(stats) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function selectTagFromFamily(family: ThemeFamily, rarity: Rarity): string {
  const tags = THEME_ELEMENTS[family];
  if (!tags || tags.length === 0) {
    return "mystic essence";
  }

  const rarityModifier = RARITY_MODIFIERS[rarity];

  let baseTag: string;
  if (rarityModifier?.simple) {
    const simpleIndex = Math.floor(Math.random() * Math.min(3, tags.length));
    baseTag = tags[simpleIndex];
  } else {
    const index = Math.floor(Math.random() * tags.length);
    baseTag = tags[index];
  }

  if (rarity === "epic" || rarity === "legendary") {
    const modifiers = rarityModifier;
    if (modifiers?.prefix && Math.random() > 0.5) {
      return `${modifiers.prefix} ${baseTag}`;
    }
  }

  return baseTag;
}

export interface PlayerContext {
  level: number;
  destiny?: {
    primaryClass: PrimaryClass;
  };
  stats?: CharacterStats;
}

export function generateThemeTag(artifact: Boon, playerContext?: PlayerContext): string {
  const dominantStat = playerContext?.stats ? getDominantStat(playerContext.stats) : undefined;
  const playerClass = playerContext?.destiny?.primaryClass;

  const themeFamilies = selectThemeFamilies(
    artifact.itemType,
    artifact.rarity,
    dominantStat,
    playerClass
  );

  const selectedFamily = themeFamilies[Math.floor(Math.random() * themeFamilies.length)];
  
  const tag = selectTagFromFamily(selectedFamily, artifact.rarity);

  console.log(
    `[ThemeTag] Generated "${tag}" for ${artifact.rarity} ${artifact.itemType} (family: ${selectedFamily})`
  );

  return tag;
}

export function shouldRegenerateThemeTag(
  artifact: Boon,
  oldRarity?: Rarity,
  playerLevelChanged?: boolean
): boolean {
  if (!artifact.themeTag) {
    return true;
  }

  if (oldRarity && oldRarity !== artifact.rarity) {
    return true;
  }

  if (playerLevelChanged && Math.random() > 0.85) {
    return true;
  }

  return false;
}
