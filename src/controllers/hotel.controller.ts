import { Request, Response } from "express";
import pool from "../db";
import * as HotelbedsService from "../services/hotelbeds.service";

// @desc    Fetch all hotels with filtering
// @route   GET /api/hotels
// @access  Public
export const getHotels = async (req: Request, res: Response) => {
  let { destinationCode, checkIn, checkOut, adults, children, rooms } =
    req.query;

  if (!destinationCode) {
    return res
      .status(400)
      .json({ message: "destinationCode query parameter is required." });
  }

  if (destinationCode === "Lanzarote") {
    destinationCode = "ACE";
  }

  try {
    const data = await HotelbedsService.searchHotelsByDestination(
      destinationCode as string,
      checkIn as string,
      checkOut as string,
      parseInt(adults as string, 10),
      parseInt(children as string, 10),
      parseInt(rooms as string, 10)
    );

    if (!data.hotels || data.hotels.hotels.length === 0) {
      return res.json({ hotels: [] });
    }

    const availableHotels = data.hotels.hotels;
    const hotelCodes = availableHotels.map((h: any) => h.code);

    const detailsData = await HotelbedsService.getHotelDetails(hotelCodes);

    const hotelsWithImages = availableHotels.map((hotel: any) => {
      const detail = detailsData.hotels.find((d: any) => d.code === hotel.code);
      return {
        ...hotel,
        images: detail ? detail.images : [],
      };
    });

    res.json({ hotels: hotelsWithImages });
  } catch (error) {
    console.error("Error in getHotels controller:", error);
    res.status(500).json({ message: "Failed to fetch hotels from provider." });
  }
};

// @desc    Fetch featured hotels from local DB
// @route   GET /api/hotels/featured
// @access  Public
export const getFeaturedHotels = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM hotels ORDER BY id LIMIT 5");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching featured hotels:", error);
    res.status(500).json({ message: "Failed to fetch featured hotels." });
  }
};

// @desc    Fetch single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
export const getHotelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM hotels WHERE id = ?", [id]);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching hotel with id ${id}:`, error);
    res.status(500).json({ message: "Failed to fetch hotel." });
  }
};

// @desc    Add a new hotel
// @route   POST /api/hotels
// @access  Private/Operator
export const addHotel = async (req: Request, res: Response) => {
  const {
    name,
    address,
    city,
    country,
    description,
    price_per_night,
    image_url,
  } = req.body;

  if (!name || !address || !city || !country || !price_per_night) {
    return res
      .status(400)
      .json({ message: "Please provide all required hotel details." });
  }

  const query = `
    INSERT INTO hotels (name, address, city, country, description, price_per_night, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const [result]: any = await pool.query(query, [
    name,
    address,
    city,
    country,
    description,
    price_per_night,
    image_url,
  ]);

  res.status(201).json({ id: result.insertId, ...req.body });
};

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private/Operator
export const updateHotel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    address,
    city,
    country,
    description,
    price_per_night,
    image_url,
    availability,
  } = req.body;

  const query = `
    UPDATE hotels SET
      name = ?, address = ?, city = ?, country = ?, description = ?,
      price_per_night = ?, image_url = ?, availability = ?
    WHERE id = ?;
  `;
  await pool.query(query, [
    name,
    address,
    city,
    country,
    description,
    price_per_night,
    image_url,
    availability,
    id,
  ]);

  res.json({ message: "Hotel updated successfully." });
};

// @desc    Delete a hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Operator
export const deleteHotel = async (req: Request, res: Response) => {
  const { id } = req.params;

  const query = "DELETE FROM hotels WHERE id = ?";
  await pool.query(query, [id]);

  res.json({ message: "Hotel removed successfully." });
};
