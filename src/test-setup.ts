import pool from "./db";

// This function will run before each test file
beforeAll(async () => {
  // You can add global setup here if needed
});

// This function will run before each individual test
beforeEach(async () => {
  // Clear all tables to ensure a clean state for every test
  await pool.query("DELETE FROM hotels");
  await pool.query("DELETE FROM users");
});

// This function will run after all tests in a file are complete
afterAll(async () => {
  // Close the database connection to allow Jest to exit cleanly
  await pool.end();
});
