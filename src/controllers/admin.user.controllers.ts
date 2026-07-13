import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getAdminUserById,
  listUsersForAdmin,
  updateUserByAdmin,
} from "../services/admin.user.services";
import { HttpException } from "../exceptions/http-exception";

const getRouteId = (value: string | string[] | undefined) => {
  if (!value) {
    throw new HttpException(400, "User id is required");
  }

  return Array.isArray(value) ? value[0] : value;
};

export const listAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await listUsersForAdmin({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminUserById(getRouteId(req.params.id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await createUserByAdmin(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await updateUserByAdmin(getRouteId(req.params.id), req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      throw new HttpException(401, "User not authenticated");
    }

    const result = await deleteUserByAdmin(getRouteId(req.params.id), req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
