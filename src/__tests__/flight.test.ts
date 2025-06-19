import request from "supertest";
import express from "express";
import flightRoutes from "../routes/flight.routes";
import * as AmadeusService from "../services/amadeus.service";

// Tell Jest to mock the service. It will automatically use the __mocks__ folder.
jest.mock("../services/amadeus.service");

const app = express();
app.use(express.json());
app.use("/api/flights", flightRoutes);

// We need to cast our imported service to its mocked version to check calls
const mockedAmadeusService = AmadeusService as jest.Mocked<
  typeof AmadeusService
>;

describe("Flight Search API", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockedAmadeusService.searchFlights.mockClear();
  });

  it("should return flight data for a valid search", async () => {
    const response = await request(app).get(
      "/api/flights/search?origin=LHR&destination=NYC&date=2024-12-25"
    );

    expect(response.status).toBe(200);
    // This checks that our mock was called correctly and returned the fake data
    expect(response.body.data[0].id).toBe("1");
  });

  it("should return a 400 error if parameters are missing", async () => {
    const response = await request(app).get("/api/flights/search?origin=LHR"); // Missing destination and date

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Origin, destination, and date are required."
    );
  });

  it("should call the amadeus service with the correct parameters", async () => {
    await request(app).get(
      "/api/flights/search?origin=LHR&destination=NYC&date=2024-12-25"
    );

    // This is a powerful feature of Jest mocks:
    // We can check if our mock function was actually called with the data we expect.
    expect(mockedAmadeusService.searchFlights).toHaveBeenCalledWith(
      "LHR",
      "NYC",
      "2024-12-25"
    );
  });
});
