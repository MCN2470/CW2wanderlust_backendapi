import Amadeus from "amadeus";
import axios from "axios";
import qs from "qs";

const AMADEUS_API_KEY = "lJw82HoIy987KWsRamaMIeTmAE5IWHyE";
const AMADEUS_API_SECRET = "tsRRs5Sy95V0WRTn";

let amadeus: any;
let token: string | null = null;
let tokenExpiresAt = 0;

const getAmadeusToken = async () => {
  if (token && Date.now() < tokenExpiresAt) {
    return token;
  }

  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: AMADEUS_API_KEY,
    client_secret: AMADEUS_API_SECRET,
  });

  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    token = response.data.access_token;
    // Set expiration to 5 minutes before it actually expires
    tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

    amadeus = new Amadeus({
      clientId: AMADEUS_API_KEY,
      clientSecret: AMADEUS_API_SECRET,
      accessToken: token,
    });

    return token;
  } catch (error) {
    console.error("Error fetching Amadeus token:", error);
    throw new Error("Failed to authenticate with Amadeus.");
  }
};

export const searchFlights = async (
  origin: string,
  destination: string,
  date: string,
  airline?: string
) => {
  try {
    await getAmadeusToken(); // Ensure we have a valid token

    const params: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: "1",
      max: 10,
    };

    if (airline) {
      params.includeAirlineCodes = airline;
    }

    const response = await amadeus.shopping.flightOffersSearch.get(params);
    console.log("Full Amadeus response:", JSON.stringify(response, null, 2));
    return response.result; // Return the full response including dictionaries
  } catch (error) {
    console.error("Error searching flights in Amadeus service:", error);
    throw error;
  }
};
