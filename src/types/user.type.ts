export type UserGender = "male" | "female" | "other";
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";

export interface IUserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
  medicineReminders: boolean;
  appointmentReminders: boolean;
}

export interface IUser {
  username: string;
  email: string;
  gender: UserGender;
  password: string;
  profileImage?: string | null;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  height?: number;
  weight?: number;
  preferences?: IUserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  gender: UserGender;
  profileImage?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegisterDTO {
  username: string;
  email: string;
  gender: UserGender;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: UserRole;
}

export interface AdminCreateUserDTO {
  username: string;
  email: string;
  gender: UserGender;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  profileImage?: string | null;
}

export interface AdminUpdateUserDTO {
  username?: string;
  email?: string;
  gender?: UserGender;
  role?: UserRole;
  status?: UserStatus;
  profileImage?: string | null;
}

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface UserListResult {
  data: PublicUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
