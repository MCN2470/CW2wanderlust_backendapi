import mysql from "mysql2/promise";
import { createHotelTable } from "./models/hotel.model";
import { createUserTable } from "./models/user.model";
import { createMessagesTable } from "./models/message.model";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "wanderlust_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDb = async () => {
  try {
    await createUserTable();
    await createHotelTable();
    await createMessagesTable();
    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export default pool;
