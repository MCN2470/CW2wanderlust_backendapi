import request from "supertest";
import express from "express";
import pool from "../db";
import jwt from "jsonwebtoken";
import userRoutes from "../routes/user.routes";
import hotelRoutes from "../routes/hotel.routes";

// Create a new express app for testing
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/hotels", hotelRoutes);

describe("Hotel API", () => {
  let operatorToken: string;
  let publicToken: string;

  // Runs before each test in this suite
  beforeEach(async () => {
    // The global beforeEach clears tables. We create fresh users for each test.

    // Create an operator user and get their token
    const opRes = await request(app).post("/api/users/register").send({
      username: "hotel_op",
      email: "hotel_op@test.com",
      password: "password",
      role: "operator",
    });
    operatorToken = opRes.body.token;

    // Create a public user and get their token
    const publicRes = await request(app).post("/api/users/register").send({
      username: "hotel_user",
      email: "hotel_user@test.com",
      password: "password",
      role: "public",
    });
    publicToken = publicRes.body.token;
  });

  describe("POST /api/hotels", () => {
    it("should allow an operator to add a hotel", async () => {
      const res = await request(app)
        .post("/api/hotels")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({
          name: "Grand Hotel",
          city: "Anytown",
          country: "USA",
          price_per_night: 250.0,
          address: "123 Main St",
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Grand Hotel");
    });

    it("should prevent a public user from adding a hotel", async () => {
      const res = await request(app)
        .post("/api/hotels")
        .set("Authorization", `Bearer ${publicToken}`)
        .send({
          name: "Public Hotel",
          city: "Otherville",
          country: "USA",
          price_per_night: 150.0,
          address: "456 Side St",
        });
      expect(res.status).toBe(403);
    });

    it("should prevent an unauthenticated user from adding a hotel", async () => {
      const res = await request(app).post("/api/hotels").send({
        name: "No Auth Hotel",
        city: "Unauth",
        country: "USA",
        price_per_night: 100.0,
        address: "789 Back St",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/hotels", () => {
    it("should return all available hotels", async () => {
      // Add hotels for this specific test
      await pool.query(
        "INSERT INTO hotels (name, address, city, country, price_per_night, availability) VALUES ('Hotel 1', 'a', 'A', 'USA', 100, true), ('Hotel 2', 'b', 'B', 'USA', 200, true), ('Hotel 3', 'c', 'C', 'USA', 300, false)"
      );

      const res = await request(app).get("/api/hotels");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // Only available hotels should be returned
    });

    it("should filter hotels by city", async () => {
      await pool.query(
        "INSERT INTO hotels (name, address, city, country, price_per_night, availability) VALUES ('Hotel A', 'a', 'Seaview', 'USA', 100, true), ('Hotel B', 'b', 'Hilltop', 'USA', 200, true)"
      );

      const res = await request(app).get("/api/hotels?city=Seaview");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Hotel A");
    });

    it("should filter hotels by price range", async () => {
      await pool.query(
        "INSERT INTO hotels (name, address, city, country, price_per_night, availability) VALUES ('Cheap Hotel', 'a', 'A', 'USA', 100, true), ('Mid-Range Hotel', 'b', 'B', 'USA', 250, true), ('Expensive Hotel', 'c', 'C', 'USA', 500, true)"
      );

      const res = await request(app).get(
        "/api/hotels?minPrice=200&maxPrice=300"
      );
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Mid-Range Hotel");
    });

    it("should filter hotels by search term", async () => {
      await pool.query(
        "INSERT INTO hotels (name, address, city, country, price_per_night, availability) VALUES ('Beachside Resort', 'a', 'A', 'USA', 100, true), ('Mountain Lodge', 'b', 'B', 'USA', 200, true)"
      );

      const res = await request(app).get("/api/hotels?search=Lodge");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Mountain Lodge");
    });
  });

  describe("PUT /api/hotels/:id", () => {
    it("should allow an operator to update a hotel", async () => {
      const [result] = await pool.query(
        "INSERT INTO hotels (name, city, country, price_per_night, address) VALUES ('Original Name', 'City', 'Country', 100, 'Address')"
      );
      const hotelId = (result as any).insertId;

      const res = await request(app)
        .put(`/api/hotels/${hotelId}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({ name: "Updated Name", price_per_night: 150 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Hotel updated successfully.");

      const [updatedHotel] = await pool.query(
        "SELECT name, price_per_night FROM hotels WHERE id = ?",
        [hotelId]
      );
      expect((updatedHotel as any)[0].name).toBe("Updated Name");
      expect(parseFloat((updatedHotel as any)[0].price_per_night)).toBe(150);
    });
  });

  describe("DELETE /api/hotels/:id", () => {
    it("should allow an operator to delete a hotel", async () => {
      const [result] = await pool.query(
        "INSERT INTO hotels (name, city, country, price_per_night, address) VALUES ('To Be Deleted', 'City', 'Country', 100, 'Address')"
      );
      const hotelId = (result as any).insertId;

      const res = await request(app)
        .delete(`/api/hotels/${hotelId}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Hotel removed successfully.");

      const [deletedHotel] = await pool.query(
        "SELECT * FROM hotels WHERE id = ?",
        [hotelId]
      );
      expect((deletedHotel as any).length).toBe(0);
    });
  });
});
