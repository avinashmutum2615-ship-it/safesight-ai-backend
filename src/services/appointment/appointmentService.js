import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import appointmentResponse from "../../../utils/dto/appointmentResponse.js";
import { getPatientDocument, findOrCreatePatientService } from "../patient/patientService.js";
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

    const patient = await findOrCreatePatientService(data);

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
            "This doctor already has an appointment at the selected time."
        );

    }

    const availableSlots = await getAvailableSlotsService(
        doctor._id,
        data.appointmentDate
    );

    if (!availableSlots.includes(data.appointmentTime)) {
        throw new Error("Selected time slot is unavailable.");
    }

    const appointment = await Appointment.create({

        patient: patient._id,

        doctor: doctor._id,

        appointmentDate: data.appointmentDate,

        appointmentTime: data.appointmentTime,

        status: data.status || "Pending Confirmation",

        source: data.source || "Walk-in",

        reason: data.reason,

        notes: data.notes,

        createdBy: userId

    });

    await appointment.populate([
        {
            path: "patient",
            select: "patientId name phone"
        },
        {
            path: "doctor",
            select: "name"
        }
    ]);

    return appointmentResponse(appointment);

};

export const getAllAppointmentsService = async () => {

    const appointments = await Appointment.find({

        isActive: true

    })
        .populate({
            path: "patient",
            select: "patientId name phone"
        })
        .populate({
            path: "doctor",
            select: "name"
        })
        .sort({
            appointmentDate: 1,
            appointmentTime: 1
        });

    return appointments.map(appointmentResponse);

};

export const getAppointmentByIdService = async (id) => {

    const appointment = await Appointment.findById(id)
        .populate({
            path: "patient",
            select: "patientId name phone email address bloodGroup emergencyContact"
        })
        .populate({
            path: "doctor",
            select: "name"
        });

    if (!appointment || !appointment.isActive) {
        throw new Error("Appointment not found.");
    }

    return appointmentResponse(appointment);

};

export const updateAppointmentService = async (
    id,
    data,
    userId
) => {

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

    // Prevent duplicate slot booking
    const existingAppointment = await Appointment.findOne({

        _id: { $ne: appointment._id },

        doctor: doctor._id || doctor,

        appointmentDate: data.appointmentDate,

        appointmentTime: data.appointmentTime,

        isActive: true,

        status: {
            $nin: [
                "Cancelled",
                "Completed",
                "No Show"
            ]
        }

    });

    if (existingAppointment) {

        throw new Error(
            "This doctor already has an appointment at the selected time."
        );

    }

    // Update allowed fields
    if (data.doctor) {
        appointment.doctor = doctor._id;
    }

    if (data.appointmentDate) {
        appointment.appointmentDate = data.appointmentDate;
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
            select: "patientId name phone"
        },
        {
            path: "doctor",
            select: "name"
        }
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
    excludeAppointmentId = null
) => {

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new Error("Doctor not found.");
    }

    if (
        !doctor.availability ||
        !doctor.availability.status
    ) {
        throw new Error("Doctor is currently unavailable.");
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {

        doctor: doctorId,

        appointmentDate: {
            $gte: startOfDay,
            $lte: endOfDay
        },

        isActive: true,

        status: {
            $nin: [
                "Cancelled",
                "Completed",
                "No Show"
            ]
        }

    };

    if (excludeAppointmentId) {

        query._id = {
            $ne: excludeAppointmentId
        };

    }

    const bookedAppointments = await Appointment.find(query)
        .select("appointmentTime");

    const bookedSlots = bookedAppointments.map(
        appointment => appointment.appointmentTime
    );

    const {
        startTime,
        endTime,
        slotDuration,
        breaks = []
    } = doctor.availability;

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    const allSlots = [];

    for (
        let current = start;
        current + slotDuration <= end;
        current += slotDuration
    ) {

        const slot = minutesToTime(current);

        const isBreak = breaks.some((br) => {

            const breakStart = timeToMinutes(br.start);
            const breakEnd = timeToMinutes(br.end);

            return (
                current >= breakStart &&
                current < breakEnd
            );

        });

        if (!isBreak) {
            allSlots.push(slot);
        }

    }

    return allSlots.filter(
        slot => !bookedSlots.includes(slot)
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
            select: "name specialization",
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
            $lt: tomorrow
        },
        isActive: true
    });

    const booked = await Appointment.countDocuments({
        status: "Confirmed",
        isActive: true
    });

    const completed = await Appointment.countDocuments({
        status: "Completed",
        isActive: true
    });

    const cancelled = await Appointment.countDocuments({
        status: "Cancelled",
        isActive: true
    });

    const availableDoctors = await Doctor.countDocuments({
        "availability.status": true
    });

    return {
        todayAppointments,
        booked,
        completed,
        cancelled,
        availableDoctors
    };
};

export const cancelAppointmentService = async (
    appointmentId,
    userId
) => {

    const appointment = await getAppointmentService({
        appointmentId,
    });

    if (appointment.status === "Cancelled") {
        throw new Error("Appointment is already cancelled.");
    }

    appointment.status = "Cancelled";

    appointment.updatedBy = userId;

    await appointment.save();

    await appointment.populate([
        {
            path: "patient",
            select: "patientId name phone"
        },
        {
            path: "doctor",
            select: "name"
        }
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
            select: "name specialization",
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
export async function startConsultationService(
    doctorId,
    patientKeyword
) {

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
        throw new Error(
            "Today's appointment not found."
        );
    }

    if (
        !["Confirmed", "Checked In"].includes(
            appointment.status
        )
    ) {
        throw new Error(
            `Cannot start consultation because appointment is currently '${appointment.status}'.`
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
            "Patient not found. Please check the name and registered phone number."
        );
    }

    // Find active appointment
    const appointment = await Appointment.findOne({
        patient: patient._id,
        isActive: true,
        status: {
            $nin: [
                "Cancelled",
                "Completed",
                "No Show",
            ],
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
        appointment._id
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
            select: "name",
        },
    ]);

    return appointmentResponse(appointment);

};

export const cancelPublicAppointmentService = async ({
    name,
    phone,
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
            "Patient not found. Please check the name and registered phone number."
        );
    }

    // Find active appointment
    const appointment = await Appointment.findOne({
        patient: patient._id,
        isActive: true,
        status: {
            $nin: [
                "Cancelled",
                "Completed",
                "No Show",
            ],
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
            select: "name",
        },
    ]);

    return appointmentResponse(appointment);

};