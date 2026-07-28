import { AuditLogService } from "../../src/services/audit-log.services";
import { AuditLogModel } from "../../src/models/audit-log.model";
import { UserModel } from "../../src/models/user.model";
import { AuditLogQuery } from "../../src/types/audit-log.type";

jest.mock("../../src/models/audit-log.model");
jest.mock("../../src/models/user.model");

const query_ = (overrides: Partial<AuditLogQuery> = {}): AuditLogQuery => overrides as AuditLogQuery;

const makeQuery = (result: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnValue(result),
});

const logDoc = (overrides: Record<string, unknown>) => ({
  _id: { toString: () => overrides.id },
  adminId: overrides.adminId,
  action: overrides.action ?? "login",
  targetType: undefined,
  targetId: undefined,
  targetLabel: undefined,
  description: overrides.description ?? "desc",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("AuditLogService.log", () => {
  it("creates an audit log entry with the given params", async () => {
    (AuditLogModel.create as jest.Mock).mockResolvedValue({});
    await AuditLogService.log({ adminId: "a1", action: "login", description: "Admin logged in" });
    expect(AuditLogModel.create).toHaveBeenCalledWith({ adminId: "a1", action: "login", description: "Admin logged in" });
  });
});

describe("AuditLogService.getLogs", () => {
  beforeEach(() => {
    (UserModel.find as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
  });

  it("defaults to page 1 with a limit of 20 when no query is given", async () => {
    const query = makeQuery([]);
    (AuditLogModel.find as jest.Mock).mockReturnValue(query);
    (AuditLogModel.countDocuments as jest.Mock).mockResolvedValue(0);
    const result = await AuditLogService.getLogs(query_());
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(query.skip).toHaveBeenCalledWith(0);
  });

  it("clamps page and limit to their valid bounds", async () => {
    const query = makeQuery([]);
    (AuditLogModel.find as jest.Mock).mockReturnValue(query);
    (AuditLogModel.countDocuments as jest.Mock).mockResolvedValue(0);
    const result = await AuditLogService.getLogs(query_({ page: -5, limit: 500 }));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("computes skip from page and limit", async () => {
    const query = makeQuery([]);
    (AuditLogModel.find as jest.Mock).mockReturnValue(query);
    (AuditLogModel.countDocuments as jest.Mock).mockResolvedValue(0);
    await AuditLogService.getLogs(query_({ page: 3, limit: 10 }));
    expect(query.skip).toHaveBeenCalledWith(20);
  });

  it("filters by action and adminId when provided", async () => {
    const query = makeQuery([]);
    (AuditLogModel.find as jest.Mock).mockReturnValue(query);
    (AuditLogModel.countDocuments as jest.Mock).mockResolvedValue(0);
    await AuditLogService.getLogs(query_({ action: "login", adminId: "a1" }));
    expect(AuditLogModel.find).toHaveBeenCalledWith({ action: "login", adminId: "a1" });
    expect(AuditLogModel.countDocuments).toHaveBeenCalledWith({ action: "login", adminId: "a1" });
  });

  it("resolves adminUsername from the matching user, null when unknown, and computes totalPages", async () => {
    const query = makeQuery([logDoc({ id: "l1", adminId: "known" }), logDoc({ id: "l2", adminId: "unknown" })]);
    (AuditLogModel.find as jest.Mock).mockReturnValue(query);
    (AuditLogModel.countDocuments as jest.Mock).mockResolvedValue(2);
    (UserModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: { toString: () => "known" }, username: "Admin One" }]),
    });
    const result = await AuditLogService.getLogs(query_());
    expect(result.items[0].adminUsername).toBe("Admin One");
    expect(result.items[1].adminUsername).toBeNull();
    expect(result.totalPages).toBe(1);
  });
});
