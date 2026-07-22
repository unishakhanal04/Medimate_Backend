import { AuditLogModel } from "../models/audit-log.model";
import { UserModel } from "../models/user.model";
import { AuditLogListResult, AuditLogQuery, LogAuditParams } from "../types/audit-log.type";

export const AuditLogService = {
  async log(params: LogAuditParams) {
    await AuditLogModel.create(params);
  },

  async getLogs(query: AuditLogQuery): Promise<AuditLogListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));

    const filter: Record<string, unknown> = {};
    if (query.action) filter.action = query.action;
    if (query.adminId) filter.adminId = query.adminId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments(filter),
    ]);

    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const admins = await UserModel.find({ _id: { $in: adminIds } }).select("username");
    const usernameById = new Map(admins.map((a) => [a._id.toString(), a.username]));

    return {
      items: logs.map((log) => ({
        id: log._id.toString(),
        adminId: log.adminId,
        adminUsername: usernameById.get(log.adminId) ?? null,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        targetLabel: log.targetLabel,
        description: log.description,
        date: log.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },
};
