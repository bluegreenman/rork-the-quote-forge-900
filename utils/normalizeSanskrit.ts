/**
 * Normalize Sanskrit diacritics to phonetic Latin equivalents for TTS.
 * Keeps original text for display, but makes it speakable by device TTS engines.
 */
export function normalizeSanskrit(text: string): string {
  if (!text) return text;

  return text
    // long vowels
    .replace(/ā/g, "aa")
    .replace(/ī/g, "ee")
    .replace(/ū/g, "oo")
    .replace(/Ā/g, "Aa")
    .replace(/Ī/g, "Ee")
    .replace(/Ū/g, "Oo")

    // vocalic r
    .replace(/ṛ/g, "ri")
    .replace(/ṝ/g, "ree")
    .replace(/Ṛ/g, "Ri")
    .replace(/Ṝ/g, "Ree")

    // vocalic l (rare but included)
    .replace(/ḷ/g, "li")
    .replace(/ḹ/g, "lee")
    .replace(/Ḷ/g, "Li")
    .replace(/Ḹ/g, "Lee")

    // nasal sounds
    .replace(/ṅ/g, "ng")
    .replace(/ñ/g, "ny")
    .replace(/ṇ/g, "n")
    .replace(/ṃ/g, "m")
    .replace(/ṁ/g, "m")  // alternative anusvara
    .replace(/Ṅ/g, "Ng")
    .replace(/Ñ/g, "Ny")
    .replace(/Ṇ/g, "N")
    .replace(/Ṃ/g, "M")
    .replace(/Ṁ/g, "M")

    // aspirates / retroflex
    .replace(/ṭ/g, "t")
    .replace(/ḍ/g, "d")
    .replace(/ṭh/g, "th")
    .replace(/ḍh/g, "dh")
    .replace(/Ṭ/g, "T")
    .replace(/Ḍ/g, "D")

    // sibilants
    .replace(/ś/g, "sh")
    .replace(/ṣ/g, "sh")
    .replace(/Ś/g, "Sh")
    .replace(/Ṣ/g, "Sh")

    // visarga
    .replace(/ḥ/g, "h")
    .replace(/Ḥ/g, "H");
}
