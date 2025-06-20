import pool from "../db";

export const createHotelTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS hotels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      description TEXT,
      price_per_night DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(255),
      availability BOOLEAN DEFAULT true,
      star_rating INT,
      rating_text VARCHAR(50),
      rating_score DECIMAL(3, 1),
      review_count INT,
      location_score DECIMAL(3, 1),
      distance_from_downtown VARCHAR(100),
      room_type VARCHAR(255),
      room_beds VARCHAR(255),
      breakfast_included BOOLEAN DEFAULT false,
      free_cancellation BOOLEAN DEFAULT false,
      no_prepayment_needed BOOLEAN DEFAULT false,
      promo_message VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("Hotels table created or already exists.");
  } catch (error) {
    console.error("Error creating hotels table:", error);
  }
};
