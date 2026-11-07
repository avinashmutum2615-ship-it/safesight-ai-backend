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

router.patch("/reschedule", (req, res) =>
  res
    .status(403)
    .json({
      success: false,
      message: "Contact the clinic to reschedule your appointment.",
    }),
);

router.patch("/cancel", (req, res) =>
  res
    .status(403)
    .json({
      success: false,
      message: "Contact the clinic to cancel your appointment.",
    }),
);

export default router;
