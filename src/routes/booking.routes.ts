import { Router } from "express";
import {
  createBooking,
  getAllBookings,
} from "../controllers/booking.controller";
import { protect, isOperator } from "../middleware/auth.middleware";

const router = Router();

router
  .route("/")
  .post(protect, createBooking)
  .get(protect, isOperator, getAllBookings);

export default router;
