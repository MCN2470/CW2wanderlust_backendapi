import pool from "./db";
import { createHotelTable } from "./models/hotel.model";
import { createUserTable } from "./models/user.model";
import { createUserFavoritesTable } from "./models/user-favorites.model";
import { createBookingsTable } from "./models/booking.model";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");

    // Drop tables in reverse order of creation to handle foreign keys
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("DROP TABLE IF EXISTS user_favorites;");
    await pool.query("DROP TABLE IF EXISTS bookings;");
    await pool.query("DROP TABLE IF EXISTS hotels;");
    await pool.query("DROP TABLE IF EXISTS users;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Dropped existing tables.");

    // Create tables
    await createUserTable();
    await createHotelTable();
    await createUserFavoritesTable();
    await createBookingsTable();
    console.log("All tables created or already exist.");

    // Clear existing data from tables that will be seeded
    // Drop dependent tables first
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE user_favorites;");
    await pool.query("TRUNCATE TABLE bookings;");
    await pool.query("TRUNCATE TABLE hotels;");
    await pool.query("TRUNCATE TABLE users;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log(
      "Truncated users, hotels, user_favorites, and bookings tables."
    );

    // Seed Operator User
    const adminEmail = "admin@wanderlust.com";
    const [adminExists] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [adminEmail]
    );

    if ((adminExists as any[]).length === 0) {
      const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "password123";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await pool.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        ["admin", adminEmail, hashedPassword, "operator"]
      );
      console.log("Seeded admin user.");
    } else {
      console.log("Admin user already exists.");
    }

    // Seed hotels
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

    // Insert all the fresh hotel data
    for (const hotel of hotels) {
      await pool.query("INSERT INTO hotels SET ?", hotel);
    }

    console.log("Hotels table cleared and seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    console.log("Seeding process finished.");
    await pool.end();
  }
};

seedDatabase();
