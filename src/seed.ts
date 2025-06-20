import pool from "./db";
import { createHotelTable } from "./models/hotel.model";
import { createUserTable } from "./models/user.model";
import { createBookingTable } from "./models/booking.model";

const hotels = [
  {
    name: "Mokkoan",
    address: "Kita, Tokyo (Akabane)",
    city: "Tokyo",
    country: "Japan",
    description:
      "Japanese-Style Room with Garden View 101. Breakfast included. Free cancellation. No prepayment needed – pay at the property.",
    price_per_night: 1372.0,
    image_url: "/photo/mokkoan.jpg",
    star_rating: 2,
    rating_text: "Exceptional",
    rating_score: 9.9,
    review_count: 300,
    location_score: 9.3,
    distance_from_downtown: "9.6 km from downtown",
    room_type: "Japanese-Style Room with Garden View 101",
    room_beds: "3 futon beds",
    breakfast_included: true,
    free_cancellation: true,
    no_prepayment_needed: true,
    promo_message: "Only 1 room left at this price on our site",
  },
  {
    name: "The Langham Hong Kong",
    address: "Yau Tsim Mong District, Hong Kong (Tsim Sha Tsui)",
    city: "Hong Kong",
    country: "China",
    description:
      "Superior City View Twin Room. Sustainability certification. Subway Access.",
    price_per_night: 2392.0,
    image_url: "/photo/The Langham Hong Kong.jpg",
    star_rating: 5,
    rating_text: "Excellent",
    rating_score: 8.6,
    review_count: 1634,
    location_score: 9.4,
    distance_from_downtown: "1.9 km from downtown",
    room_type: "Superior City View Twin Room",
    room_beds: "2 twin beds",
    breakfast_included: false,
    free_cancellation: false,
    no_prepayment_needed: false,
    promo_message: null,
  },
  {
    name: "Star Hostel Taipei Main Station",
    address: "Datong District, Taipei",
    city: "Taipei",
    country: "Taiwan",
    description:
      "Double Room. Breakfast included. Free cancellation. No prepayment needed – pay at the property.",
    price_per_night: 864.0,
    image_url: "/photo/Star Hostel Taipei Main Station.jpg",
    star_rating: 1,
    rating_text: "Wonderful",
    rating_score: 9.3,
    review_count: 4505,
    location_score: 9.6,
    distance_from_downtown: "0.5 km from downtown",
    room_type: "Double Room",
    room_beds: "1 full bed",
    breakfast_included: true,
    free_cancellation: true,
    no_prepayment_needed: true,
    promo_message: "Only 5 rooms left at this price on our site",
  },
  {
    name: "Osaka Ukiyoe Ryokan",
    address: "Chuo Ward, Osaka",
    city: "Osaka",
    country: "Japan",
    description: "Japanese-Style Room. Subway Access.",
    price_per_night: 5586.0,
    image_url: "/photo/Osaka Ukiyoe Ryokan .jpg",
    star_rating: null,
    rating_text: "Exceptional",
    rating_score: 9.8,
    review_count: 185,
    location_score: 9.7,
    distance_from_downtown: "2.4 km from downtown",
    room_type: "Japanese-Style Room",
    room_beds: "6 futon beds",
    breakfast_included: false,
    free_cancellation: false,
    no_prepayment_needed: false,
    promo_message: "Only 1 room left at this price on our site",
  },
  {
    name: "Original Backpackers",
    address: "Jongno-Gu, Seoul",
    city: "Seoul",
    country: "South Korea",
    description: "Bed in 6-Bed Mixed Dormitory Room. Subway Access.",
    price_per_night: 1052.0,
    image_url: "/photo/Original Backpackers.jpg",
    star_rating: 1,
    rating_text: "Exceptional",
    rating_score: 9.7,
    review_count: 231,
    location_score: 9.7,
    distance_from_downtown: "3 km from downtown",
    room_type: "Bed in 6-Bed Mixed Dormitory Room",
    room_beds: "2 beds in dorms, 2 bunk beds",
    breakfast_included: false,
    free_cancellation: false,
    no_prepayment_needed: false,
    promo_message: null,
  },
];

const seedDatabase = async () => {
  const client = await pool.getConnection();
  try {
    // Drop the bookings table to ensure schema updates
    await client.query("DROP TABLE IF EXISTS user_favorites;");
    await client.query("DROP TABLE IF EXISTS bookings;");

    // Ensure tables exist before we do anything
    await createUserTable();
    await createHotelTable();
    await createBookingTable();
    console.log(
      "Users, Hotels, and Bookings tables checked/created successfully."
    );

    // Create user_favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
          user_id INT,
          hotel_id INT,
          PRIMARY KEY (user_id, hotel_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      );
    `);
    console.log("User favorites table created or already exists.");

    // Now, begin the transaction for seeding hotels
    await client.beginTransaction();

    // Clear the hotels table completely before seeding
    // Disable foreign key checks to allow truncating
    await client.query("SET FOREIGN_KEY_CHECKS = 0;");
    await client.query("TRUNCATE TABLE hotels");
    // Re-enable foreign key checks
    await client.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Insert all the fresh hotel data
    for (const hotel of hotels) {
      await client.query("INSERT INTO hotels SET ?", hotel);
    }

    await client.commit();
    console.log("Hotels table cleared and seeded successfully!");
  } catch (error) {
    await client.rollback();
    console.error("Error seeding database:", error);
  } finally {
    client.release();
  }
};

const runSeed = async () => {
  await seedDatabase();
  // We shouldn't end the pool here if the app needs it running
  // For a seed script that runs once, it's okay to end the pool.
  // But if this was part of a larger app, you'd want to manage the pool lifecycle differently.
  await pool.end();
};

runSeed();
