export interface ForgeQuote {
  id: string;
  fileId: string;
  fileName: string;
  text: string;
  index: number;
  length: number;
}

export class ForgeRandomEngine {
  private queue: ForgeQuote[] = [];
  private lastQuoteId: string | null = null;

  constructor(initialQuotes: ForgeQuote[] = []) {
    if (initialQuotes.length > 0) {
      this.rebuildQueue(initialQuotes);
    }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  public rebuildQueue(allQuotes: ForgeQuote[]) {
    if (!allQuotes || allQuotes.length === 0) {
      this.queue = [];
      this.lastQuoteId = null;
      return;
    }

    const shuffled = this.shuffleArray(allQuotes);
    if (this.lastQuoteId && shuffled.length > 1 && shuffled[0].id === this.lastQuoteId) {
      const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
      [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
    }

    this.queue = shuffled;
  }

  public getNextQuote(): ForgeQuote | null {
    if (this.queue.length === 0) {
      return null;
    }

    const next = this.queue.shift()!;
    this.lastQuoteId = next.id;
    return next;
  }

  public hasQuotes(): boolean {
    return this.queue.length > 0;
  }
}
