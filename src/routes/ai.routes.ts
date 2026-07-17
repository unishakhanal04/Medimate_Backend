import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { chat, clearHistory, getHistory } from "../controllers/ai.controllers";

const router = Router();
router.use(authorize);
router.post("/chat", chat);
router.get("/history", getHistory);
router.delete("/history", clearHistory);

export default router;
