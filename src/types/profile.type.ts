import { UserGender, IUserPreferences } from "./user.type";

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  gender: UserGender;
  profileImage?: string | null;
  phone?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  allergies: string[];
  chronicDiseases: string[];
  height?: number;
  weight?: number;
  preferences: IUserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateProfileDTO {
  username?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: UserGender;
  bloodGroup?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  height?: number;
  weight?: number;
  profileImage?: string | null;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export type UpdatePreferencesDTO = Partial<IUserPreferences>;
