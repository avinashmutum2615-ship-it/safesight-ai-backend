import express from "express";

import {
    createPublicAppointment,
    getAvailableSlots,
} from "../../controllers/public/appointmentController.js";

const router = express.Router();

router.get("/slots", getAvailableSlots);

router.post("/", createPublicAppointment);

export default router;