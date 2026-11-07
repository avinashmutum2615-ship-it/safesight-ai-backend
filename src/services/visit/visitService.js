import mongoose from "mongoose";
import Appointment from "../../models/Appointment.js";
import Visit from "../../models/Visit.js";
import generateVisitId from "../../../utils/generateVisitId.js";
import visitResponse from "../../../utils/dto/visitResponse.js";
import { getPatientDocument } from "../patient/patientService.js";

export const checkInAppointmentService = async (appointmentId) => {
  let id;
  await mongoose.connection.transaction(async (session) => {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, isActive: true, status: "Confirmed" },
      { $set: { status: "Checked In" } },
      { new: true, session },
    );
    if (!appointment)
      throw new Error("Only confirmed appointments can be checked in.");
    const [visit] = await Visit.create(
      [
        {
          visitId: await generateVisitId(),
          appointment: appointment.id,
          patient: appointment.patient,
          doctor: appointment.doctor,
        },
      ],
      { session },
    );
    id = visit.id;
  });
  return getVisitByIdService(id);
};

export const getTodaysVisitsService = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const visits = await Visit.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },

    isActive: true,
  })
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    })
    .sort({
      checkedInAt: 1,
    });

  return visits.map(visitResponse);
};

export const startVisitService = async (visitId) => {
  await mongoose.connection.transaction(async (session) => {
    const visit = await Visit.findOneAndUpdate(
      { _id: visitId, isActive: true, status: "Waiting" },
      { $set: { status: "In Progress", startedAt: new Date() } },
      { new: true, session },
    );
    if (!visit) throw new Error("Visit is not waiting or does not exist.");
    const appointment = await Appointment.findOneAndUpdate(
      { _id: visit.appointment, status: "Checked In" },
      { $set: { status: "In Consultation" } },
      { session },
    );
    if (!appointment) throw new Error("Appointment is not checked in.");
  });
  return getVisitByIdService(visitId);
};

export const completeVisitService = async (visitId, notes = "") => {
  await mongoose.connection.transaction(async (session) => {
    const visit = await Visit.findOneAndUpdate(
      { _id: visitId, isActive: true, status: "In Progress" },
      { $set: { status: "Completed", completedAt: new Date(), notes } },
      { new: true, session },
    );
    if (!visit) throw new Error("Visit is not in progress.");
    const appointment = await Appointment.findOneAndUpdate(
      { _id: visit.appointment, status: "In Consultation" },
      { $set: { status: "Completed" } },
      { session },
    );
    if (!appointment) throw new Error("Appointment is not in consultation.");
  });
  return getVisitByIdService(visitId);
};

export const getVisitByIdService = async (visitId) => {
  const visit = await Visit.findById(visitId)
    .populate({
      path: "patient",
      select: "patientId name phone email",
    })
    .populate({
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    })
    .populate("appointment");

  if (!visit || !visit.isActive) {
    throw new Error("Visit not found.");
  }

  return visitResponse(visit);
};

export const getWaitingVisitService = async (doctorId, patientKeyword) => {
  const patient = await getPatientDocument(patientKeyword);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const visit = await Visit.findOne({
    patient: patient._id,
    doctor: doctorId,
    status: "Waiting",
    isActive: true,
  })
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    })
    .populate("appointment");

  if (!visit) {
    throw new Error("No waiting visit found for this patient.");
  }

  return visit;
};

export const getActiveVisitService = async (doctorId, patientKeyword) => {
  const patient = await getPatientDocument(patientKeyword);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const visit = await Visit.findOne({
    patient: patient._id,
    doctor: doctorId,
    status: "In Progress",
    isActive: true,
  })
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "userId",
      populate: { path: "userId", select: "name" },
    })
    .populate("appointment");

  if (!visit) {
    throw new Error("No active visit found for this patient.");
  }

  return visit;
};

export const startVisitByPatientService = async (doctorId, patientKeyword) => {
  const visit = await getWaitingVisitService(doctorId, patientKeyword);

  return await startVisitService(visit._id);
};

export const completeVisitByPatientService = async (
  doctorId,
  patientKeyword,
  notes = "",
) => {
  const visit = await getActiveVisitService(doctorId, patientKeyword);

  return await completeVisitService(visit._id, notes);
};
