import express from "express";
import { getClinic } from "../../controllers/public/clinicController.js";

const router = express.Router();

router.get("/", getClinic);

export default router;