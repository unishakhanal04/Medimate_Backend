jest.mock("../../src/config/constant", () => {
  const actual = jest.requireActual("../../src/config/constant");
  return { CONSTANTS: { ...actual.CONSTANTS, GEMINI_API_KEY: "" } };
});

import { getGeminiClient } from "../../src/utils/gemini.util";
import { HttpException } from "../../src/exceptions/http-exception";

describe("getGeminiClient", () => {
  it("throws a clear HttpException when GEMINI_API_KEY is not configured", () => {
    expect(() => getGeminiClient()).toThrow(HttpException);
    try {
      getGeminiClient();
    } catch (err) {
      expect((err as HttpException).status).toBe(500);
      expect((err as HttpException).message).toMatch(/GEMINI_API_KEY/);
    }
  });
});
