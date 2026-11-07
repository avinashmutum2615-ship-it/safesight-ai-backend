import express from "express";
import { auth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";
import { clinicalOwner } from "../../middleware/clinicalOwner.js";
import Visit from "../../models/Visit.js";
import Doctor from "../../models/Doctor.js";
import Examination from "../../models/Examination.js";
import {
  getTodaysVisits,
  getVisitById,
  startVisit,
  completeVisit,
} from "../../controllers/visit/visitController.js";
const router = express.Router();
router.use(auth, authorize("admin", "doctor"));
router.get("/today", async (req, res, next) => {
  if (req.user.role === "admin") return getTodaysVisits(req, res, next);
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const visits = doctor
    ? await Visit.find({
        doctor: doctor.id,
        isActive: true,
        status: { $ne: "Completed" },
      })
        .populate("patient")
        .populate({
          path: "doctor",
          populate: { path: "userId", select: "name" },
        })
        .populate("appointment")
    : [];
  const { default: dto } = await import("../../../utils/dto/visitResponse.js");
  res.json({ success: true, visits: visits.map(dto) });
});
router.use(
  "/:id",
  clinicalOwner(Visit, (req) => req.params.id),
);
router.get("/:id", getVisitById);
router.patch("/:id/start", startVisit);
router.patch("/:id/complete", completeVisit);
router.get("/:id/examination", async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  res.json({
    success: true,
    examination: await Examination.findOne({ appointment: visit.appointment }),
  });
});
router.put("/:id/examination", async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (visit.status !== "In Progress")
    return res
      .status(400)
      .json({
        success: false,
        message: "Start the visit before recording an examination.",
      });
  const data = {};
  for (const key of [
    "chiefComplaint",
    "historyOfPresentIllness",
    "visualAcuity",
    "refraction",
    "intraocularPressure",
    "slitLamp",
    "fundus",
    "diagnosis",
    "notes",
  ])
    if (req.body[key] !== undefined) data[key] = req.body[key];
  const examination = await Examination.findOneAndUpdate(
    { appointment: visit.appointment },
    { $set: { ...data, patient: visit.patient, doctor: visit.doctor } },
    { upsert: true, new: true, runValidators: true },
  );
  res.json({ success: true, examination });
});
export default router;
