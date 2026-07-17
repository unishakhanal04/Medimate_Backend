import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { AdminService } from "../services/admin.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

const getRouteId = (value: string | string[] | undefined) => {
  if (!value) {
    throw new HttpException(400, "User id is required");
  }
  return Array.isArray(value) ? value[0] : value;
};

export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await AdminService.getDashboardSummary();
    sendSuccess(res, summary, "Dashboard summary retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getReportsOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const overview = await AdminService.getReportsOverview();
    sendSuccess(res, overview, "Reports overview retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listUsers({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });
    sendSuccess(res, result, "Users retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req.params.id);
    const user = await AdminService.getUserDetails(id);
    sendSuccess(res, user, "User details retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (status !== "active" && status !== "inactive") {
      throw new HttpException(400, "Status must be active or inactive");
    }

    const user = await AdminService.updateUserStatus(getRouteId(req.params.id), status);
    sendSuccess(res, user, "User status updated successfully");
  } catch (err) {
    next(err);
  }
};
