/**
 * THE QUOTE FORGE - SYSTEM LOGIC ENGINE
 * 
 * Global quote management system for VerseForge app.
 * Provides stock quote packs and a stable randomizer.
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
    const categories = Array.from(this.stockPacks.keys());
    if (categories.length === 0) {
      console.log("[QuoteForge] No stock packs loaded");
      return null;
    }

    const allQuotes: StockQuote[] = [];
    categories.forEach(cat => {
      const pack = this.stockPacks.get(cat);
      if (pack) {
        allQuotes.push(...pack);
      }
    });

    if (allQuotes.length === 0) {
      console.log("[QuoteForge] No quotes available in stock packs");
      return null;
    }

    const index = Math.floor(Math.random() * allQuotes.length);
    const quote = allQuotes[index];
    
    console.log("[QuoteForge] Selected quote from:", quote.category);
    return quote;
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
