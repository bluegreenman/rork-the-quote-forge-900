/**
 * THE QUOTE FORGE - SYSTEM LOGIC ENGINE
 * 
 * Global quote management system for VerseForge app.
 * Provides stock quote packs and a stable, shuffle-based randomizer.
 */

export interface StockQuote {
  id: string;
  category: string;
  text: string;
}

export interface StockPack {
  name: string;
  quotes: StockQuote[];
}

class QuoteForgeEngine {
  private stockPacks: Map<string, StockQuote[]> = new Map();
  private quoteCategories: string[] = [];
  private quoteQueue: StockQuote[] = [];
  private lastQuoteId: string | null = null;

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private rebuildQuoteQueue(): void {
    const allQuotes: StockQuote[] = [];
    
    console.log('[QuoteForge] 🔄 REBUILDING QUOTE QUEUE');
    console.log(`[QuoteForge] Available packs: ${this.stockPacks.size}`);
    
    this.stockPacks.forEach((pack, packName) => {
      console.log(`[QuoteForge]   - ${packName}: ${pack.length} quotes`);
      allQuotes.push(...pack);
    });

    if (allQuotes.length === 0) {
      console.warn('[QuoteForge] rebuildQuoteQueue: no quotes available');
      this.quoteQueue = [];
      return;
    }

    this.quoteQueue = this.shuffleArray(allQuotes);
    console.log(`[QuoteForge] ✅ Queue rebuilt with ${this.quoteQueue.length} total quotes`);
    console.log(`[QuoteForge] Queue is now shuffled and ready`);
    
    const packDistribution = new Map<string, number>();
    this.quoteQueue.forEach(q => {
      packDistribution.set(q.category, (packDistribution.get(q.category) || 0) + 1);
    });
    console.log('[QuoteForge] Pack distribution in queue:');
    packDistribution.forEach((count, pack) => {
      console.log(`[QuoteForge]   - ${pack}: ${count} quotes`);
    });
  }

  loadStockPack(packName: string, quotesArray: any[]): string {
    if (!this.stockPacks.has(packName)) {
      this.stockPacks.set(packName, []);
    }

    const cleaned = quotesArray
      .filter(q => q && q.id && q.text && q.category)
      .map(q => ({
        id: String(q.id),
        category: String(q.category),
        text: String(q.text),
      }));

    this.stockPacks.set(packName, cleaned);

    if (!this.quoteCategories.includes(packName)) {
      this.quoteCategories.push(packName);
    }

    console.log(`[QuoteForge] Loaded ${cleaned.length} quotes into '${packName}'`);
    return `Loaded ${cleaned.length} quotes into '${packName}'`;
  }

  getRandomQuote(): StockQuote | null {
    const allQuotes: StockQuote[] = [];
    
    this.stockPacks.forEach((pack, packName) => {
      if (!Array.isArray(pack) || pack.length === 0) {
        console.log(`[QuoteForge] Pack '${packName}' is empty or invalid.`);
        return;
      }
      allQuotes.push(...pack);
    });

    if (allQuotes.length === 0) {
      console.warn('[QuoteForge] getRandomQuote: no stock quotes available');
      return null;
    }

    if (allQuotes.length === 1) {
      const only = allQuotes[0];
      this.lastQuoteId = only.id;
      console.log('[QuoteForge] ✨ Only one stock quote available, returning it');
      console.log(`[QuoteForge]   Pack: ${only.category}`);
      console.log(`[QuoteForge]   ID: ${only.id}`);
      console.log(`[QuoteForge]   Text preview: "${only.text.substring(0, 60)}..."`);
      return only;
    }

    let chosen: StockQuote | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const randomValue = Math.random();
      const randomIndex = Math.floor(randomValue * allQuotes.length);
      const candidate = allQuotes[randomIndex];

      if (!candidate) {
        attempts++;
        continue;
      }

      if (!this.lastQuoteId || candidate.id !== this.lastQuoteId) {
        chosen = candidate;
        console.log('[QuoteForge] RANDOM PICK:');
        console.log(`[QuoteForge]   Random value: ${randomValue}`);
        console.log(`[QuoteForge]   Index: ${randomIndex} / ${allQuotes.length}`);
        break;
      }

      attempts++;
    }

    if (!chosen) {
      chosen = allQuotes[0];
      console.log('[QuoteForge] Fallback: using first quote in allQuotes');
    }

    this.lastQuoteId = chosen.id;

    console.log('[QuoteForge] ✨ STOCK QUOTE SELECTED');
    console.log(`[QuoteForge]   Pack: ${chosen.category}`);
    console.log(`[QuoteForge]   ID: ${chosen.id}`);
    console.log(`[QuoteForge]   Text preview: "${chosen.text.substring(0, 60)}..."`);
    console.log(`[QuoteForge]   Total stock quotes loaded: ${allQuotes.length}`);

    return chosen;
  }

  getAllStockQuotes(): StockQuote[] {
    const allQuotes: StockQuote[] = [];
    this.stockPacks.forEach(pack => {
      allQuotes.push(...pack);
    });
    return allQuotes;
  }

  getPackNames(): string[] {
    return Array.from(this.stockPacks.keys());
  }

  getPackQuotes(packName: string): StockQuote[] {
    return this.stockPacks.get(packName) || [];
  }

  clearAllPacks(): void {
    this.stockPacks.clear();
    this.quoteCategories = [];
    console.log("[QuoteForge] All stock packs cleared");
  }
}

export const quoteForge = new QuoteForgeEngine();

/**
 * Load Stock Pack #1: Radiant Resolve (108 quotes)
 */
export function loadRadiantResolve(): void {
  const radiantResolveQuotes = [
    { id: "radiant_resolve_001", category: "Radiant Resolve", text: "You have survived every single day you thought you couldn't. Remember that." },
    { id: "radiant_resolve_002", category: "Radiant Resolve", text: "Today will not defeat you; it will reveal how unbreakable you really are." },
    { id: "radiant_resolve_003", category: "Radiant Resolve", text: "Your future self is already cheering for you. Don't walk away from them." },
    { id: "radiant_resolve_004", category: "Radiant Resolve", text: "You are not behind; you are precisely on the step you are learning from." },
    { id: "radiant_resolve_005", category: "Radiant Resolve", text: "Every tiny, unseen effort is quietly building the life you keep praying for." },
    { id: "radiant_resolve_006", category: "Radiant Resolve", text: "Courage rarely feels like roaring; most days it feels like showing up anyway." },
    { id: "radiant_resolve_007", category: "Radiant Resolve", text: "You are allowed to be both exhausted and unstoppable at the very same time." },
    { id: "radiant_resolve_008", category: "Radiant Resolve", text: "Do not underestimate the holy power of simply trying again today." },
    { id: "radiant_resolve_009", category: "Radiant Resolve", text: "Your pace is sacred. Rushing will not deliver you where grace is leading." },
    { id: "radiant_resolve_010", category: "Radiant Resolve", text: "Even on days you feel dim, you are still a lamp lit by Eternity." },
    { id: "radiant_resolve_011", category: "Radiant Resolve", text: "You don't need to see the whole road; you just need one honest step." },
    { id: "radiant_resolve_012", category: "Radiant Resolve", text: "There is a version of you on the other side of this that is grateful you stayed." },
    { id: "radiant_resolve_013", category: "Radiant Resolve", text: "You are not failing; you are forging. Fire never feels like progress at first." },
    { id: "radiant_resolve_014", category: "Radiant Resolve", text: "The mountain ahead is not an enemy; it is the shape of your next strength." },
    { id: "radiant_resolve_015", category: "Radiant Resolve", text: "Showing up with a shaking heart still counts as showing up with courage." },
    { id: "radiant_resolve_016", category: "Radiant Resolve", text: "Every time you choose love over fear, the universe quietly adjusts around you." },
    { id: "radiant_resolve_017", category: "Radiant Resolve", text: "You are allowed to rest; you are not allowed to believe you are worthless." },
    { id: "radiant_resolve_018", category: "Radiant Resolve", text: "Your heart has been broken, but it still believes in light. That is power." },
    { id: "radiant_resolve_019", category: "Radiant Resolve", text: "You have no idea how many people are breathing easier because you exist." },
    { id: "radiant_resolve_020", category: "Radiant Resolve", text: "Progress is often disguised as repetition. Don't despise the quiet training grounds." },
    { id: "radiant_resolve_021", category: "Radiant Resolve", text: "You can start again without hating who you were when you fell." },
    { id: "radiant_resolve_022", category: "Radiant Resolve", text: "It's okay if your miracle today is simply that you did not give up." },
    { id: "radiant_resolve_023", category: "Radiant Resolve", text: "You are not too late; you are right on time to choose a different direction." },
    { id: "radiant_resolve_024", category: "Radiant Resolve", text: "The same soul that survived yesterday can be trusted to navigate today." },
    { id: "radiant_resolve_025", category: "Radiant Resolve", text: "Do not compare your raw, sacred process to someone else's edited highlight reel." },
    { id: "radiant_resolve_026", category: "Radiant Resolve", text: "You are not fragile; you are finely made. There is a difference." },
    { id: "radiant_resolve_027", category: "Radiant Resolve", text: "Sometimes the bravest thing you can say is, 'I will try again tomorrow.'" },
    { id: "radiant_resolve_028", category: "Radiant Resolve", text: "Your wounds are not the end of your story; they are the ink of your testimony." },
    { id: "radiant_resolve_029", category: "Radiant Resolve", text: "When everything feels heavy, carry only the next right choice." },
    { id: "radiant_resolve_030", category: "Radiant Resolve", text: "You were not sent here to impress everyone; you were sent here to awaken." },
    { id: "radiant_resolve_031", category: "Radiant Resolve", text: "Even if you whisper your prayer, Heaven still hears it at full volume." },
    { id: "radiant_resolve_032", category: "Radiant Resolve", text: "Your limitations are real, but so is the grace that keeps expanding them." },
    { id: "radiant_resolve_033", category: "Radiant Resolve", text: "You are not just getting through this; you are being quietly remade by it." },
    { id: "radiant_resolve_034", category: "Radiant Resolve", text: "Let go of who you were supposed to be and serve who you are becoming." },
    { id: "radiant_resolve_035", category: "Radiant Resolve", text: "Your smallest consistent effort will outrun your loudest occasional burst." },
    { id: "radiant_resolve_036", category: "Radiant Resolve", text: "Some seasons are not about blooming; they are about growing roots in secret." },
    { id: "radiant_resolve_037", category: "Radiant Resolve", text: "You have permission to be a work in progress and a masterpiece simultaneously." },
    { id: "radiant_resolve_038", category: "Radiant Resolve", text: "Remember how far you've come; even your starting line was once a distant dream." },
    { id: "radiant_resolve_039", category: "Radiant Resolve", text: "You are allowed to protect your peace like it is something holy—because it is." },
    { id: "radiant_resolve_040", category: "Radiant Resolve", text: "Every 'I can't' you've said before was followed by a moment where you actually did." },
    { id: "radiant_resolve_041", category: "Radiant Resolve", text: "The heaviness you feel is not weakness; it is the weight of transformation." },
    { id: "radiant_resolve_042", category: "Radiant Resolve", text: "Do not rush out of the cocoon. Wings need time to remember what they are." },
    { id: "radiant_resolve_043", category: "Radiant Resolve", text: "Some days your only job is to keep the flame of hope from going out." },
    { id: "radiant_resolve_044", category: "Radiant Resolve", text: "You are not your worst decision; you are your next surrendered choice." },
    { id: "radiant_resolve_045", category: "Radiant Resolve", text: "You can't always control the storm, but you can anchor where you tie your heart." },
    { id: "radiant_resolve_046", category: "Radiant Resolve", text: "You did not lose time; you gathered wisdom you could not have learned otherwise." },
    { id: "radiant_resolve_047", category: "Radiant Resolve", text: "Be gentle with yourself; you are carrying chapters only God has fully read." },
    { id: "radiant_resolve_048", category: "Radiant Resolve", text: "Every time you choose to heal instead of hide, you bless people you haven't met yet." },
    { id: "radiant_resolve_049", category: "Radiant Resolve", text: "Your value has never depended on how well today is going." },
    { id: "radiant_resolve_050", category: "Radiant Resolve", text: "You are more than the story your fear tells about you." },
    { id: "radiant_resolve_051", category: "Radiant Resolve", text: "The same light that made the stars is patient with your slow, holy progress." },
    { id: "radiant_resolve_052", category: "Radiant Resolve", text: "Even when you feel scattered, your soul is still held in perfect order." },
    { id: "radiant_resolve_053", category: "Radiant Resolve", text: "You don't need louder motivation; you need a deeper why. You already have it." },
    { id: "radiant_resolve_054", category: "Radiant Resolve", text: "You have walked through nights that would have swallowed other people whole." },
    { id: "radiant_resolve_055", category: "Radiant Resolve", text: "Your tears have never been a sign of failure; they are evidence you still care." },
    { id: "radiant_resolve_056", category: "Radiant Resolve", text: "There is a quiet, undefeatable core inside you that remembers why you're here." },
    { id: "radiant_resolve_057", category: "Radiant Resolve", text: "You are stronger than the thing that tried to convince you to quit." },
    { id: "radiant_resolve_058", category: "Radiant Resolve", text: "You don't have to fix everything today; you just have to stay available to grace." },
    { id: "radiant_resolve_059", category: "Radiant Resolve", text: "Even when you feel lost, you are still on a map Heaven understands perfectly." },
    { id: "radiant_resolve_060", category: "Radiant Resolve", text: "You are not empty; you are being cleared for something wild and beautiful." },
    { id: "radiant_resolve_061", category: "Radiant Resolve", text: "Some of your greatest breakthroughs will look like very ordinary Tuesdays at first." },
    { id: "radiant_resolve_062", category: "Radiant Resolve", text: "You are allowed to be proud of how quietly you kept choosing the light." },
    { id: "radiant_resolve_063", category: "Radiant Resolve", text: "Your heart is not a burden; it is the compass that keeps saving your life." },
    { id: "radiant_resolve_064", category: "Radiant Resolve", text: "You have survived storms that never made it into your biography. Heaven saw them all." },
    { id: "radiant_resolve_065", category: "Radiant Resolve", text: "If you can still love after everything, you are walking in rare power." },
    { id: "radiant_resolve_066", category: "Radiant Resolve", text: "You're not starting from scratch; you're starting from experience. That is leverage." },
    { id: "radiant_resolve_067", category: "Radiant Resolve", text: "Let today be proof that you can move gently and still move forward." },
    { id: "radiant_resolve_068", category: "Radiant Resolve", text: "You are never disqualified from beginning again in the eyes of Love." },
    { id: "radiant_resolve_069", category: "Radiant Resolve", text: "You are not late; you are layered. Your story needed this depth." },
    { id: "radiant_resolve_070", category: "Radiant Resolve", text: "You do not need everyone to believe in you; just refuse to abandon yourself." },
    { id: "radiant_resolve_071", category: "Radiant Resolve", text: "Every time you choose healing over repeating, the whole lineage breathes easier." },
    { id: "radiant_resolve_072", category: "Radiant Resolve", text: "You are tougher than your mood, kinder than your fears, and deeper than your doubts." },
    { id: "radiant_resolve_073", category: "Radiant Resolve", text: "You deserved gentleness even on the days you only offered yourself survival." },
    { id: "radiant_resolve_074", category: "Radiant Resolve", text: "The dark tried to convince you it was permanent. Look at you, still glowing." },
    { id: "radiant_resolve_075", category: "Radiant Resolve", text: "You have not missed your moment; you are slowly becoming the person who can hold it." },
    { id: "radiant_resolve_076", category: "Radiant Resolve", text: "Even if no one claps today, your courage still shook something in the unseen." },
    { id: "radiant_resolve_077", category: "Radiant Resolve", text: "You are allowed to outgrow spaces that keep asking you to shrink." },
    { id: "radiant_resolve_078", category: "Radiant Resolve", text: "May you never again confuse chaos with passion or anxiety with destiny." },
    { id: "radiant_resolve_079", category: "Radiant Resolve", text: "You can be sacred and sweaty, holy and human, radiant and very much in process." },
    { id: "radiant_resolve_080", category: "Radiant Resolve", text: "Your heart keeps choosing compassion in a world that rewards apathy. That's heroic." },
    { id: "radiant_resolve_081", category: "Radiant Resolve", text: "You are not here to win every argument; you are here to keep your soul alive." },
    { id: "radiant_resolve_082", category: "Radiant Resolve", text: "You can honor your pain without letting it rewrite your identity." },
    { id: "radiant_resolve_083", category: "Radiant Resolve", text: "Healing is not linear, but it is real. Look at how your reactions are changing." },
    { id: "radiant_resolve_084", category: "Radiant Resolve", text: "You are not the chaos you walked through; you are the calm you are learning to keep." },
    { id: "radiant_resolve_085", category: "Radiant Resolve", text: "You can be shaking and still step forward. Nerves don't cancel destiny." },
    { id: "radiant_resolve_086", category: "Radiant Resolve", text: "Your dreams are not random; they are coordinates to the work your soul came to do." },
    { id: "radiant_resolve_087", category: "Radiant Resolve", text: "The page you're on right now would once have looked impossible. Honor it." },
    { id: "radiant_resolve_088", category: "Radiant Resolve", text: "You can set boundaries without apologizing for needing oxygen for your soul." },
    { id: "radiant_resolve_089", category: "Radiant Resolve", text: "You keep thinking you're starting over; really, you're starting higher each time." },
    { id: "radiant_resolve_090", category: "Radiant Resolve", text: "You are not too much; you are precisely the size of the calling on your life." },
    { id: "radiant_resolve_091", category: "Radiant Resolve", text: "The gentleness you crave from others—offer a fraction of it to yourself today." },
    { id: "radiant_resolve_092", category: "Radiant Resolve", text: "You didn't come this far to only rebuild the same cage from prettier materials." },
    { id: "radiant_resolve_093", category: "Radiant Resolve", text: "You are strong enough to choose the slower, truer path instead of the quick escape." },
    { id: "radiant_resolve_094", category: "Radiant Resolve", text: "Every time you return to love after disappointment, you rewrite what's possible." },
    { id: "radiant_resolve_095", category: "Radiant Resolve", text: "You don't need all the answers; you need the courage to live inside the questions." },
    { id: "radiant_resolve_096", category: "Radiant Resolve", text: "Your scars are proof that light reached you in time, not that darkness won." },
    { id: "radiant_resolve_097", category: "Radiant Resolve", text: "You can forgive yourself without pretending you didn't know better. Growth hurts." },
    { id: "radiant_resolve_098", category: "Radiant Resolve", text: "Sometimes strength is not moving on; it is staying present with what still aches." },
    { id: "radiant_resolve_099", category: "Radiant Resolve", text: "You are allowed to glow differently than people expected. Your path is bespoke." },
    { id: "radiant_resolve_100", category: "Radiant Resolve", text: "You are not surviving by accident; you are here because Love keeps choosing you." },
    { id: "radiant_resolve_101", category: "Radiant Resolve", text: "Your soul remembers a joy deeper than this moment's confusion. Lean toward that." },
    { id: "radiant_resolve_102", category: "Radiant Resolve", text: "You can be tired and still anointed, drained and still undeniably chosen for this." },
    { id: "radiant_resolve_103", category: "Radiant Resolve", text: "Every time you choose honesty over hiding, your future becomes a little lighter." },
    { id: "radiant_resolve_104", category: "Radiant Resolve", text: "You are not alone in this; invisible hands have been steadying you for years." },
    { id: "radiant_resolve_105", category: "Radiant Resolve", text: "The fact that you still care about goodness after everything is a victory." },
    { id: "radiant_resolve_106", category: "Radiant Resolve", text: "You are not unfinished because you are imperfect; you are alive, therefore evolving." },
    { id: "radiant_resolve_107", category: "Radiant Resolve", text: "There is nothing ordinary about a heart that keeps rising after invisible wars." },
    { id: "radiant_resolve_108", category: "Radiant Resolve", text: "Your existence is already a miracle; everything else is just detail and devotion." },
  ];

  quoteForge.loadStockPack("Radiant Resolve", radiantResolveQuotes);
}

/**
 * Load Stock Pack #2: Grit & Glory (108 quotes)
 */
export function loadGritAndGlory(): void {
  const gritAndGloryQuotes = [
    { id: "grit_glory_001", category: "Grit & Glory", text: "Discipline is doing what needs to be done long after the mood you started with is gone." },
    { id: "grit_glory_002", category: "Grit & Glory", text: "Your body listens to every thought. Train both like they're on the same mission." },
    { id: "grit_glory_003", category: "Grit & Glory", text: "You don't rise to the level of your goals; you fall to the level of your habits." },
    { id: "grit_glory_004", category: "Grit & Glory", text: "Sweat is just your weakness trying to escape. Let it go." },
    { id: "grit_glory_005", category: "Grit & Glory", text: "The weight isn't the enemy; it's the sculptor. It exposes exactly where you quit." },
    { id: "grit_glory_006", category: "Grit & Glory", text: "Excuses burn zero calories and build zero strength." },
    { id: "grit_glory_007", category: "Grit & Glory", text: "Champions don't wait to feel motivated; they move first and let motivation chase them." },
    { id: "grit_glory_008", category: "Grit & Glory", text: "There is always one more rep in you after the one you want to quit on." },
    { id: "grit_glory_009", category: "Grit & Glory", text: "The gym is the only place where breaking yourself down is how you get rebuilt." },
    { id: "grit_glory_010", category: "Grit & Glory", text: "Pain is the language progress uses when it wants your full attention." },
    { id: "grit_glory_011", category: "Grit & Glory", text: "You don't have to be the strongest in the room. Just refuse to be the one who quits first." },
    { id: "grit_glory_012", category: "Grit & Glory", text: "The day you train when you least feel like it counts more than ten easy days." },
    { id: "grit_glory_013", category: "Grit & Glory", text: "Muscle is built out of tiny, consistent acts of defiance against comfort." },
    { id: "grit_glory_014", category: "Grit & Glory", text: "Your future strength is hiding inside today's boring repetition." },
    { id: "grit_glory_015", category: "Grit & Glory", text: "You can't out-pray what you consistently out-eat and out-sit." },
    { id: "grit_glory_016", category: "Grit & Glory", text: "Train like someone is depending on you to become the healthiest version of yourself—because they are." },
    { id: "grit_glory_017", category: "Grit & Glory", text: "The mirror shows your body; your effort shows your character." },
    { id: "grit_glory_018", category: "Grit & Glory", text: "Five focused minutes beat an hour of half-hearted scrolling." },
    { id: "grit_glory_019", category: "Grit & Glory", text: "Your legs won't grow from wishing; they grow from sets that make you question your life choices." },
    { id: "grit_glory_020", category: "Grit & Glory", text: "If it doesn't challenge your breathing, it won't change your being." },
    { id: "grit_glory_021", category: "Grit & Glory", text: "The grind is holy when you offer it as gratitude for a body that can still move." },
    { id: "grit_glory_022", category: "Grit & Glory", text: "Tired is a signal, not a stop sign. Learn the difference between fatigue and surrender." },
    { id: "grit_glory_023", category: "Grit & Glory", text: "One workout will not fix your life. But it might fix your next decision." },
    { id: "grit_glory_024", category: "Grit & Glory", text: "There are two types of pain: the pain of discipline and the pain of regret. You choose daily." },
    { id: "grit_glory_025", category: "Grit & Glory", text: "Talk to yourself like a coach, not a critic, when the last set hits." },
    { id: "grit_glory_026", category: "Grit & Glory", text: "Every rep is a vote for the future you. Stack the votes higher." },
    { id: "grit_glory_027", category: "Grit & Glory", text: "You are one decision away from a completely different trajectory. Lace the shoes." },
    { id: "grit_glory_028", category: "Grit & Glory", text: "Rest is part of training, not an escape from it. Recover like an athlete, not a quitter." },
    { id: "grit_glory_029", category: "Grit & Glory", text: "Consistency beats intensity when intensity only visits on Saturdays." },
    { id: "grit_glory_030", category: "Grit & Glory", text: "The difference between 'I can't' and 'I did' is usually twenty more seconds." },
    { id: "grit_glory_031", category: "Grit & Glory", text: "You aren't just training muscles; you're training the part of you that refuses to bow to laziness." },
    { id: "grit_glory_032", category: "Grit & Glory", text: "The set doesn't start until it burns." },
    { id: "grit_glory_033", category: "Grit & Glory", text: "You will never regret a workout you finished. Only the one you skipped." },
    { id: "grit_glory_034", category: "Grit & Glory", text: "Comfort is a beautiful place, but nothing legendary ever grows there." },
    { id: "grit_glory_035", category: "Grit & Glory", text: "Don't chase the pump; chase the person you become when you show up every day." },
    { id: "grit_glory_036", category: "Grit & Glory", text: "Your lungs are stronger than your excuses. Prove it for thirty more seconds." },
    { id: "grit_glory_037", category: "Grit & Glory", text: "Train so that everyday tasks feel like warm-ups." },
    { id: "grit_glory_038", category: "Grit & Glory", text: "Your playlist can hype you up, but only your discipline will carry the bar." },
    { id: "grit_glory_039", category: "Grit & Glory", text: "The gym is cheaper than therapy and often more honest." },
    { id: "grit_glory_040", category: "Grit & Glory", text: "If you can scroll, you can stretch. If you can binge, you can walk." },
    { id: "grit_glory_041", category: "Grit & Glory", text: "Strength is built where your comfort zone ends and your shaking muscles begin." },
    { id: "grit_glory_042", category: "Grit & Glory", text: "Progress photos don't capture the most important change: the way you talk to yourself now." },
    { id: "grit_glory_043", category: "Grit & Glory", text: "Not every workout will be epic, but every workout can be honest." },
    { id: "grit_glory_044", category: "Grit & Glory", text: "Fuel like an athlete, not like an accident." },
    { id: "grit_glory_045", category: "Grit & Glory", text: "Your sweat today is rent for the body you want to live in tomorrow." },
    { id: "grit_glory_046", category: "Grit & Glory", text: "When your mind says stop, ask your form—not your feelings—if that's true." },
    { id: "grit_glory_047", category: "Grit & Glory", text: "You won't always hit a PR, but you can always hit 'show up'." },
    { id: "grit_glory_048", category: "Grit & Glory", text: "Don't negotiate with the part of you that wants the couch. It never bargains in your favor." },
    { id: "grit_glory_049", category: "Grit & Glory", text: "Strong looks good on you, but it feels even better from the inside." },
    { id: "grit_glory_050", category: "Grit & Glory", text: "Showing up late is better than not showing up. Walk in and redeem the day." },
    { id: "grit_glory_051", category: "Grit & Glory", text: "Your workout doesn't need to be perfect; it needs to be finished." },
    { id: "grit_glory_052", category: "Grit & Glory", text: "You are building armor for the days life hits harder than the weights." },
    { id: "grit_glory_053", category: "Grit & Glory", text: "Tell your laziness, \"You can ride along, but you don't touch the steering wheel.\"" },
    { id: "grit_glory_054", category: "Grit & Glory", text: "Momentum is a jealous friend; once you have it, don't let it go easily." },
    { id: "grit_glory_055", category: "Grit & Glory", text: "The barbell doesn't care about your mood. That's why it tells the truth." },
    { id: "grit_glory_056", category: "Grit & Glory", text: "Your warm-up self had doubts. Your last-set self is proof they were wrong." },
    { id: "grit_glory_057", category: "Grit & Glory", text: "The body you want is hiding inside the decisions you don't want to make yet." },
    { id: "grit_glory_058", category: "Grit & Glory", text: "No one is coming to do your push-ups for you." },
    { id: "grit_glory_059", category: "Grit & Glory", text: "Train like the future version of you is watching—and taking notes." },
    { id: "grit_glory_060", category: "Grit & Glory", text: "If it matters, schedule it. If it's scheduled, treat it like a sacred appointment." },
    { id: "grit_glory_061", category: "Grit & Glory", text: "You didn't \"fall off\"; you paused. Now press play again." },
    { id: "grit_glory_062", category: "Grit & Glory", text: "Stronger lungs, stronger legs, stronger heart—stronger prayers." },
    { id: "grit_glory_063", category: "Grit & Glory", text: "Let your children remember the sound of your footsteps moving toward health." },
    { id: "grit_glory_064", category: "Grit & Glory", text: "One disciplined hour can redeem an undisciplined day." },
    { id: "grit_glory_065", category: "Grit & Glory", text: "Progress is addictive once you learn to measure it in effort, not aesthetics." },
    { id: "grit_glory_066", category: "Grit & Glory", text: "You are never too out of shape to start, only too attached to your excuses." },
    { id: "grit_glory_067", category: "Grit & Glory", text: "Your workout is a vote for future energy. Cast it wisely." },
    { id: "grit_glory_068", category: "Grit & Glory", text: "Leg day builds character faster than most self-help books." },
    { id: "grit_glory_069", category: "Grit & Glory", text: "The scale can't measure the confidence of keeping a promise to your body." },
    { id: "grit_glory_070", category: "Grit & Glory", text: "Be the person who trains even when no one is documenting it." },
    { id: "grit_glory_071", category: "Grit & Glory", text: "A bad workout is one you never did; everything else is data." },
    { id: "grit_glory_072", category: "Grit & Glory", text: "You don't rise in life by chance; you rise by reps." },
    { id: "grit_glory_073", category: "Grit & Glory", text: "The same discipline that carries you through a set will carry you through a storm." },
    { id: "grit_glory_074", category: "Grit & Glory", text: "You're not punishing your body; you're preparing it." },
    { id: "grit_glory_075", category: "Grit & Glory", text: "Soreness is just your muscles sending a thank-you note." },
    { id: "grit_glory_076", category: "Grit & Glory", text: "Turn \"I have to work out\" into \"I get to train.\" Gratitude changes the grind." },
    { id: "grit_glory_077", category: "Grit & Glory", text: "A strong back carries more than weight; it carries responsibility." },
    { id: "grit_glory_078", category: "Grit & Glory", text: "You owe it to your older self to build a body that will not abandon them." },
    { id: "grit_glory_079", category: "Grit & Glory", text: "Every drop of sweat is proof that you showed up when you could have stayed home." },
    { id: "grit_glory_080", category: "Grit & Glory", text: "The iron never lies. It only reflects the work you did or didn't do." },
    { id: "grit_glory_081", category: "Grit & Glory", text: "Muscle is earned in the moments you'd rather stop but don't." },
    { id: "grit_glory_082", category: "Grit & Glory", text: "The hardest part of the workout is often the distance between you and the floor where your shoes are." },
    { id: "grit_glory_083", category: "Grit & Glory", text: "Your body is not the enemy; it's the ally that's been waiting for your leadership." },
    { id: "grit_glory_084", category: "Grit & Glory", text: "You can't microwave strength. It's a slow-cooked meal." },
    { id: "grit_glory_085", category: "Grit & Glory", text: "If you're strong enough to carry your stress, you're strong enough to carry a barbell." },
    { id: "grit_glory_086", category: "Grit & Glory", text: "Your warm-up decides if your workout is a blessing or a future injury." },
    { id: "grit_glory_087", category: "Grit & Glory", text: "Stop waiting for motivation. Put on the shoes and let momentum find you moving." },
    { id: "grit_glory_088", category: "Grit & Glory", text: "Every rep whispers, \"I'm still here. I still care about my life.\"" },
    { id: "grit_glory_089", category: "Grit & Glory", text: "Strength training is self-respect in motion." },
    { id: "grit_glory_090", category: "Grit & Glory", text: "Let your discipline be louder than the drama of your day." },
    { id: "grit_glory_091", category: "Grit & Glory", text: "The grind doesn't ask how you feel; it asks if you showed up." },
    { id: "grit_glory_092", category: "Grit & Glory", text: "You are not chasing a number on a bar; you are chasing mastery over yourself." },
    { id: "grit_glory_093", category: "Grit & Glory", text: "Your best excuse will never look as good as your best effort." },
    { id: "grit_glory_094", category: "Grit & Glory", text: "Show your fear the squat rack and let it see what you're capable of." },
    { id: "grit_glory_095", category: "Grit & Glory", text: "Wake up the warrior in you before the world wakes up the worrier." },
    { id: "grit_glory_096", category: "Grit & Glory", text: "You don't get stronger by thinking about lifting heavy things." },
    { id: "grit_glory_097", category: "Grit & Glory", text: "Your sweat is the ink writing a different story for your future." },
    { id: "grit_glory_098", category: "Grit & Glory", text: "Some days the victory is not your max weight—it's your minimum effort raised." },
    { id: "grit_glory_099", category: "Grit & Glory", text: "Your body remembers every time you chose strength over apathy." },
    { id: "grit_glory_100", category: "Grit & Glory", text: "You are not fragile; you are simply unpracticed at your own power." },
    { id: "grit_glory_101", category: "Grit & Glory", text: "If you can carry your phone all day, you can carry some weights for thirty minutes." },
    { id: "grit_glory_102", category: "Grit & Glory", text: "Run from your excuses faster than you run from the treadmill." },
    { id: "grit_glory_103", category: "Grit & Glory", text: "Your muscles are listening right now. What do you want them to believe about you?" },
    { id: "grit_glory_104", category: "Grit & Glory", text: "A single workout will not change your destiny, but a thousand ignored ones will." },
    { id: "grit_glory_105", category: "Grit & Glory", text: "You're allowed to start with light weights and heavy determination." },
    { id: "grit_glory_106", category: "Grit & Glory", text: "Every rep is a quiet rebellion against the version of you that gave up before." },
    { id: "grit_glory_107", category: "Grit & Glory", text: "When you feel like quitting, remember why you prayed for the strength to begin." },
    { id: "grit_glory_108", category: "Grit & Glory", text: "Glory is not found on the podium; it's forged in the lonely reps no one else sees." },
  ];

  quoteForge.loadStockPack("Grit & Glory", gritAndGloryQuotes);
}

/**
 * Load Stock Pack #3: Stoic Iron (108 quotes)
 */
export function loadStoicIron(): void {
  const stoicIronQuotes = [
    { id: "stoic_001", category: "Stoic Iron", text: "You cannot control the wind, only the set of your sails." },
    { id: "stoic_002", category: "Stoic Iron", text: "Choose not to be harmed, and you will not be." },
    { id: "stoic_003", category: "Stoic Iron", text: "If it is outside your control, it is outside your concern." },
    { id: "stoic_004", category: "Stoic Iron", text: "No man is free who is not master of himself." },
    { id: "stoic_005", category: "Stoic Iron", text: "You are not disturbed by events, but by your interpretation of them." },
    { id: "stoic_006", category: "Stoic Iron", text: "The obstacle is not in your way; it is your way." },
    { id: "stoic_007", category: "Stoic Iron", text: "Waste no time arguing what a good person should be. Be one." },
    { id: "stoic_008", category: "Stoic Iron", text: "He who fears death will never live." },
    { id: "stoic_009", category: "Stoic Iron", text: "Silence is a lesson in itself." },
    { id: "stoic_010", category: "Stoic Iron", text: "Circumstances don't make the man; they reveal him." },
    { id: "stoic_011", category: "Stoic Iron", text: "To complain is to relinquish your power." },
    { id: "stoic_012", category: "Stoic Iron", text: "A gem cannot be polished without friction, nor a man without trials." },
    { id: "stoic_013", category: "Stoic Iron", text: "If you seek tranquility, do less—but do it with excellence." },
    { id: "stoic_014", category: "Stoic Iron", text: "Remember: every insult says more about the speaker than you." },
    { id: "stoic_015", category: "Stoic Iron", text: "Let your actions speak so loudly that your critics go deaf." },
    { id: "stoic_016", category: "Stoic Iron", text: "What stands in the way becomes the way." },
    { id: "stoic_017", category: "Stoic Iron", text: "Self-control is the strongest freedom." },
    { id: "stoic_018", category: "Stoic Iron", text: "Anger is a poor counselor; let reason lead you instead." },
    { id: "stoic_019", category: "Stoic Iron", text: "Do not pray for an easy life; pray to be stronger." },
    { id: "stoic_020", category: "Stoic Iron", text: "A person's worth is measured by the worth of what they pursue." },
    { id: "stoic_021", category: "Stoic Iron", text: "The opinion of others is wind; your character is stone." },
    { id: "stoic_022", category: "Stoic Iron", text: "Learn to desire only what happens." },
    { id: "stoic_023", category: "Stoic Iron", text: "Do not let your mind be a slave to your emotions." },
    { id: "stoic_024", category: "Stoic Iron", text: "Wherever you find yourself, rise to the task." },
    { id: "stoic_025", category: "Stoic Iron", text: "Take care of your thoughts; they become your world." },
    { id: "stoic_026", category: "Stoic Iron", text: "Your calm is your fortress." },
    { id: "stoic_027", category: "Stoic Iron", text: "You always own your reaction; that is your kingdom." },
    { id: "stoic_028", category: "Stoic Iron", text: "What is truly yours cannot be taken; what is taken was never truly yours." },
    { id: "stoic_029", category: "Stoic Iron", text: "You become what you repeatedly endure." },
    { id: "stoic_030", category: "Stoic Iron", text: "Strength grows when you refuse to flee from discomfort." },
    { id: "stoic_031", category: "Stoic Iron", text: "Do not speak of your philosophy; embody it." },
    { id: "stoic_032", category: "Stoic Iron", text: "We are often frightened not by reality, but by imagination." },
    { id: "stoic_033", category: "Stoic Iron", text: "Conquer your mind, and you conquer your life." },
    { id: "stoic_034", category: "Stoic Iron", text: "Tend to the moment; the moment tends to your future." },
    { id: "stoic_035", category: "Stoic Iron", text: "Be strict with yourself and gentle with others." },
    { id: "stoic_036", category: "Stoic Iron", text: "If you want less fear, want less from the world." },
    { id: "stoic_037", category: "Stoic Iron", text: "Every difficulty is training. Every day is the gym of the soul." },
    { id: "stoic_038", category: "Stoic Iron", text: "Self-discipline is choosing what you want most over what you want now." },
    { id: "stoic_039", category: "Stoic Iron", text: "If virtue guides you, you are never lost." },
    { id: "stoic_040", category: "Stoic Iron", text: "Let your judgment of yourself be harsher than the world's; let your mercy to others be greater." },
    { id: "stoic_041", category: "Stoic Iron", text: "If you are disturbed, the disturbance is within you." },
    { id: "stoic_042", category: "Stoic Iron", text: "Take nothing personally; even your praise is not truly yours." },
    { id: "stoic_043", category: "Stoic Iron", text: "Happiness is found in wanting what you already have." },
    { id: "stoic_044", category: "Stoic Iron", text: "You suffer more in imagination than in reality." },
    { id: "stoic_045", category: "Stoic Iron", text: "To live well is to live simply." },
    { id: "stoic_046", category: "Stoic Iron", text: "Your peace is yours because it depends on nothing outside you." },
    { id: "stoic_047", category: "Stoic Iron", text: "Do not postpone virtue; you are postponing yourself." },
    { id: "stoic_048", category: "Stoic Iron", text: "The world is changing constantly; adjust without losing yourself." },
    { id: "stoic_049", category: "Stoic Iron", text: "Simplicity is strength disguised as softness." },
    { id: "stoic_050", category: "Stoic Iron", text: "Seek progress, not perfection." },
    { id: "stoic_051", category: "Stoic Iron", text: "You cannot learn if you believe you already know." },
    { id: "stoic_052", category: "Stoic Iron", text: "Let reason cut through emotion like a blade through fog." },
    { id: "stoic_053", category: "Stoic Iron", text: "Prepare your mind for difficulty, and difficulty loses its sting." },
    { id: "stoic_054", category: "Stoic Iron", text: "You are allowed to be calm in chaos." },
    { id: "stoic_055", category: "Stoic Iron", text: "Retreat into yourself; not to escape, but to fortify." },
    { id: "stoic_056", category: "Stoic Iron", text: "Every expectation is a premeditated disappointment." },
    { id: "stoic_057", category: "Stoic Iron", text: "Do not allow your happiness to depend on fickle things." },
    { id: "stoic_058", category: "Stoic Iron", text: "You rise when you refuse to be owned by misfortune." },
    { id: "stoic_059", category: "Stoic Iron", text: "If you cannot change it, change your stance toward it." },
    { id: "stoic_060", category: "Stoic Iron", text: "Your life is your responsibility; do not outsource it." },
    { id: "stoic_061", category: "Stoic Iron", text: "Most battles are won in the mind before they are fought in life." },
    { id: "stoic_062", category: "Stoic Iron", text: "Be tolerant with others and strict with yourself." },
    { id: "stoic_063", category: "Stoic Iron", text: "You cannot lose what you never truly possessed." },
    { id: "stoic_064", category: "Stoic Iron", text: "What you practice in private becomes your armor in public." },
    { id: "stoic_065", category: "Stoic Iron", text: "The more you want, the less you are free." },
    { id: "stoic_066", category: "Stoic Iron", text: "It is not events that disturb you, but your opinion of them." },
    { id: "stoic_067", category: "Stoic Iron", text: "Act as if today were the day you will be judged only by your character." },
    { id: "stoic_068", category: "Stoic Iron", text: "A man's true wealth is the goodness he does in silence." },
    { id: "stoic_069", category: "Stoic Iron", text: "You are not owed ease; you are owed the chance to grow." },
    { id: "stoic_070", category: "Stoic Iron", text: "Practice poverty so you never fear it." },
    { id: "stoic_071", category: "Stoic Iron", text: "He who conquers his desires is invincible." },
    { id: "stoic_072", category: "Stoic Iron", text: "Strength is not loud; it is consistent." },
    { id: "stoic_073", category: "Stoic Iron", text: "Nothing lasts forever—not pain, not joy, not fear." },
    { id: "stoic_074", category: "Stoic Iron", text: "If someone provokes you, they are pointing out your untrained places." },
    { id: "stoic_075", category: "Stoic Iron", text: "Do not let comfort make you soft." },
    { id: "stoic_076", category: "Stoic Iron", text: "The first step to wisdom is noticing your impulses." },
    { id: "stoic_077", category: "Stoic Iron", text: "Discipline is your truest companion." },
    { id: "stoic_078", category: "Stoic Iron", text: "If it isn't virtuous, don't say it, don't think it, don't do it." },
    { id: "stoic_079", category: "Stoic Iron", text: "Face what you fear; most of it dissolves under examination." },
    { id: "stoic_080", category: "Stoic Iron", text: "Peace comes from accepting what you cannot accelerate." },
    { id: "stoic_081", category: "Stoic Iron", text: "You cannot add more life by adding more worry." },
    { id: "stoic_082", category: "Stoic Iron", text: "Let each day's task be enough." },
    { id: "stoic_083", category: "Stoic Iron", text: "If you wish to be wise, learn to listen twice as much as you speak." },
    { id: "stoic_084", category: "Stoic Iron", text: "Judge success by your discipline, not your results." },
    { id: "stoic_085", category: "Stoic Iron", text: "Train your mind to stay where your feet are." },
    { id: "stoic_086", category: "Stoic Iron", text: "To be angry is to hand your power to the offender." },
    { id: "stoic_087", category: "Stoic Iron", text: "Every habit is a vote for the person you are becoming." },
    { id: "stoic_088", category: "Stoic Iron", text: "True strength is gentle." },
    { id: "stoic_089", category: "Stoic Iron", text: "You cannot outrun yourself; train yourself instead." },
    { id: "stoic_090", category: "Stoic Iron", text: "Take life as it is given, not as you wish it were." },
    { id: "stoic_091", category: "Stoic Iron", text: "Misfortune is a test, not a verdict." },
    { id: "stoic_092", category: "Stoic Iron", text: "Thank the obstacles—they show you where you still need mastery." },
    { id: "stoic_093", category: "Stoic Iron", text: "Your life is your training ground; use it wisely." },
    { id: "stoic_094", category: "Stoic Iron", text: "Be slow to judge and quick to understand." },
    { id: "stoic_095", category: "Stoic Iron", text: "You cannot fail if your aim is virtue." },
    { id: "stoic_096", category: "Stoic Iron", text: "Honor your time; it is your only true currency." },
    { id: "stoic_097", category: "Stoic Iron", text: "Be unmoved by praise and untouched by blame." },
    { id: "stoic_098", category: "Stoic Iron", text: "Let nothing master you except wisdom." },
    { id: "stoic_099", category: "Stoic Iron", text: "Remain calm; storms reveal the sailor." },
    { id: "stoic_100", category: "Stoic Iron", text: "Fate leads the willing and drags the unwilling." },
    { id: "stoic_101", category: "Stoic Iron", text: "If you stumble, make it part of the dance." },
    { id: "stoic_102", category: "Stoic Iron", text: "Serve your duty, not your mood." },
    { id: "stoic_103", category: "Stoic Iron", text: "Speak only what improves silence." },
    { id: "stoic_104", category: "Stoic Iron", text: "A calm mind cuts deeper than a sharp blade." },
    { id: "stoic_105", category: "Stoic Iron", text: "You owe the world your virtues, not your reactions." },
    { id: "stoic_106", category: "Stoic Iron", text: "Become the kind of person difficulty fears." },
    { id: "stoic_107", category: "Stoic Iron", text: "Live today as if you were already the person you seek to become." },
    { id: "stoic_108", category: "Stoic Iron", text: "What you control is enough." },
  ];

  quoteForge.loadStockPack("Stoic Iron", stoicIronQuotes);
}

/**
 * Load Stock Pack #4: Mindful Clarity (108 quotes)
 */
export function loadMindfulClarity(): void {
  const mindfulClarityQuotes = [
    { id: "mindful_001", category: "Mindful Clarity", text: "Your breath is the oldest friend you have—return to it when the world feels loud." },
    { id: "mindful_002", category: "Mindful Clarity", text: "Do not rush your life; meet each moment as if it were your teacher." },
    { id: "mindful_003", category: "Mindful Clarity", text: "Presence is not something you achieve; it is something you allow." },
    { id: "mindful_004", category: "Mindful Clarity", text: "You cannot control the future, but you can control the clarity with which you step into it." },
    { id: "mindful_005", category: "Mindful Clarity", text: "Let your mind settle like snow in a shaken globe—give it time and it will clear." },
    { id: "mindful_006", category: "Mindful Clarity", text: "The pause between thoughts is your doorway to peace." },
    { id: "mindful_007", category: "Mindful Clarity", text: "Every mindful breath is a small act of reconciliation with yourself." },
    { id: "mindful_008", category: "Mindful Clarity", text: "Listen to your thoughts like passing footsteps, not commands." },
    { id: "mindful_009", category: "Mindful Clarity", text: "Clarity appears when you stop insisting on certainty." },
    { id: "mindful_010", category: "Mindful Clarity", text: "Peace is not found in a quiet world; it is found in a quiet mind." },
    { id: "mindful_011", category: "Mindful Clarity", text: "A wandering mind is not a failing; it is an invitation to return." },
    { id: "mindful_012", category: "Mindful Clarity", text: "Let go of the need to label every experience; simply notice." },
    { id: "mindful_013", category: "Mindful Clarity", text: "Stillness is not the absence of movement; it is the presence of awareness." },
    { id: "mindful_014", category: "Mindful Clarity", text: "You are allowed to slow down even when you feel behind." },
    { id: "mindful_015", category: "Mindful Clarity", text: "Awareness is the first step toward freedom." },
    { id: "mindful_016", category: "Mindful Clarity", text: "Notice how much suffering disappears when you stop arguing with reality." },
    { id: "mindful_017", category: "Mindful Clarity", text: "You do not need to master the moment; you only need to meet it." },
    { id: "mindful_018", category: "Mindful Clarity", text: "Let each inhale remind you that you are alive; let each exhale remind you to let go." },
    { id: "mindful_019", category: "Mindful Clarity", text: "Clarity grows when you stop chasing and start listening." },
    { id: "mindful_020", category: "Mindful Clarity", text: "You can observe your emotions without becoming their servant." },
    { id: "mindful_021", category: "Mindful Clarity", text: "The moment you notice your mind has wandered is the moment you have awakened." },
    { id: "mindful_022", category: "Mindful Clarity", text: "Rest in the simplicity of the present; it is lighter than the stories you add to it." },
    { id: "mindful_023", category: "Mindful Clarity", text: "Awareness is compassion's first breath." },
    { id: "mindful_024", category: "Mindful Clarity", text: "When the mind becomes gentle, the heart becomes clear." },
    { id: "mindful_025", category: "Mindful Clarity", text: "Do not fight your thoughts; learn to bow to them lightly." },
    { id: "mindful_026", category: "Mindful Clarity", text: "A clear mind begins with a single honest breath." },
    { id: "mindful_027", category: "Mindful Clarity", text: "Let presence become your default, not your escape." },
    { id: "mindful_028", category: "Mindful Clarity", text: "The world becomes quieter the moment you stop demanding it to be different." },
    { id: "mindful_029", category: "Mindful Clarity", text: "You cannot hold tension and clarity at the same time—choose one." },
    { id: "mindful_030", category: "Mindful Clarity", text: "Return to now; it has been waiting patiently for you." },
    { id: "mindful_031", category: "Mindful Clarity", text: "You do not need to think less; you need to cling less." },
    { id: "mindful_032", category: "Mindful Clarity", text: "Observe without concluding. Witness without reacting." },
    { id: "mindful_033", category: "Mindful Clarity", text: "Let the mind soften like warm wax; clarity will take the shape of truth." },
    { id: "mindful_034", category: "Mindful Clarity", text: "Be where your hands are." },
    { id: "mindful_035", category: "Mindful Clarity", text: "Your breath is a sanctuary disguised as something ordinary." },
    { id: "mindful_036", category: "Mindful Clarity", text: "Mindfulness is remembering that you are not your thoughts." },
    { id: "mindful_037", category: "Mindful Clarity", text: "Calmness is not a mood—it is a skill." },
    { id: "mindful_038", category: "Mindful Clarity", text: "Your presence is the medicine your mind has been seeking." },
    { id: "mindful_039", category: "Mindful Clarity", text: "Let each moment arrive without needing to impress you." },
    { id: "mindful_040", category: "Mindful Clarity", text: "Inner peace begins the moment you stop needing to be somewhere else." },
    { id: "mindful_041", category: "Mindful Clarity", text: "Release the urge to fix everything; some things just need space." },
    { id: "mindful_042", category: "Mindful Clarity", text: "Witness your pain like a cloud: present, shifting, temporary." },
    { id: "mindful_043", category: "Mindful Clarity", text: "Each mindful breath is a step back into your own soul." },
    { id: "mindful_044", category: "Mindful Clarity", text: "Pause long enough to hear what your life is trying to tell you." },
    { id: "mindful_045", category: "Mindful Clarity", text: "Clarity comes when you stop forcing conclusions." },
    { id: "mindful_046", category: "Mindful Clarity", text: "Let your breath be the bridge between chaos and calm." },
    { id: "mindful_047", category: "Mindful Clarity", text: "True awareness is gentle, never harsh." },
    { id: "mindful_048", category: "Mindful Clarity", text: "Your mind is not a battlefield; it is a garden waiting for attention." },
    { id: "mindful_049", category: "Mindful Clarity", text: "Notice what you are noticing." },
    { id: "mindful_050", category: "Mindful Clarity", text: "You can start your entire life over with one deep breath." },
    { id: "mindful_051", category: "Mindful Clarity", text: "Let the moment unfold without needing to predict its ending." },
    { id: "mindful_052", category: "Mindful Clarity", text: "Your awareness is stronger than your patterns." },
    { id: "mindful_053", category: "Mindful Clarity", text: "Simplicity is the doorway to clarity." },
    { id: "mindful_054", category: "Mindful Clarity", text: "Return to your breath, and you return to yourself." },
    { id: "mindful_055", category: "Mindful Clarity", text: "Let go of the urge to rush into the next moment; this one matters too." },
    { id: "mindful_056", category: "Mindful Clarity", text: "Listen to the silence between your thoughts—it has something to say." },
    { id: "mindful_057", category: "Mindful Clarity", text: "You do not need to feel peaceful to practice peace." },
    { id: "mindful_058", category: "Mindful Clarity", text: "Your noticing is enough. You do not need to improve every moment." },
    { id: "mindful_059", category: "Mindful Clarity", text: "Let the mind settle into the heart." },
    { id: "mindful_060", category: "Mindful Clarity", text: "Do only one thing at a time—and give it your whole presence." },
    { id: "mindful_061", category: "Mindful Clarity", text: "You can stop running and still keep growing." },
    { id: "mindful_062", category: "Mindful Clarity", text: "Awareness transforms pain into understanding." },
    { id: "mindful_063", category: "Mindful Clarity", text: "Your breath teaches you that letting go is natural." },
    { id: "mindful_064", category: "Mindful Clarity", text: "Do not solve the moment; experience it." },
    { id: "mindful_065", category: "Mindful Clarity", text: "Your presence is enough to change the energy of a room." },
    { id: "mindful_066", category: "Mindful Clarity", text: "Stop trying to control your thoughts; start changing your relationship to them." },
    { id: "mindful_067", category: "Mindful Clarity", text: "You are not running out of time—you are running out of attention." },
    { id: "mindful_068", category: "Mindful Clarity", text: "Let each moment be exactly what it is before you try to shape it." },
    { id: "mindful_069", category: "Mindful Clarity", text: "Every mindful moment is a vote for the life you want." },
    { id: "mindful_070", category: "Mindful Clarity", text: "Quiet the world inside, and the world outside loses its power over you." },
    { id: "mindful_071", category: "Mindful Clarity", text: "Your breath is a compass—follow it home." },
    { id: "mindful_072", category: "Mindful Clarity", text: "When doubt rises, breathe until you can hear yourself again." },
    { id: "mindful_073", category: "Mindful Clarity", text: "Clarity is not found in forcing answers but in listening deeply." },
    { id: "mindful_074", category: "Mindful Clarity", text: "Be present with what is, not what you fear might be." },
    { id: "mindful_075", category: "Mindful Clarity", text: "The moment you notice your breath, you have returned to your power." },
    { id: "mindful_076", category: "Mindful Clarity", text: "Awareness softens suffering." },
    { id: "mindful_077", category: "Mindful Clarity", text: "Do not hurry your healing; clarity grows slowly like dawn." },
    { id: "mindful_078", category: "Mindful Clarity", text: "Look closely enough, and every moment contains its own miracle." },
    { id: "mindful_079", category: "Mindful Clarity", text: "Your body whispers before it screams—listen early." },
    { id: "mindful_080", category: "Mindful Clarity", text: "Let your exhale teach you the art of surrender." },
    { id: "mindful_081", category: "Mindful Clarity", text: "You do not need to escape your mind—you need to befriend it." },
    { id: "mindful_082", category: "Mindful Clarity", text: "Even one mindful breath can interrupt a lifetime of reactivity." },
    { id: "mindful_083", category: "Mindful Clarity", text: "Clarity begins when resistance ends." },
    { id: "mindful_084", category: "Mindful Clarity", text: "Spend time with your breath as you would with a beloved companion." },
    { id: "mindful_085", category: "Mindful Clarity", text: "Your awareness is the sky; your thoughts are the weather." },
    { id: "mindful_086", category: "Mindful Clarity", text: "You are not behind; you are exactly where awakening begins." },
    { id: "mindful_087", category: "Mindful Clarity", text: "Release the need to fix the moment. Just breathe it." },
    { id: "mindful_088", category: "Mindful Clarity", text: "When you slow down, life reveals its hidden layers." },
    { id: "mindful_089", category: "Mindful Clarity", text: "Notice what your mind returns to when it is quiet; that is where your heart is." },
    { id: "mindful_090", category: "Mindful Clarity", text: "Clarity is born in silence, not effort." },
    { id: "mindful_091", category: "Mindful Clarity", text: "Sit with yourself long enough and you will meet the truth beneath your noise." },
    { id: "mindful_092", category: "Mindful Clarity", text: "A mind in the present cannot be overwhelmed." },
    { id: "mindful_093", category: "Mindful Clarity", text: "Return to your breath—not because you failed, but because you remembered." },
    { id: "mindful_094", category: "Mindful Clarity", text: "Let your thoughts float like leaves downstream." },
    { id: "mindful_095", category: "Mindful Clarity", text: "Peace is not discovered; it is uncovered." },
    { id: "mindful_096", category: "Mindful Clarity", text: "Awareness is gentle observation without judgment." },
    { id: "mindful_097", category: "Mindful Clarity", text: "Let each inhale be a beginning, and each exhale be a release." },
    { id: "mindful_098", category: "Mindful Clarity", text: "Your true home is the present moment." },
    { id: "mindful_099", category: "Mindful Clarity", text: "Listen with your heart, not your habits." },
    { id: "mindful_100", category: "Mindful Clarity", text: "Be curious rather than critical of your inner world." },
    { id: "mindful_101", category: "Mindful Clarity", text: "You can step out of the storm by stepping into awareness." },
    { id: "mindful_102", category: "Mindful Clarity", text: "Mindfulness is remembering what matters most." },
    { id: "mindful_103", category: "Mindful Clarity", text: "Calm is contagious; bring it with you." },
    { id: "mindful_104", category: "Mindful Clarity", text: "Let your breath steady your thoughts like hands steady a flame." },
    { id: "mindful_105", category: "Mindful Clarity", text: "You can rest your mind the way you rest your body." },
    { id: "mindful_106", category: "Mindful Clarity", text: "Awareness is the beginning of every transformation." },
    { id: "mindful_107", category: "Mindful Clarity", text: "Your breath is a teacher that never raises its voice." },
    { id: "mindful_108", category: "Mindful Clarity", text: "Where awareness goes, peace follows." },
  ];

  quoteForge.loadStockPack("Mindful Clarity", mindfulClarityQuotes);
}

/**
 * Load Stock Pack #5: Sovereign Discipline (108 quotes)
 */
export function loadSovereignDiscipline(): void {
  const sovereignDisciplineQuotes = [
    { id: "discipline_001", category: "Sovereign Discipline", text: "Discipline is choosing what you want most over what you want now." },
    { id: "discipline_002", category: "Sovereign Discipline", text: "You don't rise to your goals; you fall to your systems." },
    { id: "discipline_003", category: "Sovereign Discipline", text: "Small daily victories become lifelong transformation." },
    { id: "discipline_004", category: "Sovereign Discipline", text: "Consistency beats intensity when intensity quits." },
    { id: "discipline_005", category: "Sovereign Discipline", text: "Your habits are the architects of your destiny." },
    { id: "discipline_006", category: "Sovereign Discipline", text: "Self-control is a form of power that needs no witnesses." },
    { id: "discipline_007", category: "Sovereign Discipline", text: "The disciplined soul becomes unstoppable by accident." },
    { id: "discipline_008", category: "Sovereign Discipline", text: "Mastery is doing it even when the mood has died." },
    { id: "discipline_009", category: "Sovereign Discipline", text: "Your future strength is hiding inside today's small effort." },
    { id: "discipline_010", category: "Sovereign Discipline", text: "When you learn to command yourself, no one else can." },
    { id: "discipline_011", category: "Sovereign Discipline", text: "Discipline is the quietest form of respect you can give yourself." },
    { id: "discipline_012", category: "Sovereign Discipline", text: "You can be talented and lose, but disciplined and never defeated." },
    { id: "discipline_013", category: "Sovereign Discipline", text: "The hardest part is starting; the noble part is continuing." },
    { id: "discipline_014", category: "Sovereign Discipline", text: "Do the work before the excuses learn your name." },
    { id: "discipline_015", category: "Sovereign Discipline", text: "Your mind will resist. Your spirit will insist." },
    { id: "discipline_016", category: "Sovereign Discipline", text: "Routine is the temple where greatness is worshiped." },
    { id: "discipline_017", category: "Sovereign Discipline", text: "The version of you you're praying to become is waiting for you at the end of consistency." },
    { id: "discipline_018", category: "Sovereign Discipline", text: "Discipline is the art of honoring commitments to your future self." },
    { id: "discipline_019", category: "Sovereign Discipline", text: "Show up especially when you don't want to—that's the forge of self-respect." },
    { id: "discipline_020", category: "Sovereign Discipline", text: "Even a slow runner outruns the one still sitting." },
    { id: "discipline_021", category: "Sovereign Discipline", text: "Your discipline is a shield against your lesser impulses." },
    { id: "discipline_022", category: "Sovereign Discipline", text: "Build the habits that make quitting inconvenient." },
    { id: "discipline_023", category: "Sovereign Discipline", text: "Delay the impulse, strengthen the will." },
    { id: "discipline_024", category: "Sovereign Discipline", text: "Your dream requires a version of you that you have not met yet—discipline is the bridge." },
    { id: "discipline_025", category: "Sovereign Discipline", text: "The grind is holy when the intention is pure." },
    { id: "discipline_026", category: "Sovereign Discipline", text: "Skipping a day is more dangerous than failing a day." },
    { id: "discipline_027", category: "Sovereign Discipline", text: "Motivation is noisy; discipline is eternal." },
    { id: "discipline_028", category: "Sovereign Discipline", text: "If you can't trust your own word, who else will?" },
    { id: "discipline_029", category: "Sovereign Discipline", text: "Aim for progress, not passion." },
    { id: "discipline_030", category: "Sovereign Discipline", text: "Your rituals carve the throne your future sits upon." },
    { id: "discipline_031", category: "Sovereign Discipline", text: "Remove the choice; make the action inevitable." },
    { id: "discipline_032", category: "Sovereign Discipline", text: "Self-mastery begins when self-pity ends." },
    { id: "discipline_033", category: "Sovereign Discipline", text: "The disciplined path is narrow, but it leads to vastness." },
    { id: "discipline_034", category: "Sovereign Discipline", text: "Be loyal to the future you see when you're at your strongest." },
    { id: "discipline_035", category: "Sovereign Discipline", text: "Momentum is a divine ally—build it daily." },
    { id: "discipline_036", category: "Sovereign Discipline", text: "Your effort is a seed; your consistency is the sun." },
    { id: "discipline_037", category: "Sovereign Discipline", text: "A disciplined mind creates a liberated life." },
    { id: "discipline_038", category: "Sovereign Discipline", text: "Comfort is sweet; discipline is sovereign." },
    { id: "discipline_039", category: "Sovereign Discipline", text: "You are either training your habits or your habits are training you." },
    { id: "discipline_040", category: "Sovereign Discipline", text: "Keep the promise. Let the promise keep you." },
    { id: "discipline_041", category: "Sovereign Discipline", text: "Every repetition is a vote for who you want to become." },
    { id: "discipline_042", category: "Sovereign Discipline", text: "You cannot control the outcome, but you control the reps." },
    { id: "discipline_043", category: "Sovereign Discipline", text: "Winner and quitter are separated by one more try." },
    { id: "discipline_044", category: "Sovereign Discipline", text: "Your excuses will always feel true—ignore them anyway." },
    { id: "discipline_045", category: "Sovereign Discipline", text: "Master the basics until the basics are extraordinary." },
    { id: "discipline_046", category: "Sovereign Discipline", text: "The disciplined man walks a lonely path that later becomes crowded with admirers." },
    { id: "discipline_047", category: "Sovereign Discipline", text: "You cannot skip the days that shape you." },
    { id: "discipline_048", category: "Sovereign Discipline", text: "Discipline is not punishment; it is alignment." },
    { id: "discipline_049", category: "Sovereign Discipline", text: "The work you avoid today becomes the regret you meet tomorrow." },
    { id: "discipline_050", category: "Sovereign Discipline", text: "Wield your habits like a sword." },
    { id: "discipline_051", category: "Sovereign Discipline", text: "Freedom belongs to the disciplined." },
    { id: "discipline_052", category: "Sovereign Discipline", text: "Nothing changes if nothing repeats." },
    { id: "discipline_053", category: "Sovereign Discipline", text: "Do hard things while they are still small." },
    { id: "discipline_054", category: "Sovereign Discipline", text: "Your courage shows up when comfort steps aside." },
    { id: "discipline_055", category: "Sovereign Discipline", text: "Build discipline like a muscle—tear, mend, strengthen." },
    { id: "discipline_056", category: "Sovereign Discipline", text: "Respect the grind—your future self is watching." },
    { id: "discipline_057", category: "Sovereign Discipline", text: "Nothing is stronger than a mind that obeys its highest intention." },
    { id: "discipline_058", category: "Sovereign Discipline", text: "Set the standard and rise to meet it." },
    { id: "discipline_059", category: "Sovereign Discipline", text: "The price of discipline is small; the price of regret is infinite." },
    { id: "discipline_060", category: "Sovereign Discipline", text: "You don't need more time; you need more discipline." },
    { id: "discipline_061", category: "Sovereign Discipline", text: "A disciplined day is a quiet triumph." },
    { id: "discipline_062", category: "Sovereign Discipline", text: "Improve the routine, improve the life." },
    { id: "discipline_063", category: "Sovereign Discipline", text: "Your rituals should serve your royalty." },
    { id: "discipline_064", category: "Sovereign Discipline", text: "To master anything, master showing up." },
    { id: "discipline_065", category: "Sovereign Discipline", text: "Be the one who follows through." },
    { id: "discipline_066", category: "Sovereign Discipline", text: "Turn consistency into your superpower." },
    { id: "discipline_067", category: "Sovereign Discipline", text: "The throne of discipline is built from ordinary days." },
    { id: "discipline_068", category: "Sovereign Discipline", text: "Protect the routine that protects your mind." },
    { id: "discipline_069", category: "Sovereign Discipline", text: "Your strength grows in silence." },
    { id: "discipline_070", category: "Sovereign Discipline", text: "Make your discipline louder than your doubts." },
    { id: "discipline_071", category: "Sovereign Discipline", text: "A disciplined life is a declaration of sovereignty." },
    { id: "discipline_072", category: "Sovereign Discipline", text: "Sacrifice what weakens you." },
    { id: "discipline_073", category: "Sovereign Discipline", text: "One disciplined hour can overpower a wasted day." },
    { id: "discipline_074", category: "Sovereign Discipline", text: "Self-mastery feels like restriction until it feels like liberation." },
    { id: "discipline_075", category: "Sovereign Discipline", text: "Let consistency become the rhythm of your greatness." },
    { id: "discipline_076", category: "Sovereign Discipline", text: "Train your habits until they train you." },
    { id: "discipline_077", category: "Sovereign Discipline", text: "A disciplined day protects a wandering mind." },
    { id: "discipline_078", category: "Sovereign Discipline", text: "Don't negotiate with laziness—command it." },
    { id: "discipline_079", category: "Sovereign Discipline", text: "Your dignity rises when your discipline rises." },
    { id: "discipline_080", category: "Sovereign Discipline", text: "Build a life that requires a strong version of you." },
    { id: "discipline_081", category: "Sovereign Discipline", text: "Write your standards in stone, not emotion." },
    { id: "discipline_082", category: "Sovereign Discipline", text: "The more disciplined you are, the less permission you need." },
    { id: "discipline_083", category: "Sovereign Discipline", text: "Resist the easy path; it is a thief of potential." },
    { id: "discipline_084", category: "Sovereign Discipline", text: "Be the executor of your vision, not just its dreamer." },
    { id: "discipline_085", category: "Sovereign Discipline", text: "The small disciplines count more than the major declarations." },
    { id: "discipline_086", category: "Sovereign Discipline", text: "Success is the shadow of discipline." },
    { id: "discipline_087", category: "Sovereign Discipline", text: "Your habits are the prophecy of your future." },
    { id: "discipline_088", category: "Sovereign Discipline", text: "Accountability is freedom disguised as responsibility." },
    { id: "discipline_089", category: "Sovereign Discipline", text: "Strong habits make strong men." },
    { id: "discipline_090", category: "Sovereign Discipline", text: "Do it because you said you would." },
    { id: "discipline_091", category: "Sovereign Discipline", text: "Your discipline is your silent oath to yourself." },
    { id: "discipline_092", category: "Sovereign Discipline", text: "When you master discipline, you master destiny." },
    { id: "discipline_093", category: "Sovereign Discipline", text: "Let the difficulty refine you, not define you." },
    { id: "discipline_094", category: "Sovereign Discipline", text: "Focus on the process—results will kneel." },
    { id: "discipline_095", category: "Sovereign Discipline", text: "The throne of self-mastery is built from completed days." },
    { id: "discipline_096", category: "Sovereign Discipline", text: "Win the morning, win the mind." },
    { id: "discipline_097", category: "Sovereign Discipline", text: "In the war between impulse and discipline, choose the king." },
    { id: "discipline_098", category: "Sovereign Discipline", text: "Your legacy is written in the hours no one sees." },
    { id: "discipline_099", category: "Sovereign Discipline", text: "Master your mood; your mood has mastered you long enough." },
    { id: "discipline_100", category: "Sovereign Discipline", text: "Let your actions disciple your desires." },
    { id: "discipline_101", category: "Sovereign Discipline", text: "Time bends for the disciplined." },
    { id: "discipline_102", category: "Sovereign Discipline", text: "Order your day or your day will disorder you." },
    { id: "discipline_103", category: "Sovereign Discipline", text: "The disciplined do today what the undisciplined postpone forever." },
    { id: "discipline_104", category: "Sovereign Discipline", text: "Consistency creates a gravity that pulls success toward you." },
    { id: "discipline_105", category: "Sovereign Discipline", text: "Greatness bows to the disciplined." },
    { id: "discipline_106", category: "Sovereign Discipline", text: "Let your commitment be louder than your comfort." },
    { id: "discipline_107", category: "Sovereign Discipline", text: "Self-discipline is self-love in armor." },
    { id: "discipline_108", category: "Sovereign Discipline", text: "Honor the grind; it is sculpting your tomorrow." },
  ];

  quoteForge.loadStockPack("Sovereign Discipline", sovereignDisciplineQuotes);
}

/**
 * Load Stock Pack #6: Zen Focus (108 quotes)
 */
export function loadZenFocus(): void {
  const zenFocusQuotes = [
    { id: "zen_001", category: "Zen Focus", text: "Where attention goes, your entire life quietly follows." },
    { id: "zen_002", category: "Zen Focus", text: "A scattered mind cannot see the door that is already open." },
    { id: "zen_003", category: "Zen Focus", text: "Clarity begins when noise ends." },
    { id: "zen_004", category: "Zen Focus", text: "One breath of awareness is stronger than an hour of distraction." },
    { id: "zen_005", category: "Zen Focus", text: "Be where your feet are; the present moment is your strongest ally." },
    { id: "zen_006", category: "Zen Focus", text: "Focus is a sanctuary you build inside your own mind." },
    { id: "zen_007", category: "Zen Focus", text: "Nothing is ever clearer than the moment you finally stop rushing." },
    { id: "zen_008", category: "Zen Focus", text: "Your attention is sacred—give it only to what matters." },
    { id: "zen_009", category: "Zen Focus", text: "Silence is not empty; it is full of answers." },
    { id: "zen_010", category: "Zen Focus", text: "You don't need more time; you need less distraction." },
    { id: "zen_011", category: "Zen Focus", text: "A calm mind reacts to nothing and responds to everything." },
    { id: "zen_012", category: "Zen Focus", text: "When you slow down inside, the whole world slows with you." },
    { id: "zen_013", category: "Zen Focus", text: "Your mind becomes your master when you stop chasing every thought." },
    { id: "zen_014", category: "Zen Focus", text: "Focus is a blade—sharp enough to cut through the impossible." },
    { id: "zen_015", category: "Zen Focus", text: "Detach from excess, and clarity will attach to you." },
    { id: "zen_016", category: "Zen Focus", text: "Peace comes when you stop arguing with reality." },
    { id: "zen_017", category: "Zen Focus", text: "Your breath is always a portal back to yourself." },
    { id: "zen_018", category: "Zen Focus", text: "You cannot be overwhelmed by a moment you are fully present in." },
    { id: "zen_019", category: "Zen Focus", text: "Clarity is not found by thinking more, but by thinking less." },
    { id: "zen_020", category: "Zen Focus", text: "Stillness is the highest form of intelligence." },
    { id: "zen_021", category: "Zen Focus", text: "When the mind quiets, the path appears." },
    { id: "zen_022", category: "Zen Focus", text: "Your awareness is the seat of your power." },
    { id: "zen_023", category: "Zen Focus", text: "Let thoughts pass like clouds—observe, don't cling." },
    { id: "zen_024", category: "Zen Focus", text: "One moment of true focus replaces hours of scattered effort." },
    { id: "zen_025", category: "Zen Focus", text: "Solitude resets the compass of the soul." },
    { id: "zen_026", category: "Zen Focus", text: "A mind anchored in the present cannot drown in chaos." },
    { id: "zen_027", category: "Zen Focus", text: "The quieter you become, the more you can hear." },
    { id: "zen_028", category: "Zen Focus", text: "Focus is not force—it is the release of everything unnecessary." },
    { id: "zen_029", category: "Zen Focus", text: "Your attention creates the world you live in." },
    { id: "zen_030", category: "Zen Focus", text: "Observe the mind without becoming the mind." },
    { id: "zen_031", category: "Zen Focus", text: "A single clear intention outperforms a thousand half-hearted ones." },
    { id: "zen_032", category: "Zen Focus", text: "Return to the breath whenever life begins to scatter you." },
    { id: "zen_033", category: "Zen Focus", text: "An unfocused mind exhausts itself quickly." },
    { id: "zen_034", category: "Zen Focus", text: "Clarity enters when judgment leaves." },
    { id: "zen_035", category: "Zen Focus", text: "The present moment is a teacher disguised as now." },
    { id: "zen_036", category: "Zen Focus", text: "Be clear, not busy." },
    { id: "zen_037", category: "Zen Focus", text: "Nothing strengthens concentration like removing what weakens it." },
    { id: "zen_038", category: "Zen Focus", text: "A wandering mind finds chaos; a centered mind finds peace." },
    { id: "zen_039", category: "Zen Focus", text: "Do not chase thoughts; let them travel without your energy." },
    { id: "zen_040", category: "Zen Focus", text: "Master the moment, and the moment will master the world for you." },
    { id: "zen_041", category: "Zen Focus", text: "Wisdom grows in silence, not noise." },
    { id: "zen_042", category: "Zen Focus", text: "Cut distractions without apology." },
    { id: "zen_043", category: "Zen Focus", text: "When you focus deeply, even time bows." },
    { id: "zen_044", category: "Zen Focus", text: "Let your awareness be wider than your worries." },
    { id: "zen_045", category: "Zen Focus", text: "The ability to pause is the beginning of mastery." },
    { id: "zen_046", category: "Zen Focus", text: "Your mind becomes sharp when your environment becomes simple." },
    { id: "zen_047", category: "Zen Focus", text: "Train your awareness like a warrior trains the blade." },
    { id: "zen_048", category: "Zen Focus", text: "Presence is the highest form of strength." },
    { id: "zen_049", category: "Zen Focus", text: "Let go of what you cannot carry with a clear mind." },
    { id: "zen_050", category: "Zen Focus", text: "A single focused hour can rearrange an entire life." },
    { id: "zen_051", category: "Zen Focus", text: "When the mind stops arguing, the heart can begin speaking." },
    { id: "zen_052", category: "Zen Focus", text: "Do one thing with your whole being—watch the universe respond." },
    { id: "zen_053", category: "Zen Focus", text: "Clarity loves an uncluttered mind." },
    { id: "zen_054", category: "Zen Focus", text: "Do not hurry; move like a mountain walks—slow and unstoppable." },
    { id: "zen_055", category: "Zen Focus", text: "A focused mind becomes a force of nature." },
    { id: "zen_056", category: "Zen Focus", text: "You reclaim power every time you reclaim your attention." },
    { id: "zen_057", category: "Zen Focus", text: "Don't react—observe. Reaction is instinct, observation is mastery." },
    { id: "zen_058", category: "Zen Focus", text: "Thoughts are visitors; awareness is the home." },
    { id: "zen_059", category: "Zen Focus", text: "Worry fades when presence grows." },
    { id: "zen_060", category: "Zen Focus", text: "A clear mind sees opportunities blurred minds miss." },
    { id: "zen_061", category: "Zen Focus", text: "Your inner silence is more powerful than outer noise." },
    { id: "zen_062", category: "Zen Focus", text: "Let awareness become the sun inside your mind." },
    { id: "zen_063", category: "Zen Focus", text: "The less you cling, the more you see." },
    { id: "zen_064", category: "Zen Focus", text: "When your mind settles, your soul remembers." },
    { id: "zen_065", category: "Zen Focus", text: "Moment by moment, clarity is crafted." },
    { id: "zen_066", category: "Zen Focus", text: "The mind sharpens when the heart softens." },
    { id: "zen_067", category: "Zen Focus", text: "Bring your awareness back gently, again and again." },
    { id: "zen_068", category: "Zen Focus", text: "Focus is choosing one thing over a thousand open doors." },
    { id: "zen_069", category: "Zen Focus", text: "Be witness, not prisoner, to your thoughts." },
    { id: "zen_070", category: "Zen Focus", text: "Let breathing be the medicine that recalibrates you." },
    { id: "zen_071", category: "Zen Focus", text: "Your awareness is a mirror—keep it clean." },
    { id: "zen_072", category: "Zen Focus", text: "The mind learns focus the way a tree learns light: slowly and consistently." },
    { id: "zen_073", category: "Zen Focus", text: "Be here now—that is the whole secret." },
    { id: "zen_074", category: "Zen Focus", text: "To see clearly, step away from the noise." },
    { id: "zen_075", category: "Zen Focus", text: "Patience is the breath of clarity." },
    { id: "zen_076", category: "Zen Focus", text: "Awareness is freedom from the autopilot of your mind." },
    { id: "zen_077", category: "Zen Focus", text: "Inner focus is the foundation of outer power." },
    { id: "zen_078", category: "Zen Focus", text: "Let presence be your dwelling place, not a rare vacation." },
    { id: "zen_079", category: "Zen Focus", text: "Nothing calms the storm like watching it instead of joining it." },
    { id: "zen_080", category: "Zen Focus", text: "Stillness sharpens perception like a whetstone sharpens steel." },
    { id: "zen_081", category: "Zen Focus", text: "A focused mind unlocks doors the unfocused mind never notices." },
    { id: "zen_082", category: "Zen Focus", text: "Detach from urgency to return to accuracy." },
    { id: "zen_083", category: "Zen Focus", text: "Your presence is your most valuable currency." },
    { id: "zen_084", category: "Zen Focus", text: "A gentle awareness is stronger than aggressive force." },
    { id: "zen_085", category: "Zen Focus", text: "Let clarity rise like the morning sun—soft but unstoppable." },
    { id: "zen_086", category: "Zen Focus", text: "The mind expands when it stops contracting around fear." },
    { id: "zen_087", category: "Zen Focus", text: "Return to the breath: your reset button is always within reach." },
    { id: "zen_088", category: "Zen Focus", text: "Simplicity is clarity wearing a crown." },
    { id: "zen_089", category: "Zen Focus", text: "You cannot focus on everything; focus on what aligns with your soul." },
    { id: "zen_090", category: "Zen Focus", text: "Relax the body, and the mind will follow." },
    { id: "zen_091", category: "Zen Focus", text: "When you anchor in the moment, doubt loses its grip." },
    { id: "zen_092", category: "Zen Focus", text: "Clarity comes not from thinking harder but from seeing simpler." },
    { id: "zen_093", category: "Zen Focus", text: "You can handle anything as long as you handle one moment at a time." },
    { id: "zen_094", category: "Zen Focus", text: "Observe your thoughts like leaves on a river—passing, not permanent." },
    { id: "zen_095", category: "Zen Focus", text: "Presence is the art of being fully where your soul already is." },
    { id: "zen_096", category: "Zen Focus", text: "A quiet mind sees truth in high resolution." },
    { id: "zen_097", category: "Zen Focus", text: "Focus is devotion to the moment in front of you." },
    { id: "zen_098", category: "Zen Focus", text: "When you learn to pause, you learn to lead yourself." },
    { id: "zen_099", category: "Zen Focus", text: "Awareness transforms time from frantic to spacious." },
    { id: "zen_100", category: "Zen Focus", text: "The mind clears when the heart exhales." },
    { id: "zen_101", category: "Zen Focus", text: "Presence is the doorway to your highest intelligence." },
    { id: "zen_102", category: "Zen Focus", text: "Focus is liberation from the thousand things that do not matter." },
    { id: "zen_103", category: "Zen Focus", text: "When you simplify your attention, your life simplifies too." },
    { id: "zen_104", category: "Zen Focus", text: "Breathe deep—your mind listens to your lungs." },
    { id: "zen_105", category: "Zen Focus", text: "A focused day is a blessing to every future version of you." },
    { id: "zen_106", category: "Zen Focus", text: "You don't need to control thoughts—just stop feeding them." },
    { id: "zen_107", category: "Zen Focus", text: "Stillness turns confusion into understanding." },
    { id: "zen_108", category: "Zen Focus", text: "When you master your attention, you master your reality." },
  ];

  quoteForge.loadStockPack("Zen Focus", zenFocusQuotes);
}
