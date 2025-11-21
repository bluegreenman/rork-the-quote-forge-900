import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";
import { RARITY_STYLE_MAP } from "../../constants/rarity";
import { RarityFrame } from "../../components/RarityFrame";
import { getXPProgress } from "../../constants/game";
import {
  Crown,
  Hand,
  Heart,
  Brain,
  Lightbulb,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  Star,
  RefreshCw,
  Clock,
  User,
} from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { buildDestinyCardPrompt, generateDestinyCard, canGenerateCard } from "../../utils/destinyCard";
import { SlotType, Boon } from "../../types/game";

const SLOT_CONFIG: Record<
  SlotType,
  { label: string; icon: React.ComponentType<any>; description: string }
> = {
  head: {
    label: "Head",
    icon: Crown,
    description: "Crowns, circlets, halos",
  },
  hands: {
    label: "Hands",
    icon: Hand,
    description: "Rings, quills, blades",
  },
  heart: {
    label: "Heart",
    icon: Heart,
    description: "Amulets, cloaks, sigils",
  },
  mind: {
    label: "Mind",
    icon: Brain,
    description: "Tomes, tablets, scrolls",
  },
  light: {
    label: "Light",
    icon: Lightbulb,
    description: "Lamps, lanterns, orbs, mirrors",
  },
  relic: {
    label: "Relic",
    icon: Sparkles,
    description: "Staffs, chalices, keys, runes",
  },
};

export default function CharacterScreen() {
  const { state, theme, isLoaded, equipBoon, getCharacterStats, setCharacterCard } = useGame();
  const colors = getThemeColors(theme);

  const [selectedSlot, setSelectedSlot] = useState<SlotType | null>(null);
  const [generatingCard, setGeneratingCard] = useState<boolean>(false);

  // Helper so we never index equipment with `null`
  const currentSlot: SlotType | undefined =
    selectedSlot === null ? undefined : selectedSlot;

  const characterStats = useMemo(() => getCharacterStats(), [getCharacterStats]);

  const availableBoonsForSlot = useMemo(() => {
    if (!selectedSlot) return [];
    return state.boons.filter((b) => b.slotType === selectedSlot);
  }, [selectedSlot, state.boons]);

  const getEquippedBoonForSlot = (slot: SlotType): Boon | null => {
    const boonId = state.equipment[slot];
    if (!boonId) return null;
    return state.boons.find((b) => b.id === boonId) || null;
  };

  const handleEquipBoon = (boonId: string | null) => {
    if (selectedSlot) {
      equipBoon(selectedSlot, boonId);
      setSelectedSlot(null);
    }
  };

  const calculateBoonScore = (boon: Boon): number => {
    const rarityScores: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    };
    
    const totalStats = Object.values(boon.statBonuses).reduce((sum, val) => sum + val, 0);
    const rarityScore = rarityScores[boon.rarity] || 0;
    
    return (totalStats * 10) + (rarityScore * 100);
  };

  const sortedBoonsForSlot = useMemo(() => {
    return [...availableBoonsForSlot].sort((a, b) => {
      const scoreA = calculateBoonScore(a);
      const scoreB = calculateBoonScore(b);
      return scoreB - scoreA;
    });
  }, [availableBoonsForSlot]);

  const handleEquipBest = () => {
    const slots: SlotType[] = ["head", "hands", "heart", "mind", "light", "relic"];
    
    slots.forEach((slot) => {
      const availableBoons = state.boons.filter((b) => b.slotType === slot);
      
      if (availableBoons.length === 0) return;
      
      let bestBoon = availableBoons[0];
      let bestScore = calculateBoonScore(bestBoon);
      
      availableBoons.forEach((boon) => {
        const score = calculateBoonScore(boon);
        if (score > bestScore) {
          bestScore = score;
          bestBoon = boon;
        }
      });
      
      equipBoon(slot, bestBoon.id);
    });
  };

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
        {state.destiny && (
          <View style={[styles.destinyCardSection, { backgroundColor: colors.surface }]}>
            {state.characterCardImageUrl ? (
              <View style={styles.destinyCardImageContainer}>
                <Image
                  source={{ uri: state.characterCardImageUrl }}
                  style={styles.destinyCardImage}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View style={[styles.destinyCardPlaceholder, { backgroundColor: colors.surfaceHigh }]}>
                <Sparkles size={48} color={colors.primary} />
                <Text style={[styles.destinyCardPlaceholderText, { color: colors.textSecondary }]}>
                  Your destiny awaits
                </Text>
              </View>
            )}
            
            <Text style={[styles.destinyCardTitle, { color: colors.primary }]}>
              {state.destiny.title}
            </Text>
            
            <View style={styles.genderButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  {
                    backgroundColor: generatingCard ? colors.surfaceHigh : colors.primary,
                  },
                ]}
                onPress={async () => {
                  if (generatingCard) return;
                  
                  const cooldownCheck = canGenerateCard(state.lastCardGeneratedAt);
                  if (!cooldownCheck.canGenerate) {
                    Alert.alert(
                      "Please Wait",
                      `The Forge needs time to weave your destiny. Try again in ${cooldownCheck.waitTimeMinutes} minute${cooldownCheck.waitTimeMinutes === 1 ? "" : "s"}.`
                    );
                    return;
                  }
                  
                  setGeneratingCard(true);
                  try {
                    const characterStats = getCharacterStats();
                    const prompt = buildDestinyCardPrompt(
                      state.destiny!,
                      characterStats,
                      state.level,
                      "male"
                    );
                    
                    const result = await generateDestinyCard(prompt);
                    
                    if (result.success && result.imageUri) {
                      setCharacterCard(result.imageUri);
                      Alert.alert("Success", "Your destiny card has been forged!");
                    } else {
                      Alert.alert("Error", result.error || "Failed to generate card");
                    }
                  } catch (error) {
                    console.error("[Destiny Card] Error:", error);
                    Alert.alert("Error", "Failed to generate destiny card");
                  } finally {
                    setGeneratingCard(false);
                  }
                }}
                disabled={generatingCard}
                activeOpacity={0.7}
              >
                {generatingCard ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    {state.characterCardImageUrl ? (
                      <RefreshCw size={18} color="#FFF" />
                    ) : (
                      <User size={18} color="#FFF" />
                    )}
                    <Text style={styles.genderButtonText}>Male</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  {
                    backgroundColor: generatingCard ? colors.surfaceHigh : colors.primary,
                  },
                ]}
                onPress={async () => {
                  if (generatingCard) return;
                  
                  const cooldownCheck = canGenerateCard(state.lastCardGeneratedAt);
                  if (!cooldownCheck.canGenerate) {
                    Alert.alert(
                      "Please Wait",
                      `The Forge needs time to weave your destiny. Try again in ${cooldownCheck.waitTimeMinutes} minute${cooldownCheck.waitTimeMinutes === 1 ? "" : "s"}.`
                    );
                    return;
                  }
                  
                  setGeneratingCard(true);
                  try {
                    const characterStats = getCharacterStats();
                    const prompt = buildDestinyCardPrompt(
                      state.destiny!,
                      characterStats,
                      state.level,
                      "female"
                    );
                    
                    const result = await generateDestinyCard(prompt);
                    
                    if (result.success && result.imageUri) {
                      setCharacterCard(result.imageUri);
                      Alert.alert("Success", "Your destiny card has been forged!");
                    } else {
                      Alert.alert("Error", result.error || "Failed to generate card");
                    }
                  } catch (error) {
                    console.error("[Destiny Card] Error:", error);
                    Alert.alert("Error", "Failed to generate destiny card");
                  } finally {
                    setGeneratingCard(false);
                  }
                }}
                disabled={generatingCard}
                activeOpacity={0.7}
              >
                {generatingCard ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    {state.characterCardImageUrl ? (
                      <RefreshCw size={18} color="#FFF" />
                    ) : (
                      <User size={18} color="#FFF" />
                    )}
                    <Text style={styles.genderButtonText}>Female</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {state.lastCardGeneratedAt && (
              <View style={styles.cooldownInfo}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={[styles.cooldownText, { color: colors.textSecondary }]}>
                  Last generated {new Date(state.lastCardGeneratedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.avatarAndLevelContainer}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.primary + "22",
                  borderColor: colors.primary,
                },
              ]}
            >
              <Sparkles size={64} color={colors.primary} />
            </View>
            
            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
              <Star size={14} color="#FFF" fill="#FFF" />
              <Text style={styles.levelBadgeText}>{state.level}</Text>
            </View>
          </View>
          
          {state.destiny && (
            <View style={styles.destinyContainer}>
              <Text style={[styles.destinyTitle, { color: colors.primary }]}>
                {state.destiny.title}
              </Text>
              <View style={styles.destinyDetails}>
                <Text style={[styles.destinyDetail, { color: colors.textSecondary }]}>
                  {state.destiny.primaryClass} → {state.destiny.subclass}
                </Text>
              </View>
              <View style={styles.destinyTierBadge}>
                <Text style={[styles.destinyTierText, { color: colors.primary }]}>
                  {state.destiny.destinyTier} Tier
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

        <View style={[styles.levelProgressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.levelProgressHeader}>
            <View style={styles.levelProgressTitleRow}>
              <Zap size={20} color={colors.primary} />
              <Text style={[styles.levelProgressTitle, { color: colors.text }]}>
                Next Level Progress
              </Text>
            </View>
            <Text style={[styles.levelProgressPercentage, { color: colors.primary }]}>
              {getXPProgress(state.xp, state.level).percentage.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.levelProgressBarContainer}>
            <View style={[styles.levelProgressBarBg, { backgroundColor: colors.surfaceHigh }]}>
              <View
                style={[
                  styles.levelProgressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(getXPProgress(state.xp, state.level).percentage, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
          
          <View style={styles.levelProgressStats}>
            <Text style={[styles.levelProgressStat, { color: colors.textSecondary }]}>
              {getXPProgress(state.xp, state.level).current.toLocaleString()} / {getXPProgress(state.xp, state.level).needed.toLocaleString()} XP
            </Text>
            <Text style={[styles.levelProgressStat, { color: colors.textSecondary }]}>
              {(getXPProgress(state.xp, state.level).needed - getXPProgress(state.xp, state.level).current).toLocaleString()} to next level
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Soul Statistics
          </Text>
          <View style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
            {(
              [
                ["Insight", characterStats.insight],
                ["Devotion", characterStats.devotion],
                ["Focus", characterStats.focus],
                ["Wonder", characterStats.wonder],
                ["Clarity", characterStats.clarity],
                ["Fortune", characterStats.fortune],
                ["Endurance", characterStats.endurance],
              ] as [string, number][]
            ).map(([statName, statValue]) => (
              <View key={statName} style={styles.statRow}>
                <Text style={[styles.statName, { color: colors.textSecondary }]}>
                  {statName}
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {statValue}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.equipmentSection}>
          <View style={styles.equipmentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Equipment Slots
            </Text>
            <TouchableOpacity
              style={[styles.equipBestButton, { backgroundColor: colors.primary }]}
              onPress={handleEquipBest}
              activeOpacity={0.7}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={styles.equipBestText}>Equip Best</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.slotsGrid}>
            {(
              ["head", "hands", "heart", "mind", "light", "relic"] as SlotType[]
            ).map((slot) => {
              const slotConfig = SLOT_CONFIG[slot];
              const equippedBoon = getEquippedBoonForSlot(slot);
              const IconComponent = slotConfig.icon;

              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.7}
                >
                  {equippedBoon ? (
                    <RarityFrame rarity={equippedBoon.rarity} size={48}>
                      <View
                        style={[
                          styles.slotIcon,
                          {
                            backgroundColor:
                              RARITY_STYLE_MAP[equippedBoon.rarity].color + "22",
                          },
                        ]}
                      >
                        <IconComponent
                          size={24}
                          color={RARITY_STYLE_MAP[equippedBoon.rarity].color}
                        />
                      </View>
                    </RarityFrame>
                  ) : (
                    <View
                      style={[
                        styles.slotIcon,
                        {
                          backgroundColor: colors.surfaceHigh,
                          borderRadius: 12,
                        },
                      ]}
                    >
                      <IconComponent size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotLabel, { color: colors.text }]}>
                      {slotConfig.label}
                    </Text>
                    {equippedBoon ? (
                      <>
                        <Text
                          style={[
                            styles.slotBoonName,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {equippedBoon.name}
                        </Text>
                        {equippedBoon.imageUrl && (
                          <View style={styles.equippedItemImageContainer}>
                            <Image
                              source={{ uri: equippedBoon.imageUrl }}
                              style={styles.equippedItemImage}
                              contentFit="cover"
                            />
                          </View>
                        )}
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.slotEmpty,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Empty Slot
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={selectedSlot !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {currentSlot ? SLOT_CONFIG[currentSlot].label : ""}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedSlot(null)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {currentSlot && (
              <Text
                style={[
                  styles.modalDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {SLOT_CONFIG[currentSlot].description}
              </Text>
            )}

            {/* We removed the big image preview here to avoid the old pink box
                and a bunch of null / type issues. If you ever want it back,
                we can re-add it safely later. */}

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {/* Unequip option */}
              <TouchableOpacity
                style={[
                  styles.boonOption,
                  {
                    backgroundColor:
                      currentSlot && state.equipment[currentSlot] == null
                        ? colors.primary + "22"
                        : colors.background,
                  },
                ]}
                onPress={() => handleEquipBoon(null)}
              >
                <View
                  style={[
                    styles.boonOptionIcon,
                    { backgroundColor: colors.surfaceHigh },
                  ]}
                >
                  <X size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.boonOptionInfo}>
                  <Text style={[styles.boonOptionName, { color: colors.text }]}>
                    Unequip
                  </Text>
                  <Text
                    style={[
                      styles.boonOptionType,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Remove current item
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Boons list */}
              {sortedBoonsForSlot.map((boon) => {
                const rarityStyle = RARITY_STYLE_MAP[boon.rarity];
                const isEquipped =
                  currentSlot && state.equipment[currentSlot] === boon.id;

                return (
                  <TouchableOpacity
                    key={boon.id}
                    style={[
                      styles.boonOption,
                      {
                        backgroundColor: isEquipped
                          ? colors.primary + "22"
                          : colors.background,
                      },
                    ]}
                    onPress={() => handleEquipBoon(boon.id)}
                  >
                    <RarityFrame rarity={boon.rarity} size={44}>
                      <View
                        style={[
                          styles.boonOptionIcon,
                          { backgroundColor: rarityStyle.color + "22" },
                        ]}
                      >
                        <Sparkles size={20} color={rarityStyle.color} />
                      </View>
                    </RarityFrame>
                    <View style={styles.boonOptionInfo}>
                      <Text
                        style={[styles.boonOptionName, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {boon.name}
                      </Text>
                      <Text
                        style={[
                          styles.boonOptionType,
                          { color: rarityStyle.color },
                        ]}
                      >
                        {rarityStyle.label}
                      </Text>
                      <View style={styles.statBonuses}>
                        {boon.statBonuses &&
                          Object.entries(boon.statBonuses)
                            .filter(([, value]) => value > 0)
                            .map(([stat, value]) => (
                              <Text
                                key={stat}
                                style={[
                                  styles.statBonus,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                +{value} {stat}
                              </Text>
                            ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {sortedBoonsForSlot.length === 0 && (
                <View style={styles.emptyBoons}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No artifacts available for this slot.
                  </Text>
                  <Text
                    style={[styles.emptyHint, { color: colors.textSecondary }]}
                  >
                    Roll for quotes to discover more!
                  </Text>
                </View>
              )}
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
  destinyCardSection: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: "center",
    gap: 16,
  },
  destinyCardImageContainer: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  destinyCardImage: {
    width: "100%",
    height: "100%",
  },
  destinyCardPlaceholder: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  destinyCardPlaceholderText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  destinyCardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    textAlign: "center",
    lineHeight: 24,
  },
  genderButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  genderButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  cooldownInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cooldownText: {
    fontSize: 13,
    fontWeight: "500" as const,
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
  avatarAndLevelContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  levelBadge: {
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
  levelBadgeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  levelTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  xpSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  destinyContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  destinyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 28,
  },
  destinyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  destinyDetail: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  destinyTierBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  destinyTierText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  levelProgressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  levelProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelProgressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelProgressTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  levelProgressPercentage: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  levelProgressBarContainer: {
    marginBottom: 12,
  },
  levelProgressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  levelProgressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  levelProgressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelProgressStat: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  statsGrid: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statName: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  equipmentSection: {
    marginBottom: 32,
  },
  equipmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  equipBestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  equipBestText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  slotsGrid: {
    gap: 12,
  },
  slotCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    gap: 12,
  },
  slotIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  slotBoonName: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginBottom: 8,
  },
  equippedItemImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden" as const,
    marginTop: 8,
  },
  equippedItemImage: {
    width: "100%",
    height: "100%",
  },
  slotEmpty: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontStyle: "italic" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  closeButton: {
    padding: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 400,
  },
  boonOption: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  boonOptionIcon: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  boonOptionInfo: {
    flex: 1,
    gap: 4,
  },
  boonOptionName: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  boonOptionType: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statBonuses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  statBonus: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  emptyBoons: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
  },
  modalImagePreview: {
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  modalPreviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
});
