/**
 * Arabic-aware text normalization for matching and search (pure, client-safe).
 * ة/ه, ى/ي and أ/إ/آ/ا compare equal; diacritics and tatweel are ignored; Arabic-Indic digits
 * become Latin; punctuation becomes spaces. Used by the catalog name matcher (G7 blocks) and the
 * quote form's product search.
 */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[ً-ٰٟـ]/g, "") // diacritics (tashkeel), superscript alef, tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/(\d)([a-z؀-ۿ])/g, "$1 $2") // "10mm" -> "10 mm"
    .replace(/[^\p{L}\p{N}.\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every word of the query appears (in any order) somewhere in the text, after normalization. */
export function matchesSearch(text: string, query: string): boolean {
  const words = normalizeArabic(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeArabic(text);
  return words.every((w) => haystack.includes(w));
}
