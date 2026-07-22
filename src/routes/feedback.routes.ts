import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { createFeedback, listMyFeedback } from "../controllers/feedback.controllers";

const router = Router();
router.use(authorize);
router.get("/", listMyFeedback);
router.post("/", createFeedback);

export default router;
