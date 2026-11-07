import { slotsFor } from "../appointment/scheduling.js";
import Doctor from "../../models/Doctor.js";
import User from "../../models/User.js";
import { doctorListResponse } from "../../../utils/dto/doctorListResponse.js";
import { doctorResponse } from "../../../utils/dto/doctorResponse.js";

export async function getAvailableDoctorsService() {
  const doctors = await Doctor.find({
    "availability.status": true,
  });

  const availableDoctors = [];

  for (const doctor of doctors) {
    const user = await User.findById(doctor.userId);

    if (!user || !user.isActive) continue;

    availableDoctors.push(doctorListResponse(user, doctor));
  }

  return availableDoctors;
}

export async function getDoctorByIdService(id) {
  const doctor = await Doctor.findById(id);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  const user = await User.findById(doctor.userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return doctorResponse(user, doctor);
}

export async function updateDoctorService(id, data) {
  const doctor = await Doctor.findById(id);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  const user = await User.findById(doctor.userId);

  if (!user) {
    throw new Error("User not found.");
  }

  // Check duplicate email
  if (data.email && data.email !== user.email) {
    const emailExists = await User.findOne({
      email: data.email,
      _id: { $ne: user._id },
    });

    if (emailExists) {
      throw new Error("Email already exists.");
    }
  }

  // Check duplicate phone
  if (data.phone && data.phone !== user.phone) {
    const phoneExists = await User.findOne({
      phone: data.phone,
      _id: { $ne: user._id },
    });

    if (phoneExists) {
      throw new Error("Phone number already exists.");
    }
  }

  user.name = data.name ?? user.name;
  user.email = data.email ?? user.email;
  user.phone = data.phone ?? user.phone;

  doctor.specialization = data.specialization ?? doctor.specialization;

  doctor.qualification = data.qualification ?? doctor.qualification;

  doctor.experience = data.experience ?? doctor.experience;

  doctor.consultationFee = data.consultationFee ?? doctor.consultationFee;

  await user.save();
  await doctor.save();

  return doctorResponse(user, doctor);
}

export async function deleteDoctorService(id) {
  const doctor = await Doctor.findById(id);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  await User.findByIdAndUpdate(doctor.userId, { isActive: false });
  doctor.availability.status = false;
  await doctor.save();
}

export async function searchDoctorsService(keyword) {
  const doctors = await Doctor.find({
    specialization: {
      $regex: keyword,
      $options: "i",
    },
  }).populate("userId");

  const nameDoctors = await Doctor.find().populate({
    path: "userId",
    match: {
      name: {
        $regex: keyword,
        $options: "i",
      },
    },
  });

  const results = [];

  const added = new Set();

  [...doctors, ...nameDoctors].forEach((doctor) => {
    if (!doctor.userId || !doctor.userId.isActive) return;

    if (added.has(doctor._id.toString())) return;

    added.add(doctor._id.toString());

    results.push(doctorListResponse(doctor.userId, doctor));
  });

  return results;
}

export const updateDoctorAvailabilityService = async (doctorId, data) => {
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  const proposed = { ...doctor.availability.toObject(), ...data };
  if (
    data.slotDuration !== undefined &&
    (!Number.isInteger(data.slotDuration) ||
      data.slotDuration < 5 ||
      data.slotDuration > 240)
  )
    throw new Error("Slot duration must be 5–240 minutes.");
  if (
    data.workingDays &&
    (!Array.isArray(data.workingDays) ||
      data.workingDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6))
  )
    throw new Error("Invalid working days.");
  slotsFor(
    { ...proposed, status: true, workingDays: [1] },
    "2030-01-07",
    [],
    new Date("2029-01-01"),
  );
  if (data.status !== undefined) {
    doctor.availability.status = data.status;
  }

  if (data.workingDays) {
    doctor.availability.workingDays = data.workingDays;
  }

  if (data.startTime) {
    doctor.availability.startTime = data.startTime;
  }

  if (data.endTime) {
    doctor.availability.endTime = data.endTime;
  }

  if (data.slotDuration) {
    doctor.availability.slotDuration = data.slotDuration;
  }

  if (data.breaks) {
    doctor.availability.breaks = data.breaks;
  }

  doctor.availability.updatedAt = new Date();

  await doctor.save();

  return doctor.availability;
};
