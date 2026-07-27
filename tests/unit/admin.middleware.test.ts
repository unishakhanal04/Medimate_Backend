import { Response, NextFunction } from "express";
import { requireAdmin } from "../../src/middlewares/admin.middleware";
import { AuthRequest } from "../../src/middlewares/authorized.middleware";
import { HttpException } from "../../src/exceptions/http-exception";
import { UserRepository } from "../../src/repositories/user.repository";

jest.mock("../../src/repositories/user.repository");

describe("requireAdmin middleware", () => {
  it("rejects a non-admin user with 403", async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ role: "user" });
    const req = { user: { userId: "u1" } } as AuthRequest;
    const next = jest.fn();
    await requireAdmin(req, {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as HttpException;
    expect(err.status).toBe(403);
  });

  it("allows an admin user through and attaches role", async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ role: "admin" });
    const req = { user: { userId: "u2" } } as AuthRequest;
    const next = jest.fn();
    await requireAdmin(req, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(req.user?.role).toBe("admin");
  });
});
