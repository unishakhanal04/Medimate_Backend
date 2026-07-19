import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { createReminder, deleteReminder, listReminderLogs, listReminders, setReminderStatus, updateReminder } from "../controllers/reminder.controllers";
const router = Router(); router.use(authorize); router.get("/logs", listReminderLogs); router.get("/", listReminders); router.post("/", createReminder); router.patch("/:id", updateReminder); router.delete("/:id", deleteReminder); router.post("/:id/status", setReminderStatus); export default router;
