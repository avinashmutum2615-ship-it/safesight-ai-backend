import mongoose from "mongoose";
import User from "../../models/User.js";
import Doctor from "../../models/Doctor.js";
import Receptionist from "../../models/Receptionist.js";
import { hashPassword } from "../../../utils/hashPassword.js";
import { userResponse } from "../../../utils/dto/userResponse.js";
import { doctorResponse } from "../../../utils/dto/doctorResponse.js";

export async function createDoctorService(data) {
  if (typeof data.password !== "string" || data.password.length < 12)
    throw new Error("Password must contain at least 12 characters.");
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    }).session(session);

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error("Email already exists.");
      }

      if (existingUser.phone === data.phone) {
        throw new Error("Phone number already exists.");
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = new User({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: "doctor",
    });

    await user.save({ session });

    const doctor = new Doctor({
      userId: user._id,
      specialization: data.specialization,
      qualification: data.qualification,
      experience: data.experience,
      consultationFee: data.consultationFee,
    });

    await doctor.save({ session });

    await session.commitTransaction();

    return doctorResponse(user, doctor);
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
}

export async function createReceptionistService(data) {
  if (typeof data.password !== "string" || data.password.length < 12)
    throw new Error("Password must contain at least 12 characters.");
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    }).session(session);

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error("Email already exists.");
      }

      if (existingUser.phone === data.phone) {
        throw new Error("Phone number already exists.");
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = new User({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: "receptionist",
    });

    await user.save({ session });

    const receptionist = new Receptionist({
      userId: user._id,
    });

    await receptionist.save({ session });

    await session.commitTransaction();

    return userResponse(user);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getAllStaffService() {
  const users = await User.find().sort({ createdAt: -1 });

  const staff = [];

  for (const user of users) {
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({
        userId: user._id,
      });

      staff.push(doctorResponse(user, doctor));
    } else {
      staff.push(userResponse(user));
    }
  }

  return staff;
}

export async function getDashboardService() {
  const totalStaff = await User.countDocuments();

  const totalDoctors = await User.countDocuments({
    role: "doctor",
  });

  const totalReceptionists = await User.countDocuments({
    role: "receptionist",
  });

  const totalAdmins = await User.countDocuments({
    role: "admin",
  });

  const activeStaff = await User.countDocuments({
    isActive: true,
  });

  const inactiveStaff = await User.countDocuments({
    isActive: false,
  });

  return {
    totalStaff,
    totalDoctors,
    totalReceptionists,
    totalAdmins,
    activeStaff,
    inactiveStaff,
  };
}
