import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

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
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

      // Attach user to the request object
      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
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
