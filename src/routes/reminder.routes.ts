import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { createReminder, deleteReminder, listReminders, updateReminder } from "../controllers/reminder.controllers";
const router = Router(); router.use(authorize); router.get("/", listReminders); router.post("/", createReminder); router.patch("/:id", updateReminder); router.delete("/:id", deleteReminder); export default router;
