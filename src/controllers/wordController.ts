import type { Request, Response } from "express";
import { getAllWords } from "../services/wordService.js";

// Translates HTTP <-> service. Knows nothing about SQL or `pool`,
// and does not know which URL it is mounted at — that is the route's job.
export async function getAllWordsController(
  req: Request,
  res: Response,
): Promise<void> {
  const allWords = await getAllWords();
  res.status(200).json(allWords);
}
