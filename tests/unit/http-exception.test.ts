import { HttpException } from "../../src/exceptions/http-exception";

describe("HttpException", () => {
  it("sets status, message, and is an instance of Error", () => {
    const err = new HttpException(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpException);
  });

  it("carries an optional field-level errors map", () => {
    const err = new HttpException(400, "Validation error", { email: "Required" });
    expect(err.errors).toEqual({ email: "Required" });
  });
});
