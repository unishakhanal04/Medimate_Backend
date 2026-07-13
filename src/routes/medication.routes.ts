import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { createMedication, deleteMedication, listMedications, takeMedication, updateMedication } from "../controllers/medication.controllers";
const router = Router(); router.use(authorize); router.get("/", listMedications); router.post("/", createMedication); router.patch("/:id", updateMedication); router.patch("/:id/take", takeMedication); router.delete("/:id", deleteMedication); export default router;
