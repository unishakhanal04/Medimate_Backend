import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { AppointmentService } from "../services/appointment.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";
import { CreateAppointmentDTO, UpdateAppointmentDTO } from "../types/appointment.type";

const getRouteId = (value: string | string[] | undefined) => {
  if (!value) {
    throw new HttpException(400, "Appointment id is required");
  }
  return Array.isArray(value) ? value[0] : value;
};

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const data: CreateAppointmentDTO = {
      doctorName: req.body.doctorName,
      specialization: req.body.specialization,
      hospital: req.body.hospital,
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      purpose: req.body.purpose,
      notes: req.body.notes,
      reminderEnabled: req.body.reminderEnabled,
    };

    const appointment = await AppointmentService.createAppointment(req.user.userId, data);
    sendSuccess(res, appointment, "Appointment created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const appointments = await AppointmentService.getAppointmentsByUserId(req.user.userId);
    sendSuccess(res, appointments, "Appointments retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    const appointment = await AppointmentService.getAppointmentById(id, req.user.userId);
    sendSuccess(res, appointment, "Appointment retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    const data: UpdateAppointmentDTO = {
      doctorName: req.body.doctorName,
      specialization: req.body.specialization,
      hospital: req.body.hospital,
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      purpose: req.body.purpose,
      notes: req.body.notes,
      status: req.body.status,
      reminderEnabled: req.body.reminderEnabled,
    };

    const appointment = await AppointmentService.updateAppointment(id, req.user.userId, data);
    sendSuccess(res, appointment, "Appointment updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    await AppointmentService.deleteAppointment(id, req.user.userId);
    sendSuccess(res, { id }, "Appointment deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const getUpcomingAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const appointments = await AppointmentService.getUpcomingAppointments(req.user.userId);
    sendSuccess(res, appointments, "Upcoming appointments retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getPastAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const appointments = await AppointmentService.getPastAppointments(req.user.userId);
    sendSuccess(res, appointments, "Past appointments retrieved successfully");
  } catch (err) {
    next(err);
  }
};
