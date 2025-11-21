import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { Rarity } from "../types/game";
import { RARITY_STYLE_MAP, getGlowStyles } from "../constants/rarity";

interface RarityFrameProps {
  rarity: Rarity;
  size?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function RarityFrame({ rarity, size = 80, children, style }: RarityFrameProps) {
  const rarityStyle = RARITY_STYLE_MAP[rarity];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const shouldAnimate = rarity === "epic" || rarity === "legendary";
  
  useEffect(() => {
    if (shouldAnimate) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [shouldAnimate, pulseAnim]);
  
  const glowStyles = getGlowStyles(rarityStyle.glow, rarityStyle.color);
  
  const containerStyle = [
    styles.frame,
    {
      width: size,
      height: size,
      borderColor: rarityStyle.color,
      borderWidth: rarityStyle.borderWidth,
      borderRadius: size / 6,
    },
    glowStyles,
    style,
  ];
  
  if (shouldAnimate) {
    return (
      <Animated.View
        style={[
          containerStyle,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }
  
  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden" as const,
    backgroundColor: "transparent",
  },
});
