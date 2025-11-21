import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";
import { getXPProgress, RARITY_CONFIG } from "../../constants/game";
import { pickAndParseTextFile } from "../../utils/fileParser";
import { Sparkles, Upload, TrendingUp, Clock, Volume2, VolumeX, Infinity } from "lucide-react-native";
import { quoteForge } from "../../utils/quoteForge";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  AppState,
  AppStateStatus,
} from "react-native";
import { Quote, Boon } from "../../types/game";
import { useFocusEffect } from "@react-navigation/native";
import { useTts } from "../../hooks/useTts";
import { useAutoMode } from "../../hooks/useAutoMode";

export default function QuoteGeneratorScreen() {
  const { state, theme, readQuote, addQuotes, isLoaded, startSession, endSession, getSessionInfo, setFocusMode } = useGame();
  const colors = getThemeColors(theme);

  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [lastXP, setLastXP] = useState<number>(0);
  const [lastBoon, setLastBoon] = useState<Boon | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const boonFadeAnim = useState(new Animated.Value(0))[0];

  const { speak, stop, isSpeaking } = useTts();

  const handleNextQuote = useCallback(() => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo.isActive || sessionInfo.type !== "questing") {
      console.log("[Forge Session] FORGE SESSION STARTED");
      startSession("questing");
    }
    
    const result = readQuote();

    if (result.quote) {
      setCurrentQuote(result.quote);
      setLastXP(result.xpGained);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      if (result.boon) {
        setLastBoon(result.boon);
        Animated.sequence([
          Animated.timing(boonFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
          Animated.timing(boonFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setLastBoon(null);
        });
      }

      if (result.leveledUp) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    }
  }, [readQuote, scaleAnim, boonFadeAnim, getSessionInfo, startSession]);

  const {
    enabled: isAutoModeActive,
    toggleAutoMode,
    stopAutoMode,
  } = useAutoMode({
    getText: () => currentQuote?.text,
    onNext: handleNextQuote,
    config: {
      silenceBetweenSeconds: 0.8,
    },
  });

  useEffect(() => {
    console.log("[Forge Session] Installing AppState listener");
    
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log("[Forge Session] AppState changed to:", nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log("[Forge Session] App backgrounded - FORGE SESSION ENDED (app left)");
        endSession();
        stop();
        stopAutoMode();
      }
    });
    
    return () => {
      console.log("[Forge Session] Removing AppState listener");
      subscription.remove();
    };
  }, [endSession, stop, stopAutoMode]);
  
  useFocusEffect(
    React.useCallback(() => {
      if (!isLoaded || !state.quotes.length) return;
      
      console.log("[Forge Session] Tab focused - setting random mode");
      console.log("[Forge Session] Session will start on first quote (Roll for Quote or Auto Mode)");
      setFocusMode("all");
      
      return () => {
        console.log("[Forge Session] Tab blurred - FORGE SESSION ENDED (app left)");
        endSession();
        stop();
        stopAutoMode();
      };
    }, [isLoaded, state.quotes.length, endSession, setFocusMode, stop, stopAutoMode])
  );
  
  if (!isLoaded) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const progress = getXPProgress(state.xp, state.level);

  const handleRoll = () => {
    handleNextQuote();
  };

  const handleSpeakerPress = async () => {
    if (!currentQuote?.text) return;

    if (isSpeaking()) {
      await stop();
    } else {
      await speak(currentQuote.text);
    }
  };

  const handleAutoModePress = async () => {
    await toggleAutoMode();
  };

  const handleUploadFile = async () => {
    setIsUploading(true);
    try {
      const result = await pickAndParseTextFile();
      if (result) {
        addQuotes(result.quotes, result.fileName);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const stockPacksAvailable = quoteForge.getAllStockQuotes().length > 0;
  const hasQuotes = state.quotes.length > 0 || stockPacksAvailable;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { color: colors.text }]}>
              Level {state.level}
            </Text>
            <Text style={[styles.xpText, { color: colors.textSecondary }]}>
              {progress.current.toLocaleString()} /{" "}
              {progress.needed.toLocaleString()} XP
            </Text>
          </View>
          <View
            style={[styles.progressBarBg, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(progress.percentage, 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        {showLevelUp && (
          <View
            style={[
              styles.levelUpBanner,
              { backgroundColor: colors.success },
            ]}
          >
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.levelUpText}>Level Up! Now Level {state.level}</Text>
          </View>
        )}

        {lastBoon && (
          <Animated.View
            style={[
              styles.boonNotification,
              {
                backgroundColor: RARITY_CONFIG[lastBoon.rarity].color,
                opacity: boonFadeAnim,
              },
            ]}
          >
            <Sparkles size={20} color="#FFFFFF" />
            <Text style={styles.boonText}>
              {RARITY_CONFIG[lastBoon.rarity].label} Boon Acquired!
            </Text>
          </Animated.View>
        )}

        {!hasQuotes ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Quotes Available
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Upload scriptures to begin your journey
            </Text>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleUploadFile}
              disabled={isUploading}
            >
              <Upload size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>
                {isUploading ? "Uploading..." : "Upload Text File"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : state.quotes.length === 0 && stockPacksAvailable ? (
          <>
            <View style={[styles.stockPackBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
              <Sparkles size={20} color={colors.primary} />
              <View style={styles.stockPackInfo}>
                <Text style={[styles.stockPackTitle, { color: colors.primary }]}>
                  Radiant Resolve Pack Active
                </Text>
                <Text style={[styles.stockPackDesc, { color: colors.textSecondary }]}>
                  108 inspirational quotes • Upload your own scriptures anytime
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {state.totalQuotesRead}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Quotes Read
                </Text>
              </View>
              <View
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {state.boons.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Boons Acquired
                </Text>
              </View>
            </View>
            
            <View style={[styles.sessionCard, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>Current Session</Text>
                <Text style={[styles.sessionTime, { color: colors.primary }]}>
                  {getSessionInfo().isActive && getSessionInfo().type === "questing" ? (
                    <>
                      {Math.floor(getSessionInfo().elapsedMinutes / 60) > 0 ? `${Math.floor(getSessionInfo().elapsedMinutes / 60)}h ` : ''}
                      {getSessionInfo().elapsedMinutes % 60}m {getSessionInfo().elapsedSeconds % 60}s
                    </>
                  ) : '0m 0s'}
                </Text>
              </View>
            </View>

            {currentQuote && (
              <View style={styles.ttsControls}>
                <TouchableOpacity
                  style={[styles.ttsButton, { backgroundColor: colors.surface }]}
                  onPress={handleSpeakerPress}
                  accessibilityLabel="Read this text aloud"
                >
                  {isSpeaking() ? (
                    <VolumeX size={20} color={colors.primary} />
                  ) : (
                    <Volume2 size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.ttsButtonText, { color: colors.text }]}>
                    {isSpeaking() ? 'Stop' : 'Listen'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.autoModeButton,
                    {
                      backgroundColor: isAutoModeActive
                        ? colors.primary
                        : colors.surface,
                    },
                  ]}
                  onPress={handleAutoModePress}
                  accessibilityLabel="Enable auto reading mode"
                >
                  <Infinity
                    size={20}
                    color={isAutoModeActive ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.autoModeButtonText,
                      { color: isAutoModeActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {isAutoModeActive ? 'Auto Mode On' : 'Auto Mode'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Animated.View
              style={[
                styles.quoteCard,
                { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {currentQuote ? (
                <>
                  <Text style={[styles.quoteText, { color: colors.text }]}>
                    &ldquo;{currentQuote.text}&rdquo;
                  </Text>
                  <View style={styles.quoteFooter}>
                    <Text
                      style={[styles.quoteSource, { color: colors.textSecondary }]}
                    >
                      {currentQuote.fileOrigin}
                    </Text>
                    {lastXP > 0 && (
                      <Text style={[styles.xpGained, { color: colors.success }]}>
                        +{lastXP} XP
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tap the button below to forge a verse
                </Text>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[styles.rollButton, { backgroundColor: colors.primary }]}
              onPress={handleRoll}
            >
              <Sparkles size={28} color="#FFFFFF" />
              <Text style={styles.rollButtonText}>Roll for Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButtonSmall,
                { backgroundColor: colors.surfaceHigh },
              ]}
              onPress={handleUploadFile}
              disabled={isUploading}
            >
              <Upload size={20} color={colors.text} />
              <Text style={[styles.uploadButtonSmallText, { color: colors.text }]}>
                {isUploading ? "Uploading..." : "Upload Your Own Scripture"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.questHeader, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Sparkles size={24} color={colors.primary} />
              <View style={styles.questInfo}>
                <Text style={[styles.questLabel, { color: colors.textSecondary }]}>
                  QUESTING MODE
                </Text>
                <Text style={[styles.questTitle, { color: colors.primary }]}>
                  Random Oracle - All Scriptures
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {state.totalQuotesRead}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Quotes Read
                </Text>
              </View>
              <View
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {state.boons.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Boons Acquired
                </Text>
              </View>
            </View>
            
            <View style={[styles.sessionCard, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>Current Session</Text>
                <Text style={[styles.sessionTime, { color: colors.primary }]}>
                  {getSessionInfo().isActive && getSessionInfo().type === "questing" ? (
                    <>
                      {Math.floor(getSessionInfo().elapsedMinutes / 60) > 0 ? `${Math.floor(getSessionInfo().elapsedMinutes / 60)}h ` : ''}
                      {getSessionInfo().elapsedMinutes % 60}m {getSessionInfo().elapsedSeconds % 60}s
                    </>
                  ) : '0m 0s'}
                </Text>
              </View>
            </View>

            {currentQuote && (
              <View style={styles.ttsControls}>
                <TouchableOpacity
                  style={[styles.ttsButton, { backgroundColor: colors.surface }]}
                  onPress={handleSpeakerPress}
                  accessibilityLabel="Read this text aloud"
                >
                  {isSpeaking() ? (
                    <VolumeX size={20} color={colors.primary} />
                  ) : (
                    <Volume2 size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.ttsButtonText, { color: colors.text }]}>
                    {isSpeaking() ? 'Stop' : 'Listen'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.autoModeButton,
                    {
                      backgroundColor: isAutoModeActive
                        ? colors.primary
                        : colors.surface,
                    },
                  ]}
                  onPress={handleAutoModePress}
                  accessibilityLabel="Enable auto reading mode"
                >
                  <Infinity
                    size={20}
                    color={isAutoModeActive ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.autoModeButtonText,
                      { color: isAutoModeActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {isAutoModeActive ? 'Auto Mode On' : 'Auto Mode'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Animated.View
              style={[
                styles.quoteCard,
                { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {currentQuote ? (
                <>
                  <Text style={[styles.quoteText, { color: colors.text }]}>
                    &ldquo;{currentQuote.text}&rdquo;
                  </Text>
                  <View style={styles.quoteFooter}>
                    <Text
                      style={[styles.quoteSource, { color: colors.textSecondary }]}
                    >
                      {currentQuote.fileOrigin}
                    </Text>
                    {lastXP > 0 && (
                      <Text style={[styles.xpGained, { color: colors.success }]}>
                        +{lastXP} XP
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tap the button below to forge a verse
                </Text>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[styles.rollButton, { backgroundColor: colors.primary }]}
              onPress={handleRoll}
            >
              <Sparkles size={28} color="#FFFFFF" />
              <Text style={styles.rollButtonText}>Roll for Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButtonSmall,
                { backgroundColor: colors.surfaceHigh },
              ]}
              onPress={handleUploadFile}
              disabled={isUploading}
            >
              <Upload size={20} color={colors.text} />
              <Text style={[styles.uploadButtonSmallText, { color: colors.text }]}>
                {isUploading ? "Uploading..." : "Upload Another Scripture"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    marginBottom: 24,
  },
  levelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  xpText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  levelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  levelUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  boonNotification: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  boonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  quoteCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    minHeight: 200,
    justifyContent: "center",
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "500" as const,
    marginBottom: 16,
  },
  quoteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quoteSource: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  xpGained: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic" as const,
  },
  rollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  rollButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  uploadButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonSmallText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    gap: 12,
  },
  questInfo: {
    flex: 1,
  },
  questLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  ttsControls: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  ttsButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ttsButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  autoModeButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  autoModeButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  stockPackBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    gap: 12,
  },
  stockPackInfo: {
    flex: 1,
  },
  stockPackTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  stockPackDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
