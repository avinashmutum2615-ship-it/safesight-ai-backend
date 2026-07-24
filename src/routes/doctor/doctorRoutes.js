import express from "express";

import { auth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";

import {
    getAvailableDoctors,
    updateAvailability,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    searchDoctors,
} from "../../controllers/doctor/doctorController.js";

const router = express.Router();

router.patch(
    "/availability",
    auth,
    authorize("doctor"),
    updateAvailability
);

router.get(
    "/search", 
    searchDoctors);

router.get(
    "/:id",
    auth,
    authorize("admin"),
    getDoctorById
);

router.patch(
    "/:id",
    auth,
    authorize("admin"),
    updateDoctor
);

router.delete(
    "/:id",
    auth,
    authorize("admin"),
    deleteDoctor
);
router.get(
    "/available",
    auth,
    getAvailableDoctors
);

export default router;