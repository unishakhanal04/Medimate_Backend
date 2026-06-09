export interface IUser {
  username: string;
  email: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  password: string;
  createdAt?: Date;
}

export interface RegisterDTO {
  username: string;
  email: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
