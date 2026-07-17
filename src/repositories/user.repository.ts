import { UserModel } from "../models/user.model";
import {
  AdminCreateUserDTO,
  AdminUpdateUserDTO,
  IUser,
  RegisterDTO,
  UserListQuery,
  UserListResult,
} from "../types/user.type";

export const UserRepository = {
  async findByEmail(email: string) {
    return await UserModel.findOne({ email: email.toLowerCase() });
  },

  async existsByEmail(email: string, excludeUserId?: string) {
    const query: Record<string, unknown> = { email: email.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    return await UserModel.exists(query);
  },

  async findById(id: string) {
    return await UserModel.findById(id);
  },

  async create(userData: (RegisterDTO | AdminCreateUserDTO) & { password: string }) {
    return await UserModel.create(userData);
  },

  async findAll() {
    return await UserModel.find().select("-password");
  },

  async findUsers({ page, limit, search }: UserListQuery): Promise<UserListResult> {
    const trimmedSearch = search?.trim();
    const query = trimmedSearch
      ? {
          $or: [
            { username: { $regex: trimmedSearch, $options: "i" } },
            { email: { $regex: trimmedSearch, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(query),
    ]);

    return {
      data: users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        gender: user.gender,
        profileImage: user.profileImage,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async deleteById(id: string) {
    return await UserModel.findByIdAndDelete(id);
  },

  async update(id: string, updateData: Partial<IUser> | AdminUpdateUserDTO) {
    return await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
};
