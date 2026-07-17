import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { getTimeline } from "../controllers/timeline.controllers";

const router = Router();
router.use(authorize);
router.get("/", getTimeline);

export default router;
