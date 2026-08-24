import { Router } from "express";
import { getAllWordsController, getWordByIdController } from "../controllers/wordController.js";

const router = Router();
router.get("/", getAllWordsController);
router.get("/:id", getWordByIdController);

export default router;