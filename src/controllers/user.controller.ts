import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password, role = "public" } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?);
    `;

    const [result]: any = await pool.query(query, [
      username,
      email,
      hashedPassword,
      role,
    ]);
    const insertId = result.insertId;

    // After successful registration, automatically log the user in and return a token
    const [newUserRows]: any = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [insertId]
    );
    const user = newUserRows[0];

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
    }
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error during user registration." });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows]: any = await pool.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.json({ token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error during user login." });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  // If we get here, the 'protect' middleware has already run and
  // attached the user payload to the request.
  res.json(req.user);
};
