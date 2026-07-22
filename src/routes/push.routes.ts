import { Router } from "express";
import { getVapidPublicKey, subscribe, unsubscribe, getStatus } from "../controllers/push.controllers";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();

router.use(authorize);

router.get("/vapid-public-key", getVapidPublicKey);
router.get("/status", getStatus);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

export default router;
