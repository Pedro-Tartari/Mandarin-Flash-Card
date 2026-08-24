import type { Request, Response } from "express";
import { getAllWords, getWordById } from "../services/wordService.js";

// Translates HTTP <-> service. Knows nothing about SQL or `pool`,
// and does not know which URL it is mounted at — that is the route's job.
export async function getAllWordsController(
  req: Request,
  res: Response,
): Promise<void> {
  const allWords = await getAllWords();
  res.status(200).json(allWords);
}

export async function getWordByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  const idParam = req.params.id;
  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: `Word id must be an integer, received "${idParam}"`,
      },
    });
    return;
  }

  const word = await getWordById(id);

  if (word === null) {
    res.status(404).json({
      error: {
        code: "WORD_NOT_FOUND",
        message: `No word exists with id ${id}`,
      },
    });
    return;
  }

  res.status(200).json(word);
}
