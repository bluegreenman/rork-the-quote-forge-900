import { useGame } from "../../contexts/GameContext";
import { getThemeColors, THEMES } from "../../constants/themes";
import { getXPProgress, RARITY_CONFIG } from "../../constants/game";
import { User, Award, Flame, Palette, Crown, Clock, Gem, Camera, Image as ImageIcon, Sparkles, X, Star, Zap, TrendingUp } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Theme, BadgeCategory, Rarity } from "../../types/game";
import { BADGE_TIER_COLORS } from "../../constants/badges";

const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/png?seed=1",
  "https://api.dicebear.com/7.x/bottts/png?seed=2",
  "https://api.dicebear.com/7.x/bottts/png?seed=3",
  "https://api.dicebear.com/7.x/avataaars/png?seed=1",
  "https://api.dicebear.com/7.x/avataaars/png?seed=2",
  "https://api.dicebear.com/7.x/avataaars/png?seed=3",
  "https://api.dicebear.com/7.x/lorelei/png?seed=1",
  "https://api.dicebear.com/7.x/lorelei/png?seed=2",
];

export default function ProfileScreen() {
  const { state, theme, changeTheme, isLoaded, setProfilePicture } = useGame();
  const colors = getThemeColors(theme);

  const [showThemes, setShowThemes] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [generatingAI, setGeneratingAI] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [showAIPrompt, setShowAIPrompt] = useState<boolean>(false);

  const progress = getXPProgress(state.xp, state.level);
  const unlockedBadges = state.badges.filter((b) => b.unlocked);
  
  const rarityStats = useMemo(() => {
    const stats: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    state.boons.forEach((boon) => {
      stats[boon.rarity]++;
    });
    return stats;
  }, [state.boons]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarLevelWrapper}>
            <TouchableOpacity
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.primary + "33" },
              ]}
              onPress={() => setShowAvatarPicker(true)}
            >
              {state.profilePicture ? (
                <Image
                  source={{ uri: state.profilePicture }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  onError={(error) => {
                    console.error("[Avatar] Image load error:", error);
                    if (state.profilePicture) {
                      console.log("[Avatar] Failed URI:", state.profilePicture.substring(0, 100));
                    }
                  }}
                  onLoad={() => {
                    console.log("[Avatar] Image loaded successfully");
                  }}
                />
              ) : (
                <User size={48} color={colors.primary} />
              )}
              <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            
            <View style={[styles.levelBadgeProfile, { backgroundColor: colors.primary }]}>
              <Star size={16} color="#FFF" fill="#FFF" />
              <Text style={styles.levelBadgeProfileText}>{state.level}</Text>
            </View>
          </View>
          
          {state.destiny && (
            <View style={styles.destinyHeader}>
              <Text style={[styles.destinyTitle, { color: colors.primary }]}>
                {state.destiny.primaryClass}
              </Text>
              <View style={styles.destinyBadge}>
                <Crown size={14} color={colors.primary} />
                <Text style={[styles.destinyTier, { color: colors.primary }]}>
                  {state.destiny.destinyTier}
                </Text>
              </View>
            </View>
          )}
          
          {!state.destiny && (
            <>
              <Text style={[styles.levelTitle, { color: colors.text }]}>
                Level {state.level} Seeker
              </Text>
              <Text style={[styles.xpSubtitle, { color: colors.textSecondary }]}>
                {state.xp.toLocaleString()} Total XP
              </Text>
            </>
          )}
        </View>

        <View style={[styles.levelCard, { backgroundColor: colors.surface }]}>
          <View style={styles.levelCardHeader}>
            <View style={styles.levelCardLeft}>
              <View style={[styles.levelIconCircle, { backgroundColor: colors.primary + "22" }]}>
                <TrendingUp size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.levelCardTitle, { color: colors.text }]}>Level {state.level}</Text>
                <Text style={[styles.levelCardSubtitle, { color: colors.textSecondary }]}>{state.xp.toLocaleString()} Total XP</Text>
              </View>
            </View>
            <View style={[styles.levelCircleProgress, { borderColor: colors.primary + "33" }]}>
              <View style={[styles.levelCircleProgressInner, { backgroundColor: colors.primary }]}>
                <Zap size={18} color="#FFF" fill="#FFF" />
              </View>
            </View>
          </View>
          
          <View style={styles.levelCardProgress}>
            <View style={styles.levelCardProgressInfo}>
              <Text style={[styles.levelCardProgressLabel, { color: colors.textSecondary }]}>Progress to Level {state.level + 1}</Text>
              <Text style={[styles.levelCardProgressPercent, { color: colors.primary }]}>
                {progress.percentage.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.levelCardProgressBar, { backgroundColor: colors.surfaceHigh }]}>
              <View
                style={[
                  styles.levelCardProgressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(progress.percentage, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.levelCardProgressRemaining, { color: colors.textSecondary }]}>
              {(progress.needed - progress.current).toLocaleString()} XP remaining
            </Text>
          </View>
        </View>

        <View style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {state.totalQuotesRead}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Quotes Read
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {state.boons.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Boons Found
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {state.filesUploaded}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Files Uploaded
            </Text>
          </View>
        </View>

        <View style={styles.statsRow2}>
          <View style={[styles.section2, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader2}>
              <Flame size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle2, { color: colors.text }]}>
                Streak
              </Text>
            </View>
            <Text style={[styles.streakValue2, { color: colors.primary }]}>
              {state.streakDays}
            </Text>
            <Text style={[styles.streakLabel2, { color: colors.textSecondary }]}>
              {state.streakDays === 1 ? "Day" : "Days"}
            </Text>
          </View>
          
          <View style={[styles.section2, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader2}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle2, { color: colors.text }]}>
                Time
              </Text>
            </View>
            <Text style={[styles.streakValue2, { color: colors.primary }]}>
              {Math.floor(state.totalQuestingTimeMinutes / 60)}h {Math.floor(state.totalQuestingTimeMinutes % 60)}m
            </Text>
            <Text style={[styles.streakLabel2, { color: colors.textSecondary }]}>
              Questing in the Forge
            </Text>
          </View>
        </View>

        <View style={[styles.timeSection, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader2}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle2, { color: colors.text }]}>
              Time Raiding in the Sanctum
            </Text>
          </View>
          <Text style={[styles.streakValue2, { color: colors.primary }]}>
            {Math.floor(state.totalRaidingTimeMinutes / 60)}h {Math.floor(state.totalRaidingTimeMinutes % 60)}m
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gem size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Rarity Collection
            </Text>
          </View>
          <View style={[styles.rarityStatsContainer, { backgroundColor: colors.surface }]}>
            {(["legendary", "epic", "rare", "uncommon", "common"] as Rarity[]).map((rarity) => {
              const config = RARITY_CONFIG[rarity];
              const count = rarityStats[rarity];
              
              return (
                <View key={rarity} style={styles.rarityStatRow}>
                  <View style={styles.rarityStatLeft}>
                    <View
                      style={[
                        styles.rarityDot,
                        { backgroundColor: config.color },
                      ]}
                    />
                    <Text style={[styles.rarityStatLabel, { color: colors.text }]}>
                      {config.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.rarityStatValue,
                      { color: config.color },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Badges
            </Text>
            <Text style={[styles.badgeCount, { color: colors.textSecondary }]}>
              {unlockedBadges.length} / {state.badges.length}
            </Text>
          </View>
          
          {(['quotes', 'files', 'boons', 'streaks', 'level', 'destiny', 'time', 'scripture'] as BadgeCategory[]).map((category) => {
            const categoryBadges = state.badges.filter((b) => b.category === category);
            if (categoryBadges.length === 0) return null;
            
            const categoryLabels: Record<BadgeCategory, string> = {
              quotes: "Quotes",
              files: "Files",
              boons: "Boons",
              streaks: "Streaks",
              level: "Level",
              destiny: "Destiny",
              time: "Time Questing",
              scripture: "Scripture Mastery",
            };
            
            return (
              <View key={category} style={styles.badgeCategory}>
                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                  {categoryLabels[category]}
                </Text>
                <View style={styles.badgesGrid}>
                  {categoryBadges.map((badge) => {
                    const tierColor = badge.unlocked
                      ? BADGE_TIER_COLORS[badge.tier]
                      : colors.border;
                    
                    return (
                      <View
                        key={badge.id}
                        style={[
                          styles.badgeCard,
                          {
                            backgroundColor: badge.unlocked
                              ? tierColor + "22"
                              : colors.surface,
                            borderColor: tierColor,
                          },
                        ]}
                      >
                        <Award
                          size={28}
                          color={tierColor}
                        />
                        <View style={[styles.tierBadge, { backgroundColor: tierColor + "33" }]}>
                          <Text style={[styles.tierText, { color: tierColor }]}>
                            {badge.tier}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.badgeName,
                            {
                              color: badge.unlocked ? colors.text : colors.textSecondary,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {badge.name}
                        </Text>
                        <Text
                          style={[
                            styles.badgeDesc,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {badge.description}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Theme
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowThemes(!showThemes)}
          >
            <View style={[styles.themePreview, { backgroundColor: colors.primary }]} />
            <Text style={[styles.themeButtonText, { color: colors.text }]}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>
          </TouchableOpacity>

          {showThemes && (
            <View style={styles.themesGrid}>
              {(Object.keys(THEMES) as Theme[]).map((themeName) => {
                const themeColors = THEMES[themeName];
                return (
                  <TouchableOpacity
                    key={themeName}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          theme === themeName ? colors.primary : colors.border,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      changeTheme(themeName);
                      setShowThemes(false);
                    }}
                  >
                    <View
                      style={[
                        styles.themeOptionPreview,
                        { backgroundColor: themeColors.primary },
                      ]}
                    />
                    <Text style={[styles.themeOptionText, { color: colors.text }]}>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.progressSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Next Level
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress.current.toLocaleString()} / {progress.needed.toLocaleString()} XP
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {progress.percentage.toFixed(1)}%
            </Text>
          </View>
          <View
            style={[styles.progressBarBg, { backgroundColor: colors.surfaceHigh }]}
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
      </ScrollView>

      <Modal
        visible={showAvatarPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Avatar</Text>
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity
                style={[styles.pickerOption, { backgroundColor: colors.surface }]}
                onPress={async () => {
                  try {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert("Permission needed", "We need camera roll permissions to select a photo.");
                      return;
                    }

                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.8,
                    });

                    if (!result.canceled && result.assets[0]) {
                      setProfilePicture(result.assets[0].uri);
                      setShowAvatarPicker(false);
                    }
                  } catch (error) {
                    console.error("Image picker error:", error);
                    Alert.alert("Error", "Failed to pick image");
                  }
                }}
              >
                <ImageIcon size={24} color={colors.primary} />
                <Text style={[styles.pickerOptionText, { color: colors.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>

              {!showAIPrompt ? (
                <TouchableOpacity
                  style={[styles.pickerOption, { backgroundColor: colors.surface }]}
                  onPress={() => setShowAIPrompt(true)}
                >
                  <Sparkles size={24} color={colors.primary} />
                  <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                    Generate AI Avatar
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.aiPromptSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.aiPromptLabel, { color: colors.text }]}>Describe your avatar</Text>
                  <TextInput
                    style={[styles.aiPromptInput, { backgroundColor: colors.surfaceHigh, color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g., mystical wizard with purple robes, ancient scholar, fantasy warrior..."
                    placeholderTextColor={colors.textSecondary}
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.aiPromptButtons}>
                    <TouchableOpacity
                      style={[styles.aiPromptButton, styles.aiPromptCancel, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowAIPrompt(false);
                        setAiPrompt("");
                      }}
                    >
                      <Text style={[styles.aiPromptButtonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.aiPromptButton, styles.aiPromptGenerate, { backgroundColor: colors.primary }]}
                      onPress={async () => {
                        if (generatingAI) return;
                        if (!aiPrompt.trim()) {
                          Alert.alert("No Description", "Please describe what you want for your avatar.");
                          return;
                        }
                        
                        setGeneratingAI(true);
                        try {
                          const fullPrompt = `Create a profile avatar: ${aiPrompt}. Make it suitable as a profile picture, centered composition, high quality digital art.`;
                          const response = await fetch("https://toolkit.rork.com/images/generate/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              prompt: fullPrompt,
                              size: "1024x1024",
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.text();
                            console.error("Generation failed:", errorData);
                            throw new Error("Generation failed");
                          }

                          const data = await response.json();
                          console.log("[AI Avatar] Response keys:", Object.keys(data));
                          console.log("[AI Avatar] Full response:", JSON.stringify(data).substring(0, 1000));
                          
                          if (!data || typeof data !== 'object') {
                            console.error("[AI Avatar] Invalid response type:", typeof data);
                            throw new Error("Invalid response from server");
                          }
                          
                          let base64Data: string;
                          let mimeType: string;
                          
                          if (data.image && typeof data.image === 'object') {
                            console.log("[AI Avatar] Found image object, keys:", Object.keys(data.image));
                            
                            if (data.image.base64Data && typeof data.image.base64Data === 'string') {
                              base64Data = data.image.base64Data;
                              mimeType = data.image.mimeType || 'image/png';
                            } else if (data.image.base64 && typeof data.image.base64 === 'string') {
                              console.log("[AI Avatar] Found base64 (not base64Data) in image object");
                              base64Data = data.image.base64;
                              mimeType = data.image.mimeType || 'image/png';
                            } else if (typeof data.image === 'string') {
                              base64Data = data.image;
                              mimeType = 'image/png';
                            } else {
                              console.error("[AI Avatar] image object structure:", JSON.stringify(data.image).substring(0, 200));
                              throw new Error("Could not find base64Data or base64 in image object");
                            }
                          } else if (data.base64Data && typeof data.base64Data === 'string') {
                            console.log("[AI Avatar] Found base64Data at root level");
                            base64Data = data.base64Data;
                            mimeType = data.mimeType || 'image/png';
                          } else if (data.base64 && typeof data.base64 === 'string') {
                            console.log("[AI Avatar] Found base64 (not base64Data) at root level");
                            base64Data = data.base64;
                            mimeType = data.mimeType || 'image/png';
                          } else if (data.url && typeof data.url === 'string') {
                            console.log("[AI Avatar] Found URL instead of base64:", data.url);
                            setProfilePicture(data.url);
                            setShowAvatarPicker(false);
                            setShowAIPrompt(false);
                            setAiPrompt("");
                            Alert.alert("Success", "AI avatar generated successfully!");
                            return;
                          } else {
                            console.error("[AI Avatar] Could not find image data. Full response:", JSON.stringify(data));
                            throw new Error("No image data found in server response");
                          }
                          
                          if (!base64Data) {
                            throw new Error("base64Data is empty or undefined");
                          }
                          
                          console.log("[AI Avatar] Using mimeType:", mimeType);
                          console.log("[AI Avatar] Base64 length:", base64Data.length);
                          console.log("[AI Avatar] Base64 preview:", base64Data.substring(0, 50));
                          
                          const imageUri = `data:${mimeType};base64,${base64Data}`;
                          console.log("[AI Avatar] Image URI created, length:", imageUri.length);
                          
                          setProfilePicture(imageUri);
                          console.log("[AI Avatar] Profile picture set successfully");
                          setShowAvatarPicker(false);
                          setShowAIPrompt(false);
                          setAiPrompt("");
                          Alert.alert("Success", "AI avatar generated and set successfully!");
                        } catch (error) {
                          console.error("AI generation error:", error);
                          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                          Alert.alert("Error", `Failed to generate AI avatar: ${errorMessage}`);
                        } finally {
                          setGeneratingAI(false);
                        }
                      }}
                      disabled={generatingAI}
                    >
                      {generatingAI ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={[styles.aiPromptButtonText, { color: "#FFF" }]}>Generate</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Default Avatars
              </Text>
              <View style={styles.defaultAvatarsGrid}>
                {DEFAULT_AVATARS.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.defaultAvatarOption,
                      { backgroundColor: colors.surface },
                      state.profilePicture === uri && { borderColor: colors.primary, borderWidth: 3 },
                    ]}
                    onPress={() => {
                      setProfilePicture(uri);
                      setShowAvatarPicker(false);
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.defaultAvatarImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    marginBottom: 24,
  },
  avatarLevelWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  levelBadgeProfile: {
    position: "absolute",
    bottom: -4,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  levelBadgeProfileText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  xpSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  destinyHeader: {
    alignItems: "center",
    gap: 8,
  },
  destinyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  destinyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  destinyTier: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statsGrid: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ffffff22",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    flex: 1,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  badgeCategory: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  streakCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  streakValue: {
    fontSize: 48,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    gap: 6,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: "center",
  },
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  themePreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  themeOption: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  themeOptionPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  levelCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 20,
  },
  levelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  levelIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCardTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  levelCardSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  levelCircleProgress: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCircleProgressInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCardProgress: {
    gap: 8,
  },
  levelCardProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelCardProgressLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  levelCardProgressPercent: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  levelCardProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  levelCardProgressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  levelCardProgressRemaining: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  progressSection: {
    padding: 20,
    borderRadius: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700" as const,
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
  statsRow2: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  section2: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  sectionHeader2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle2: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  streakValue2: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  streakLabel2: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  rarityStatsContainer: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  rarityStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityStatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rarityStatLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  rarityStatValue: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  timeSection: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  defaultAvatarsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  defaultAvatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  defaultAvatarImage: {
    width: "100%",
    height: "100%",
  },
  aiPromptSection: {
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
  },
  aiPromptLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  aiPromptInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 80,
  },
  aiPromptButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  aiPromptButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  aiPromptCancel: {
    borderWidth: 1,
  },
  aiPromptGenerate: {},
  aiPromptButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
