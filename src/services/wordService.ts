import type { Word, WordRow } from "../types/word.js";
import { pool } from "../db/pool.js";

// Translates a DB row into the shape the rest of the app speaks.
// Lives here, not in types/, because it is runtime code and an
// implementation detail of how this service talks to Postgres.
function toWord(row: WordRow): Word {
  return {
    id: row.id,
    hanzi: row.hanzi,
    zhuyin: row.zhuyin,
    pinyin: row.pinyin,
    meaning: row.meaning,
    exampleSentence: row.example_sentence,
    tocflLevel: row.tocfl_level,
  };
}

export async function getAllWords(): Promise<Word[]> {
  const result = await pool.query<WordRow>(`
    SELECT 
    id, 
    hanzi, 
    zhuyin, 
    pinyin, 
    meaning,
    example_sentence, 
    tocfl_level 
    FROM words 
    ORDER BY tocfl_level NULLS LAST, id`);

  return result.rows.map(toWord);
}

export async function getWordById(id: number): Promise<Word | null> {
   const result = await pool.query<WordRow>(`
    SELECT 
    id, 
    hanzi, 
    zhuyin, 
    pinyin, 
    meaning,
    example_sentence, 
    tocfl_level 
    FROM words 
    WHERE id = $1`, [id]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    } 
  return toWord(row);
} 
