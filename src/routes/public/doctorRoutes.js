import express from "express";
import {
  getAvailableDoctors,
  searchDoctors,
} from "../../controllers/doctor/doctorController.js";
const router = express.Router();
router.get("/", getAvailableDoctors);
router.get("/search", searchDoctors);
export default router;
