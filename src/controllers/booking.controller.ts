import { Request, Response } from "express";
import pool from "../db";
import { asyncHandler } from "../utils/asyncHandler";

export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      hotel_id,
      check_in_date,
      check_out_date,
      special_requests,
      arrival_time,
      add_on_flight,
      add_on_car,
      add_on_taxi,
    } = req.body;

    if (!hotel_id || !check_in_date || !check_out_date) {
      res.status(400).json({ message: "Missing required booking information" });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, hotel_id, check_in_date, check_out_date, special_requests, arrival_time, add_on_flight, add_on_car, add_on_taxi) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        hotel_id,
        check_in_date,
        check_out_date,
        special_requests,
        arrival_time,
        add_on_flight,
        add_on_car,
        add_on_taxi,
      ]
    );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: (result as any).insertId,
    });
  }
);
