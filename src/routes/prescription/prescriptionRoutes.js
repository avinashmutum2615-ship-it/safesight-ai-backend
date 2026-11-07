import express from "express";

import {
  createPrescription,
  getPrescriptionById,
  getPrescriptionByVisit,
  updatePrescription,
  deletePrescription,
} from "../../controllers/prescription/prescriptionController.js";

import { auth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";

import { clinicalOwner } from "../../middleware/clinicalOwner.js";
import Visit from "../../models/Visit.js";
import Prescription from "../../models/Prescription.js";
const router = express.Router();

router.use(auth);

router.post(
  "/",
  authorize("doctor", "admin"),
  clinicalOwner(Visit, (req) => req.body.visit),
  createPrescription,
);

router.get(
  "/visit/:visitId",
  authorize("doctor", "admin", "receptionist"),
  getPrescriptionByVisit,
);

router.get(
  "/:id",
  authorize("doctor", "admin", "receptionist"),
  getPrescriptionById,
);

router.patch(
  "/:id",
  authorize("doctor", "admin"),
  clinicalOwner(Prescription, (req) => req.params.id),
  updatePrescription,
);

router.delete("/:id", authorize("admin"), deletePrescription);

export default router;
