import { Router } from "express";
import { getAllWordsController } from "../controllers/wordController.js";

const router = Router();
router.get("/", getAllWordsController);

export default router;