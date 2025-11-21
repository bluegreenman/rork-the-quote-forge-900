import { useGame } from "../../contexts/GameContext";
import { canGenerateItemArt } from "../../utils/itemArt";
import { getThemeColors } from "../../constants/themes";
import { RARITY_STYLE_MAP } from "../../constants/rarity";
import { RarityBadge } from "../../components/RarityBadge";
import { RarityFrame } from "../../components/RarityFrame";
import {
  BookText,
  Filter,
  X,
  Crown,
  Sparkles,
  Circle,
  Key,
  Scroll,
  Lamp,
  Sword,
  Compass,
  Shield,
  Gem,
  Wand,
} from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Boon, Rarity, ItemType } from "../../types/game";

type SortOption = "rarity" | "newest" | "oldest" | "name" | "itemType" | "hasImage";
type FilterType = "all" | Rarity | ItemType | "recent";

const ITEM_TYPE_ICONS: Record<ItemType, React.ComponentType<any>> = {
  ring: Circle,
  crown: Crown,
  amulet: Sparkles,
  cloak: Shield,
  quill: Wand,
  blade: Sword,
  lamp: Lamp,
  lantern: Lamp,
  orb: Circle,
  mirror: Circle,
  tome: BookText,
  scroll: Scroll,
  tablet: BookText,
  staff: Wand,
  chalice: Circle,
  key: Key,
  rune: Gem,
  sigil: Sparkles,
  compass: Compass,
  relic: Gem,
};

function getItemTypeIcon(itemType: ItemType) {
  return ITEM_TYPE_ICONS[itemType] || BookText;
}

function capitalizeFirst(str: string | undefined): string {
  if (!str || typeof str !== 'string') return "Unknown";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function LedgerScreen() {
  const { state, theme, isLoaded, generateItemArtForBoon, getItemArtGenerationStatus } = useGame();
  const colors = getThemeColors(theme);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterType>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedBoon, setSelectedBoon] = useState<Boon | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const filteredAndSortedBoons = useMemo(() => {
    let boons = [...state.boons];

    if (filterBy !== "all") {
      if (filterBy === "recent") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        boons = boons.filter(
          (b) => new Date(b.dateAcquired).getTime() >= thirtyDaysAgo.getTime()
        );
      } else if (
        ["common", "uncommon", "rare", "epic", "legendary"].includes(filterBy)
      ) {
        boons = boons.filter((b) => b.rarity === filterBy);
      } else {
        boons = boons.filter((b) => b.itemType === filterBy);
      }
    }

    switch (sortBy) {
      case "rarity":
        const rarityOrder: Rarity[] = [
          "legendary",
          "epic",
          "rare",
          "uncommon",
          "common",
        ];
        return boons.sort(
          (a, b) =>
            rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        );

      case "newest":
        return boons.sort(
          (a, b) =>
            new Date(b.dateAcquired).getTime() -
            new Date(a.dateAcquired).getTime()
        );

      case "oldest":
        return boons.sort(
          (a, b) =>
            new Date(a.dateAcquired).getTime() -
            new Date(b.dateAcquired).getTime()
        );

      case "name":
        return boons.sort((a, b) => a.name.localeCompare(b.name));

      case "itemType":
        return boons.sort((a, b) => a.itemType.localeCompare(b.itemType));

      case "hasImage":
        return boons.sort((a, b) => {
          const aHasImage = !!a.imageUrl;
          const bHasImage = !!b.imageUrl;
          if (aHasImage && !bHasImage) return -1;
          if (!aHasImage && bHasImage) return 1;
          return 0;
        });

      default:
        return boons;
    }
  }, [state.boons, sortBy, filterBy]);

  const rarityDistribution = useMemo(() => {
    const dist: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    state.boons.forEach((b) => {
      dist[b.rarity]++;
    });
    return dist;
  }, [state.boons]);

  const renderBoon = ({ item }: { item: Boon }) => {
    const rarityStyle = RARITY_STYLE_MAP[item.rarity];
    const date = new Date(item.dateAcquired);
    const IconComponent = getItemTypeIcon(item.itemType);

    return (
      <TouchableOpacity
        style={[styles.boonCard, { backgroundColor: colors.surface }]}
        onPress={() => setSelectedBoon(item)}
        activeOpacity={0.7}
      >
        <RarityFrame rarity={item.rarity} size={60}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.boonCardImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.boonIcon,
                {
                  backgroundColor: rarityStyle.color + "22",
                },
              ]}
            >
              <IconComponent size={28} color={rarityStyle.color} />
            </View>
          )}
        </RarityFrame>
        <View style={styles.boonInfo}>
          <Text
            style={[styles.boonName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.boonMeta}>
            <RarityBadge rarity={item.rarity} size="small" showIcon={false} />
            <Text style={[styles.boonType, { color: colors.textSecondary }]}>
              {capitalizeFirst(item.itemType)}
            </Text>
          </View>
          <Text
            style={[styles.boonDate, { color: colors.textSecondary }]}
          >
            {date.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.text }]}>
            Artifact Ledger
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {state.boons.length} artifacts • {filteredAndSortedBoons.length} shown
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface },
              showFilters && { backgroundColor: colors.primary + "22" },
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter
              size={20}
              color={showFilters ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Sort By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "rarity", label: "Rarity" },
                  { value: "itemType", label: "Type" },
                  { value: "name", label: "A-Z" },
                  { value: "hasImage", label: "Has Art" },
                ] as { value: SortOption; label: string }[]).map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          sortBy === option.value
                            ? colors.primary
                            : colors.background,
                      },
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            sortBy === option.value
                              ? "#FFFFFF"
                              : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filter By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        filterBy === "all" ? colors.primary : colors.background,
                    },
                  ]}
                  onPress={() => setFilterBy("all")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: filterBy === "all" ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    All ({state.boons.length})
                  </Text>
                </TouchableOpacity>
                {([
                  "legendary",
                  "epic",
                  "rare",
                  "uncommon",
                  "common",
                ] as Rarity[]).map((rarity) => (
                  <TouchableOpacity
                    key={rarity}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          filterBy === rarity
                            ? RARITY_STYLE_MAP[rarity].color
                            : colors.background,
                        borderColor: RARITY_STYLE_MAP[rarity].color,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => setFilterBy(rarity)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            filterBy === rarity
                              ? "#FFFFFF"
                              : RARITY_STYLE_MAP[rarity].color,
                        },
                      ]}
                    >
                      {capitalizeFirst(rarity)} ({rarityDistribution[rarity]})
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        filterBy === "recent" ? colors.primary : colors.background,
                    },
                  ]}
                  onPress={() => setFilterBy("recent")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: filterBy === "recent" ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    Recent (30d)
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {state.boons.length === 0 ? (
        <View style={styles.emptyState}>
          <BookText size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Artifacts Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Roll for quotes to discover mystical artifacts
          </Text>
        </View>
      ) : filteredAndSortedBoons.length === 0 ? (
        <View style={styles.emptyState}>
          <Filter size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Matching Artifacts
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Try adjusting your filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedBoons}
          renderItem={renderBoon}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={selectedBoon !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBoon(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBoon(null)}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
              activeOpacity={1}
            >
              {selectedBoon && (
                <>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedBoon(null)}
                  >
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>

                  <RarityFrame rarity={selectedBoon.rarity} size={200}>
                    {selectedBoon.imageUrl ? (
                      <Image
                        source={{ uri: selectedBoon.imageUrl }}
                        style={styles.modalImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.modalIconInner,
                          {
                            backgroundColor:
                              RARITY_STYLE_MAP[selectedBoon.rarity].color + "22",
                          },
                        ]}
                      >
                        {React.createElement(getItemTypeIcon(selectedBoon.itemType), {
                          size: 64,
                          color: RARITY_STYLE_MAP[selectedBoon.rarity].color,
                        })}
                      </View>
                    )}
                  </RarityFrame>

                  <Text style={[styles.modalName, { color: colors.text }]}>
                    {selectedBoon.name}
                  </Text>

                  <View style={styles.modalMetaRow}>
                    <RarityBadge rarity={selectedBoon.rarity} size="medium" />
                    <View
                      style={[
                        styles.modalBadge,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[styles.modalBadgeText, { color: colors.text }]}
                      >
                        {capitalizeFirst(selectedBoon.itemType)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.modalDescription, { color: colors.textSecondary }]}
                  >
                    {selectedBoon.description}
                  </Text>

                  {selectedBoon.themeTag && (
                    <View style={[styles.themeTagContainer, { backgroundColor: colors.background }]}>
                      <Text style={[styles.themeTagLabel, { color: colors.textSecondary }]}>
                        Theme:
                      </Text>
                      <Text style={[styles.themeTagText, { color: colors.primary }]}>
                        {selectedBoon.themeTag}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.generateButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: isGenerating ? 0.6 : 1,
                      },
                    ]}
                    onPress={async () => {
                      if (isGenerating) return;

                      const today = new Date().toISOString().split('T')[0];
                      const dailyCount = state.itemArtGenerationDate === today 
                        ? (state.itemArtGenerationCountToday || 0) 
                        : 0;
                      
                      const canGenerate = canGenerateItemArt(
                        dailyCount,
                        state.itemArtGenerationDate,
                        selectedBoon.imageGeneratedAt || undefined
                      );

                      if (!canGenerate.canGenerate) {
                        Alert.alert("Cannot Generate", canGenerate.reason || "Unable to generate item art");
                        return;
                      }

                      setIsGenerating(true);
                      const result = await generateItemArtForBoon(selectedBoon.id);
                      setIsGenerating(false);

                      if (result.success) {
                        const updatedBoon = state.boons.find(b => b.id === selectedBoon.id);
                        if (updatedBoon) {
                          setSelectedBoon(updatedBoon);
                        }
                        const status = getItemArtGenerationStatus();
                        Alert.alert(
                          "Item Art Generated!",
                          `Remaining today: ${status.remainingToday}/${status.maxPerDay}`
                        );
                      } else {
                        Alert.alert("Generation Failed", result.error || "Unknown error");
                      }
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.generateButtonText}>
                        {selectedBoon.imageUrl ? "Regenerate" : "Generate"} Item Art
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.modalFooter,
                      { borderTopColor: colors.background },
                    ]}
                  >
                    <Text style={[styles.modalFooterText, { color: colors.textSecondary }]}>
                      Acquired on{" "}
                      {new Date(selectedBoon.dateAcquired).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </Text>
                    <Text style={[styles.modalFooterHint, { color: colors.textSecondary }]}>
                      {(() => {
                        const status = getItemArtGenerationStatus();
                        return `${status.remainingToday} of ${status.maxPerDay} generations remaining today`;
                      })()}
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  iconButton: {
    padding: 12,
    borderRadius: 12,
  },
  filtersContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  filterSection: {
    gap: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  filterChips: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  list: {
    padding: 20,
    paddingTop: 8,
  },
  boonCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
    position: "relative" as const,
  },
  boonIcon: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  boonCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  boonInfo: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  boonName: {
    fontSize: 15,
    fontWeight: "700" as const,
    lineHeight: 19,
  },
  boonMeta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  boonType: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  boonDate: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalIconInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalName: {
    fontSize: 22,
    fontWeight: "700" as const,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },
  modalMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  modalFooter: {
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalFooterText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  modalFooterHint: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.7,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
  },
  generateButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 50,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  themeTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  themeTagLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  themeTagText: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontStyle: "italic" as const,
  },
});
