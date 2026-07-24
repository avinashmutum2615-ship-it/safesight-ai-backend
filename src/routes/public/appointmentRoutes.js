import express from "express";

import {
    createPublicAppointment,
    getAvailableSlots,
    rescheduleAppointment,
    cancelPublicAppointment,
} from "../../controllers/public/appointmentController.js";

const router = express.Router();

router.get("/slots", getAvailableSlots);

router.post("/", createPublicAppointment);

router.patch("/reschedule", rescheduleAppointment);

router.patch("/cancel", cancelPublicAppointment);

export default router;