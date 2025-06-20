import pool from "../db";

export const createUserFavoritesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id INT,
      hotel_id INT,
      PRIMARY KEY (user_id, hotel_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );
  `;
  try {
    await pool.query(query);
    console.log("User favorites table created or already exists.");
  } catch (error) {
    console.error("Error creating user favorites table:", error);
  }
};
