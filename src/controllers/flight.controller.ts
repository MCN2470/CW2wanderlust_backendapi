import { Request, Response } from "express";
import * as AmadeusService from "../services/amadeus.service";

// @desc    Search for flights
// @route   GET /api/flights/search
// @access  Public
export const searchFlights = async (req: Request, res: Response) => {
  const { origin, destination, date } = req.query;

  if (!origin || !destination || !date) {
    return res
      .status(400)
      .json({ message: "Origin, destination, and date are required." });
  }

  try {
    const flightData = await AmadeusService.searchFlights(
      origin as string,
      destination as string,
      date as string
    );
    res.json(flightData);
  } catch (error: any) {
    console.error(
      "Error searching flights:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ message: "Failed to fetch flight data from external API." });
  }
};
