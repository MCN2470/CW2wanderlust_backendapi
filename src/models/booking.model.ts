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
        special_requests TEXT,
        arrival_time VARCHAR(255),
        add_on_flight BOOLEAN DEFAULT FALSE,
        add_on_car BOOLEAN DEFAULT FALSE,
        add_on_taxi BOOLEAN DEFAULT FALSE,
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
