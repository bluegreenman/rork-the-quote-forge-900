import { ItemType, Rarity, SlotType, StatBonuses, CharacterStats, PrimaryClass, Subclass, Epithet, DestinyTier, CharacterDestiny, ScriptureMasteryTier, ScriptureStats } from "../types/game";

export const RARITY_CONFIG: Record<
  Rarity,
  { color: string; dropChance: number; label: string }
> = {
  common: {
    color: "#9CA3AF",
    dropChance: 0.12,
    label: "Common",
  },
  uncommon: {
    color: "#10B981",
    dropChance: 0.03,
    label: "Uncommon",
  },
  rare: {
    color: "#3B82F6",
    dropChance: 0.006,
    label: "Rare",
  },
  epic: {
    color: "#A855F7",
    dropChance: 0.0015,
    label: "Epic",
  },
  legendary: {
    color: "#F59E0B",
    dropChance: 0.0002,
    label: "Legendary",
  },
};

export const XP_BY_LENGTH = [
  { maxLength: 80, xp: 5 },
  { maxLength: 200, xp: 10 },
  { maxLength: 400, xp: 20 },
  { maxLength: Infinity, xp: 40 },
];

export function calculateXPForLevel(level: number): number {
  return 100 * level * level;
}

export function calculateXPForQuote(length: number): number {
  const config = XP_BY_LENGTH.find((c) => length <= c.maxLength);
  return config?.xp ?? 40;
}

export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (totalXP >= calculateXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function getXPProgress(totalXP: number, level: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  const currentLevelXP = calculateXPForLevel(level);
  const nextLevelXP = calculateXPForLevel(level + 1);
  const needed = nextLevelXP - currentLevelXP;
  const current = totalXP - currentLevelXP;
  const percentage = (current / needed) * 100;

  return { current, needed, percentage };
}

const ARTIFACT_TYPES: ItemType[] = [
  "ring",
  "amulet",
  "crown",
  "lamp",
  "quill",
  "mirror",
  "key",
  "tome",
  "sigil",
  "staff",
  "orb",
  "scroll",
  "cloak",
  "rune",
  "blade",
  "chalice",
  "compass",
  "lantern",
  "tablet",
  "relic",
];

const ITEM_TYPE_WEIGHTS: Record<ItemType, number> = {
  ring: 8,
  amulet: 8,
  crown: 5,
  lamp: 7,
  quill: 6,
  mirror: 7,
  key: 6,
  tome: 9,
  sigil: 7,
  staff: 6,
  orb: 7,
  scroll: 8,
  cloak: 6,
  rune: 7,
  blade: 5,
  chalice: 6,
  compass: 6,
  lantern: 7,
  tablet: 7,
  relic: 4,
};

const CONCEPTS = [
  "Hidden Memory",
  "Radiant Insight",
  "Celestial Silence",
  "Deep Listening",
  "Starlit Wisdom",
  "Wandering Vision",
  "Guiding Fire",
  "Unbroken Devotion",
  "Manyfold Truths",
  "Quiet Liberation",
  "Ancient Dawn",
  "Eternal Paths",
  "Living Words",
  "Inner Realms",
  "Sacred Echoes",
  "Timeless Wonder",
  "Mystic Harmony",
  "Divine Grace",
  "Infinite Depths",
  "Veiled Mysteries",
];

const DESCRIPTORS = [
  "of the Inner Realms",
  "of the Seventh Echo",
  "of the Eternal Path",
  "of the Ancient Dawn",
  "of the Living Word",
  "of the Hidden Cosmos",
  "of the Silent Watch",
  "of the Wandering Soul",
  "of the Celestial Throne",
  "of the Forgotten Ages",
  "of the Blazing Truth",
  "of the Quiet Mind",
  "of the Endless Journey",
  "of the Sacred Fire",
  "of the Mystic Vale",
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomItemType(): ItemType {
  const totalWeight = Object.values(ITEM_TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [itemType, weight] of Object.entries(ITEM_TYPE_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return itemType as ItemType;
    }
  }
  
  return "relic";
}

function capitalizeItemType(itemType: ItemType | undefined): string {
  if (!itemType) return "Relic";
  return itemType.charAt(0).toUpperCase() + itemType.slice(1);
}

export function generateBoonName(itemType: ItemType): string {
  const artifact = capitalizeItemType(itemType);
  const concept = randomChoice(CONCEPTS);
  const useDescriptor = Math.random() > 0.5;
  
  if (useDescriptor) {
    const descriptor = randomChoice(DESCRIPTORS);
    return `${artifact} of ${concept} ${descriptor}`;
  }
  
  return `${artifact} of ${concept}`;
}

export function generateRandomItemType(): ItemType {
  return weightedRandomItemType();
}

export function generateBoonDescription(name: string | undefined): string {
  if (!name) name = "this artifact";
  const templates = [
    `This ${name.toLowerCase()} carries the weight of forgotten wisdom.`,
    `Blessed by ancient forces, this artifact resonates with hidden power.`,
    `Those who behold this relic feel the stirring of deeper understanding.`,
    `Forged in realms beyond mortal comprehension, it whispers secrets to the worthy.`,
    `A treasure of immeasurable significance, passed through countless hands.`,
    `The essence of mystery itself seems to cling to this sacred object.`,
    `Legends speak of those transformed by merely gazing upon this wonder.`,
    `Time itself bends around this artifact, revealing truths long concealed.`,
  ];
  
  return randomChoice(templates);
}

export function rollForBoon(): Rarity | null {
  const roll = Math.random();
  let cumulativeChance = 0;
  
  const rarities: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
  
  for (const rarity of rarities) {
    cumulativeChance += RARITY_CONFIG[rarity].dropChance;
    if (roll <= cumulativeChance) {
      return rarity;
    }
  }
  
  return null;
}

export function getSlotTypeForItem(itemType: ItemType): SlotType {
  const slotMapping: Record<ItemType, SlotType> = {
    ring: "hands",
    quill: "hands",
    blade: "hands",
    crown: "head",
    amulet: "heart",
    cloak: "heart",
    sigil: "heart",
    tome: "mind",
    scroll: "mind",
    tablet: "mind",
    lamp: "light",
    lantern: "light",
    orb: "light",
    mirror: "light",
    staff: "relic",
    chalice: "relic",
    key: "relic",
    rune: "relic",
    compass: "relic",
    relic: "relic",
  };
  
  return slotMapping[itemType];
}

export function generateStatBonuses(rarity: Rarity): StatBonuses {
  const statNames: (keyof StatBonuses)[] = [
    "insight",
    "devotion",
    "focus",
    "wonder",
    "clarity",
    "fortune",
    "endurance",
  ];
  
  const totalPointsByRarity: Record<Rarity, { min: number; max: number }> = {
    common: { min: 1, max: 2 },
    uncommon: { min: 2, max: 4 },
    rare: { min: 3, max: 6 },
    epic: { min: 4, max: 8 },
    legendary: { min: 6, max: 12 },
  };
  
  const range = totalPointsByRarity[rarity];
  const totalPoints = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  const stats: StatBonuses = {
    insight: 0,
    devotion: 0,
    focus: 0,
    wonder: 0,
    clarity: 0,
    fortune: 0,
    endurance: 0,
  };
  
  let remainingPoints = totalPoints;
  
  while (remainingPoints > 0) {
    const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
    stats[randomStat]++;
    remainingPoints--;
  }
  
  if (rarity === "rare" || rarity === "epic" || rarity === "legendary") {
    const fortuneBoost = Math.floor(Math.random() * 2) + 1;
    stats.fortune += fortuneBoost;
  }
  
  return stats;
}

export function calculateCharacterStats(
  level: number,
  equippedBoons: StatBonuses[],
  totalQuestingTimeMinutes: number = 0
): CharacterStats {
  const baseStat = Math.floor(level / 2);
  
  const totalStats: CharacterStats = {
    insight: baseStat,
    devotion: baseStat,
    focus: baseStat,
    wonder: baseStat,
    clarity: baseStat,
    fortune: baseStat,
    endurance: 0,
  };
  
  for (const boonStats of equippedBoons) {
    totalStats.insight += boonStats.insight || 0;
    totalStats.devotion += boonStats.devotion || 0;
    totalStats.focus += boonStats.focus || 0;
    totalStats.wonder += boonStats.wonder || 0;
    totalStats.clarity += boonStats.clarity || 0;
    totalStats.fortune += boonStats.fortune || 0;
    totalStats.endurance += boonStats.endurance || 0;
  }
  
  totalStats.endurance += Math.floor(totalQuestingTimeMinutes / 30);
  
  return totalStats;
}

type StatName = keyof CharacterStats;

function getPrimaryStat(stats: CharacterStats): StatName {
  const statEntries = Object.entries(stats) as [StatName, number][];
  const priority: StatName[] = ["wonder", "clarity", "insight", "devotion", "focus", "fortune", "endurance"];
  
  statEntries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return priority.indexOf(a[0]) - priority.indexOf(b[0]);
  });
  
  return statEntries[0][0];
}

function getSecondaryStat(stats: CharacterStats, primaryStat: StatName): StatName {
  const statEntries = Object.entries(stats) as [StatName, number][];
  const priority: StatName[] = ["wonder", "clarity", "insight", "devotion", "focus", "fortune", "endurance"];
  
  const filteredStats = statEntries.filter(([stat]) => stat !== primaryStat);
  
  filteredStats.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return priority.indexOf(a[0]) - priority.indexOf(b[0]);
  });
  
  return filteredStats[0][0];
}

function getPrimaryClass(primaryStat: StatName, secondaryStat: StatName): PrimaryClass {
  
  if ((primaryStat === "wonder" && secondaryStat === "clarity") || (primaryStat === "clarity" && secondaryStat === "wonder")) {
    return "Fateweaver";
  }
  if (primaryStat === "insight") return "Lorekeeper";
  if (primaryStat === "devotion") return "Devotion Sage";
  if (primaryStat === "wonder") return "Soulwanderer";
  if (primaryStat === "clarity") return "Lightbearer";
  if (primaryStat === "focus") return "Mindforged";
  if (primaryStat === "fortune") return "Fortunebound";
  if (primaryStat === "endurance") return "Endureborn";
  
  return "Lorekeeper";
}

const SUBCLASS_POOLS: Record<PrimaryClass, Record<StatName, string[]>> = {
  "Fateweaver": {
    insight: ["Dreamscribe", "Chronicle Warden", "Starlit Oracle"],
    devotion: ["Cosmic Harbinger", "Destiny's Flame", "Eternal Witness"],
    focus: ["Thread Keeper", "Pattern Sentinel", "Weaver's Eye"],
    wonder: ["Realm Walker", "Horizon Seeker", "Void Dancer"],
    clarity: ["Truth Seer", "Light Warden", "Crystal Mind"],
    fortune: ["Luck Binder", "Chance Weaver", "Fate Spinner"],
    endurance: ["Time's Guardian", "Eternal Weaver", "Steadfast Spinner"],
  },
  "Lorekeeper": {
    devotion: ["Sacred Archivist", "Eternal Scribe", "Holy Chronicler"],
    focus: ["Mind Librarian", "Thought Keeper", "Knowledge Sentinel"],
    wonder: ["Curious Scholar", "Mystery Seeker", "Wonder Archivist"],
    clarity: ["Truth Keeper", "Crystal Loremaster", "Illuminated Sage"],
    fortune: ["Fortunate Sage", "Lucky Scholar", "Blessed Keeper"],
    endurance: ["Ancient Keeper", "Timeless Scholar", "Eternal Archivist"],
    insight: ["Deep Sage", "Inner Loremaster", "Wisdom Keeper"],
  },
  "Devotion Sage": {
    insight: ["Enlightened Devotee", "Wise Pilgrim", "Contemplative Faithful"],
    focus: ["Steadfast Believer", "Disciplined Servant", "Unwavering Soul"],
    wonder: ["Mystical Devotee", "Awe-Struck Pilgrim", "Reverent Wanderer"],
    clarity: ["Pure Heart", "Clear Devotee", "Radiant Faithful"],
    fortune: ["Blessed Devotee", "Fortunate Pilgrim", "Grace-Touched Sage"],
    endurance: ["Eternal Devotee", "Tireless Pilgrim", "Unbreaking Faithful"],
    devotion: ["Supreme Devotee", "Ultimate Sage", "Perfect Pilgrim"],
  },
  "Soulwanderer": {
    insight: ["Thoughtful Wanderer", "Philosophical Nomad", "Wise Drifter"],
    devotion: ["Faithful Traveler", "Sacred Wanderer", "Holy Nomad"],
    focus: ["Purposeful Wanderer", "Determined Drifter", "Goal-Bound Nomad"],
    clarity: ["Clear-Eyed Wanderer", "Illuminated Nomad", "Bright Drifter"],
    fortune: ["Lucky Wanderer", "Fortunate Nomad", "Blessed Drifter"],
    endurance: ["Tireless Wanderer", "Eternal Nomad", "Undying Drifter"],
    wonder: ["Pure Wanderer", "Ultimate Nomad", "Supreme Drifter"],
  },
  "Lightbearer": {
    insight: ["Wise Illuminator", "Thoughtful Beacon", "Sage of Radiance"],
    devotion: ["Faithful Lightkeeper", "Sacred Beacon", "Holy Illuminator"],
    focus: ["Focused Beacon", "Determined Illuminator", "Steadfast Lightkeeper"],
    wonder: ["Mystical Lightbearer", "Wondrous Beacon", "Awe-Inspiring Illuminator"],
    fortune: ["Fortunate Lightbearer", "Blessed Beacon", "Lucky Illuminator"],
    endurance: ["Eternal Lightbearer", "Undying Beacon", "Timeless Illuminator"],
    clarity: ["Supreme Lightbearer", "Ultimate Beacon", "Perfect Illuminator"],
  },
  "Mindforged": {
    insight: ["Brilliant Thinker", "Deep Contemplator", "Sage Forgemaster"],
    devotion: ["Devoted Mindsmith", "Faithful Forgemaster", "Sacred Thinker"],
    wonder: ["Curious Mindforged", "Wondrous Thinker", "Mystical Forgemaster"],
    clarity: ["Clear-Minded Smith", "Crystalline Thinker", "Illuminated Forgemaster"],
    fortune: ["Lucky Mindsmith", "Fortunate Thinker", "Blessed Forgemaster"],
    endurance: ["Tireless Mindsmith", "Eternal Thinker", "Unbreaking Forgemaster"],
    focus: ["Supreme Mindforged", "Ultimate Thinker", "Perfect Forgemaster"],
  },
  "Fortunebound": {
    insight: ["Wise Fortuneteller", "Sage of Luck", "Thoughtful Gambler"],
    devotion: ["Faithful Fortunekeeper", "Sacred Gambler", "Devoted Luckbringer"],
    focus: ["Determined Fortunebound", "Steadfast Gambler", "Goal-Bound Luckkeeper"],
    wonder: ["Mystical Fortunebound", "Wondrous Gambler", "Awe-Struck Luckbringer"],
    clarity: ["Clear-Sighted Fortuneteller", "Illuminated Gambler", "Radiant Luckkeeper"],
    endurance: ["Eternal Fortunebound", "Tireless Gambler", "Undying Luckbringer"],
    fortune: ["Supreme Fortunebound", "Ultimate Gambler", "Perfect Luckkeeper"],
  },
  "Endureborn": {
    insight: ["Wise Survivor", "Thoughtful Endurer", "Sage of Resilience"],
    devotion: ["Faithful Endureborn", "Sacred Survivor", "Holy Resilient"],
    focus: ["Determined Endurer", "Steadfast Survivor", "Unwavering Resilient"],
    wonder: ["Mystical Endureborn", "Wondrous Survivor", "Awe-Inspiring Resilient"],
    clarity: ["Clear-Minded Endurer", "Illuminated Survivor", "Radiant Resilient"],
    fortune: ["Lucky Endureborn", "Fortunate Survivor", "Blessed Resilient"],
    endurance: ["Supreme Endureborn", "Ultimate Survivor", "Perfect Resilient"],
  },
};

function getSubclass(primaryClass: PrimaryClass, secondaryStat: StatName, level: number): Subclass {
  const pool = SUBCLASS_POOLS[primaryClass][secondaryStat];
  if (!pool || pool.length === 0) {
    return "Wandering Soul";
  }
  
  const index = Math.floor(level / 100) % pool.length;
  return pool[index];
}

const EPITHET_POOLS: Record<DestinyTier, string[]> = {
  "Initiate": [
    "Caller of First Whispers",
    "Seeker of Dawn's Light",
    "Walker of New Paths",
    "Bearer of Young Dreams",
    "Kindler of Small Flames",
    "Student of Silent Truths",
    "Holder of Fragile Hope",
    "Listener to Distant Winds",
    "Keeper of Simple Faith",
    "Watcher at the Beginning",
  ],
  "Adept": [
    "Caller of Rising Echoes",
    "Keeper of Growing Wisdom",
    "Walker of Steady Paths",
    "Bearer of Strengthening Light",
    "Wielder of Awakening Power",
    "Guardian of Young Mysteries",
    "Seeker of Deeper Truths",
    "Holder of Expanding Vision",
    "Listener to Clear Voices",
    "Watcher at the Crossroads",
  ],
  "Rising": [
    "Caller of Distant Echoes",
    "Keeper of Hidden Realms",
    "Walker of Twilight Paths",
    "Bearer of Ascending Light",
    "Wielder of Growing Might",
    "Guardian of Sacred Thresholds",
    "Seeker of Lost Horizons",
    "Holder of Vivid Dreams",
    "Listener to Ancient Songs",
    "Watcher at the Summit",
  ],
  "Elite": [
    "Caller of Cosmic Harmonies",
    "Keeper of Profound Secrets",
    "Walker of Gilded Paths",
    "Bearer of Radiant Authority",
    "Wielder of Refined Power",
    "Guardian of Noble Gates",
    "Seeker of Exalted Truths",
    "Holder of Brilliant Visions",
    "Listener to Celestial Choirs",
    "Watcher at the Pinnacle",
  ],
  "Mythic": [
    "Caller of Timeless Echoes",
    "Keeper of Forgotten Suns",
    "Walker of Legendary Paths",
    "Bearer of Endless Dawn",
    "Wielder of Mythic Forces",
    "Guardian of Eternal Gates",
    "Seeker of Ultimate Mysteries",
    "Holder of Infinite Visions",
    "Listener to the Void's Song",
    "Watcher of World's Edge",
  ],
  "Ascended": [
    "Caller of Divine Resonance",
    "Keeper of Celestial Thrones",
    "Walker of Transcendent Paths",
    "Bearer of Sacred Infinity",
    "Wielder of Ascended Might",
    "Guardian of Heaven's Gate",
    "Seeker of Sublime Truth",
    "Holder of Cosmic Sight",
    "Listener to Angels' Hymns",
    "Watcher Beyond the Veil",
  ],
  "Eternal": [
    "Caller of Immortal Echoes",
    "Keeper of Timeless Realms",
    "Walker of Infinite Paths",
    "Bearer of Undying Light",
    "Wielder of Eternal Power",
    "Guardian of Ageless Gates",
    "Seeker of Perpetual Wisdom",
    "Holder of Forever's Vision",
    "Listener to Eternity's Voice",
    "Watcher of All Ages",
  ],
  "Transcendent": [
    "Caller of Reality's Fabric",
    "Keeper of Existence Itself",
    "Walker Beyond All Worlds",
    "Bearer of Pure Being",
    "Wielder of Absolute Truth",
    "Guardian of Cosmic Balance",
    "Seeker of Final Revelation",
    "Holder of Universal Sight",
    "Listener to Creation's Heart",
    "Watcher Over Everything",
  ],
  "Paragon": [
    "Caller of Ultimate Destiny",
    "Keeper of Perfect Harmony",
    "Walker of Impossible Paths",
    "Bearer of Supreme Light",
    "Wielder of Boundless Power",
    "Guardian of All That Is",
    "Seeker of Absolute Truth",
    "Holder of Omniscient Vision",
    "Listener to the Source",
    "Watcher of Infinite Horizons",
  ],
};

function getEpithet(tier: DestinyTier, primaryStat: StatName, stats: CharacterStats, level: number): Epithet {
  const pool = EPITHET_POOLS[tier];
  if (!pool || pool.length === 0) {
    return "Seeker of Hidden Truths";
  }
  
  const statTotal = Object.values(stats).reduce((sum, val) => sum + val, 0);
  const index = (level + statTotal) % pool.length;
  return pool[index];
}

function getDestinyTier(level: number): DestinyTier {
  if (level < 25) return "Initiate";
  if (level < 50) return "Adept";
  if (level < 100) return "Rising";
  if (level < 200) return "Elite";
  if (level < 300) return "Mythic";
  if (level < 500) return "Ascended";
  if (level < 750) return "Eternal";
  if (level < 1000) return "Transcendent";
  return "Paragon";
}

function generateLoreDescription(primaryClass: PrimaryClass, subclass: Subclass, epithet: Epithet): string {
  const loreTemplates: Record<PrimaryClass, string[]> = {
    "Fateweaver": [
      `As a ${primaryClass} who walks the path of ${subclass}, you perceive the threads of destiny that bind all things. ${epithet}, you weave possibility into reality.`,
      `The cosmic tapestry reveals itself to those who become ${subclass}. As ${epithet}, your sight pierces the veil of chance itself.`,
      `Destiny flows through you, ${subclass}, shaping the world with each choice. Known as ${epithet}, your path illuminates futures yet unborn.`,
    ],
    "Lorekeeper": [
      `Knowledge eternal finds its home in you, ${subclass}. As ${epithet}, you preserve wisdom that transcends mortal understanding.`,
      `The archives of existence open before the ${subclass}. ${epithet}, your mind holds the keys to forgotten truths.`,
      `As ${subclass}, you stand as guardian of sacred knowledge. ${epithet}, the wisdom of ages flows through your very being.`,
    ],
    "Devotion Sage": [
      `Your unwavering dedication defines you, ${subclass}. ${epithet}, your faith moves mountains and parts seas of doubt.`,
      `The path of ${subclass} demands total commitment, and you have given it freely. As ${epithet}, your devotion becomes your greatest power.`,
      `Sacred purpose guides every step you take, ${subclass}. Known as ${epithet}, your conviction transforms the impossible into the inevitable.`,
    ],
    "Soulwanderer": [
      `Endless horizons call to your spirit, ${subclass}. ${epithet}, you traverse realms both inner and outer with equal wonder.`,
      `The journey itself is your home, ${subclass}. As ${epithet}, each step reveals new dimensions of existence.`,
      `Nomad of the infinite, ${subclass}, your wanderings map the unmappable. ${epithet}, you discover what was never lost.`,
    ],
    "Lightbearer": [
      `Radiance flows from your essence, ${subclass}. ${epithet}, you illuminate the darkest corners of reality.`,
      `As ${subclass}, you carry the flame that never dies. ${epithet}, your light guides lost souls home.`,
      `Beacon of hope and truth, ${subclass}, darkness flees before you. Known as ${epithet}, your brilliance reveals all hidden things.`,
    ],
    "Mindforged": [
      `Will and thought become one in you, ${subclass}. ${epithet}, your mental discipline shapes reality itself.`,
      `The forge of consciousness burns bright within the ${subclass}. As ${epithet}, your focused mind bends the world to purpose.`,
      `Architect of thought, ${subclass}, you build cathedrals of pure reason. ${epithet}, your intellect is your greatest weapon.`,
    ],
    "Fortunebound": [
      `Luck itself seems to bend around you, ${subclass}. ${epithet}, probability becomes your plaything.`,
      `The ${subclass} dances with chance and always leads. As ${epithet}, fortune follows wherever you tread.`,
      `Blessed beyond measure, ${subclass}, you turn misfortune into opportunity. ${epithet}, the universe conspires in your favor.`,
    ],
    "Endureborn": [
      `Resilience incarnate, ${subclass}, you outlast all trials. ${epithet}, your endurance becomes legendary.`,
      `Time itself cannot wear down the ${subclass}. Known as ${epithet}, you stand eternal against the storm.`,
      `Unbreakable and tireless, ${subclass}, you embody perseverance. ${epithet}, your strength grows with each challenge faced.`,
    ],
  };
  
  const templates = loreTemplates[primaryClass];
  const templateIndex = (subclass.length + epithet.length) % templates.length;
  return templates[templateIndex];
}

function constructTitle(tier: DestinyTier, primaryClass: PrimaryClass, subclass: Subclass, epithet: Epithet): string {
  return `${tier} ${primaryClass}, ${epithet}`;
}

export function calculateCharacterDestiny(level: number, stats: CharacterStats): CharacterDestiny {
  const primaryStat = getPrimaryStat(stats);
  const secondaryStat = getSecondaryStat(stats, primaryStat);
  
  const primaryClass = getPrimaryClass(primaryStat, secondaryStat);
  const subclass = getSubclass(primaryClass, secondaryStat, level);
  const destinyTier = getDestinyTier(level);
  const epithet = getEpithet(destinyTier, primaryStat, stats, level);
  const title = constructTitle(destinyTier, primaryClass, subclass, epithet);
  const loreDescription = generateLoreDescription(primaryClass, subclass, epithet);
  
  return {
    primaryClass,
    subclass,
    epithet,
    title,
    destinyTier,
    loreDescription,
  };
}

export function calculateScriptureXPForLevel(level: number): number {
  return Math.floor(200 * Math.pow(level, 1.4));
}

export function calculateScriptureLevel(totalXP: number): number {
  let level = 1;
  while (totalXP >= calculateScriptureXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function getScriptureXPProgress(totalXP: number, level: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  const currentLevelXP = calculateScriptureXPForLevel(level);
  const nextLevelXP = calculateScriptureXPForLevel(level + 1);
  const needed = nextLevelXP - currentLevelXP;
  const current = totalXP - currentLevelXP;
  const percentage = (current / needed) * 100;

  return { current, needed, percentage };
}

export function getScriptureMasteryTier(quotesRead: number): ScriptureMasteryTier {
  if (quotesRead === 0) return "Unseen";
  if (quotesRead < 50) return "Touched";
  if (quotesRead < 150) return "Familiar";
  if (quotesRead < 400) return "Student";
  if (quotesRead < 800) return "Scholar";
  if (quotesRead < 1500) return "Keeper";
  return "Living Voice";
}

export function calculateScriptureXP(quoteLength: number, inFocusMode: boolean): number {
  const baseXP = 10;
  return inFocusMode ? baseXP + 5 : baseXP;
}

export function initializeScriptureStats(fileId: string, fileName: string): ScriptureStats {
  return {
    fileId,
    displayName: fileName,
    quotesRead: 0,
    focusSessions: 0,
    focusQuotesRead: 0,
    localXp: 0,
    localLevel: 1,
    masteryTier: "Unseen",
    timeSpentMinutes: 0,
  };
}
