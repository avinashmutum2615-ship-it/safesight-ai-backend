import {
    createPatientService,
    getAllPatientsService,
    getPatientByIdService,
    searchPatientsService,
    updatePatientService,
    deletePatientService,
} from "../../services/patient/patientService.js";

export async function createPatient(req, res) {
    try {

        const patient = await createPatientService(req.body);

    res.status(201).json({
        success: true,
        patient: patientResponse(patient),
    });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
}

export async function getAllPatients(req, res) {
    try {

        const patients = await getAllPatientsService();

    res.json({
        success: true,
        patients: patients.map(patientResponse),
    });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
}

export async function getPatientById(req, res) {
    try {

        const patient = await getPatientByIdService(req.params.id);

        res.json({
            success: true,
            patient: patientResponse(patient),
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message,
        });

    }
}

export async function searchPatients(req, res) {
    try {

        const keyword = req.query.keyword || "";

        const patients = await searchPatientsService(keyword);

        res.json({
            success: true,
            patients,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
}

export async function updatePatient(req, res) {
    try {

        const patient = await updatePatientService(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            message: "Patient updated successfully.",
            patient,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
}

export async function deletePatient(req, res) {
    try {

        const result = await deletePatientService(req.params.id);

        res.json({
            success: true,
            message: result.message,
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message,
        });

    }
}