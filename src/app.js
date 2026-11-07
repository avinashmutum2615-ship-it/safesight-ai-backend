import { rateLimit } from "express-rate-limit";
import "./config/env.js";
import express from "express";
import path from "node:path";
import mongoose from "mongoose";
import visitRoutes from "./routes/visit/visitRoutes.js";
import { chatRouter } from "./routes/ai/chatRouter.js";
import cors from "cors";
import authRoutes from "./routes/auth/authRoutes.js";

import { connectDb } from "./config/database.js";
import { auth } from "./middleware/auth.js";
//internal
import adminRoutes from "./routes/admin/adminRoutes.js";
import patientRoutes from "./routes/patient/patientRoutes.js";
import doctorRoutes from "./routes/doctor/doctorRoutes.js";
import appointmentRoutes from "./routes/appointment/appointmentRoutes.js";
import receptionistRoutes from "./routes/receptionist/receptionistRoutes.js";
import prescriptionRoutes from "./routes/prescription/prescriptionRoutes.js";
//AI

//MCP public
import publicDoctorRoutes from "./routes/public/doctorRoutes.js";
import publicClinicRoutes from "./routes/public/clinicRoutes.js";
import publicPatientRoutes from "./routes/public/patientRoutes.js";
import publicAppointmentRoutes from "./routes/public/appointmentRoutes.js";

const app = express();

app.disable("x-powered-by");
if (process.env.TRUST_PROXY)
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  if (req.path.startsWith("/api")) res.set("Cache-Control", "no-store");
  next();
});
const limiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  });
app.use("/api/auth/login", limiter(30));
app.use("/api/public", limiter(200));
app.use("/api/ai", limiter(40));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
      : false,
  }),
);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/receptionists", receptionistRoutes);

app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/appointments", appointmentRoutes);
//Ai API

//mcp public API
app.use("/api/public/doctors", publicDoctorRoutes);
app.use("/api/public/clinic", publicClinicRoutes);
app.use("/api/public/patients", publicPatientRoutes);
app.use("/api/public/appointments", publicAppointmentRoutes);

app.use("/api/visits", visitRoutes);
app.use("/api/ai", chatRouter);
app.get("/api/health", (req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({
      success: mongoose.connection.readyState === 1,
      aiConfigured: Boolean(
        process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
      ),
    }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ success: false, message: "API route not found." }),
);
if (process.env.FRONTEND_DIR)
  app.use(express.static(path.resolve(process.env.FRONTEND_DIR)));
app.use((error, req, res, next) => {
  const status =
    error.status ||
    (error.name === "ValidationError" || error.name === "CastError"
      ? 400
      : error.code === 11000
        ? 409
        : 500);
  res
    .status(status)
    .json({
      success: false,
      message:
        status === 500
          ? "Unexpected server error."
          : error.code === 11000
            ? "This record or appointment slot already exists."
            : error.message,
    });
});
export default app;
