import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },

        appointmentDate: {
            type: Date,
            required: true
        },

        appointmentTime: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending Confirmation",
                "Confirmed",
                "Checked In",
                "In Consultation",
                "Completed",
                "Cancelled",
                "No Show"
            ],
            default: "Pending Confirmation"
        },

        source: {
            type: String,
            enum: [
                "Walk-in",
                "Phone",
                "Website",
                "MCP"
            ],
            default: "Walk-in"
        },

        reason: {
            type: String,
            trim: true,
            default: ""
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Appointment", appointmentSchema);