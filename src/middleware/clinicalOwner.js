import Doctor from "../models/Doctor.js";
export function clinicalOwner(Model, getId) {
  return async (req, res, next) => {
    if (req.user.role === "admin") return next();
    try {
      const record = await Model.findById(getId(req));
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!record || !doctor || String(record.doctor) !== String(doctor.id))
        return res
          .status(403)
          .json({
            success: false,
            message: "This record is not assigned to you.",
          });
      next();
    } catch {
      res
        .status(400)
        .json({ success: false, message: "Invalid clinical record." });
    }
  };
}
