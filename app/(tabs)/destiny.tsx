import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";
import { Sparkles, Crown, TrendingUp, Star, Book } from "lucide-react-native";

export default function DestinyScreen() {
  const { state, theme, isLoaded, getCharacterStats } = useGame();
  const colors = getThemeColors(theme);

  const characterStats = getCharacterStats();

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!state.destiny) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Sparkles size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your Destiny Awaits
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Level up and equip boons to forge your unique destiny path
          </Text>
        </View>
      </View>
    );
  }

  const { primaryClass, subclass, epithet, destinyTier, loreDescription } = state.destiny;

  const getStatNames = (): string[] => {
    const sortedStats = Object.entries(characterStats)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
    return sortedStats.slice(0, 3);
  };

  const primaryStats = getStatNames();

  const getTierProgress = (): { current: number; next: number; percentage: number } => {
    const tierThresholds = [
      { tier: "Initiate", level: 1 },
      { tier: "Adept", level: 25 },
      { tier: "Rising", level: 50 },
      { tier: "Elite", level: 100 },
      { tier: "Mythic", level: 200 },
      { tier: "Ascended", level: 300 },
      { tier: "Eternal", level: 500 },
      { tier: "Transcendent", level: 750 },
      { tier: "Paragon", level: 1000 },
    ];

    const currentTierIndex = tierThresholds.findIndex(t => t.tier === destinyTier);
    if (currentTierIndex === -1 || currentTierIndex === tierThresholds.length - 1) {
      return { current: state.level, next: state.level, percentage: 100 };
    }

    const currentTierLevel = tierThresholds[currentTierIndex].level;
    const nextTierLevel = tierThresholds[currentTierIndex + 1].level;
    const progress = state.level - currentTierLevel;
    const total = nextTierLevel - currentTierLevel;
    const percentage = (progress / total) * 100;

    return { current: currentTierLevel, next: nextTierLevel, percentage };
  };

  const tierProgress = getTierProgress();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <View style={styles.headerIconContainer}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + "22" }]}>
              <Crown size={48} color={colors.primary} />
            </View>
          </View>
          
          <Text style={[styles.mainTitle, { color: colors.primary }]}>
            {state.destiny.title}
          </Text>
          
          <View style={[styles.tierBadge, { backgroundColor: colors.primary }]}>
            <Star size={16} color="#FFF" fill="#FFF" />
            <Text style={styles.tierBadgeText}>{destinyTier} Tier</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Destiny Identity
            </Text>
          </View>
          
          <View style={styles.identityRow}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>
              Primary Class
            </Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>
              {primaryClass}
            </Text>
          </View>
          
          <View style={styles.identityRow}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>
              Subclass
            </Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>
              {subclass}
            </Text>
          </View>
          
          <View style={styles.identityRow}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>
              Epithet
            </Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>
              {epithet}
            </Text>
          </View>
          
          <View style={styles.identityRow}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>
              Tier
            </Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>
              {destinyTier}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Book size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Lore & Legend
            </Text>
          </View>
          
          <Text style={[styles.loreText, { color: colors.text }]}>
            {loreDescription}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tier Evolution
            </Text>
          </View>
          
          <View style={styles.tierProgressInfo}>
            <Text style={[styles.tierProgressText, { color: colors.textSecondary }]}>
              Level {state.level} / {tierProgress.next}
            </Text>
            <Text style={[styles.tierProgressPercentage, { color: colors.primary }]}>
              {tierProgress.percentage.toFixed(1)}%
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceHigh }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(tierProgress.percentage, 100)}%`,
                },
              ]}
            />
          </View>
          
          {tierProgress.next > state.level && (
            <Text style={[styles.tierProgressHint, { color: colors.textSecondary }]}>
              {tierProgress.next - state.level} levels until next tier
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Star size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dominant Attributes
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            {primaryStats.map((statName, index) => {
              const statValue = characterStats[statName.toLowerCase() as keyof typeof characterStats];
              return (
                <View key={statName} style={styles.statCard}>
                  <View style={[styles.statRankBadge, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[styles.statRank, { color: colors.primary }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.statCardName, { color: colors.text }]}>
                    {statName}
                  </Text>
                  <Text style={[styles.statCardValue, { color: colors.primary }]}>
                    {statValue}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceHigh }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your destiny evolves as you level up, change equipment, and develop your stats. The path you walk shapes who you become.
          </Text>
        </View>
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  headerCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  headerIconContainer: {
    marginBottom: 8,
  },
  headerIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center",
    lineHeight: 32,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tierBadgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  identityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  identityLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  identityValue: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  loreText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic" as const,
  },
  tierProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierProgressText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  tierProgressPercentage: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  tierProgressHint: {
    fontSize: 13,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    gap: 8,
  },
  statRankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statRank: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statCardName: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
