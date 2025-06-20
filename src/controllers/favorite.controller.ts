import { Request, Response } from "express";
import pool from "../db";
import { asyncHandler } from "../utils/asyncHandler";

// Add a hotel to user's favorites
export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { hotelId } = req.body;

  if (!hotelId) {
    res.status(400).json({ message: "Hotel ID is required" });
    return;
  }

  await pool.query(
    "INSERT INTO user_favorites (user_id, hotel_id) VALUES (?, ?)",
    [userId, hotelId]
  );
  res.status(201).json({ message: "Favorite added successfully" });
});

// Remove a hotel from user's favorites
export const removeFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { hotelId } = req.params;

    await pool.query(
      "DELETE FROM user_favorites WHERE user_id = ? AND hotel_id = ?",
      [userId, hotelId]
    );
    res.status(200).json({ message: "Favorite removed successfully" });
  }
);

// Get all favorite hotels for a user
export const getFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const [rows] = await pool.query(
      `
        SELECT h.* FROM hotels h
        JOIN user_favorites uf ON h.id = uf.hotel_id
        WHERE uf.user_id = ?
    `,
      [userId]
    );

    res.status(200).json(rows);
  }
);
