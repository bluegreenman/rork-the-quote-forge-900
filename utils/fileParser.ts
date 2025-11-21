import * as DocumentPicker from "expo-document-picker";
import { Quote } from "../types/game";

export async function pickAndParseTextFile(): Promise<{
  quotes: Quote[];
  fileName: string;
} | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "text/plain",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    console.log("Selected file:", file.name);

    const response = await fetch(file.uri);
    const text = await response.text();

    console.log("File loaded, parsing quotes...");
    
    const quotes = parseTextIntoQuotes(text, file.name);
    console.log(`Parsed ${quotes.length} quotes from ${file.name}`);

    return {
      quotes,
      fileName: file.name,
    };
  } catch (error) {
    console.error("Error picking/parsing file:", error);
    return null;
  }
}

const MIN_QUOTE_CHARS = 40;
const MAX_QUOTE_CHARS = 400;
const MIN_SENTENCE_CHARS = 15;

function normalizeText(text: string): string {
  let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  normalized = normalized.replace(/([^\n])\n([^\n])/g, "$1 $2");
  
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  
  return normalized.trim();
}

function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  
  const sentenceEndings = /[.!?]+/;
  const parts = text.split(sentenceEndings);
  
  let currentSentence = "";
  const matches = text.match(/[.!?]+/g) || [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    const ending = matches[i] || "";
    
    if (part.length === 0) continue;
    
    currentSentence = (part + ending).trim();
    
    if (currentSentence.length >= MIN_SENTENCE_CHARS) {
      sentences.push(currentSentence);
      currentSentence = "";
    }
  }
  
  if (currentSentence.length >= MIN_SENTENCE_CHARS) {
    sentences.push(currentSentence);
  }
  
  if (sentences.length === 0) {
    const lines = text.split(/[\r\n]+/);
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.length >= MIN_SENTENCE_CHARS) {
        sentences.push(trimmed);
      }
    }
  }
  
  console.log(`Split into ${sentences.length} sentences, samples:`, sentences.slice(0, 3).map(s => s.substring(0, 50) + '...'));
  
  return sentences;
}

function buildQuoteChunks(sentences: string[]): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    
    if (sentence.length === 0) continue;
    
    if (currentChunk.length === 0) {
      currentChunk = sentence;
    } else {
      const testChunk = currentChunk + " " + sentence;
      
      if (testChunk.length <= MAX_QUOTE_CHARS) {
        currentChunk = testChunk;
      } else {
        if (currentChunk.length >= MIN_QUOTE_CHARS) {
          chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk = testChunk;
        }
      }
    }
  }
  
  if (currentChunk.length >= MIN_QUOTE_CHARS) {
    chunks.push(currentChunk);
  }
  
  console.log(`Built ${chunks.length} quote chunks from ${sentences.length} sentences`);
  console.log(`Sample quotes:`);
  chunks.slice(0, 3).forEach((chunk, idx) => {
    console.log(`  [${idx}] ${chunk.substring(0, 80)}... (${chunk.length} chars)`);
  });
  
  return chunks;
}

function parseTextIntoQuotes(text: string, fileName: string): Quote[] {
  const quotes: Quote[] = [];
  
  try {
    const normalized = normalizeText(text);
    
    const paragraphs = normalized.split(/\n\n+/);
    
    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (trimmed.length === 0) return;
      
      const sentences = splitIntoSentences(trimmed);
      
      if (sentences.length === 0) return;
      
      const chunks = buildQuoteChunks(sentences);
      
      chunks.forEach((chunk) => {
        quotes.push({
          id: `${fileName}_${quotes.length}_${Date.now()}_${Math.random()}`,
          text: chunk,
          fileOrigin: fileName,
          index: quotes.length,
          length: chunk.length,
        });
      });
    });
    
    console.log(`Parsed ${quotes.length} complete-sentence quotes`);
    console.log(`Sample lengths: ${quotes.slice(0, 5).map(q => q.length).join(", ")}`);
    
    return quotes;
  } catch (error) {
    console.error("Error in sentence-based parsing, falling back to simple mode:", error);
    
    return fallbackParse(text, fileName);
  }
}

function fallbackParse(text: string, fileName: string): Quote[] {
  const quotes: Quote[] = [];
  const lines = text.split(/\n+/);
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > MIN_SENTENCE_CHARS) {
      quotes.push({
        id: `${fileName}_${quotes.length}_${Date.now()}_${Math.random()}`,
        text: trimmed,
        fileOrigin: fileName,
        index: quotes.length,
        length: trimmed.length,
      });
    }
  });
  
  return quotes;
}
