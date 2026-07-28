import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authorize, AuthRequest } from "../../src/middlewares/authorized.middleware";
import { HttpException } from "../../src/exceptions/http-exception";
import { CONSTANTS } from "../../src/config/constant";

describe("authorize middleware", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err).toBeInstanceOf(HttpException);
    expect(err.status).toBe(401);
  });

  it("rejects a malformed/invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(401);
  });

  it("accepts a valid token and attaches the decoded payload to req.user", () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.com", role: "user" }, CONSTANTS.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(req.user?.userId).toBe("u1");
  });

  it("rejects an Authorization header that isn't a Bearer token", () => {
    const req = { headers: { authorization: "Basic dXNlcjpwYXNz" } } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(401);
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.com", role: "user" }, "wrong-secret");
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(401);
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.com", role: "user" }, CONSTANTS.JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const next = jest.fn();
    authorize(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(401);
    expect(err.message).toMatch(/expired/i);
  });
});
