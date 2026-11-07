export default function visitResponse(visit) {
  return {
    id: visit._id,

    visitId: visit.visitId,

    appointment: {
      id: visit.appointment?._id,
    },

    patient: {
      id: visit.patient?._id,
      patientId: visit.patient?.patientId,
      name: visit.patient?.name,
      phone: visit.patient?.phone,
    },

    doctor: {
      id: visit.doctor?._id,
      name: visit.doctor?.userId?.name,
    },

    status: visit.status,

    checkedInAt: visit.checkedInAt,

    startedAt: visit.startedAt,

    completedAt: visit.completedAt,

    notes: visit.notes,

    createdAt: visit.createdAt,

    updatedAt: visit.updatedAt,
  };
}
