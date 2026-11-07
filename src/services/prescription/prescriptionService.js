import Prescription from "../../models/Prescription.js";
import Visit from "../../models/Visit.js";
import { getPatientDocument } from "../patient/patientService.js";
import prescriptionResponse from "../../../utils/dto/prescriptionResponse.js";

export async function createPrescriptionService(data) {
  const visit = await Visit.findById(data.visit)
    .populate("patient")
    .populate("doctor");

  if (!visit) {
    throw new Error("Visit not found.");
  }

  if (!visit.isActive) {
    throw new Error("Visit is inactive.");
  }

  if (visit.status !== "In Progress" && visit.status !== "Completed") {
    throw new Error(
      "Prescription can only be created after the visit has started.",
    );
  }

  const existingPrescription = await Prescription.findOne({
    visit: visit._id,
    isActive: true,
  });

  if (existingPrescription) {
    throw new Error("Prescription already exists for this visit.");
  }

  const prescription = await Prescription.create({
    visit: visit._id,

    patient: visit.patient._id,

    doctor: visit.doctor._id,

    diagnosis: data.diagnosis || [],

    clinicalComments: data.clinicalComments,

    glassPrescription: data.glassPrescription,

    medications: data.medications || [],

    actionPlan: data.actionPlan,

    procedures: data.procedures || [],

    investigations: data.investigations || [],

    followUp: data.followUp,

    referrals: data.referrals || [],
  });

  await prescription.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    },
    {
      path: "visit",
      select: "visitId status",
    },
  ]);

  return prescriptionResponse(prescription);
}
export async function createPrescriptionByPatientService(
  doctorId,
  patientKeyword,
  data,
) {
  // Find patient
  const patient = await getPatientDocument(patientKeyword);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  // Find active visit
  const visit = await Visit.findOne({
    patient: patient._id,
    doctor: doctorId,
    status: "In Progress",
    isActive: true,
  });

  if (!visit) {
    throw new Error("No active visit found for this patient.");
  }

  return await createPrescriptionService({
    visit: visit._id,
    ...data,
  });
}

export async function getPrescriptionByIdService(id) {
  const prescription = await Prescription.findOne({
    _id: id,
    isActive: true,
  })
    .populate("patient", "patientId name phone")
    .populate({ path: "doctor", populate: { path: "userId", select: "name" } })
    .populate("visit", "visitId status");

  if (!prescription) {
    throw new Error("Prescription not found.");
  }

  return prescriptionResponse(prescription);
}

export async function getPrescriptionByVisitService(visitId) {
  const prescription = await Prescription.findOne({
    visit: visitId,
    isActive: true,
  })
    .populate("patient", "patientId name phone")
    .populate({ path: "doctor", populate: { path: "userId", select: "name" } })
    .populate("visit", "visitId status");

  if (!prescription) {
    throw new Error("Prescription not found.");
  }

  return prescriptionResponse(prescription);
}

export async function updatePrescriptionService(id, data) {
  const prescription = await Prescription.findOne({
    _id: id,
    isActive: true,
  });

  if (!prescription) {
    throw new Error("Prescription not found.");
  }

  for (const key of [
    "diagnosis",
    "clinicalComments",
    "glassPrescription",
    "medications",
    "actionPlan",
    "procedures",
    "investigations",
    "followUp",
    "referrals",
  ])
    if (data[key] !== undefined) prescription[key] = data[key];

  await prescription.save();

  await prescription.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    },
    {
      path: "visit",
      select: "visitId status",
    },
  ]);

  return prescriptionResponse(prescription);
}

export async function deletePrescriptionService(id) {
  const prescription = await Prescription.findOne({
    _id: id,
    isActive: true,
  });

  if (!prescription) {
    throw new Error("Prescription not found.");
  }

  prescription.isActive = false;

  await prescription.save();
}
