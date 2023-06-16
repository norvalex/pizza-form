const { Rental } = require("../../models/rental");

describe("rental.duration", () => {
  it("should return 12 months for full year", () => {
    const rental = new Rental({
      startDate: new Date("2022-01-01"),
      endDate: new Date("2022-12-31"),
    });

    expect(rental.duration).toBe(12);
  });

  it("should return 1 month for a month", () => {
    const rental = new Rental({
      startDate: new Date("2022-01-01"),
      endDate: new Date("2022-01-31"),
    });

    expect(rental.duration).toBe(1);
  });
});
