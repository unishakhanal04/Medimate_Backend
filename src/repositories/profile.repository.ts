import { UserModel } from "../models/user.model";
import { IUser } from "../types/user.type";

export const ProfileRepository = {
  async findById(userId: string) {
    return await UserModel.findById(userId);
  },

  async update(userId: string, updateData: Partial<IUser>) {
    return await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  },
};
