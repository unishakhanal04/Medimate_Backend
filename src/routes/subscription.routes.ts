import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { getCurrent, getPayments, initiatePayment, verifyPayment } from "../controllers/subscription.controllers";

const router = Router();
router.use(authorize);

router.get("/current", getCurrent);
router.get("/payments", getPayments);
router.post("/initiate", initiatePayment);
router.post("/verify", verifyPayment);

export default router;
