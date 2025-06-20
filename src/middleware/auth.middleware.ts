import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import pool from "../db";

// We need to add the 'user' property to the Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const protectMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("--- Executing Protect Middleware ---");
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      console.log("Authorization header found.");
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      console.log("Token received:", token);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
      };
      console.log("Token decoded successfully. User ID:", decoded.id);

      // Get user from the token and attach to request
      const [rows]: any = await pool.query(
        "SELECT id, username, email, role, profile_photo_url FROM users WHERE id = ?",
        [decoded.id]
      );
      console.log("Database query for user executed.");

      if (rows.length === 0) {
        console.log("User not found in DB for ID:", decoded.id);
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      req.user = rows[0];
      console.log("User attached to request object:", req.user);

      return next();
    } catch (error) {
      console.error("!!! Error in protect middleware:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    console.log("No token found in request.");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const protect = asyncHandler(protectMiddleware);

export const isOperator = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "operator") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an operator" });
  }
};

export const operatorProtect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === "operator") {
      next();
    } else {
      res.status(403);
      throw new Error("Not authorized as an operator");
    }
  }
);
