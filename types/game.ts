export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ItemType =
  | "ring"
  | "crown"
  | "amulet"
  | "cloak"
  | "quill"
  | "blade"
  | "lamp"
  | "lantern"
  | "orb"
  | "mirror"
  | "tome"
  | "scroll"
  | "tablet"
  | "staff"
  | "chalice"
  | "key"
  | "rune"
  | "sigil"
  | "compass"
  | "relic";

export type SlotType = "head" | "hands" | "heart" | "mind" | "light" | "relic";

export interface StatBonuses {
  insight: number;
  devotion: number;
  focus: number;
  wonder: number;
  clarity: number;
  fortune: number;
  endurance: number;
}

export interface CharacterStats {
  insight: number;
  devotion: number;
  focus: number;
  wonder: number;
  clarity: number;
  fortune: number;
  endurance: number;
}

export interface Quote {
  id: string;
  text: string;
  fileOrigin: string;
  index: number;
  length: number;
}

export interface Boon {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  dateAcquired: string;
  itemType: ItemType;
  slotType: SlotType;
  statBonuses: StatBonuses;
  imageUrl?: string | null;
  imageGeneratedAt?: string | null;
  themeTag?: string;
}

export type BadgeTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Mythic" | "Ascended" | "Eternal" | "Transcendent";

export type BadgeCategory = "quotes" | "files" | "boons" | "streaks" | "level" | "destiny" | "time" | "scripture";

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  dateUnlocked?: string;
  xpReward: number;
  category: BadgeCategory;
  tier: BadgeTier;
}

export interface Equipment {
  head: string | null;
  hands: string | null;
  heart: string | null;
  mind: string | null;
  light: string | null;
  relic: string | null;
}

export type PrimaryClass =
  | "Fateweaver"
  | "Lorekeeper"
  | "Devotion Sage"
  | "Soulwanderer"
  | "Lightbearer"
  | "Mindforged"
  | "Fortunebound"
  | "Endureborn";

export type Subclass = string;

export type DestinyTier =
  | "Initiate"
  | "Adept"
  | "Rising"
  | "Elite"
  | "Mythic"
  | "Ascended"
  | "Eternal"
  | "Transcendent"
  | "Paragon";

export type Epithet = string;

export interface CharacterDestiny {
  primaryClass: PrimaryClass;
  subclass: Subclass;
  epithet: Epithet;
  title: string;
  destinyTier: DestinyTier;
  loreDescription: string;
}

export type ScriptureMasteryTier =
  | "Unseen"
  | "Touched"
  | "Familiar"
  | "Student"
  | "Scholar"
  | "Keeper"
  | "Living Voice";

export interface ScriptureStats {
  fileId: string;
  displayName: string;
  quotesRead: number;
  focusSessions: number;
  focusQuotesRead: number;
  localXp: number;
  localLevel: number;
  masteryTier: ScriptureMasteryTier;
  timeSpentMinutes: number;
}

export interface FocusState {
  mode: "all" | "focus";
  focusedFileId?: string | null;
}

export interface ParsedFile {
  fileId: string;
  fileName: string;
  quotes: Quote[];
}

export interface GameState {
  xp: number;
  level: number;
  totalQuotesRead: number;
  quotes: Quote[];
  boons: Boon[];
  badges: Badge[];
  filesUploaded: number;
  streakDays: number;
  lastReadDate?: string;
  equipment: Equipment;
  destiny?: CharacterDestiny;
  totalQuestingTimeMinutes: number;
  totalRaidingTimeMinutes: number;
  scriptureStats: { [fileId: string]: ScriptureStats };
  focusState: FocusState;
  parsedFiles: ParsedFile[];
  profilePicture?: string;
  hasOnboarded?: boolean;
  characterCardImageUrl?: string;
  lastCardGeneratedAt?: string;
  itemArtGenerationCountToday?: number;
  itemArtGenerationDate?: string;
}

export interface ScriptureMilestone {
  scriptureName: string;
  tier: ScriptureMasteryTier;
  quotesRead: number;
}

export type Theme = "dark" | "light" | "solar" | "cosmic" | "forest" | "midnight" | "crimson" | "ocean" | "desert" | "ember" | "void" | "sage" | "rose" | "slate" | "amber";
