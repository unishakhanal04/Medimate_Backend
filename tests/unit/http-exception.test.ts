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

  it("leaves errors undefined when none are given", () => {
    const err = new HttpException(500, "Server error");
    expect(err.errors).toBeUndefined();
  });

  it("is recognized by instanceof after crossing a catch boundary", () => {
    const raise = () => {
      throw new HttpException(403, "Forbidden");
    };
    try {
      raise();
      throw new Error("expected raise() to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).status).toBe(403);
    }
  });

  it("supports multiple field-level errors at once", () => {
    const err = new HttpException(400, "Validation error", { email: "Required", password: "Too short" });
    expect(Object.keys(err.errors ?? {})).toHaveLength(2);
    expect(err.errors?.password).toBe("Too short");
  });

  it("preserves a stack trace like a normal Error", () => {
    const err = new HttpException(404, "Not found");
    expect(typeof err.stack).toBe("string");
    expect(err.name).toBe("Error");
  });
});
