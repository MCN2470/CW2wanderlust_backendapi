import { Request, Response } from "express";
import pool from "../db";
import * as HotelbedsService from "../services/hotelbeds.service";

// @desc    Fetch all hotels from DB
// @route   GET /api/hotels
// @access  Public
export const getAllHotelsFromDB = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM hotels");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching hotels from DB:", error);
    res.status(500).json({ message: "Failed to fetch hotels." });
  }
};

// @desc    Fetch all hotels with filtering from Hotelbeds
// @route   GET /api/hotels/search
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
    console.log("Hotel search parameters:", {
      destinationCode,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    });

    const data = await HotelbedsService.searchHotelsByDestination(
      destinationCode as string,
      checkIn as string,
      checkOut as string,
      parseInt(adults as string, 10),
      parseInt(children as string, 10),
      parseInt(rooms as string, 10)
    );

    console.log("Hotelbeds API response:", JSON.stringify(data, null, 2));

    if (!data.hotels || data.hotels.hotels.length === 0) {
      console.log("No hotels found in API response");
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

    // Don't fallback to local hotels - this page is for external hotel search only
    console.log("External hotel search API is unavailable");
    res.status(503).json({
      message: "Hotel search service is temporarily unavailable",
      error:
        "External hotel booking API is currently down. Please try again later.",
      hotels: [],
    });
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
  console.log("Raw request body:", req.body);

  const {
    name,
    address,
    city,
    country,
    description,
    price_per_night,
    image_url,
    availability,
    star_rating,
    rating_text,
    rating_score,
    review_count,
    location_score,
    distance_from_downtown,
    room_type,
    room_beds,
    breakfast_included,
    free_cancellation,
    no_prepayment_needed,
    promo_message,
  } = req.body;

  if (!name || !address || !city || !country || !price_per_night) {
    return res
      .status(400)
      .json({ message: "Please provide all required hotel details." });
  }

  const query = `
    INSERT INTO hotels (name, address, city, country, description, price_per_night, image_url, availability, star_rating, rating_text, rating_score, review_count, location_score, distance_from_downtown, room_type, room_beds, breakfast_included, free_cancellation, no_prepayment_needed, promo_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const parseBoolean = (value: any) => /^(true|1)$/i.test(value);

  const values = [
    name,
    address,
    city,
    country,
    description,
    parseFloat(price_per_night),
    image_url,
    parseBoolean(availability),
    parseInt(star_rating, 10),
    rating_text,
    parseFloat(rating_score),
    parseInt(review_count, 10),
    parseFloat(location_score),
    distance_from_downtown,
    room_type,
    parseInt(room_beds, 10),
    parseBoolean(breakfast_included),
    parseBoolean(free_cancellation),
    parseBoolean(no_prepayment_needed),
    promo_message,
  ];

  console.log("Processed values for database:", values);

  const [result]: any = await pool.query(query, values);

  const [rows]: any = await pool.query("SELECT * FROM hotels WHERE id = ?", [
    result.insertId,
  ]);

  console.log("Hotel saved to database:", rows[0]);

  res.status(201).json(rows[0]);
};

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private/Operator
export const updateHotel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;

  const validFields = [
    "name",
    "address",
    "city",
    "country",
    "description",
    "price_per_night",
    "image_url",
    "availability",
    "star_rating",
    "rating_text",
    "rating_score",
    "review_count",
    "location_score",
    "distance_from_downtown",
    "room_type",
    "room_beds",
    "breakfast_included",
    "free_cancellation",
    "no_prepayment_needed",
    "promo_message",
  ];

  const numericFields = [
    "price_per_night",
    "star_rating",
    "rating_score",
    "review_count",
    "location_score",
    "room_beds",
  ];
  const booleanFields = [
    "availability",
    "breakfast_included",
    "free_cancellation",
    "no_prepayment_needed",
  ];
  const parseBoolean = (value: any) => /^(true|1)$/i.test(value);

  const updates = Object.keys(fieldsToUpdate)
    .filter((key) => validFields.includes(key) && fieldsToUpdate[key] != null)
    .map((key) => `${key} = ?`);

  if (updates.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  const values = Object.keys(fieldsToUpdate)
    .filter((key) => validFields.includes(key) && fieldsToUpdate[key] != null)
    .map((key) => {
      let value = fieldsToUpdate[key];
      if (numericFields.includes(key)) {
        return parseFloat(value);
      }
      if (booleanFields.includes(key)) {
        return parseBoolean(value);
      }
      return value;
    });

  const query = `UPDATE hotels SET ${updates.join(", ")} WHERE id = ?;`;
  await pool.query(query, [...values, id]);

  const [rows]: any = await pool.query("SELECT * FROM hotels WHERE id = ?", [
    id,
  ]);

  res.json(rows[0]);
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
