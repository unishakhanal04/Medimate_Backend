import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  getProfile,
  updateProfile,
  updatePassword,
  updatePreferences,
} from "../controllers/profile.controllers";

const router = Router();

router.use(authorize);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/password", updatePassword);
router.put("/preferences", updatePreferences);

export default router;
