import request from "supertest";
import express from "express";
import userRoutes from "../routes/user.routes";

// Create a new express app for testing
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User API", () => {
  it("should register a new public user and return a token", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      // No role provided, should default to 'public'
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });

  it("should register a new operator user and return a token", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "opuser",
      email: "op@example.com",
      password: "password123",
      role: "operator", // Explicitly set role
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    // Optional: decode token and check role
  });

  it("should fail to register a user with a duplicate email", async () => {
    // First, create a user
    await request(app).post("/api/users/register").send({
      username: "testuser1",
      email: "duplicate@example.com",
      password: "password123",
    });

    // Then, try to create another user with the same email
    const response = await request(app).post("/api/users/register").send({
      username: "testuser2",
      email: "duplicate@example.com",
      password: "password123",
    });

    expect(response.status).toBe(409);
  });

  it("should fail if required fields are missing", async () => {
    const response = await request(app).post("/api/users/register").send({
      username: "testuser",
      // Missing email and password
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Username, email, and password are required."
    );
  });

  it("should log in an existing user successfully", async () => {
    // Register user first
    await request(app).post("/api/users/register").send({
      username: "loginuser",
      email: "login@example.com",
      password: "password123",
    });

    // Then test login
    const res = await request(app).post("/api/users/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should fail to log in with an incorrect password", async () => {
    // Register user first
    await request(app).post("/api/users/register").send({
      username: "loginuser2",
      email: "login2@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/users/login").send({
      email: "login2@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials.");
  });

  it("should fail to log in with a non-existent email", async () => {
    const response = await request(app).post("/api/users/login").send({
      email: "nouser@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials.");
  });

  it("should get user profile with a valid token", async () => {
    const registerRes = await request(app).post("/api/users/register").send({
      username: "profileuser",
      email: "profile@example.com",
      password: "password123",
    });
    const token = registerRes.body.token;

    const profileRes = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body).toHaveProperty("username", "profileuser");
    expect(profileRes.body).toHaveProperty("role", "public");
  });

  it("should fail to get user profile without a token", async () => {
    const response = await request(app).get("/api/users/profile"); // No auth header

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Not authorized, no token");
  });

  it("should fail to get user profile with an invalid token", async () => {
    const response = await request(app)
      .get("/api/users/profile")
      .set("Authorization", "Bearer invalidtoken"); // Invalid token

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Not authorized, token failed"
    );
  });
});
