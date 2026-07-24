import express from "express";

import {
    getAvailableDoctors,
    getDoctorById,
    searchDoctors,
} from "../../controllers/doctor/doctorController.js";

const router = express.Router();


router.get("/", getAvailableDoctors);

//GET /api/public/doctors/search?keyword=retina

router.get("/search", searchDoctors);

//GET /api/public/doctors/:id

router.get("/:id", getDoctorById);

export default router;