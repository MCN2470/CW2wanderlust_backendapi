import Amadeus from "amadeus";
import dotenv from "dotenv";

dotenv.config();

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!,
});

export const searchFlights = async (
  origin: string,
  destination: string,
  date: string,
  airline?: string
) => {
  const params: any = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: "1",
    max: 10,
    include: "airlines",
  };

  if (airline) {
    params.includeAirlineCodes = airline;
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get(params);
    return response.data;
  } catch (error) {
    console.error("Error searching flights in Amadeus service:", error);
    throw error;
  }
};
