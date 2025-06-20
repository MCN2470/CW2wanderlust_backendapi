import { Router } from "express";
import { createBooking } from "../controllers/booking.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.route("/").post(protect, createBooking);

export default router;
