import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Circle, Sparkles, Zap, Star, Crown } from "lucide-react-native";
import { Rarity } from "../types/game";
import { RARITY_STYLE_MAP } from "../constants/rarity";

interface RarityBadgeProps {
  rarity: Rarity;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  showLabel?: boolean;
}

export function RarityBadge({ 
  rarity, 
  size = "medium",
  showIcon = true,
  showLabel = true,
}: RarityBadgeProps) {
  const style = RARITY_STYLE_MAP[rarity];
  
  const getIcon = () => {
    const iconSize = size === "small" ? 12 : size === "medium" ? 14 : 16;
    const iconColor = style.color;
    
    switch (style.icon) {
      case "circle":
        return <Circle size={iconSize} color={iconColor} fill={iconColor} />;
      case "sparkle":
        return <Sparkles size={iconSize} color={iconColor} />;
      case "zap":
        return <Zap size={iconSize} color={iconColor} />;
      case "star":
        return <Star size={iconSize} color={iconColor} fill={iconColor} />;
      case "crown":
        return <Crown size={iconSize} color={iconColor} />;
      default:
        return <Circle size={iconSize} color={iconColor} />;
    }
  };
  
  const containerStyle = [
    styles.badge,
    size === "small" && styles.badgeSmall,
    size === "medium" && styles.badgeMedium,
    size === "large" && styles.badgeLarge,
    { 
      backgroundColor: style.color + "22",
      borderColor: style.color,
      borderWidth: 1,
    },
  ];
  
  const textStyle = [
    styles.badgeText,
    size === "small" && styles.textSmall,
    size === "medium" && styles.textMedium,
    size === "large" && styles.textLarge,
    { color: style.color },
  ];
  
  return (
    <View style={containerStyle}>
      {showIcon && getIcon()}
      {showLabel && <Text style={textStyle}>{style.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  badgeText: {
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
