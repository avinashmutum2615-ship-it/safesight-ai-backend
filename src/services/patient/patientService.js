import Patient from "../../models/Patient.js";
import Appointment from "../../models/Appointment.js";
import { generatePatientId } from "../../../utils/generatePatientId.js";
import { patientResponse } from "../../../utils/dto/patientResponse.js";
import { normalizePatient } from "../../../utils/normalizer.js";
import { patientHistoryResponse } from "../../../utils/dto/patientHistoryResponse.js";

export async function createPatientService(data) {

    data = normalizePatient(data);

    const patientId = await generatePatientId();

    const patient = new Patient({
        patientId,
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        email: data.email,
        address: data.address,
        bloodGroup: data.bloodGroup,
        emergencyContact: data.emergencyContact,
    });

    await patient.save();

    return patient;

}

export async function getAllPatientsService() {

    const patients = await Patient
        .find({ isActive: true })
        .sort({ createdAt: -1 });

    return patients;

}

export async function getPatientByIdService(id) {

    const patient = await Patient.findById(id);

    if (!patient) {
        throw new Error("Patient not found.");
    }

    return patient;

}

export async function getPatientDocument(keyword) {

    const patient = await Patient.findOne({
        isActive: true,
        $or: [
            {
                patientId: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                name: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                phone: {
                    $regex: keyword,
                    $options: "i",
                },
            },
        ],
    });

    return patient;

}

export async function searchPatientsService(keyword) {

    const patients = await Patient.find({
        isActive: true,
        $or: [
            {
                patientId: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                name: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                phone: {
                    $regex: keyword,
                    $options: "i",
                },
            },
        ],
    });

    return patients.map(patient => patientResponse(patient));

}

export async function updatePatientService(id, data) {

    const patient = await Patient.findById(id);

    if (!patient) {
        throw new Error("Patient not found.");
    }

    patient.name = data.name;
    patient.gender = data.gender;
    patient.dateOfBirth = data.dateOfBirth;
    patient.phone = data.phone;
    patient.email = data.email;
    patient.address = data.address;
    patient.bloodGroup = data.bloodGroup;
    patient.emergencyContact = data.emergencyContact;

    await patient.save();

    return patient;

}

export async function deletePatientService(id) {

    const patient = await Patient.findById(id);

    if (!patient) {
        throw new Error("Patient not found.");
    }

    patient.isActive = false;

    await patient.save();

    return {
        message: "Patient deleted successfully.",
    };

}

export async function getPatientHistoryService(keyword) {

    const patient = await getPatientDocument(keyword);

    if (!patient) {
        throw new Error("Patient not found.");
    }

    const appointments = await Appointment.find({
        patient: patient._id,
    })
        .populate({
            path: "doctor",
            populate: {
                path: "userId",
                select: "name",
            },
        })
        .sort({
            appointmentDate: -1,
        });

    return patientHistoryResponse(
        patient,
        appointments
    );
}

export async function findOrCreatePatientService(data) {

    let patient = await Patient.findOne({
        phone: data.phone,
        isActive: true,
    });

    if (patient) {
        return patient;
    }

    return await createPatientService({
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        email: data.email,
        address: data.address,
        bloodGroup: data.bloodGroup,
        emergencyContact: data.emergencyContact,
    });

}