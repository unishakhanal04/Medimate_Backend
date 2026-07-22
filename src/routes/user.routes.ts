import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  whoami,
  updateProfile,
  changePassword,
  uploadImage,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controllers";
import { authorize } from "../middlewares/authorized.middleware";
import { validateRegister, validateLogin } from "../middlewares/validation.middleware";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ storage: storage });

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", authorize, whoami);
router.get("/whoami", authorize, whoami);
router.put("/profile", authorize, upload.single('image'), updateProfile);
router.put("/update", authorize, updateProfile);
router.put("/update-password", authorize, changePassword);
router.post("/upload", authorize, upload.single('image'), uploadImage);

export default router;
