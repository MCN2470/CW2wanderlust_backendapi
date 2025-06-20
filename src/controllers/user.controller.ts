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
        id: newUser.insertId,
        username: username,
        email: email,
        role: userRole,
        token: generateToken(newUser.insertId, userRole),
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
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// Generate JWT
const generateToken = (id: number, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(req.user);
  }
);

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  console.log(`--- Fetching user by ID: ${req.params.id} ---`);
  const [user]: any = await pool.query(
    "SELECT id, username, email, role, profile_photo_url FROM users WHERE id = ?",
    [req.params.id]
  );
  if (user.length > 0) {
    console.log("Found user:", user[0]);
    res.json(user[0]);
  } else {
    console.log(`User with ID ${req.params.id} not found in database.`);
    res.status(404);
    throw new Error("User not found");
  }
});

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const authenticatedUserId = (req.user as any).id;

    // Ensure users can only update their own profile
    if (parseInt(userId) !== authenticatedUserId) {
      res.status(403);
      throw new Error("You are not authorized to update this profile.");
    }

    let profile_photo_url = req.body.profile_photo_url;

    // Check if a new file was uploaded
    if (req.file) {
      // The file path will be relative, e.g., 'public/uploads/profile_photo-...'
      // We need to remove the 'public' part for the URL path.
      const filePath = req.file.path.replace(/\\/g, "/").replace("public/", "");
      const protocol = req.protocol;
      const host = req.get("host");
      profile_photo_url = `${protocol}://${host}/${filePath}`;
    }

    // If there's neither a new file nor an existing URL in the body, do nothing.
    // Or handle as an error if a profile picture is mandatory.
    // For now, we'll just update if we have a URL.
    if (!profile_photo_url) {
      // If you want to allow removing a photo, you could handle an empty string here.
      // For this implementation, we'll assume an update always provides a new photo.
      return res.status(400).json({ message: "No profile photo provided." });
    }

    try {
      const [result]: any = await pool.query(
        "UPDATE users SET profile_photo_url = ? WHERE id = ?",
        [profile_photo_url, userId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "User not found, no records updated." });
      }
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return res
        .status(500)
        .json({ message: "Failed to update profile in database." });
    }

    const [rows]: any = await pool.query(
      "SELECT id, username, email, role, profile_photo_url FROM users WHERE id = ?",
      [userId]
    );

    const updatedUser = rows[0];

    if (updatedUser) {
      const { id, username, email, role, profile_photo_url } = updatedUser;
      res.json({
        id,
        username,
        email,
        role,
        profile_photo_url,
        token: generateToken(id, role),
      });
    } else {
      res.status(404);
      throw new Error("User not found after update");
    }
  }
);
