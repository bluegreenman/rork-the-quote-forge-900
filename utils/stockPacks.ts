import type { ForgeQuote } from "./forgeRandomEngine";

export type StockQuote = {
  id: string;
  category: string;
  text: string;
};

export const STOCK_PACKS: StockQuote[] = [
  // 🔻 NEW PACKS WILL BE APPENDED HERE IN FUTURE PROMPTS 🔻
  // Example for later:
  // ...radiantResolveQuotes,
  // ...gritAndGloryQuotes,
];

export function getStockQuotesForForge(): ForgeQuote[] {
  return STOCK_PACKS.map((q) => ({
    id: `stock:${q.id}`,
    fileId: `stock:${q.category}`,
    fileName: q.category,
    text: q.text.trim(),
    index: 0,
    length: q.text.trim().length,
  }));
}
