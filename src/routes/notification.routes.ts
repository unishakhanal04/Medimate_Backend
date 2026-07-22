import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { getNotifications, markNotificationsSeen } from "../controllers/notification.controllers";

const router = Router();
router.use(authorize);
router.get("/", getNotifications);
router.post("/mark-seen", markNotificationsSeen);

export default router;
