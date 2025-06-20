import axios, { InternalAxiosRequestConfig } from "axios";
import crypto from "crypto";

const API_KEY = "0bbfcf4726eed4c7e4ffff83b4f05102";
const API_SECRET = "1d6d95b307";
const API_BASE_URL = "https://api.test.hotelbeds.com";

if (!API_KEY || !API_SECRET) {
  throw new Error(
    "Missing Hotelbeds API key or secret in environment variables"
  );
}

const getSignature = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha256")
    .update(API_KEY + API_SECRET + timestamp)
    .digest("hex");
  return signature;
};

const hotelbedsApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Api-key": API_KEY,
    "Accept-Encoding": "gzip",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

hotelbedsApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers["X-Signature"] = getSignature();
  return config;
});

export const searchHotelsByDestination = async (
  destinationCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  rooms: number
) => {
  const requestBody = {
    stay: {
      checkIn,
      checkOut,
    },
    occupancies: [
      {
        rooms,
        adults,
        children,
      },
    ],
    destination: {
      code: destinationCode,
    },
  };

  try {
    const response = await hotelbedsApi.post(
      "/hotel-api/1.0/hotels",
      requestBody
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error calling Hotelbeds API:",
        error.response?.data || error.message
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
    throw error;
  }
};

export const getHotelDetails = async (hotelCodes: number[]) => {
  if (hotelCodes.length === 0) {
    return { hotels: [] };
  }

  try {
    const response = await hotelbedsApi.get(
      `/hotel-content-api/1.0/hotels?codes=${hotelCodes.join(
        ","
      )}&language=ENG&useSecondaryLanguage=false`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error calling Hotelbeds Content API:",
        error.response?.data || error.message
      );
    } else {
      console.error("An unexpected error occurred in getHotelDetails:", error);
    }
    // Return a default structure on error to prevent crashes
    return { hotels: [] };
  }
};
