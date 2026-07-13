import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../controllers/admin.user.controllers";

const router = Router();

router.use(authorize, requireAdmin);

router.get("/", listAdminUsers);
router.get("/:id", getAdminUser);
router.post("/", createAdminUser);
router.patch("/:id", updateAdminUser);
router.put("/:id", updateAdminUser);
router.delete("/:id", deleteAdminUser);

export default router;
