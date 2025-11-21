import { GameState, Equipment, Badge, FocusState, ScriptureStats, ParsedFile, CharacterDestiny, Boon, Theme } from "../types/game";
import { INITIAL_BADGES } from "../constants/badges";
import { calculateCharacterStats, calculateCharacterDestiny } from "../constants/game";

export const BACKUP_VERSION = 2;

export interface BackupV2 {
  version: 2;
  createdAt: string;
  player: {
    xp: number;
    level: number;
    totalQuotesRead: number;
    streakDays: number;
    lastReadDate: string | null;
    totalQuestingTimeMinutes: number;
    totalRaidingTimeMinutes: number;
    boons: Boon[];
    equipment: Equipment;
    badges: Badge[];
    destiny: CharacterDestiny | null;
    theme: Theme;
    hasOnboarded: boolean;
    profilePicture: string | null;
    characterCardImageUrl: string | null;
    lastCardGeneratedAt: string | null;
    itemArtGenerationCountToday: number;
    itemArtGenerationDate: string | null;
    filesUploaded: number;
  };
  scriptures: {
    [scriptureKey: string]: {
      fileName: string;
      displayName: string;
      quotesRead: number;
      focusQuotesRead: number;
      focusSessions: number;
      localXp: number;
      localLevel: number;
      masteryTier: string;
      timeSpentMinutes: number;
    };
  };
}

export interface AppBackup {
  version: number;
  backupVersion: number;
  createdAt: string;
  gameState: GameState;
  theme: string;
}

function migrateEquipment(equipment: any): Equipment {
  if (!equipment || typeof equipment !== "object") {
    return {
      head: null,
      hands: null,
      heart: null,
      mind: null,
      light: null,
      relic: null,
    };
  }
  return {
    head: equipment.head ?? null,
    hands: equipment.hands ?? null,
    heart: equipment.heart ?? null,
    mind: equipment.mind ?? null,
    light: equipment.light ?? null,
    relic: equipment.relic ?? null,
  };
}

function migrateFocusState(focusState: any): FocusState {
  if (!focusState || typeof focusState !== "object") {
    return { mode: "all", focusedFileId: null };
  }
  const mode = (focusState.mode === "all" || focusState.mode === "focus") 
    ? focusState.mode 
    : "all";
  return {
    mode,
    focusedFileId: focusState.focusedFileId ?? null,
  };
}

function migrateBadges(badges: any): Badge[] {
  if (!Array.isArray(badges)) {
    return [...INITIAL_BADGES];
  }
  
  return INITIAL_BADGES.map((initialBadge) => {
    const existingBadge = badges.find((b: any) => 
      b && typeof b === "object" && b.id === initialBadge.id
    );
    
    if (existingBadge && existingBadge.unlocked === true) {
      return {
        ...initialBadge,
        unlocked: true,
        dateUnlocked: existingBadge.dateUnlocked || new Date().toISOString(),
      };
    }
    
    return initialBadge;
  });
}

function migrateScriptureStats(stats: any): { [fileId: string]: ScriptureStats } {
  if (!stats || typeof stats !== "object") {
    return {};
  }
  
  const migrated: { [fileId: string]: ScriptureStats } = {};
  
  for (const [fileId, stat] of Object.entries(stats)) {
    if (stat && typeof stat === "object") {
      const s = stat as any;
      migrated[fileId] = {
        fileId: s.fileId || fileId,
        displayName: s.displayName || "Unknown",
        quotesRead: typeof s.quotesRead === "number" ? s.quotesRead : 0,
        focusSessions: typeof s.focusSessions === "number" ? s.focusSessions : 0,
        focusQuotesRead: typeof s.focusQuotesRead === "number" ? s.focusQuotesRead : 0,
        localXp: typeof s.localXp === "number" ? s.localXp : 0,
        localLevel: typeof s.localLevel === "number" ? s.localLevel : 1,
        masteryTier: s.masteryTier || "Unseen",
        timeSpentMinutes: typeof s.timeSpentMinutes === "number" ? s.timeSpentMinutes : 0,
      };
    }
  }
  
  return migrated;
}

function migrateParsedFiles(files: any): ParsedFile[] {
  if (!Array.isArray(files)) {
    return [];
  }
  
  return files.filter((f: any) => 
    f && 
    typeof f === "object" && 
    typeof f.fileId === "string" && 
    typeof f.fileName === "string" &&
    Array.isArray(f.quotes)
  ).map((f: any) => ({
    fileId: f.fileId,
    fileName: f.fileName,
    quotes: f.quotes,
  }));
}

function recomputeDestinyIfNeeded(
  destiny: any,
  level: number,
  boons: any[],
  equipment: Equipment,
  totalQuestingTimeMinutes: number
): CharacterDestiny | undefined {
  if (destiny && 
      typeof destiny === "object" && 
      destiny.primaryClass && 
      destiny.subclass &&
      destiny.destinyTier) {
    return destiny as CharacterDestiny;
  }
  
  console.log("[Backup] Recomputing destiny from stats");
  
  const equippedBoons = [];
  const slots: (keyof Equipment)[] = ["head", "hands", "heart", "mind", "light", "relic"];
  
  for (const slot of slots) {
    const boonId = equipment[slot];
    if (boonId && Array.isArray(boons)) {
      const boon = boons.find((b: any) => b && b.id === boonId);
      if (boon && boon.statBonuses) {
        equippedBoons.push(boon);
      }
    }
  }
  
  const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
  const stats = calculateCharacterStats(level, statBonusesArray, totalQuestingTimeMinutes);
  return calculateCharacterDestiny(level, stats);
}

export function validateBackupV2(data: any): { valid: boolean; error?: string } {
  console.log("[BackupV2] Starting validation");
  
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid backup format: not an object" };
  }

  if (data.version !== 2) {
    return { valid: false, error: "Unsupported backup version. This restore requires Backup v2." };
  }

  if (!data.createdAt || typeof data.createdAt !== "string") {
    return { valid: false, error: "Missing or invalid creation date" };
  }

  if (!data.player || typeof data.player !== "object") {
    return { valid: false, error: "Missing player data" };
  }
  
  if (typeof data.player.xp !== "number" || 
      typeof data.player.level !== "number" || 
      typeof data.player.totalQuotesRead !== "number") {
    return { valid: false, error: "Invalid player progression fields (xp, level, totalQuotesRead)" };
  }
  
  if (!Array.isArray(data.player.boons) || 
      !Array.isArray(data.player.badges)) {
    return { valid: false, error: "Invalid arrays (boons, badges must be arrays)" };
  }
  
  console.log("[BackupV2] Validation passed");
  return { valid: true };
}

export function validateBackup(data: any): { valid: boolean; error?: string } {
  console.log("[Backup] Starting validation");
  
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid backup format: not an object" };
  }

  if (!data.version && !data.backupVersion) {
    return { valid: false, error: "Missing backup version" };
  }

  if (!data.createdAt || typeof data.createdAt !== "string") {
    return { valid: false, error: "Missing or invalid creation date" };
  }

  if (!data.gameState || typeof data.gameState !== "object") {
    return { valid: false, error: "Missing game state" };
  }

  const raw = data.gameState;
  
  if (typeof raw.xp !== "number" || 
      typeof raw.level !== "number" || 
      typeof raw.totalQuotesRead !== "number") {
    return { valid: false, error: "Invalid core progression fields (xp, level, totalQuotesRead)" };
  }
  
  if (!Array.isArray(raw.quotes) || 
      !Array.isArray(raw.boons)) {
    return { valid: false, error: "Invalid arrays (quotes, boons must be arrays)" };
  }
  
  console.log("[Backup] Validation passed");
  return { valid: true };
}

export function migrateGameState(raw: any): GameState {
  console.log("[Backup] Starting migration with safe defaults");
  
  const equipment = migrateEquipment(raw.equipment);
  const focusState = migrateFocusState(raw.focusState);
  const badges = migrateBadges(raw.badges);
  const scriptureStats = migrateScriptureStats(raw.scriptureStats);
  const parsedFiles = migrateParsedFiles(raw.parsedFiles);
  
  const totalQuestingTimeMinutes = typeof raw.totalQuestingTimeMinutes === "number" 
    ? raw.totalQuestingTimeMinutes 
    : 0;
  
  const totalRaidingTimeMinutes = typeof raw.totalRaidingTimeMinutes === "number" 
    ? raw.totalRaidingTimeMinutes 
    : 0;
  
  let hasOnboarded = raw.hasOnboarded;
  if (hasOnboarded === undefined) {
    const hasActivity = 
      (raw.totalQuotesRead ?? 0) > 0 ||
      (raw.boons?.length ?? 0) > 0 ||
      (raw.filesUploaded ?? 0) > 0 ||
      !!raw.profilePicture;
    hasOnboarded = hasActivity;
  }
  
  const destiny = recomputeDestinyIfNeeded(
    raw.destiny,
    raw.level ?? 1,
    raw.boons || [],
    equipment,
    totalQuestingTimeMinutes
  );
  
  const migratedState: GameState = {
    xp: raw.xp ?? 0,
    level: raw.level ?? 1,
    totalQuotesRead: raw.totalQuotesRead ?? 0,
    quotes: Array.isArray(raw.quotes) ? raw.quotes : [],
    boons: Array.isArray(raw.boons) ? raw.boons : [],
    badges,
    filesUploaded: typeof raw.filesUploaded === "number" ? raw.filesUploaded : 0,
    streakDays: typeof raw.streakDays === "number" ? raw.streakDays : 0,
    lastReadDate: raw.lastReadDate,
    equipment,
    destiny,
    totalQuestingTimeMinutes,
    totalRaidingTimeMinutes,
    scriptureStats,
    focusState,
    parsedFiles,
    profilePicture: raw.profilePicture,
    hasOnboarded,
    characterCardImageUrl: raw.characterCardImageUrl,
    lastCardGeneratedAt: raw.lastCardGeneratedAt,
    itemArtGenerationCountToday: typeof raw.itemArtGenerationCountToday === "number" 
      ? raw.itemArtGenerationCountToday 
      : 0,
    itemArtGenerationDate: raw.itemArtGenerationDate,
  };
  
  console.log("[Backup] Migration complete");
  console.log("[Backup] Migrated state - Level:", migratedState.level, "XP:", migratedState.xp);
  console.log("[Backup] Boons:", migratedState.boons.length, "Quotes:", migratedState.quotes.length);
  console.log("[Backup] Files:", migratedState.parsedFiles.length);
  console.log("[Backup] Destiny:", migratedState.destiny ? "Present" : "Absent");
  
  return migratedState;
}

export function restoreFromBackupV2(backup: BackupV2, currentState: GameState): GameState {
  console.log("[BackupV2] Starting restore");
  console.log("[BackupV2] Backup level:", backup.player.level, "XP:", backup.player.xp);
  console.log("[BackupV2] Current parsed files:", currentState.parsedFiles.length);
  
  const restoredScriptureStats: { [fileId: string]: ScriptureStats } = {};
  
  for (const [key, stats] of Object.entries(backup.scriptures)) {
    const existingFile = currentState.parsedFiles.find(
      (f) => f.fileName === stats.fileName || f.fileId === key
    );
    
    if (existingFile) {
      console.log("[BackupV2] Attaching stats to existing file:", stats.fileName);
      restoredScriptureStats[existingFile.fileId] = {
        fileId: existingFile.fileId,
        displayName: stats.displayName,
        quotesRead: stats.quotesRead,
        focusQuotesRead: stats.focusQuotesRead,
        focusSessions: stats.focusSessions,
        localXp: stats.localXp,
        localLevel: stats.localLevel,
        masteryTier: stats.masteryTier as any,
        timeSpentMinutes: stats.timeSpentMinutes,
      };
    } else {
      console.log("[BackupV2] Scripture not found, preserving stats for future:", stats.fileName);
      restoredScriptureStats[key] = {
        fileId: key,
        displayName: stats.displayName,
        quotesRead: stats.quotesRead,
        focusQuotesRead: stats.focusQuotesRead,
        focusSessions: stats.focusSessions,
        localXp: stats.localXp,
        localLevel: stats.localLevel,
        masteryTier: stats.masteryTier as any,
        timeSpentMinutes: stats.timeSpentMinutes,
      };
    }
  }
  
  const restoredState: GameState = {
    xp: backup.player.xp,
    level: backup.player.level,
    totalQuotesRead: backup.player.totalQuotesRead,
    quotes: currentState.quotes,
    boons: backup.player.boons,
    badges: backup.player.badges,
    filesUploaded: backup.player.filesUploaded,
    streakDays: backup.player.streakDays,
    lastReadDate: backup.player.lastReadDate ?? undefined,
    equipment: backup.player.equipment,
    destiny: backup.player.destiny ?? undefined,
    totalQuestingTimeMinutes: backup.player.totalQuestingTimeMinutes,
    totalRaidingTimeMinutes: backup.player.totalRaidingTimeMinutes,
    scriptureStats: restoredScriptureStats,
    focusState: { mode: "all", focusedFileId: null },
    parsedFiles: currentState.parsedFiles,
    profilePicture: backup.player.profilePicture ?? undefined,
    hasOnboarded: backup.player.hasOnboarded,
    characterCardImageUrl: backup.player.characterCardImageUrl ?? undefined,
    lastCardGeneratedAt: backup.player.lastCardGeneratedAt ?? undefined,
    itemArtGenerationCountToday: backup.player.itemArtGenerationCountToday,
    itemArtGenerationDate: backup.player.itemArtGenerationDate ?? undefined,
  };
  
  console.log("[BackupV2] Restore complete");
  console.log("[BackupV2] Restored level:", restoredState.level, "XP:", restoredState.xp);
  console.log("[BackupV2] Restored boons:", restoredState.boons.length);
  console.log("[BackupV2] Scripture stats restored:", Object.keys(restoredState.scriptureStats).length);
  console.log("[BackupV2] Kept current parsed files:", restoredState.parsedFiles.length);
  
  return restoredState;
}

export function createBackupV2(gameState: GameState, theme: Theme): BackupV2 {
  console.log("[BackupV2] Creating backup v2 (progress only, no scripture content)");
  
  const scriptures: BackupV2["scriptures"] = {};
  
  Object.entries(gameState.scriptureStats || {}).forEach(([key, stats]) => {
    const parsedFile = gameState.parsedFiles.find((f) => f.fileId === key);
    const fileName = parsedFile ? parsedFile.fileName : key;
    
    scriptures[key] = {
      fileName,
      displayName: stats.displayName ?? fileName,
      quotesRead: stats.quotesRead ?? 0,
      focusQuotesRead: stats.focusQuotesRead ?? 0,
      focusSessions: stats.focusSessions ?? 0,
      localXp: stats.localXp ?? 0,
      localLevel: stats.localLevel ?? 1,
      masteryTier: stats.masteryTier ?? "Unseen",
      timeSpentMinutes: stats.timeSpentMinutes ?? 0,
    };
  });
  
  const backup: BackupV2 = {
    version: 2,
    createdAt: new Date().toISOString(),
    player: {
      xp: gameState.xp,
      level: gameState.level,
      totalQuotesRead: gameState.totalQuotesRead,
      streakDays: gameState.streakDays,
      lastReadDate: gameState.lastReadDate ?? null,
      totalQuestingTimeMinutes: gameState.totalQuestingTimeMinutes ?? 0,
      totalRaidingTimeMinutes: gameState.totalRaidingTimeMinutes ?? 0,
      boons: gameState.boons ?? [],
      equipment: gameState.equipment,
      badges: gameState.badges ?? [],
      destiny: gameState.destiny ?? null,
      theme,
      hasOnboarded: gameState.hasOnboarded ?? true,
      profilePicture: gameState.profilePicture ?? null,
      characterCardImageUrl: gameState.characterCardImageUrl ?? null,
      lastCardGeneratedAt: gameState.lastCardGeneratedAt ?? null,
      itemArtGenerationCountToday: gameState.itemArtGenerationCountToday ?? 0,
      itemArtGenerationDate: gameState.itemArtGenerationDate ?? null,
      filesUploaded: gameState.filesUploaded,
    },
    scriptures,
  };
  
  const jsonStr = JSON.stringify(backup);
  const sizeKB = (jsonStr.length / 1024).toFixed(2);
  console.log("[BackupV2] Created - Size:", sizeKB, "KB");
  console.log("[BackupV2] Player level:", backup.player.level, "XP:", backup.player.xp);
  console.log("[BackupV2] Boons:", backup.player.boons.length);
  console.log("[BackupV2] Scripture stats:", Object.keys(backup.scriptures).length, "files");
  
  return backup;
}

export function createBackup(gameState: GameState, theme: string): AppBackup {
  console.log("[Backup] Creating backup version", BACKUP_VERSION);
  return {
    version: BACKUP_VERSION,
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    gameState,
    theme,
  };
}
