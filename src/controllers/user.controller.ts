import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Please add all fields");
    }

    const [userExists]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      res.status(400);
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [newUser]: any = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, "user"] // Default role is 'user'
    );

    if (newUser.insertId) {
      res.status(201).json({
        _id: newUser.insertId,
        username: username,
        email: email,
        role: "user",
        token: generateToken(newUser.insertId),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
);

export const createStaffUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Please add all fields");
    }

    const [userExists]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      res.status(400);
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [newUser]: any = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, "operator"]
    );

    if (newUser.insertId) {
      res.status(201).json({
        _id: newUser.insertId,
        username: username,
        email: email,
        role: "operator",
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [user]: any = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);

  if (user.length > 0 && (await bcrypt.compare(password, user[0].password))) {
    res.json({
      _id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role,
      token: generateToken(user[0].id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// Generate JWT
const generateToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(req.user);
  }
);
