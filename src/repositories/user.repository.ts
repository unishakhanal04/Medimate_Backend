import { UserModel } from "../models/user.model";
import { IUser, RegisterDTO } from "../types/user.type";

export const UserRepository = {
  async findByEmail(email: string) {
    return await UserModel.findOne({ email: email.toLowerCase() });
  },

  async existsByEmail(email: string) {
    return await UserModel.exists({ email: email.toLowerCase() });
  },

  async findById(id: string) {
    return await UserModel.findById(id);
  },

  async create(userData: RegisterDTO & { password: string }) {
    return await UserModel.create(userData);
  },

  async findAll() {
    return await UserModel.find().select("-password");
  },

  async deleteById(id: string) {
    return await UserModel.findByIdAndDelete(id);
  }
};