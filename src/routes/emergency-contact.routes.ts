import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "../controllers/emergency-contact.controllers";
const router = Router();
router.use(authorize);
router.get("/", listContacts);
router.post("/", createContact);
router.patch("/:id", updateContact);
router.delete("/:id", deleteContact);
export default router;
