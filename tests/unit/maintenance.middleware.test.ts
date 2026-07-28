import { Request, Response, NextFunction } from "express";
import { maintenanceGate } from "../../src/middlewares/maintenance.middleware";
import { SystemSettingsService } from "../../src/services/system-settings.services";

jest.mock("../../src/services/system-settings.services");

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("maintenanceGate middleware", () => {
  it("passes through /health without checking maintenance mode", async () => {
    const req = { path: "/health" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(SystemSettingsService.getMaintenanceMode).not.toHaveBeenCalled();
  });

  it("passes through auth routes without checking maintenance mode", async () => {
    const req = { path: "/api/v1/auth/login" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(SystemSettingsService.getMaintenanceMode).not.toHaveBeenCalled();
  });

  it("passes through admin routes even when maintenance mode is on", async () => {
    (SystemSettingsService.getMaintenanceMode as jest.Mock).mockResolvedValue(true);
    const req = { path: "/api/v1/admin/users" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it("returns 503 for non-exempt paths when maintenance mode is on", async () => {
    (SystemSettingsService.getMaintenanceMode as jest.Mock).mockResolvedValue(true);
    const req = { path: "/api/v1/medicines" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for non-exempt paths when maintenance mode is off", async () => {
    (SystemSettingsService.getMaintenanceMode as jest.Mock).mockResolvedValue(false);
    const req = { path: "/api/v1/medicines" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("fails open (calls next) when the settings lookup throws", async () => {
    (SystemSettingsService.getMaintenanceMode as jest.Mock).mockRejectedValue(new Error("db down"));
    const req = { path: "/api/v1/medicines" } as Request;
    const res = mockRes();
    const next = jest.fn();
    await maintenanceGate(req, res, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });
});
