import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import pool from "./db";
import { createUserTable } from "./models/user.model";
import { createHotelTable } from "./models/hotel.model";
import userRoutes from "./routes/user.routes";
import hotelRoutes from "./routes/hotel.routes";
import flightRoutes from "./routes/flight.routes";
import favoriteRoutes from "./routes/favorite.routes";
import bookingRoutes from "./routes/booking.routes";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Wanderlust Travel API",
      version: "1.0.0",
      description: "API documentation for the Wanderlust Travel assessment.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the files containing OpenAPI annotations
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/bookings", bookingRoutes);

// Swagger Page
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// A simple welcome route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, this is the Wanderlust Travel API!");
});

const initializeDatabase = async () => {
  try {
    // Test the connection
    const connection = await pool.getConnection();
    console.log("Successfully connected to the database.");
    connection.release();

    // Ensure all tables are created
    await createUserTable();
    await createHotelTable();
  } catch (error) {
    console.error("Failed to initialize the database:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
};

startServer();
