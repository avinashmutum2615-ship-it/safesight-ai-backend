import express from "express";

import {
    createPatient,
    searchPatients,
    getPatientById,
} from "../../controllers/patient/patientController.js";

const router = express.Router();

// Register a new patient
router.post("/", createPatient);

// Search patients
router.get("/search", searchPatients);

// Get patient by ID
router.get("/:id", getPatientById);

export default router;