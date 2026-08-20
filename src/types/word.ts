// Matches the actual DB columns exactly
export interface WordRow {
  id: number;
  hanzi: string;
  zhuyin: string;
  pinyin: string | null;
  meaning: string;
  example_sentence: string | null;
  tocfl_level: number | null;
}
// What the API actually returns to clients
export interface Word {
  id: number;
  hanzi: string;
  zhuyin: string;
  pinyin: string | null;
  meaning: string;
  exampleSentence: string | null;
  tocflLevel: number | null;
}