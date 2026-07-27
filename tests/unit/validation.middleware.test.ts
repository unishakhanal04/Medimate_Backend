import { Request, Response, NextFunction } from "express";
import { validateRegister, validateLogin } from "../../src/middlewares/validation.middleware";
import { HttpException } from "../../src/exceptions/http-exception";

const runMiddleware = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  body: Record<string, unknown>
) => {
  const req = { body } as Request;
  const res = {} as Response;
  const next = jest.fn();
  middleware(req, res, next as NextFunction);
  return { req, next };
};

describe("validateRegister", () => {
  it("passes through and normalizes valid input", () => {
    const { req, next } = runMiddleware(validateRegister, {
      username: "  Jane  ",
      email: "  Jane@Example.com ",
      gender: "female",
      password: "secret1",
    });
    expect(next).toHaveBeenCalledWith();
    expect(req.body.username).toBe("Jane");
    expect(req.body.email).toBe("jane@example.com");
  });

  it("rejects an invalid email", () => {
    const { next } = runMiddleware(validateRegister, {
      username: "Jane",
      email: "not-an-email",
      gender: "female",
      password: "secret1",
    });
    const err = next.mock.calls[0][0] as HttpException;
    expect(err).toBeInstanceOf(HttpException);
    expect(err.status).toBe(400);
    expect(err.errors?.email).toBeDefined();
  });

  it("rejects a password shorter than 6 characters", () => {
    const { next } = runMiddleware(validateRegister, {
      username: "Jane",
      email: "jane@example.com",
      gender: "female",
      password: "abc",
    });
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.errors?.password).toBeDefined();
  });

  it("rejects an invalid gender value", () => {
    const { next } = runMiddleware(validateRegister, {
      username: "Jane",
      email: "jane@example.com",
      gender: "unknown",
      password: "secret1",
    });
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.errors?.gender).toBeDefined();
  });
});

describe("validateLogin", () => {
  it("passes through and normalizes valid input", () => {
    const { req, next } = runMiddleware(validateLogin, {
      email: "Jane@Example.com",
      password: "secret1",
    });
    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe("jane@example.com");
  });

  it("rejects a missing password", () => {
    const { next } = runMiddleware(validateLogin, { email: "jane@example.com" });
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(400);
    expect(err.errors?.password).toBeDefined();
  });

  it("rejects an invalid portal value", () => {
    const { next } = runMiddleware(validateLogin, {
      email: "jane@example.com",
      password: "secret1",
      portal: "superadmin",
    });
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.errors?.portal).toBeDefined();
  });
});
