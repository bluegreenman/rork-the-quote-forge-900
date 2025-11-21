import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GameProvider, useGame } from "../contexts/GameContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { state, isLoaded } = useGame();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || !navigationReady) return;

    console.log("[Routing] hasOnboarded:", state.hasOnboarded, "segments:", segments);

    const inOnboarding = segments[0] === "onboarding";

    if (state.hasOnboarded === false && !inOnboarding) {
      console.log("[Routing] Redirecting to onboarding");
      setTimeout(() => {
        try {
          router.replace("/onboarding" as any);
        } catch (error) {
          console.error("[Routing] Failed to navigate to onboarding:", error);
        }
      }, 100);
    } else if (state.hasOnboarded === true && inOnboarding) {
      console.log("[Routing] Redirecting to tabs");
      setTimeout(() => {
        try {
          router.replace("/(tabs)");
        } catch (error) {
          console.error("[Routing] Failed to navigate to tabs:", error);
        }
      }, 100);
    }
  }, [isLoaded, navigationReady, state.hasOnboarded, segments, router]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </GameProvider>
    </QueryClientProvider>
  );
}
