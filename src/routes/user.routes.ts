import { Router } from "express";
import { register, login, getProfile } from "../controllers/user.controllers";
import { authorize } from "../middlewares/authorized.middleware";
import { validateRegister, validateLogin } from "../middlewares/validation.middleware";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/profile", authorize, getProfile);

export default router;