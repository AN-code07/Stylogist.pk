import { describe, it, expect } from "vitest";

function calcPrice(price, discount) {
  return price - (price * discount) / 100;
}

describe("Price calculation", () => {
  it("should apply discount correctly", () => {
    expect(calcPrice(1000, 10)).toBe(900);
  });
});