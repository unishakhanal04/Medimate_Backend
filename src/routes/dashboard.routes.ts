import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();

router.use(authorize);

router.get("/", getDashboard);

export default router;
