import express from "express";
const router = express.Router();
router.use((req, res) =>
  res
    .status(403)
    .json({
      success: false,
      message:
        "Patient records require staff authentication. Use the appointment form to request a booking.",
    }),
);
export default router;
