import { CharacterDestiny, CharacterStats, PrimaryClass, DestinyTier } from "../types/game";
import type { StatBonuses } from "../types/game";

const TIER_STYLE_MAP: Record<DestinyTier, { detail: string; aura: string }> = {
  Initiate: {
    detail: "simple, clean illustration, minimal background, soft watercolor feel",
    aura: "soft subtle glow, faint shimmer",
  },
  Adept: {
    detail: "more detailed rendering, gentle magical energy, refined brushwork",
    aura: "soft halo, subtle floating symbols, wisps of light",
  },
  Rising: {
    detail: "polished fantasy art, vivid colors, detailed costume and accessories",
    aura: "growing aura, floating runes, crystalline particles",
  },
  Elite: {
    detail: "highly detailed fantasy art, rich textures, ornate decorations",
    aura: "bright aura, glowing runes and symbols, dramatic lighting, energy waves",
  },
  Mythic: {
    detail: "epic fantasy illustration, intricate details, legendary aesthetic",
    aura: "radiant aura, mystical patterns, ancient symbols, powerful energy",
  },
  Ascended: {
    detail: "transcendent fantasy art, divine aesthetic, breathtaking detail",
    aura: "brilliant aura, sacred geometry, celestial light, divine radiance",
  },
  Eternal: {
    detail: "cosmic fantasy art, timeless aesthetic, ultra-detailed illustration",
    aura: "constellations, infinite patterns, swirling cosmic light, eternal glow",
  },
  Transcendent: {
    detail: "mythic, otherworldly, hyper-detailed masterpiece, reality-bending aesthetic",
    aura: "nebulae, fractal light, divine radiance, multi-layered cosmic aura, reality warping effects",
  },
  Paragon: {
    detail: "ultimate masterpiece, godlike presence, infinite detail, beyond mortal comprehension",
    aura: "universe itself as aura, dimensional rifts, pure energy, manifestation of infinity",
  },
};

const CLASS_THEME_MAP: Record<PrimaryClass, { base: string; motifs: string }> = {
  Fateweaver: {
    base: "weaver of cosmic threads, confident mystic gaze, flowing robes with constellation patterns",
    motifs: "glowing threads of light weaving through space, constellations, woven patterns, destiny symbols",
  },
  Lorekeeper: {
    base: "keeper of ancient knowledge, scholarly presence, robes adorned with script and symbols",
    motifs: "floating books, ancient scrolls, glowing runes, library aesthetic, wisdom symbols",
  },
  "Devotion Sage": {
    base: "devoted spiritual master, serene expression, ceremonial garments with sacred symbols",
    motifs: "sacred flames, prayer beads, lotus flowers, mandala patterns, spiritual energy",
  },
  Soulwanderer: {
    base: "traveler between worlds, introspective expression, travel-worn mystical attire",
    motifs: "floating lanterns, distant landscapes, dreamlike mist, portal effects, path symbols",
  },
  Lightbearer: {
    base: "bringer of illumination, radiant presence, robes that shimmer with inner light",
    motifs: "beams of light, glowing crystals, sun motifs, stars, radiant energy",
  },
  Mindforged: {
    base: "master of mental discipline, focused intense gaze, sleek armor-like robes",
    motifs: "geometric patterns, crystalline structures, neural networks, thought made visible",
  },
  Fortunebound: {
    base: "favored by luck, knowing smile, elegant attire with fortune symbols",
    motifs: "coins and dice floating nearby, four-leaf clovers, probability waves, luck runes",
  },
  Endureborn: {
    base: "embodiment of resilience, weathered but strong, sturdy robes with endurance marks",
    motifs: "mountains, oak trees, unbreakable chains, shield symbols, timeless stones",
  },
};

type StatName = keyof StatBonuses;

const STAT_ADJECTIVES: Record<StatName, string[]> = {
  insight: ["thoughtful expression", "perceptive eyes", "wise countenance"],
  devotion: ["warm aura", "compassionate gaze", "gentle glow around the heart"],
  wonder: ["wide curious eyes", "awe-struck expression", "surrounded by magical sparkles"],
  clarity: ["sharp focused features", "crisp clear lighting", "crystalline clarity"],
  fortune: ["subtle knowing smile", "lucky shimmer", "coins or runes of luck nearby"],
  endurance: ["steady confident stance", "strong grounded posture", "weathered but resilient"],
  focus: ["intense concentrated gaze", "laser-focused eyes", "determined expression"],
};

function getDominantStats(stats: CharacterStats): StatName[] {
  const statEntries = Object.entries(stats) as [StatName, number][];
  statEntries.sort((a, b) => b[1] - a[1]);
  return statEntries.slice(0, 2).map(([stat]) => stat);
}

function getShortTitle(tier: DestinyTier, primaryClass: PrimaryClass): string {
  const title = `${tier} ${primaryClass}`;
  if (title.length > 24) {
    return primaryClass;
  }
  return title;
}

export function buildDestinyCardPrompt(
  destiny: CharacterDestiny,
  stats: CharacterStats,
  level: number,
  gender: "male" | "female"
): string {
  const { primaryClass, destinyTier } = destiny;
  
  const tierStyle = TIER_STYLE_MAP[destinyTier];
  const classTheme = CLASS_THEME_MAP[primaryClass];
  const dominantStats = getDominantStats(stats);
  
  const statPhrases: string[] = [];
  for (const stat of dominantStats.slice(0, 2)) {
    const adjectives = STAT_ADJECTIVES[stat];
    if (adjectives && adjectives.length > 0) {
      const randomIndex = Math.floor(Math.random() * adjectives.length);
      statPhrases.push(adjectives[randomIndex]);
    }
  }
  
  const genderDescription = gender === "male" ? "male" : "female";
  
  const prompt = `Fantasy character portrait of a ${genderDescription} ${primaryClass.toLowerCase()},
${classTheme.base}, ${statPhrases.join(", ")}.
Background with ${classTheme.motifs}, ${tierStyle.detail},
${tierStyle.aura}.
Tarot-style character card illustration, centered composition, highly polished art.
IMPORTANT: The character must be clearly ${genderDescription}.
No text, no lettering, no captions, no words anywhere in the image.
No copyrighted characters, no logos, no real people.
Original fantasy-inspired mystical character, spiritual and ethereal aesthetic.
Portrait orientation (2:3 aspect ratio), suitable for mobile game character card.`;

  console.log("[Destiny Card] Built prompt for tier:", destinyTier, "class:", primaryClass);
  return prompt;
}

export async function generateDestinyCard(
  prompt: string
): Promise<{ imageUri: string; success: boolean; error?: string }> {
  try {
    console.log("[Destiny Card] Generating with prompt length:", prompt.length);

    const response = await fetch("https://toolkit.rork.com/images/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        size: "1024x1536",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Destiny Card] Generation failed:", errorData);
      return {
        success: false,
        error: "Failed to generate card",
        imageUri: "",
      };
    }

    const data = await response.json();
    console.log("[Destiny Card] Response received");

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
      console.log("[Destiny Card] Using URL:", data.url);
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
    console.log("[Destiny Card] Image URI created successfully");

    return {
      success: true,
      imageUri,
    };
  } catch (error) {
    console.error("[Destiny Card] Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      imageUri: "",
    };
  }
}

export function canGenerateCard(lastGeneratedAt?: string): {
  canGenerate: boolean;
  waitTimeMinutes?: number;
} {
  if (!lastGeneratedAt) {
    return { canGenerate: true };
  }

  const lastGenTime = new Date(lastGeneratedAt).getTime();
  const now = Date.now();
  const timeDiffMs = now - lastGenTime;
  const timeDiffMinutes = timeDiffMs / (1000 * 60);
  const cooldownMinutes = 10;

  if (timeDiffMinutes >= cooldownMinutes) {
    return { canGenerate: true };
  }

  return {
    canGenerate: false,
    waitTimeMinutes: Math.ceil(cooldownMinutes - timeDiffMinutes),
  };
}
