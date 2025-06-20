import { Router } from "express";
import {
  getHotels,
  getFeaturedHotels,
  addHotel,
  updateHotel,
  deleteHotel,
  getHotelById,
  getAllHotelsFromDB,
} from "../controllers/hotel.controller";
import { protect, isOperator } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel management and browsing
 */

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Retrieve a list of hotels with optional filters
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for hotel name or description
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *     responses:
 *       200:
 *         description: A list of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   city:
 *                     type: string
 *                   price_per_night:
 *                     type: number
 */
router.get("/", asyncHandler(getAllHotelsFromDB));
router.get("/search", asyncHandler(getHotels));

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Add a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city, country, price_per_night]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               price_per_night:
 *                 type: number
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user is not an operator
 */
router.post("/", protect, isOperator, asyncHandler(addHotel));

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Update a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               availability:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user is not an operator
 */
router.put("/:id", protect, isOperator, asyncHandler(updateHotel));

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Delete a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hotel removed successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user is not an operator
 */
router.delete("/:id", protect, isOperator, asyncHandler(deleteHotel));

router.get("/featured", asyncHandler(getFeaturedHotels));

router.get("/:id", asyncHandler(getHotelById));

export default router;
