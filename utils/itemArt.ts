import { Boon, Rarity, ItemType } from "../types/game";

const MAX_ITEM_IMAGES_PER_DAY = 10;

const RARITY_STYLES: Record<Rarity, string> = {
  common: "simple but meaningful design, subtle magical hint, minimal glow, grounded colors",
  uncommon: "soft magical aura, light engravings, slightly enhanced detail",
  rare: "strong magical glow, vivid colors, intricate engravings, clearly powerful artifact",
  epic: "dramatic lighting, swirling magical energy, complex silhouette, heroic presentation",
  legendary: "legendary artifact, highly ornate, radiant energy, sacred and ancient, awe-inspiring design",
};

const SLOT_DESCRIPTIONS: Record<ItemType, string> = {
  crown: "floating crown, ornate metalwork, gemstone centerpiece",
  ring: "close-up mystical ring, glowing gem, soft surface reflection",
  cloak: "cloak shown on invisible mannequin, flowing fabric, magical folds",
  lamp: "ancient magical lantern, internal glow",
  lantern: "ancient magical lantern, internal glow",
  tome: "ancient spellbook, slightly open, glowing runes or pages",
  key: "ornate key with intricate head design, suspended softly",
  amulet: "pendant floating in air, faint chain visible",
  blade: "sword or dagger, dynamic angle, detailed hilt",
  quill: "mystical feather quill, glowing ink tip, ethereal",
  orb: "mystical sphere, internal energy, suspended in air",
  mirror: "ornate hand mirror, reflective surface with magical depth",
  scroll: "partially unrolled scroll, glowing symbols visible",
  tablet: "stone or crystal tablet, engraved with mystical writing",
  staff: "ornate magical staff, detailed headpiece, energy flowing",
  chalice: "sacred goblet, intricate design, subtle inner light",
  rune: "carved mystical rune stone, glowing inscriptions",
  sigil: "floating magical sigil, complex geometric pattern",
  compass: "mystical compass, ornate design, magical needle",
  relic: "ancient sacred relic, mysterious aura, timeless design",
};

function cleanItemName(name: string): string {
  const parts = name.split(" of ");
  if (parts.length > 3) {
    return `${parts[0]} of ${parts[1]}`;
  }
  if (name.length > 80) {
    return name.substring(0, 77) + "...";
  }
  return name;
}

export function buildItemArtPrompt(artifact: Boon, playerLevel: number = 1): string {
  const cleanedName = cleanItemName(artifact.name);
  const rarityStyle = RARITY_STYLES[artifact.rarity];
  const slotDescription = SLOT_DESCRIPTIONS[artifact.itemType] || "mystical item, centered composition";
  
  const isHighLevel = playerLevel >= 100;
  const isHighRarity = artifact.rarity === "epic" || artifact.rarity === "legendary";
  const enhancementModifier = (isHighLevel || isHighRarity) 
    ? "ultra high detail, cinematic lighting, dramatic composition" 
    : "";

  const themeTagLine = artifact.themeTag 
    ? `\nThe design reflects the theme of ${artifact.themeTag}.`
    : "";

  const prompt = `A single magical ${artifact.itemType} called '${cleanedName}', centered on screen, no text, no labels, detailed fantasy concept art, clean background, designed as game item artwork.

${slotDescription}

Rarity style: ${rarityStyle}

${enhancementModifier}${themeTagLine}

No text, no labels, no lettering anywhere in the image.
No copyrighted content, no real people, no logos.
Mystical and spiritual aesthetic, suitable for a wisdom and knowledge focused RPG.
Clean, iconic design optimized for mobile game item cards.`;

  return prompt;
}

export async function generateItemArt(
  prompt: string
): Promise<{ imageUri: string; success: boolean; error?: string }> {
  try {
    console.log("[Item Art] Generating with prompt length:", prompt.length);

    const response = await fetch("https://toolkit.rork.com/images/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Item Art] Generation failed:", errorData);
      return {
        success: false,
        error: "Failed to generate item art",
        imageUri: "",
      };
    }

    const data = await response.json();
    console.log("[Item Art] Response received");

    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: "Invalid response from server",
        imageUri: "",
      };
    }

    let base64Data: string;
    let mimeType: string;

    if (data.image && typeof data.image === "object") {
      if (data.image.base64Data && typeof data.image.base64Data === "string") {
        base64Data = data.image.base64Data;
        mimeType = data.image.mimeType || "image/png";
      } else if (data.image.base64 && typeof data.image.base64 === "string") {
        base64Data = data.image.base64;
        mimeType = data.image.mimeType || "image/png";
      } else if (typeof data.image === "string") {
        base64Data = data.image;
        mimeType = "image/png";
      } else {
        return {
          success: false,
          error: "Could not find image data in response",
          imageUri: "",
        };
      }
    } else if (data.base64Data && typeof data.base64Data === "string") {
      base64Data = data.base64Data;
      mimeType = data.mimeType || "image/png";
    } else if (data.base64 && typeof data.base64 === "string") {
      base64Data = data.base64;
      mimeType = data.mimeType || "image/png";
    } else if (data.url && typeof data.url === "string") {
      console.log("[Item Art] Using URL:", data.url);
      return {
        success: true,
        imageUri: data.url,
      };
    } else {
      return {
        success: false,
        error: "No image data found in response",
        imageUri: "",
      };
    }

    if (!base64Data) {
      return {
        success: false,
        error: "Image data is empty",
        imageUri: "",
      };
    }

    const imageUri = `data:${mimeType};base64,${base64Data}`;
    console.log("[Item Art] Image URI created successfully");

    return {
      success: true,
      imageUri,
    };
  } catch (error) {
    console.error("[Item Art] Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      imageUri: "",
    };
  }
}

export function canGenerateItemArt(
  dailyCount: number,
  dailyDate: string | undefined,
  lastGeneratedAt: string | undefined
): {
  canGenerate: boolean;
  reason?: string;
  remainingToday?: number;
} {
  const today = new Date().toISOString().split('T')[0];
  
  const currentCount = dailyDate === today ? dailyCount : 0;
  
  if (currentCount >= MAX_ITEM_IMAGES_PER_DAY) {
    return {
      canGenerate: false,
      reason: "You've reached today's forging limit for item art. The Forge will be ready again tomorrow.",
      remainingToday: 0,
    };
  }
  
  if (lastGeneratedAt) {
    const lastGenTime = new Date(lastGeneratedAt).getTime();
    const now = Date.now();
    const timeDiffMs = now - lastGenTime;
    const timeDiffSeconds = timeDiffMs / 1000;
    const cooldownSeconds = 60;

    if (timeDiffSeconds < cooldownSeconds) {
      const waitSeconds = Math.ceil(cooldownSeconds - timeDiffSeconds);
      return {
        canGenerate: false,
        reason: `Please wait ${waitSeconds} seconds before forging this item again.`,
        remainingToday: MAX_ITEM_IMAGES_PER_DAY - currentCount,
      };
    }
  }

  return {
    canGenerate: true,
    remainingToday: MAX_ITEM_IMAGES_PER_DAY - currentCount - 1,
  };
}
