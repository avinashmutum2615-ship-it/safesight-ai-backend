import User from "../../models/User.js";
import { dateOnly, slotsFor } from "./scheduling.js";
import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import appointmentResponse from "../../../utils/dto/appointmentResponse.js";
import {
  getPatientDocument,
  findOrCreatePatientService,
} from "../patient/patientService.js";
import Patient from "../../models/Patient.js";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const createAppointmentService = async (data, userId) => {
  data.appointmentDate = dateOnly(data.appointmentDate);
  if (
    data.status &&
    !["Pending Confirmation", "Confirmed"].includes(data.status)
  )
    throw new Error("New appointments must be pending or confirmed.");
  if (
    typeof data.name !== "string" ||
    !data.name.trim() ||
    typeof data.phone !== "string" ||
    !/^\+?[\d ()-]{10,16}$/.test(data.phone) ||
    !["male", "female", "other"].includes(data.gender?.toLowerCase())
  )
    throw new Error("Patient name, valid phone and gender are required.");

  const doctor = await Doctor.findById(data.doctor);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  const startOfDay = new Date(data.appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(data.appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointment = await Appointment.findOne({
    doctor: doctor._id,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    appointmentTime: data.appointmentTime,
    isActive: true,
    status: {
      $nin: ["Cancelled", "Completed", "No Show"],
    },
  });

  if (existingAppointment) {
    throw new Error(
      "This doctor already has an appointment at the selected time.",
    );
  }

  const availableSlots = await getAvailableSlotsService(
    doctor._id,
    data.appointmentDate,
  );

  if (!availableSlots.includes(data.appointmentTime)) {
    throw new Error("Selected time slot is unavailable.");
  }

  const patient = await findOrCreatePatientService(data);
  const appointment = await Appointment.create({
    patient: patient._id,

    doctor: doctor._id,

    appointmentDate: data.appointmentDate,

    appointmentTime: data.appointmentTime,

    status: data.status || "Pending Confirmation",

    source: data.source || "Walk-in",

    reason: data.reason,

    notes: data.notes,

    createdBy: userId,
  });

  await appointment.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    },
  ]);

  return appointmentResponse(appointment);
};

export const getAllAppointmentsService = async () => {
  const appointments = await Appointment.find({
    isActive: true,
  })
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    })
    .sort({
      appointmentDate: 1,
      appointmentTime: 1,
    });

  return appointments.map(appointmentResponse);
};

export const getAppointmentByIdService = async (id) => {
  const appointment = await Appointment.findById(id)
    .populate({
      path: "patient",
      select: "patientId name phone email address bloodGroup emergencyContact",
    })
    .populate({
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    });

  if (!appointment || !appointment.isActive) {
    throw new Error("Appointment not found.");
  }

  return appointmentResponse(appointment);
};

export const updateAppointmentService = async (id, data, userId) => {
  const appointment = await getAppointmentService({
    appointmentId: id,
  });

  appointment.updatedBy = userId;

  // Check Doctor
  let doctor = appointment.doctor;

  if (data.doctor) {
    doctor = await Doctor.findById(data.doctor);

    if (!doctor) {
      throw new Error("Doctor not found.");
    }
  }

  if (
    ["Checked In", "In Consultation", "Completed"].includes(appointment.status)
  )
    throw new Error("This appointment is already in the clinical workflow.");
  if (
    data.status &&
    !["Pending Confirmation", "Confirmed", "Cancelled", "No Show"].includes(
      data.status,
    )
  )
    throw new Error(
      "Use check-in and visit actions for clinical status changes.",
    );
  const targetDate = dateOnly(
    data.appointmentDate || appointment.appointmentDate,
  );
  const targetTime = data.appointmentTime || appointment.appointmentTime;
  if (
    !["Cancelled", "No Show"].includes(data.status) &&
    (data.doctor ||
      data.appointmentDate ||
      data.appointmentTime ||
      data.status === "Confirmed")
  ) {
    const slots = await getAvailableSlotsService(
      doctor._id || doctor,
      targetDate,
      appointment._id,
    );
    if (!slots.includes(targetTime))
      throw new Error("Selected time slot is unavailable.");
  }
  // Update allowed fields
  if (data.doctor) {
    appointment.doctor = doctor._id;
  }

  if (data.appointmentDate) {
    appointment.appointmentDate = dateOnly(data.appointmentDate);
  }

  if (data.appointmentTime) {
    appointment.appointmentTime = data.appointmentTime;
  }

  if (data.status) {
    appointment.status = data.status;
  }

  if (data.source) {
    appointment.source = data.source;
  }

  if (data.reason !== undefined) {
    appointment.reason = data.reason;
  }

  if (data.notes !== undefined) {
    appointment.notes = data.notes;
  }

  await appointment.save();

  await appointment.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    },
  ]);

  return appointmentResponse(appointment);
};

export const deleteAppointmentService = async (id) => {
  const appointment = await Appointment.findById(id);

  if (!appointment || !appointment.isActive) {
    throw new Error("Appointment not found.");
  }

  appointment.isActive = false;

  await appointment.save();

  return;
};

export const getAvailableSlotsService = async (
  doctorId,
  date,
  excludeAppointmentId = null,
) => {
  date = dateOnly(date);
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !(await User.exists({ _id: doctor.userId, isActive: true })))
    throw new Error("Doctor not found or inactive.");
  const query = {
    doctor: doctorId,
    appointmentDate: new Date(date),
    isActive: true,
    status: {
      $in: [
        "Pending Confirmation",
        "Confirmed",
        "Checked In",
        "In Consultation",
      ],
    },
  };
  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  const booked = await Appointment.find(query).select("appointmentTime");
  return slotsFor(
    doctor.availability,
    date,
    booked.map((a) => a.appointmentTime),
  );
};

export const getAppointmentService = async ({
  appointmentId,
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  status,
}) => {
  const query = {};
  if (appointmentId) {
    query._id = appointmentId;
  }

  if (patientId) query.patient = patientId;

  if (doctorId) query.doctor = doctorId;

  if (status) query.status = status;

  if (appointmentTime) {
    query.appointmentTime = appointmentTime;
  }

  if (appointmentDate) {
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    query.appointmentDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const appointment = await Appointment.findOne(query)
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    });

  if (!appointment || !appointment.isActive) {
    throw new Error("Appointment not found.");
  }

  return appointment;
};

export const getDashboardService = async () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  const todayAppointments = await Appointment.countDocuments({
    appointmentDate: {
      $gte: today,
      $lt: tomorrow,
    },
    isActive: true,
  });

  const booked = await Appointment.countDocuments({
    status: "Confirmed",
    isActive: true,
  });

  const completed = await Appointment.countDocuments({
    status: "Completed",
    isActive: true,
  });

  const cancelled = await Appointment.countDocuments({
    status: "Cancelled",
    isActive: true,
  });

  const availableDoctors = await Doctor.countDocuments({
    "availability.status": true,
  });

  return {
    todayAppointments,
    booked,
    completed,
    cancelled,
    availableDoctors,
  };
};

export const cancelAppointmentService = async (appointmentId, userId) => {
  const appointment = await getAppointmentService({
    appointmentId,
  });

  if (!["Pending Confirmation", "Confirmed"].includes(appointment.status)) throw new Error("Only pending or confirmed appointments can be cancelled.");
  if (appointment.status === "Cancelled") {
    throw new Error("Appointment is already cancelled.");
  }

  appointment.status = "Cancelled";

  appointment.updatedBy = userId;

  await appointment.save();

  await appointment.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    },
  ]);

  return appointmentResponse(appointment);
};

export const searchAppointmentsService = async ({
  patientId,
  doctorId,
  appointmentDate,
  status,
  limit = 20,
}) => {
  const query = {
    isActive: true,
  };

  if (patientId) {
    query.patient = patientId;
  }

  if (doctorId) {
    query.doctor = doctorId;
  }

  if (status) {
    query.status = status;
  }

  if (appointmentDate) {
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    query.appointmentDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const appointments = await Appointment.find(query)
    .populate({
      path: "patient",
      select: "patientId name phone",
    })
    .populate({
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    })
    .sort({
      appointmentDate: 1,
      appointmentTime: 1,
    })
    .limit(limit);

  return appointments.map(appointmentResponse);
};

export async function getTodayAppointmentsService(doctorId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctor: doctorId,

    appointmentDate: {
      $gte: start,
      $lte: end,
    },

    isActive: true,
  })
    .populate("patient")
    .sort({
      appointmentTime: 1,
    });

  return appointments;
}
export async function startConsultationService(doctorId, patientKeyword) {
  const patient = await getPatientDocument(patientKeyword);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  const appointment = await Appointment.findOne({
    patient: patient._id,

    doctor: doctorId,

    appointmentDate: {
      $gte: today,
      $lt: tomorrow,
    },

    isActive: true,
  });

  if (!appointment) {
    throw new Error("Today's appointment not found.");
  }

  if (!["Confirmed", "Checked In"].includes(appointment.status)) {
    throw new Error(
      `Cannot start consultation because appointment is currently '${appointment.status}'.`,
    );
  }

  appointment.status = "In Consultation";

  await appointment.save();

  return appointment;
}

export const rescheduleAppointmentService = async ({
  name,
  phone,
  appointmentDate,
  appointmentTime,
}) => {
  // Find patient using name + phone
  const patient = await Patient.findOne({
    name: {
      $regex: `^${name}$`,
      $options: "i",
    },
    phone,
    isActive: true,
  });

  if (!patient) {
    throw new Error(
      "Patient not found. Please check the name and registered phone number.",
    );
  }

  // Find active appointment
  const appointment = await Appointment.findOne({
    patient: patient._id,
    isActive: true,
    status: {
      $nin: ["Cancelled", "Completed", "No Show"],
    },
  }).sort({
    appointmentDate: 1,
  });

  if (!appointment) {
    throw new Error("Active appointment not found.");
  }

  // Check available slots
  const availableSlots = await getAvailableSlotsService(
    appointment.doctor,
    appointmentDate,
    appointment._id,
  );

  if (!availableSlots.includes(appointmentTime)) {
    throw new Error("Selected time slot is unavailable.");
  }

  // Update appointment
  appointment.appointmentDate = appointmentDate;
  appointment.appointmentTime = appointmentTime;

  await appointment.save();

  await appointment.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    },
  ]);

  return appointmentResponse(appointment);
};

export const cancelPublicAppointmentService = async ({ name, phone }) => {
  // Find patient using name + phone
  const patient = await Patient.findOne({
    name: {
      $regex: `^${name}$`,
      $options: "i",
    },
    phone,
    isActive: true,
  });

  if (!patient) {
    throw new Error(
      "Patient not found. Please check the name and registered phone number.",
    );
  }

  // Find active appointment
  const appointment = await Appointment.findOne({
    patient: patient._id,
    isActive: true,
    status: {
      $nin: ["Cancelled", "Completed", "No Show"],
    },
  }).sort({
    appointmentDate: 1,
  });

  if (!appointment) {
    throw new Error("Active appointment not found.");
  }

  // Cancel appointment
  appointment.status = "Cancelled";

  await appointment.save();

  await appointment.populate([
    {
      path: "patient",
      select: "patientId name phone",
    },
    {
      path: "doctor",
      select: "specialization userId",
      populate: {
        path: "userId",
        select: "name",
      },
    },
  ]);

  return appointmentResponse(appointment);
};
