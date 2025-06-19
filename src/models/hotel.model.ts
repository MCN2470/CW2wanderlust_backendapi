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
