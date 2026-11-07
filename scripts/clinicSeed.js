import "../src/config/env.js";
import mongoose from "mongoose";
import ClinicSetting from "../src/models/ClinicSetting.js";
import { connectDb } from "../src/config/database.js";
await connectDb();
if (!(await ClinicSetting.exists({}))) {
  if (
    !process.env.CLINIC_PHONE ||
    !process.env.CLINIC_EMAIL ||
    !process.env.CLINIC_ADDRESS
  )
    throw new Error(
      "Set CLINIC_PHONE, CLINIC_EMAIL and CLINIC_ADDRESS before seeding clinic details.",
    );
  await ClinicSetting.create({
    clinicName: "SafeSight Eye Care",
    address: process.env.CLINIC_ADDRESS,
    contact: {
      phone: process.env.CLINIC_PHONE,
      email: process.env.CLINIC_EMAIL,
    },
    services: [],
    consultationFees: [],
    appointmentUrl: "/Appointment.html",
  });
  console.log(
    "Clinic settings created. Set verified contact details in MongoDB.",
  );
} else console.log("Existing clinic settings retained.");
await mongoose.disconnect();
