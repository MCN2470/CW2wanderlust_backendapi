import pool from "../db";

export const createBookingTable = async () => {
  const client = await pool.getConnection();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      );
    `);
    console.log("Bookings table created or already exists.");
  } catch (error) {
    console.error("Error creating bookings table:", error);
    throw error;
  } finally {
    client.release();
  }
};
