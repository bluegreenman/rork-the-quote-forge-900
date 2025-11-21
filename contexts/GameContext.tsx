import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useRef } from "react";
import { Boon, GameState, Quote, Theme, SlotType, ScriptureStats, ParsedFile } from "../types/game";
import {
  calculateLevel,
  calculateXPForQuote,
  generateBoonDescription,
  generateBoonName,
  generateRandomItemType,
  rollForBoon,
  getSlotTypeForItem,
  generateStatBonuses,
  calculateCharacterStats,
  calculateCharacterDestiny,
  initializeScriptureStats,
  calculateScriptureXP,
  calculateScriptureLevel,
  getScriptureMasteryTier,
} from "../constants/game";
import { INITIAL_BADGES } from "../constants/badges";
import { createBackup, validateBackup, migrateGameState, createBackupV2, validateBackupV2, restoreFromBackupV2 } from "../utils/backup";
import { buildItemArtPrompt, generateItemArt, canGenerateItemArt } from "../utils/itemArt";
import { generateThemeTag } from "../utils/themeTag";
import { quoteForge, loadForgeFoundations, loadRadiantResolve, loadGritAndGlory, loadStoicIron, loadMindfulClarity, loadSovereignDiscipline, loadZenFocus, StockQuote } from "../utils/quoteForge";

const STORAGE_KEY = "verseforge_game_state";
const THEME_KEY = "verseforge_theme";

interface SessionState {
  isActive: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  type: "questing" | "raiding" | null;
  lastMinuteMarker: number;
  focusedFileId?: string;
}

const DEFAULT_STATE: GameState = {
  xp: 0,
  level: 1,
  totalQuotesRead: 0,
  quotes: [],
  boons: [],
  badges: [...INITIAL_BADGES],
  filesUploaded: 0,
  streakDays: 0,
  equipment: {
    head: null,
    hands: null,
    heart: null,
    mind: null,
    light: null,
    relic: null,
  },
  totalQuestingTimeMinutes: 0,
  totalRaidingTimeMinutes: 0,
  scriptureStats: {},
  focusState: { mode: "all", focusedFileId: null },
  parsedFiles: [],
  profilePicture: undefined,
  hasOnboarded: false,
  destiny: undefined,
  lastReadDate: undefined,
  characterCardImageUrl: undefined,
  lastCardGeneratedAt: undefined,
  itemArtGenerationCountToday: 0,
  itemArtGenerationDate: undefined,
};

const useGameContext = () => {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    startedAt: null,
    elapsedSeconds: 0,
    type: null,
    lastMinuteMarker: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stockPackLoaded, setStockPackLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!stockPackLoaded) {
      console.log("[QuoteForge] Initializing stock packs...");
      
      // Load the unified Forge Foundations pack (648 quotes for Forge mode)
      loadForgeFoundations();
      
      // Load individual packs for Sanctum mastery tracking
      loadRadiantResolve();
      loadGritAndGlory();
      loadStoicIron();
      loadMindfulClarity();
      loadSovereignDiscipline();
      loadZenFocus();
      
      setStockPackLoaded(true);
      console.log("[QuoteForge] Stock packs loaded:");
      console.log("  - Forge Foundations (648 quotes - UNIFIED for Forge)");
      console.log("  - Radiant Resolve (for Sanctum mastery)");
      console.log("  - Grit & Glory (for Sanctum mastery)");
      console.log("  - Stoic Iron (for Sanctum mastery)");
      console.log("  - Mindful Clarity (for Sanctum mastery)");
      console.log("  - Sovereign Discipline (for Sanctum mastery)");
      console.log("  - Zen Focus (for Sanctum mastery)");
    }
  }, [stockPackLoaded]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stateData, themeData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(THEME_KEY),
        ]);

        if (stateData) {
          let parsed;
          try {
            parsed = JSON.parse(stateData);
          } catch (parseError) {
            console.error("[Load] Failed to parse game state JSON:", parseError);
            console.error("[Load] Corrupted data preview:", stateData.substring(0, 100));
            console.log("[Load] Clearing corrupted data and starting fresh");
            await AsyncStorage.removeItem(STORAGE_KEY);
            setState(DEFAULT_STATE);
            setIsLoaded(true);
            return;
          }
          
          console.log("[Migration] Starting full state migration with defaults");
          
          let hasOnboarded = parsed.hasOnboarded;
          if (hasOnboarded === undefined) {
            const hasActivity = 
              (parsed.totalQuotesRead ?? 0) > 0 ||
              (parsed.boons?.length ?? 0) > 0 ||
              (parsed.filesUploaded ?? 0) > 0 ||
              !!parsed.profilePicture;
            
            hasOnboarded = hasActivity;
            console.log("[Migration]", hasActivity ? "Existing user detected" : "New user detected");
          }
          
          const migratedBoons = (parsed.boons || []).map((boon: any) => {
            if (!boon.slotType || !boon.statBonuses) {
              const slotType = getSlotTypeForItem(boon.itemType);
              const statBonuses = generateStatBonuses(boon.rarity);
              return { ...boon, slotType, statBonuses };
            }
            return boon;
          });
          
          const equipment = {
            head: parsed.equipment?.head ?? null,
            hands: parsed.equipment?.hands ?? null,
            heart: parsed.equipment?.heart ?? null,
            mind: parsed.equipment?.mind ?? null,
            light: parsed.equipment?.light ?? null,
            relic: parsed.equipment?.relic ?? null,
          };
          
          const focusState =
            parsed.focusState && typeof parsed.focusState === "object"
              ? {
                  mode: (parsed.focusState.mode === "all" || parsed.focusState.mode === "focus") 
                    ? parsed.focusState.mode 
                    : "all",
                  focusedFileId: parsed.focusState.focusedFileId ?? null,
                }
              : { mode: "all" as const, focusedFileId: null };
          
          const migratedBadges = INITIAL_BADGES.map((initialBadge) => {
            const existingBadge = parsed.badges?.find((b: any) => 
              b.id === initialBadge.id ||
              (b.id === "first_10_quotes" && initialBadge.id === "quotes_10") ||
              (b.id === "100_quotes" && initialBadge.id === "quotes_100") ||
              (b.id === "1000_quotes" && initialBadge.id === "quotes_1000") ||
              (b.id === "first_rare" && initialBadge.id === "rare_1") ||
              (b.id === "first_legendary" && initialBadge.id === "legendary_1") ||
              (b.id === "5_files" && initialBadge.id === "files_5") ||
              (b.id === "10_files" && initialBadge.id === "files_10") ||
              (b.id === "week_streak" && initialBadge.id === "streak_7") ||
              (b.id === "month_streak" && initialBadge.id === "streak_30")
            );
            
            if (existingBadge && existingBadge.unlocked) {
              return {
                ...initialBadge,
                unlocked: true,
                dateUnlocked: existingBadge.dateUnlocked,
              };
            }
            
            return initialBadge;
          });
          
          let migratedDestiny = parsed.destiny;
          if (migratedDestiny && !migratedDestiny.primaryClass) {
            console.log("[Migration] Old destiny format detected, clearing");
            migratedDestiny = undefined;
          }
          
          const migratedState: GameState = {
            ...DEFAULT_STATE,
            xp: parsed.xp ?? DEFAULT_STATE.xp,
            level: parsed.level ?? DEFAULT_STATE.level,
            totalQuotesRead: parsed.totalQuotesRead ?? DEFAULT_STATE.totalQuotesRead,
            quotes: parsed.quotes || DEFAULT_STATE.quotes,
            boons: migratedBoons,
            badges: migratedBadges,
            filesUploaded: parsed.filesUploaded ?? DEFAULT_STATE.filesUploaded,
            streakDays: parsed.streakDays ?? DEFAULT_STATE.streakDays,
            equipment,
            totalQuestingTimeMinutes: parsed.totalQuestingTimeMinutes ?? DEFAULT_STATE.totalQuestingTimeMinutes,
            totalRaidingTimeMinutes: parsed.totalRaidingTimeMinutes ?? DEFAULT_STATE.totalRaidingTimeMinutes,
            scriptureStats: parsed.scriptureStats || DEFAULT_STATE.scriptureStats,
            focusState,
            parsedFiles: parsed.parsedFiles || DEFAULT_STATE.parsedFiles,
            profilePicture: parsed.profilePicture,
            hasOnboarded,
            destiny: migratedDestiny,
            lastReadDate: parsed.lastReadDate,
            characterCardImageUrl: parsed.characterCardImageUrl,
            lastCardGeneratedAt: parsed.lastCardGeneratedAt,
            itemArtGenerationCountToday: parsed.itemArtGenerationCountToday ?? DEFAULT_STATE.itemArtGenerationCountToday,
            itemArtGenerationDate: parsed.itemArtGenerationDate,
          };
          
          console.log("[Migration] State migration complete - focusState:", migratedState.focusState);
          setState(migratedState);
        } else {
          console.log("[Load] No saved state, using DEFAULT_STATE");
          setState(DEFAULT_STATE);
        }

        if (themeData) {
          setTheme(themeData as Theme);
        }
      } catch (error) {
        console.error("Failed to load game state:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
        console.error("Failed to save game state:", error)
      );
    }
  }, [state, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(THEME_KEY, theme).catch((error) =>
        console.error("Failed to save theme:", error)
      );
    }
  }, [theme, isLoaded]);

  const checkBadges = useCallback(() => {
    setState((prev) => {
      const updated = { ...prev };
      let xpBonus = 0;

      const rareBoonCount = prev.boons.filter((b) => 
        b.rarity === "rare" || b.rarity === "epic" || b.rarity === "legendary"
      ).length;
      const legendaryCount = prev.boons.filter((b) => b.rarity === "legendary").length;

      updated.badges = prev.badges.map((badge) => {
        if (badge.unlocked) return badge;

        let shouldUnlock = false;

        switch (badge.id) {
          case "quotes_10":
            shouldUnlock = prev.totalQuotesRead >= 10;
            break;
          case "quotes_100":
            shouldUnlock = prev.totalQuotesRead >= 100;
            break;
          case "quotes_1000":
            shouldUnlock = prev.totalQuotesRead >= 1000;
            break;
          case "quotes_5000":
            shouldUnlock = prev.totalQuotesRead >= 5000;
            break;
          case "quotes_10000":
            shouldUnlock = prev.totalQuotesRead >= 10000;
            break;
          case "files_5":
            shouldUnlock = prev.filesUploaded >= 5;
            break;
          case "files_10":
            shouldUnlock = prev.filesUploaded >= 10;
            break;
          case "files_25":
            shouldUnlock = prev.filesUploaded >= 25;
            break;
          case "files_50":
            shouldUnlock = prev.filesUploaded >= 50;
            break;
          case "files_100":
            shouldUnlock = prev.filesUploaded >= 100;
            break;
          case "boons_10":
            shouldUnlock = prev.boons.length >= 10;
            break;
          case "boons_50":
            shouldUnlock = prev.boons.length >= 50;
            break;
          case "boons_100":
            shouldUnlock = prev.boons.length >= 100;
            break;
          case "boons_250":
            shouldUnlock = prev.boons.length >= 250;
            break;
          case "boons_500":
            shouldUnlock = prev.boons.length >= 500;
            break;
          case "rare_1":
            shouldUnlock = rareBoonCount >= 1;
            break;
          case "rare_10":
            shouldUnlock = rareBoonCount >= 10;
            break;
          case "rare_25":
            shouldUnlock = rareBoonCount >= 25;
            break;
          case "rare_50":
            shouldUnlock = rareBoonCount >= 50;
            break;
          case "rare_100":
            shouldUnlock = rareBoonCount >= 100;
            break;
          case "legendary_1":
            shouldUnlock = legendaryCount >= 1;
            break;
          case "legendary_3":
            shouldUnlock = legendaryCount >= 3;
            break;
          case "legendary_5":
            shouldUnlock = legendaryCount >= 5;
            break;
          case "legendary_10":
            shouldUnlock = legendaryCount >= 10;
            break;
          case "legendary_20":
            shouldUnlock = legendaryCount >= 20;
            break;
          case "streak_7":
            shouldUnlock = prev.streakDays >= 7;
            break;
          case "streak_30":
            shouldUnlock = prev.streakDays >= 30;
            break;
          case "streak_100":
            shouldUnlock = prev.streakDays >= 100;
            break;
          case "streak_365":
            shouldUnlock = prev.streakDays >= 365;
            break;
          case "level_25":
            shouldUnlock = prev.level >= 25;
            break;
          case "level_50":
            shouldUnlock = prev.level >= 50;
            break;
          case "level_100":
            shouldUnlock = prev.level >= 100;
            break;
          case "level_150":
            shouldUnlock = prev.level >= 150;
            break;
          case "level_200":
            shouldUnlock = prev.level >= 200;
            break;
          case "destiny_disciple":
            shouldUnlock = prev.destiny?.destinyTier === "Adept" || 
                          prev.destiny?.destinyTier === "Rising" || 
                          prev.destiny?.destinyTier === "Elite" || 
                          prev.destiny?.destinyTier === "Mythic" ||
                          prev.destiny?.destinyTier === "Ascended" ||
                          prev.destiny?.destinyTier === "Eternal" ||
                          prev.destiny?.destinyTier === "Transcendent" ||
                          prev.destiny?.destinyTier === "Paragon";
            break;
          case "destiny_adept":
            shouldUnlock = prev.destiny?.destinyTier === "Adept" || 
                          prev.destiny?.destinyTier === "Rising" || 
                          prev.destiny?.destinyTier === "Elite" || 
                          prev.destiny?.destinyTier === "Mythic" ||
                          prev.destiny?.destinyTier === "Ascended" ||
                          prev.destiny?.destinyTier === "Eternal" ||
                          prev.destiny?.destinyTier === "Transcendent" ||
                          prev.destiny?.destinyTier === "Paragon";
            break;
          case "destiny_master":
            shouldUnlock = prev.destiny?.destinyTier === "Elite" || 
                          prev.destiny?.destinyTier === "Mythic" ||
                          prev.destiny?.destinyTier === "Ascended" ||
                          prev.destiny?.destinyTier === "Eternal" ||
                          prev.destiny?.destinyTier === "Transcendent" ||
                          prev.destiny?.destinyTier === "Paragon";
            break;
          case "destiny_mythic":
            shouldUnlock = prev.destiny?.destinyTier === "Mythic" ||
                          prev.destiny?.destinyTier === "Ascended" ||
                          prev.destiny?.destinyTier === "Eternal" ||
                          prev.destiny?.destinyTier === "Transcendent" ||
                          prev.destiny?.destinyTier === "Paragon";
            break;
          case "time_30":
            shouldUnlock = prev.totalQuestingTimeMinutes >= 30;
            break;
          case "time_120":
            shouldUnlock = prev.totalQuestingTimeMinutes >= 120;
            break;
          case "time_360":
            shouldUnlock = prev.totalQuestingTimeMinutes >= 360;
            break;
          case "time_1200":
            shouldUnlock = prev.totalQuestingTimeMinutes >= 1200;
            break;
          case "time_3000":
            shouldUnlock = prev.totalQuestingTimeMinutes >= 3000;
            break;
        }

        if (shouldUnlock) {
          xpBonus += badge.xpReward;
          return {
            ...badge,
            unlocked: true,
            dateUnlocked: new Date().toISOString(),
          };
        }

        return badge;
      });

      if (xpBonus > 0) {
        updated.xp += xpBonus;
        updated.level = calculateLevel(updated.xp);
      }

      return updated;
    });
  }, []);

  const addQuotes = useCallback(
    (newQuotes: Quote[], fileName: string) => {
      const fileId = `file_${Date.now()}_${Math.random()}`;
      
      setState((prev) => {
        const newParsedFile: ParsedFile = {
          fileId,
          fileName,
          quotes: newQuotes,
        };
        
        const newScriptureStats: ScriptureStats = initializeScriptureStats(fileId, fileName);
        
        return {
          ...prev,
          quotes: [...prev.quotes, ...newQuotes],
          filesUploaded: prev.filesUploaded + 1,
          parsedFiles: [...prev.parsedFiles, newParsedFile],
          scriptureStats: {
            ...prev.scriptureStats,
            [fileId]: newScriptureStats,
          },
        };
      });
      
      checkBadges();
    },
    [checkBadges]
  );

  const convertStockQuoteToQuote = useCallback((stockQuote: StockQuote, index: number): Quote => {
    return {
      id: stockQuote.id,
      text: stockQuote.text,
      fileOrigin: stockQuote.category,
      index,
      length: stockQuote.text.length,
    };
  }, []);

  const getAvailableStockPacks = useCallback((): ParsedFile[] => {
    const packNames = quoteForge.getPackNames();
    return packNames.map((packName) => {
      const packQuotes = quoteForge.getPackQuotes(packName);
      const quotes = packQuotes.map((sq, idx) => convertStockQuoteToQuote(sq, idx));
      return {
        fileId: `stock_${packName.toLowerCase().replace(/\s+/g, '_')}`,
        fileName: `📦 ${packName}`,
        quotes,
      };
    });
  }, [convertStockQuoteToQuote]);

  const readQuote = useCallback((): {
    quote: Quote | null;
    xpGained: number;
    boon: Boon | null;
    leveledUp: boolean;
    newLevel: number;
  } => {
    // Read current state (this still has closure issues but we'll fix separately)
    let currentState: GameState = state;
    
    // Ensure focusState exists with safe default
    const currentFocus = currentState.focusState && typeof currentState.focusState === 'object'
      ? { mode: currentState.focusState.mode ?? "all", focusedFileId: currentState.focusState.focusedFileId ?? null }
      : { mode: "all" as const, focusedFileId: null };
    
    let quotesToPickFrom: Quote[] = [];
    let sourceFileId: string | null = null;
    
    if (currentFocus.mode === "focus" && currentFocus.focusedFileId) {
      let focusedFile = currentState.parsedFiles.find((f) => f.fileId === currentFocus.focusedFileId);
      
      if (!focusedFile && currentFocus.focusedFileId.startsWith('stock_')) {
        const stockPacks = getAvailableStockPacks();
        focusedFile = stockPacks.find((f) => f.fileId === currentFocus.focusedFileId);
      }
      
      if (focusedFile && focusedFile.quotes.length > 0) {
        quotesToPickFrom = focusedFile.quotes;
        sourceFileId = focusedFile.fileId;
        console.log("[Forge] FOCUS mode - using", focusedFile.fileName, "with", quotesToPickFrom.length, "quotes");
      } else {
        quotesToPickFrom = currentState.quotes;
        console.log("[Forge] FOCUS mode but no focused file, using all quotes:", quotesToPickFrom.length);
      }
    } else {
      console.log("[Forge] Random Oracle - All Scriptures mode: picking from ALL quotes across ALL files");
      
      quotesToPickFrom = currentState.quotes;
      console.log("[Forge] User quotes available:", quotesToPickFrom.length);
      
      if (quotesToPickFrom.length === 0) {
        console.log("[Forge] ⚠️ NO USER QUOTES - USING FORGE FOUNDATIONS");
        console.log("[Forge] Drawing from unified 648-quote Forge Foundations pack");
        const stockQuote = quoteForge.getRandomQuote();
        
        if (stockQuote) {
          const quote = convertStockQuoteToQuote(stockQuote, 0);
          const xpGained = calculateXPForQuote(quote.length);
          
          console.log("[Forge] ✨ Using quote from:", stockQuote.category);
          console.log("[Forge] Quote ID:", stockQuote.id);
          console.log("[Forge] Text:", stockQuote.text.substring(0, 60) + "...");
          
          const boonRarity = rollForBoon();
          let boon: Boon | null = null;

          if (boonRarity) {
            const itemType = generateRandomItemType();
            const boonName = generateBoonName(itemType);
            const slotType = getSlotTypeForItem(itemType);
            const statBonuses = generateStatBonuses(boonRarity);
            
            const tempBoon: Boon = {
              id: `${Date.now()}_${Math.random()}`,
              name: boonName,
              description: generateBoonDescription(boonName),
              rarity: boonRarity,
              dateAcquired: new Date().toISOString(),
              itemType,
              slotType,
              statBonuses,
            };
            
            const equippedBoons: Boon[] = [];
            const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
            for (const slot of slots) {
              const boonId = currentState.equipment[slot];
              if (boonId) {
                const equippedBoon = currentState.boons.find((b) => b.id === boonId);
                if (equippedBoon) {
                  equippedBoons.push(equippedBoon);
                }
              }
            }
            const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
            const playerStats = calculateCharacterStats(currentState.level, statBonusesArray, currentState.totalQuestingTimeMinutes);
            
            const playerContext = {
              level: currentState.level,
              destiny: currentState.destiny,
              stats: playerStats,
            };
            
            const themeTag = generateThemeTag(tempBoon, playerContext);
            tempBoon.themeTag = themeTag;
            
            boon = tempBoon;
          }

          const newXP = currentState.xp + xpGained;
          const oldLevel = currentState.level;
          const newLevel = calculateLevel(newXP);
          const leveledUp = newLevel > oldLevel;

          setState((prev) => {
            const today = new Date().toDateString();
            const lastRead = prev.lastReadDate
              ? new Date(prev.lastReadDate).toDateString()
              : null;
            let newStreak = prev.streakDays;

            if (lastRead !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toDateString();

              if (lastRead === yesterdayStr) {
                newStreak += 1;
              } else if (lastRead === null) {
                newStreak = 1;
              } else {
                newStreak = 1;
              }
            }

            return {
              ...prev,
              xp: newXP,
              level: newLevel,
              totalQuotesRead: prev.totalQuotesRead + 1,
              boons: boon ? [...prev.boons, boon] : prev.boons,
              streakDays: newStreak,
              lastReadDate: new Date().toISOString(),
            };
          });

          setTimeout(checkBadges, 100);

          return { quote, xpGained, boon, leveledUp, newLevel };
        }
        
        console.log("[Forge] No quotes available (neither user nor stock)");
        return {
          quote: null,
          xpGained: 0,
          boon: null,
          leveledUp: false,
          newLevel: currentState.level,
        };
      }
      
      console.log("[Forge] Total quote pool:", quotesToPickFrom.length, "quotes from", currentState.parsedFiles.length, "file(s)");
    }
    
    if (quotesToPickFrom.length === 0) {
      return {
        quote: null,
        xpGained: 0,
        boon: null,
        leveledUp: false,
        newLevel: currentState.level,
      };
    }

    const randomValue = Math.random();
    const randomIndex = Math.floor(randomValue * quotesToPickFrom.length);
    const quote = quotesToPickFrom[randomIndex];
    
    // Find which file this quote belongs to for debug logging
    const selectedFile = currentState.parsedFiles.find((f) =>
      f.quotes.some((q) => q.id === quote.id)
    );
    console.log("[DEBUG RANDOMIZER] ===== NEW QUOTE =====");
    console.log("[DEBUG RANDOMIZER] Focus mode:", currentFocus.mode);
    console.log("[DEBUG RANDOMIZER] Focused file ID:", currentFocus.focusedFileId);
    console.log("[DEBUG RANDOMIZER] Quote pool size:", quotesToPickFrom.length);
    console.log("[DEBUG RANDOMIZER] Random value:", randomValue);
    console.log("[DEBUG RANDOMIZER] Selected index:", randomIndex);
    console.log("[DEBUG RANDOMIZER] Selected from file:", selectedFile?.fileName || "UNKNOWN");
    console.log("[DEBUG RANDOMIZER] Quote text:", quote.text.substring(0, 80) + "...");
    console.log("[DEBUG RANDOMIZER] Total files available:", currentState.parsedFiles.map(f => f.fileName).join(", "));
    console.log("[DEBUG RANDOMIZER] ========================");
    
    const xpGained = calculateXPForQuote(quote.length);
    
    if (!sourceFileId) {
      const foundFile = currentState.parsedFiles.find((f) =>
        f.quotes.some((q) => q.id === quote.id)
      );
      if (foundFile) {
        sourceFileId = foundFile.fileId;
      }
    }

    const boonRarity = rollForBoon();
    let boon: Boon | null = null;

    if (boonRarity) {
      const itemType = generateRandomItemType();
      const boonName = generateBoonName(itemType);
      const slotType = getSlotTypeForItem(itemType);
      const statBonuses = generateStatBonuses(boonRarity);
      
      const tempBoon: Boon = {
        id: `${Date.now()}_${Math.random()}`,
        name: boonName,
        description: generateBoonDescription(boonName),
        rarity: boonRarity,
        dateAcquired: new Date().toISOString(),
        itemType,
        slotType,
        statBonuses,
      };
      
      const equippedBoons: Boon[] = [];
      const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
      for (const slot of slots) {
        const boonId = currentState.equipment[slot];
        if (boonId) {
          const equippedBoon = currentState.boons.find((b) => b.id === boonId);
          if (equippedBoon) {
            equippedBoons.push(equippedBoon);
          }
        }
      }
      const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
      const playerStats = calculateCharacterStats(currentState.level, statBonusesArray, currentState.totalQuestingTimeMinutes);
      
      const playerContext = {
        level: currentState.level,
        destiny: currentState.destiny,
        stats: playerStats,
      };
      
      const themeTag = generateThemeTag(tempBoon, playerContext);
      tempBoon.themeTag = themeTag;
      
      boon = tempBoon;
    }

    const newXP = currentState.xp + xpGained;
    const oldLevel = currentState.level;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;

    setState((prev) => {
      const today = new Date().toDateString();
      const lastRead = prev.lastReadDate
        ? new Date(prev.lastReadDate).toDateString()
        : null;
      let newStreak = prev.streakDays;

      if (lastRead !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastRead === yesterdayStr) {
          newStreak += 1;
        } else if (lastRead === null) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }
      }
      
      const updatedScriptureStats = { ...prev.scriptureStats };
      
      if (sourceFileId && updatedScriptureStats[sourceFileId]) {
        // Always use safe default for focusState
        const currentFocusInState = (prev.focusState && typeof prev.focusState === 'object') 
          ? { mode: prev.focusState.mode ?? "all", focusedFileId: prev.focusState.focusedFileId ?? null }
          : { mode: "all" as const, focusedFileId: null };
        const inFocusMode = currentFocusInState.mode === "focus" && currentFocusInState.focusedFileId === sourceFileId;
        const scriptureXP = calculateScriptureXP(quote.length, inFocusMode);
        
        const currentStats = updatedScriptureStats[sourceFileId];
        const newLocalXp = currentStats.localXp + scriptureXP;
        const newLocalLevel = calculateScriptureLevel(newLocalXp);
        const newQuotesRead = currentStats.quotesRead + 1;
        const newMasteryTier = getScriptureMasteryTier(newQuotesRead);
        
        updatedScriptureStats[sourceFileId] = {
          ...currentStats,
          quotesRead: newQuotesRead,
          focusQuotesRead: inFocusMode ? currentStats.focusQuotesRead + 1 : currentStats.focusQuotesRead,
          localXp: newLocalXp,
          localLevel: newLocalLevel,
          masteryTier: newMasteryTier,
        };
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        totalQuotesRead: prev.totalQuotesRead + 1,
        boons: boon ? [...prev.boons, boon] : prev.boons,
        streakDays: newStreak,
        lastReadDate: new Date().toISOString(),
        scriptureStats: updatedScriptureStats,
      };
    });

    setTimeout(checkBadges, 100);

    return { quote, xpGained, boon, leveledUp, newLevel };
  }, [state, checkBadges, convertStockQuoteToQuote]);

  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const equipBoon = useCallback((slotType: SlotType, boonId: string | null) => {
    setState((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [slotType]: boonId,
      },
    }));
  }, []);

  const getEquippedBoons = useCallback(() => {
    const equipped: Boon[] = [];
    const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
    
    for (const slot of slots) {
      const boonId = state.equipment[slot];
      if (boonId) {
        const boon = state.boons.find((b) => b.id === boonId);
        if (boon) {
          equipped.push(boon);
        }
      }
    }
    
    return equipped;
  }, [state.equipment, state.boons]);

  const getCharacterStats = useCallback(() => {
    const equippedBoons = getEquippedBoons();
    const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
    return calculateCharacterStats(state.level, statBonusesArray, state.totalQuestingTimeMinutes);
  }, [state.level, getEquippedBoons, state.totalQuestingTimeMinutes]);

  const updateDestiny = useCallback(() => {
    setState((prev) => {
      const equippedBoons: Boon[] = [];
      const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
      
      for (const slot of slots) {
        const boonId = prev.equipment[slot];
        if (boonId) {
          const boon = prev.boons.find((b) => b.id === boonId);
          if (boon) {
            equippedBoons.push(boon);
          }
        }
      }
      
      const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
      const stats = calculateCharacterStats(prev.level, statBonusesArray, prev.totalQuestingTimeMinutes);
      const destiny = calculateCharacterDestiny(prev.level, stats);
      
      return {
        ...prev,
        destiny,
      };
    });
    
    setTimeout(checkBadges, 100);
  }, [checkBadges]);

  const equipmentKey = `${state.equipment.head}-${state.equipment.hands}-${state.equipment.heart}-${state.equipment.mind}-${state.equipment.light}-${state.equipment.relic}`;
  
  useEffect(() => {
    if (!isLoaded) return;
    
    const equippedBoons: Boon[] = [];
    const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
    
    for (const slot of slots) {
      const boonId = state.equipment[slot];
      if (boonId) {
        const boon = state.boons.find((b) => b.id === boonId);
        if (boon) {
          equippedBoons.push(boon);
        }
      }
    }
    
    const statBonusesArray = equippedBoons.map((b) => b.statBonuses);
    const stats = calculateCharacterStats(state.level, statBonusesArray, state.totalQuestingTimeMinutes);
    const newDestiny = calculateCharacterDestiny(state.level, stats);
    
    const currentDestinyStr = JSON.stringify(state.destiny);
    const newDestinyStr = JSON.stringify(newDestiny);
    
    if (currentDestinyStr !== newDestinyStr) {
      console.log("[Destiny] Updating destiny");
      setState((prev) => ({
        ...prev,
        destiny: newDestiny,
      }));
      setTimeout(checkBadges, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, state.level, equipmentKey, state.totalQuestingTimeMinutes, checkBadges]);
  
  useEffect(() => {
    if (!session.isActive || !session.startedAt) {
      if (timerRef.current) {
        console.log("[Session Timer] Clearing interval (session not active)");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    console.log("[Session Timer] Starting interval");
    
    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev.isActive || !prev.startedAt) return prev;
        
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        const currentMinutes = Math.floor(elapsed / 60);
        
        if (currentMinutes > prev.lastMinuteMarker) {
          const minutesToAdd = currentMinutes - prev.lastMinuteMarker;
          console.log("[Session Timer] Minute boundary crossed, adding", minutesToAdd, "minute(s)");
          
          setState((state) => {
            const updatedState = { ...state };
            
            if (prev.type === "raiding") {
              updatedState.totalRaidingTimeMinutes = state.totalRaidingTimeMinutes + minutesToAdd;
              
              if (prev.focusedFileId && state.scriptureStats[prev.focusedFileId]) {
                const updatedScriptureStats = { ...state.scriptureStats };
                updatedScriptureStats[prev.focusedFileId] = {
                  ...updatedScriptureStats[prev.focusedFileId],
                  timeSpentMinutes: (updatedScriptureStats[prev.focusedFileId].timeSpentMinutes || 0) + minutesToAdd,
                };
                updatedState.scriptureStats = updatedScriptureStats;
              }
            } else {
              updatedState.totalQuestingTimeMinutes = state.totalQuestingTimeMinutes + minutesToAdd;
            }
            
            return updatedState;
          });
          
          return {
            ...prev,
            elapsedSeconds: elapsed,
            lastMinuteMarker: currentMinutes,
          };
        }
        
        return {
          ...prev,
          elapsedSeconds: elapsed,
        };
      });
    }, 1000);
    
    timerRef.current = interval;
    
    return () => {
      console.log("[Session Timer] Clearing interval");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session.isActive, session.startedAt]);
  
  const startSession = useCallback((sessionType: "questing" | "raiding", fileId?: string) => {
    console.log("[Session] Starting session:", sessionType, "fileId:", fileId);
    
    setSession((prev) => {
      if (prev.isActive && prev.type === sessionType && prev.focusedFileId === fileId) {
        console.log("[Session] Already active, skipping");
        return prev;
      }
      
      if (prev.isActive) {
        console.log("[Session] Different session active, stopping first");
      }
      
      console.log("[Session] FORGE SESSION RESET & RESTARTED - Starting fresh session from 0");
      return {
        isActive: true,
        startedAt: Date.now(),
        elapsedSeconds: 0,
        type: sessionType,
        lastMinuteMarker: 0,
        focusedFileId: fileId,
      };
    });
  }, []);

  const endSession = useCallback(() => {
    console.log("[Session] Ending and resetting session");
    
    setSession((prev) => {
      if (!prev.isActive || !prev.startedAt || !prev.type) {
        console.log("[Session] No active session to end");
        return {
          isActive: false,
          startedAt: null,
          elapsedSeconds: 0,
          type: null,
          lastMinuteMarker: 0,
        };
      }
      
      const finalElapsedSeconds = Math.floor((Date.now() - prev.startedAt) / 1000);
      const finalMinutes = Math.floor(finalElapsedSeconds / 60);
      const minutesToAdd = Math.max(0, finalMinutes - prev.lastMinuteMarker);
      
      console.log("[Session] Final elapsed:", finalElapsedSeconds, "seconds =", finalMinutes, "minutes");
      console.log("[Session] Last marker:", prev.lastMinuteMarker, "minutes, adding:", minutesToAdd, "minutes");
      
      if (minutesToAdd > 0 && finalMinutes >= 1) {
        console.log("[Session] Session was at least 1 minute, counting towards stats");
        setState((state) => {
          const updatedState = { ...state };
          
          if (prev.type === "raiding") {
            console.log("[Session] Adding", minutesToAdd, "to raiding time");
            updatedState.totalRaidingTimeMinutes = state.totalRaidingTimeMinutes + minutesToAdd;
            
            if (prev.focusedFileId && state.scriptureStats[prev.focusedFileId]) {
              const updatedScriptureStats = { ...state.scriptureStats };
              updatedScriptureStats[prev.focusedFileId] = {
                ...updatedScriptureStats[prev.focusedFileId],
                timeSpentMinutes: (updatedScriptureStats[prev.focusedFileId].timeSpentMinutes || 0) + minutesToAdd,
              };
              updatedState.scriptureStats = updatedScriptureStats;
            }
          } else {
            console.log("[Session] Adding", minutesToAdd, "to questing time");
            updatedState.totalQuestingTimeMinutes = state.totalQuestingTimeMinutes + minutesToAdd;
          }
          
          return updatedState;
        });
        setTimeout(checkBadges, 100);
      } else if (finalMinutes < 1) {
        console.log("[Session] Session was less than 1 minute, not counting towards stats");
      }
      
      console.log("[Session] Resetting session state to 0");
      return {
        isActive: false,
        startedAt: null,
        elapsedSeconds: 0,
        type: null,
        lastMinuteMarker: 0,
      };
    });
  }, [checkBadges]);
  
  const getSessionInfo = useCallback(() => {
    return {
      isActive: session.isActive,
      elapsedSeconds: session.elapsedSeconds,
      elapsedMinutes: Math.floor(session.elapsedSeconds / 60),
      type: session.type,
    };
  }, [session]);
  
  const setFocusMode = useCallback((mode: "all" | "focus", fileId?: string) => {
    setState((prev) => {
      // Always use safe default
      const currentFocusState = (prev.focusState && typeof prev.focusState === 'object') 
        ? { mode: prev.focusState.mode ?? "all", focusedFileId: prev.focusState.focusedFileId ?? null }
        : { mode: "all" as const, focusedFileId: null };
      const updatedScriptureStats = { ...prev.scriptureStats };
      
      if (mode === "focus" && fileId) {
        if (!updatedScriptureStats[fileId]) {
          const stockPacks = getAvailableStockPacks();
          const stockFile = stockPacks.find((f) => f.fileId === fileId);
          const userFile = prev.parsedFiles.find((f) => f.fileId === fileId);
          const fileName = stockFile?.fileName || userFile?.fileName || fileId;
          
          updatedScriptureStats[fileId] = initializeScriptureStats(fileId, fileName);
          console.log("[Focus] Initialized stats for", fileName);
        }
        
        updatedScriptureStats[fileId] = {
          ...updatedScriptureStats[fileId],
          focusSessions: updatedScriptureStats[fileId].focusSessions + 1,
        };
      }
      
      return {
        ...prev,
        focusState: {
          ...currentFocusState,
          mode,
          focusedFileId: mode === "focus" ? (fileId ?? null) : null,
        },
        scriptureStats: updatedScriptureStats,
      };
    });
  }, [getAvailableStockPacks]);
  
  const getScriptureStats = useCallback((fileId: string): ScriptureStats | null => {
    return state.scriptureStats[fileId] || null;
  }, [state.scriptureStats]);
  
  const deleteFile = useCallback((fileId: string) => {
    setState((prev) => {
      const updatedParsedFiles = prev.parsedFiles.filter((f) => f.fileId !== fileId);
      const fileToDelete = prev.parsedFiles.find((f) => f.fileId === fileId);
      
      if (!fileToDelete) return prev;
      
      const quotesToRemove = new Set(fileToDelete.quotes.map((q) => q.id));
      const updatedQuotes = prev.quotes.filter((q) => !quotesToRemove.has(q.id));
      
      const updatedScriptureStats = { ...prev.scriptureStats };
      delete updatedScriptureStats[fileId];
      
      // Always use safe default
      const currentFocusState = (prev.focusState && typeof prev.focusState === 'object') 
        ? { mode: prev.focusState.mode ?? "all", focusedFileId: prev.focusState.focusedFileId ?? null }
        : { mode: "all" as const, focusedFileId: null };
      let updatedFocusState = currentFocusState;
      if (currentFocusState.mode === "focus" && currentFocusState.focusedFileId === fileId) {
        updatedFocusState = { mode: "all", focusedFileId: null };
      }
      
      return {
        ...prev,
        quotes: updatedQuotes,
        parsedFiles: updatedParsedFiles,
        scriptureStats: updatedScriptureStats,
        focusState: updatedFocusState,
        filesUploaded: Math.max(0, prev.filesUploaded - 1),
      };
    });
  }, []);
  
  const resetApp = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, THEME_KEY]);
      setState(DEFAULT_STATE);
      setTheme("dark");
      console.log("App reset complete - all data cleared");
    } catch (error) {
      console.error("Failed to reset app:", error);
    }
  }, []);
  
  const resetOnboarding = useCallback(async () => {
    try {
      console.log("[Dev] Resetting onboarding status");
      
      setState((prev) => {
        const updated = { ...prev, hasOnboarded: false };
        return updated;
      });
      
      console.log("[Dev] Onboarding reset complete");
      return { success: true };
    } catch (error) {
      console.error("[Dev] Failed to reset onboarding:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }, []);
  
  const completeOnboarding = useCallback(() => {
    console.log("[Onboarding] Marking onboarding as complete");
    setState((prev) => ({
      ...prev,
      hasOnboarded: true,
    }));
  }, []);
  
  const exportBackup = useCallback(() => {
    try {
      console.log("[BackupV2] Creating Backup v2 (progress only, no scripture content)");
      console.log("[BackupV2] State snapshot - Level:", state.level, "XP:", state.xp);
      console.log("[BackupV2] Boons:", state.boons.length, "Scripture files:", state.parsedFiles.length);
      
      const backup = createBackupV2(state, theme);
      
      const json = JSON.stringify(backup, null, 2);
      
      const sizeKB = (json.length / 1024).toFixed(2);
      const sizeMB = (json.length / (1024 * 1024)).toFixed(2);
      console.log("[BackupV2] Export complete - Size:", sizeKB, "KB (", sizeMB, "MB)");
      
      return json;
    } catch (error) {
      console.error("[BackupV2] Export failed:", error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Unknown error creating backup: " + String(error));
    }
  }, [state, theme]);
  
  const setProfilePicture = useCallback((uri: string) => {
    console.log("[Profile] Setting profile picture:", uri);
    setState((prev) => ({
      ...prev,
      profilePicture: uri,
    }));
  }, []);

  const setCharacterCard = useCallback((uri: string) => {
    console.log("[Character Card] Setting character card:", uri);
    setState((prev) => ({
      ...prev,
      characterCardImageUrl: uri,
      lastCardGeneratedAt: new Date().toISOString(),
    }));
  }, []);

  const generateItemArtForBoon = useCallback(async (boonId: string): Promise<{
    success: boolean;
    error?: string;
    imageUri?: string;
  }> => {
    try {
      const boon = state.boons.find(b => b.id === boonId);
      if (!boon) {
        return { success: false, error: "Artifact not found" };
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyCount = state.itemArtGenerationDate === today ? (state.itemArtGenerationCountToday || 0) : 0;
      
      const canGenerate = canGenerateItemArt(
        dailyCount,
        state.itemArtGenerationDate,
        boon.imageGeneratedAt || undefined
      );

      if (!canGenerate.canGenerate) {
        return { success: false, error: canGenerate.reason };
      }

      console.log("[Item Art] Generating for:", boon.name);
      const prompt = buildItemArtPrompt(boon, state.level);
      const result = await generateItemArt(prompt);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setState((prev) => {
        const updatedBoons = prev.boons.map(b => {
          if (b.id === boonId) {
            return {
              ...b,
              imageUrl: result.imageUri,
              imageGeneratedAt: new Date().toISOString(),
            };
          }
          return b;
        });

        const newDailyCount = prev.itemArtGenerationDate === today 
          ? (prev.itemArtGenerationCountToday || 0) + 1 
          : 1;

        return {
          ...prev,
          boons: updatedBoons,
          itemArtGenerationCountToday: newDailyCount,
          itemArtGenerationDate: today,
        };
      });

      console.log("[Item Art] Successfully generated and saved");
      return { success: true, imageUri: result.imageUri };
    } catch (error) {
      console.error("[Item Art] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [state.boons, state.level, state.itemArtGenerationCountToday, state.itemArtGenerationDate]);

  const getItemArtGenerationStatus = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const dailyCount = state.itemArtGenerationDate === today ? (state.itemArtGenerationCountToday || 0) : 0;
    return {
      usedToday: dailyCount,
      remainingToday: Math.max(0, 10 - dailyCount),
      maxPerDay: 10,
    };
  }, [state.itemArtGenerationCountToday, state.itemArtGenerationDate]);

  const restoreFromBackup = useCallback(async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
    console.log("[BackupV2] Starting restore");
    
    try {
      const parsed = JSON.parse(jsonString);
      console.log("[BackupV2] JSON parsed successfully");
      
      if (parsed.version === 2) {
        console.log("[BackupV2] Detected Backup v2");
        
        const validation = validateBackupV2(parsed);
        if (!validation.valid) {
          console.error("[BackupV2] Validation failed:", validation.error);
          return { success: false, error: validation.error };
        }
        
        console.log("[BackupV2] Validation passed, restoring...");
        
        const restoredState = restoreFromBackupV2(parsed, state);
        const restoredTheme = parsed.player.theme || "dark";
        
        setState(restoredState);
        setTheme(restoredTheme);
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restoredState));
        await AsyncStorage.setItem(THEME_KEY, restoredTheme);
        
        console.log("[BackupV2] Restore complete - Level:", restoredState.level, "XP:", restoredState.xp);
        console.log("[BackupV2] Boons:", restoredState.boons.length);
        console.log("[BackupV2] Scripture stats:", Object.keys(restoredState.scriptureStats).length);
        console.log("[BackupV2] Destiny:", restoredState.destiny ? restoredState.destiny.title : "None");
        
        setTimeout(checkBadges, 100);
        
        return { success: true };
      } else {
        console.log("[Backup] Detected old backup format, using legacy restore");
        
        const validation = validateBackup(parsed);
        if (!validation.valid) {
          console.error("[Backup] Validation failed:", validation.error);
          return { success: false, error: validation.error };
        }
        
        console.log("[Backup] Backup validation passed, migrating state...");
        
        const migratedState = migrateGameState(parsed.gameState);
        const restoredTheme = parsed.theme || "dark";
        
        setState(migratedState);
        setTheme(restoredTheme);
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
        await AsyncStorage.setItem(THEME_KEY, restoredTheme);
        
        console.log("[Backup] Legacy restore complete - Level:", migratedState.level, "XP:", migratedState.xp);
        console.log("[Backup] Boons:", migratedState.boons.length, "Quotes:", migratedState.quotes.length);
        console.log("[Backup] Files:", migratedState.parsedFiles.length);
        console.log("[Backup] Destiny:", migratedState.destiny ? migratedState.destiny.title : "None");
        
        setTimeout(checkBadges, 100);
        
        return { success: true };
      }
    } catch (error) {
      console.error("[Backup] Restore failed:", error);
      if (error instanceof SyntaxError) {
        return { success: false, error: "Invalid JSON format" };
      }
      return { success: false, error: "Failed to restore backup" };
    }
  }, [checkBadges, state]);

  return {
    state,
    theme,
    isLoaded,
    addQuotes,
    readQuote,
    changeTheme,
    equipBoon,
    getEquippedBoons,
    getCharacterStats,
    updateDestiny,
    startSession,
    endSession,
    getSessionInfo,
    setFocusMode,
    getScriptureStats,
    deleteFile,
    resetApp,
    exportBackup,
    restoreFromBackup,
    setProfilePicture,
    resetOnboarding,
    completeOnboarding,
    session,
    setCharacterCard,
    generateItemArtForBoon,
    getItemArtGenerationStatus,
    getAvailableStockPacks,
  };
};

export const [GameProvider, useGame] = createContextHook(useGameContext);
