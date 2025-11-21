import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";
import { getXPProgress, getScriptureXPProgress, RARITY_CONFIG } from "../../constants/game";
import { pickAndParseTextFile } from "../../utils/fileParser";
import { Sparkles, Upload, TrendingUp, BookOpen, Flame, Volume2, VolumeX, Infinity, Clock } from "lucide-react-native";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { Quote, Boon } from "../../types/game";
import { useFocusEffect } from "@react-navigation/native";
import { useTts } from "../../hooks/useTts";
import { useAutoMode } from "../../hooks/useAutoMode";

export default function SanctumScreen() {
  const { state, theme, readQuote, addQuotes, isLoaded, startSession, endSession, getSessionInfo, setFocusMode, getAvailableStockPacks } = useGame();
  const colors = getThemeColors(theme);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previousFileCount, setPreviousFileCount] = useState<number>(0);

  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [lastXP, setLastXP] = useState<number>(0);
  const [lastBoon, setLastBoon] = useState<Boon | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const boonFadeAnim = useState(new Animated.Value(0))[0];

  const { speak, stop, isSpeaking } = useTts();

  const stockPacks = getAvailableStockPacks();
  const allFiles = [...stockPacks, ...state.parsedFiles];

  const handleNextQuote = useCallback(() => {
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
  }, [readQuote, scaleAnim, boonFadeAnim]);

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

  useFocusEffect(
    React.useCallback(() => {
      if (!isLoaded || !allFiles.length || !selectedFileId) return;
      
      console.log("[Sanctum] Tab focused - starting session for", selectedFileId);
      startSession("raiding", selectedFileId);
      
      return () => {
        console.log("[Sanctum] Tab blurred - ending session");
        endSession();
        stop();
        stopAutoMode();
      };
    }, [isLoaded, allFiles.length, selectedFileId, startSession, endSession, stop, stopAutoMode])
  );

  useEffect(() => {
    if (allFiles.length > 0) {
      if (state.parsedFiles.length > previousFileCount) {
        const latestFileId = state.parsedFiles[state.parsedFiles.length - 1].fileId;
        setSelectedFileId(latestFileId);
        setFocusMode("focus", latestFileId);
        setPreviousFileCount(state.parsedFiles.length);
      } else if (!selectedFileId && previousFileCount === 0) {
        const firstFileId = allFiles[0].fileId;
        setSelectedFileId(firstFileId);
        setFocusMode("focus", firstFileId);
        setPreviousFileCount(state.parsedFiles.length);
      }
    }
  }, [allFiles.length, state.parsedFiles.length, previousFileCount, selectedFileId, setFocusMode]);

  useEffect(() => {
    if (selectedFileId && state.focusState?.focusedFileId !== selectedFileId) {
      setFocusMode("focus", selectedFileId);
      if (allFiles.length > 0) {
        endSession();
        startSession("raiding", selectedFileId);
      }
    }
  }, [selectedFileId, state.focusState?.focusedFileId, allFiles.length, setFocusMode, startSession, endSession]);
  
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

  const handleRaid = () => {
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

  const hasFiles = allFiles.length > 0;
  const currentFile = selectedFileId ? allFiles.find(f => f.fileId === selectedFileId) : null;
  const currentStats = selectedFileId ? state.scriptureStats[selectedFileId] : null;

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

        {!hasFiles ? (
          <View style={styles.emptyState}>
            <Flame size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              The Sanctum Awaits
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Upload scriptures to begin your focused raids
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
                {isUploading ? "Uploading..." : "Upload Scripture"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.sanctumHeader, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Flame size={24} color={colors.primary} />
              <View style={styles.sanctumInfo}>
                <Text style={[styles.sanctumLabel, { color: colors.textSecondary }]}>
                  RAIDING SANCTUM
                </Text>
                <Text style={[styles.sanctumTitle, { color: colors.primary }]}>
                  Focused Scripture Study
                </Text>
              </View>
            </View>

            <View style={styles.scriptureSelector}>
              <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>
                SELECT SCRIPTURE
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scriptureList}
              >
                {allFiles.map((file) => {
                  const stats = state.scriptureStats[file.fileId];
                  const isSelected = selectedFileId === file.fileId;
                  const isStockPack = file.fileId.startsWith('stock_');
                  const scriptureProgress = stats ? getScriptureXPProgress(stats.localXp, stats.localLevel) : null;
                  const timeSpent = stats?.timeSpentMinutes || 0;
                  const timeText = timeSpent >= 60 
                    ? `${Math.floor(timeSpent / 60)}h ${timeSpent % 60}m`
                    : `${timeSpent}m`;

                  return (
                    <TouchableOpacity
                      key={file.fileId}
                      style={[
                        styles.scriptureCard,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedFileId(file.fileId)}
                    >
                      <BookOpen 
                        size={20} 
                        color={isSelected ? "#FFFFFF" : colors.primary} 
                      />
                      <Text
                        style={[
                          styles.scriptureCardTitle,
                          { color: isSelected ? "#FFFFFF" : colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {file.fileName}
                      </Text>
                      {isStockPack && !stats && (
                        <Text
                          style={[
                            styles.scriptureCardStats,
                            { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                          ]}
                        >
                          {file.quotes.length} quotes · Stock Pack
                        </Text>
                      )}
                      {stats && (
                        <>
                          <Text
                            style={[
                              styles.scriptureCardMastery,
                              { color: isSelected ? "#FFFFFF" : colors.primary },
                            ]}
                          >
                            {stats.masteryTier}
                          </Text>
                          <Text
                            style={[
                              styles.scriptureCardStats,
                              { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                            ]}
                          >
                            Level {stats.localLevel} · {stats.quotesRead} read
                          </Text>
                          <Text
                            style={[
                              styles.scriptureCardTime,
                              { color: isSelected ? "rgba(255,255,255,0.7)" : colors.textSecondary },
                            ]}
                          >
                            {timeText} spent
                          </Text>
                          {scriptureProgress && (
                            <View style={styles.scriptureProgressContainer}>
                              <View
                                style={[
                                  styles.scriptureProgressBg,
                                  { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : colors.border },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.scriptureProgressBar,
                                    {
                                      backgroundColor: isSelected ? "#FFFFFF" : colors.primary,
                                      width: `${Math.min(scriptureProgress.percentage, 100)}%`,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.sessionCard, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>Current Session</Text>
                <Text style={[styles.sessionTime, { color: colors.primary }]}>
                  {getSessionInfo().isActive && getSessionInfo().type === "raiding" ? (
                    <>
                      {Math.floor(getSessionInfo().elapsedMinutes / 60) > 0 ? `${Math.floor(getSessionInfo().elapsedMinutes / 60)}h ` : ''}
                      {getSessionInfo().elapsedMinutes % 60}m {getSessionInfo().elapsedSeconds % 60}s
                    </>
                  ) : '0m 0s'}
                </Text>
              </View>
            </View>

            {currentFile && currentStats && (
              <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Scripture Level
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {currentStats.localLevel}
                  </Text>
                </View>
                <View style={styles.levelProgressContainer}>
                  <View style={styles.levelProgressInfo}>
                    <Text style={[styles.levelProgressText, { color: colors.textSecondary }]}>
                      {getScriptureXPProgress(currentStats.localXp, currentStats.localLevel).current} / {getScriptureXPProgress(currentStats.localXp, currentStats.localLevel).needed} XP
                    </Text>
                    <Text style={[styles.levelProgressPercent, { color: colors.primary }]}>
                      {Math.floor(getScriptureXPProgress(currentStats.localXp, currentStats.localLevel).percentage)}%
                    </Text>
                  </View>
                  <View style={[styles.levelProgressBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.levelProgressBar,
                        {
                          backgroundColor: colors.primary,
                          width: `${Math.min(getScriptureXPProgress(currentStats.localXp, currentStats.localLevel).percentage, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Mastery Tier
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {currentStats.masteryTier}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Quotes Read
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {currentStats.quotesRead}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Time Spent
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {currentStats.timeSpentMinutes >= 60 
                      ? `${Math.floor(currentStats.timeSpentMinutes / 60)}h ${currentStats.timeSpentMinutes % 60}m`
                      : `${currentStats.timeSpentMinutes}m`}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Focus Sessions
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {currentStats.focusSessions}
                  </Text>
                </View>
              </View>
            )}

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
                  Tap the button below to raid this scripture
                </Text>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[styles.raidButton, { backgroundColor: colors.primary }]}
              onPress={handleRaid}
            >
              <Flame size={28} color="#FFFFFF" />
              <Text style={styles.raidButtonText}>Raid Scripture</Text>
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
    marginTop: 20,
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
  sanctumHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    gap: 12,
  },
  sanctumInfo: {
    flex: 1,
  },
  sanctumLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sanctumTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  scriptureSelector: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  scriptureList: {
    gap: 12,
    paddingRight: 20,
  },
  scriptureCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  scriptureCardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    minHeight: 40,
  },
  scriptureCardMastery: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  scriptureCardStats: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  scriptureCardTime: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
  scriptureProgressContainer: {
    marginTop: 8,
  },
  scriptureProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scriptureProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  levelProgressContainer: {
    marginBottom: 12,
  },
  levelProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  levelProgressText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  levelProgressPercent: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  levelProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  levelProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
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
  raidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  raidButtonText: {
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
});
