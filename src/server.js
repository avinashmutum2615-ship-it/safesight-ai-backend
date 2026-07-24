import "./config/env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/authRoutes.js";

import { connectDb } from "./config/database.js";
import { auth } from "./middleware/auth.js";
//internal 
import adminRoutes from "./routes/admin/adminRoutes.js";
import patientRoutes from "./routes/patient/patientRoutes.js";
import doctorRoutes from "./routes/doctor/doctorRoutes.js";
import appointmentRoutes from "./routes/appointment/appointmentRoutes.js";
import receptionistRoutes from"./routes/receptionist/receptionistRoutes.js";
import prescriptionRoutes from "./routes/prescription/prescriptionRoutes.js";
//AI 
import publicChatRoute from "./routes/ai/publicRoute.js";
import doctorChatRoute from "./routes/ai/doctorRoute.js";
import receptionistchatRoutes from "./routes/ai/receptionistChatRoutes.js";
//MCP public 
import publicDoctorRoutes from "./routes/public/doctorRoutes.js";
import publicClinicRoutes from "./routes/public/clinicRoutes.js";
import publicPatientRoutes from "./routes/public/patientRoutes.js";
import publicAppointmentRoutes from "./routes/public/appointmentRoutes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDb();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
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
app.use("/api/ai/public/chat", publicChatRoute);
app.use("/api/ai/receptionist/chat", receptionistchatRoutes);
app.use("/api/ai/doctor/chat", doctorChatRoute);
//mcp public API
app.use("/api/public/doctors", publicDoctorRoutes);
app.use("/api/public/clinic", publicClinicRoutes);
app.use("/api/public/patients", publicPatientRoutes);
app.use("/api/public/appointments", publicAppointmentRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to SafeSight AI");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});