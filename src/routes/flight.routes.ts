import { Router } from "express";
import { searchFlights } from "../controllers/flight.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Flight searching via Amadeus API
 */

/**
 * @swagger
 * /api/flights/search:
 *   get:
 *     summary: Search for flight offers
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: IATA code for the origin city (e.g., LHR)
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: IATA code for the destination city (e.g., NYC)
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: A list of flight offers
 *       400:
 *         description: Missing required query parameters
 */
router.get("/search", asyncHandler(searchFlights));

export default router;
