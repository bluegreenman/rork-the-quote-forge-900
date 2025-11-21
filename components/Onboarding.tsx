import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGame } from "../contexts/GameContext";
import { getThemeColors } from "../constants/themes";
import { pickAndParseTextFile } from "../utils/fileParser";

import { Sparkles, BookOpen, Image as ImageIcon, Flame } from "lucide-react-native";

type OnboardingStep = "welcome" | "how-it-works" | "import" | "avatar" | "complete";

export default function Onboarding() {
  const router = useRouter();
  const { state, theme, addQuotes, setProfilePicture, completeOnboarding } = useGame();
  const colors = getThemeColors(theme);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [hasUploadedFiles, setHasUploadedFiles] = useState<boolean>(false);
  const [avatarPrompt, setAvatarPrompt] = useState<string>("");
  const [avatarPromptError, setAvatarPromptError] = useState<string>("");

  const handleImportFile = async () => {
    try {
      const result = await pickAndParseTextFile();
      if (result) {
        addQuotes(result.quotes, result.fileName);
        setHasUploadedFiles(true);
        Alert.alert(
          "File Imported",
          `${result.fileName} has been added with ${result.quotes.length} quotes.`
        );
      }
    } catch (error) {
      console.error("Failed to import file:", error);
      Alert.alert("Import Error", "Failed to import the file. Please try again.");
    }
  };

  const handleGenerateAvatar = async () => {
    const trimmedPrompt = avatarPrompt.trim();
    
    if (trimmedPrompt.length === 0) {
      setAvatarPromptError("Please add a short description for your avatar before generating.");
      return;
    }
    
    setAvatarPromptError("");
    setIsGeneratingAvatar(true);
    
    try {
      const fullPrompt = `${trimmedPrompt}. Portrait style, mystical character avatar for a quote RPG game, spiritual explorer aesthetic, centered composition, high quality digital art.`;
      
      const response = await fetch("https://toolkit.rork.com/images/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Avatar] API request failed:", response.status, response.statusText);
        console.error("[Avatar] Error body:", errorText.slice(0, 500));
        throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('[Avatar] Raw response keys', {
        hasImage: !!result?.image,
        imageKeys: result?.image ? Object.keys(result.image) : null,
      });
      
      if (!result || !result.image) {
        console.error("[Avatar] No image object in response");
        throw new Error("No image data returned from API");
      }
      
      const image = result.image;
      const base64 = image.base64 ?? image.base64Data ?? null;
      
      if (!base64) {
        console.error('[Avatar] No base64 image data in response');
        throw new Error('No image data returned from API');
      }
      
      const mimeType = image.mimeType ?? 'image/png';
      const imageUri = `data:${mimeType};base64,${base64}`;
      setProfilePicture(imageUri);
      Alert.alert("Avatar Generated", "Your character avatar has been created!");
    } catch (error) {
      console.error("Failed to generate avatar:", error);
      Alert.alert("Generation Error", "Failed to generate avatar. Please try again or skip for now.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleFinish = () => {
    console.log("[Onboarding] Completing onboarding");
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Sparkles size={64} color={colors.primary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Welcome to The Quote Forge
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Roll for wisdom, gain artifacts, and level up your soul through the ancient practice of contemplative reading.
      </Text>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep("how-it-works")}
      >
        <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHowItWorks = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Flame size={64} color={colors.primary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        How It Works
      </Text>
      
      <View style={styles.featuresList}>
        <View style={[styles.featureItem, { backgroundColor: colors.surface }]}>
          <Sparkles size={24} color={colors.primary} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Random Wisdom
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              This is a random quote RPG, not a linear reader. Every roll gives you a verse, XP, and a chance for loot.
            </Text>
          </View>
        </View>
        
        <View style={[styles.featureItem, { backgroundColor: colors.surface }]}>
          <BookOpen size={24} color={colors.primary} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Your Library
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Upload your own texts - scriptures, books, or any wisdom you want to explore randomly.
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep("import")}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderImport = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <BookOpen size={64} color={colors.primary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Import Your Texts
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Upload .txt files containing scriptures, books, or any texts you want to explore. PDFs must be converted to plain text first.
      </Text>
      
      {hasUploadedFiles && (
        <View style={[styles.successBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.successText, { color: colors.primary }]}>
            ✓ {state.parsedFiles.length} file(s) imported
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
        onPress={handleImportFile}
      >
        <BookOpen size={20} color={colors.primary} />
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Choose Files
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep("avatar")}
      >
        <Text style={styles.primaryButtonText}>
          {hasUploadedFiles ? "Continue" : "Skip for Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAvatar = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        {state.profilePicture ? (
          <View style={[styles.avatarPreview, { borderColor: colors.primary }]}>
            <Image 
              source={{ uri: state.profilePicture }} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <ImageIcon size={64} color={colors.primary} />
        )}
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Create Your Avatar
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Generate a unique character avatar with AI, or skip and add one later from your Profile.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Describe your VerseForge avatar
        </Text>
        <TextInput
          style={[
            styles.promptInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: avatarPromptError ? "#EF4444" : colors.border,
            },
          ]}
          placeholder="Mystical anime-style portrait, soft purple glow, calm expression, spiritual explorer"
          placeholderTextColor={colors.textSecondary + "80"}
          value={avatarPrompt}
          onChangeText={(text) => {
            setAvatarPrompt(text);
            if (avatarPromptError) setAvatarPromptError("");
          }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isGeneratingAvatar}
        />
        {avatarPromptError ? (
          <Text style={styles.errorText}>
            {avatarPromptError}
          </Text>
        ) : null}
      </View>
      
      <TouchableOpacity
        style={[
          styles.secondaryButton, 
          { backgroundColor: colors.surface },
          isGeneratingAvatar && { opacity: 0.6 }
        ]}
        onPress={handleGenerateAvatar}
        disabled={isGeneratingAvatar}
      >
        {isGeneratingAvatar ? (
          <>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Generating...
            </Text>
          </>
        ) : (
          <>
            <ImageIcon size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {state.profilePicture ? "Generate New Avatar" : "Generate Avatar"}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep("complete")}
      >
        <Text style={styles.primaryButtonText}>
          {state.profilePicture ? "Continue" : "Skip for Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Sparkles size={64} color={colors.primary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Ready to Begin
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Your journey begins now. Tap the Roll Quote button in the Forge to receive your first verse and start gaining XP.
      </Text>
      
      <View style={[styles.statsPreview, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {state.parsedFiles.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Texts
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {state.quotes.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Quotes
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            1
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Level
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleFinish}
      >
        <Text style={styles.primaryButtonText}>Enter The Forge</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return renderWelcome();
      case "how-it-works":
        return renderHowItWorks();
      case "import":
        return renderImport();
      case "avatar":
        return renderAvatar();
      case "complete":
        return renderComplete();
      default:
        return renderWelcome();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
      
      <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
        {["welcome", "how-it-works", "import", "avatar", "complete"].map((s, index) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  ["welcome", "how-it-works", "import", "avatar", "complete"].indexOf(step) >= index
                    ? colors.primary
                    : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 80,
  },
  stepContainer: {
    alignItems: "center",
    gap: 24,
  },
  iconContainer: {
    marginBottom: 8,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    overflow: "hidden",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 400,
  },
  featuresList: {
    width: "100%",
    gap: 16,
    maxWidth: 500,
  },
  featureItem: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 16,
    gap: 16,
    alignItems: "flex-start",
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  successBadge: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  statsPreview: {
    flexDirection: "row",
    padding: 24,
    borderRadius: 16,
    gap: 24,
    width: "100%",
    maxWidth: 400,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  secondaryButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    paddingLeft: 4,
  },
  promptInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    paddingLeft: 4,
    paddingTop: 2,
  },
});
