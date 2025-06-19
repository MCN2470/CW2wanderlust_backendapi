import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { AMADEUS_API_KEY, AMADEUS_API_SECRET, AMADEUS_BASE_URL } = process.env;

let amadeusToken: string | null = null;
let tokenExpiry: number | null = null;

const getAmadeusToken = async (): Promise<string> => {
  // If we have a valid token, return it
  if (amadeusToken && tokenExpiry && Date.now() < tokenExpiry) {
    return amadeusToken;
  }

  // Otherwise, fetch a new one
  const tokenUrl = `${AMADEUS_BASE_URL}/v1/security/oauth2/token`;
  const body = `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`;

  const response = await axios.post(tokenUrl, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  amadeusToken = response.data.access_token;
  // Set expiry time to be slightly less than the actual expiry to be safe
  tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

  console.log("Fetched new Amadeus token.");
  return amadeusToken as string;
};

export const searchFlights = async (
  origin: string,
  destination: string,
  date: string
) => {
  const token = await getAmadeusToken();
  const searchUrl = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers`;

  const response = await axios.get(searchUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: 1,
      max: 5, // Limit the number of results
    },
  });

  return response.data;
};
