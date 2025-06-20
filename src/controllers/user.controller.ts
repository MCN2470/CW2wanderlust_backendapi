import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password, role, signupCode } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Please add all fields");
    }

    if (
      role === "operator" &&
      signupCode !== process.env.OPERATOR_SIGNUP_CODE
    ) {
      res.status(401);
      throw new Error("Invalid signup code for operator");
    }

    const [userExists]: any = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (userExists.length > 0) {
      res.status(400);
      throw new Error("User with that email or username already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role === "operator" ? "operator" : "user";

    const [newUser]: any = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, userRole]
    );

    if (newUser.insertId) {
      res.status(201).json({
        _id: newUser.insertId,
        username: username,
        email: email,
        role: userRole,
        token: generateToken(newUser.insertId),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [userResult]: any = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (userResult.length === 0) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const user = userResult[0];

  if (await bcrypt.compare(password, user.password)) {
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
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
