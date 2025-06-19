// We export an object that contains the mock function
export const searchFlights = jest.fn(
  (origin: string, destination: string, date: string) => {
    console.log("--- MOCK searchFlights CALLED ---");
    if (origin === "LHR" && destination === "NYC" && date === "2024-12-25") {
      return Promise.resolve({ data: [{ id: "1", price: "500.00" }] });
    }
    return Promise.resolve({ data: [] });
  }
);

// We can also export other functions from the module if needed
export const getAmadeusToken = jest.fn(() => Promise.resolve("fake-token"));
