import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: deactivating a user via the admin portal writes an audit log entry", () => {
  it("records a user_deactivated entry retrievable from /api/v1/admin/audit-logs", async () => {
    const member = await registerAndLogin({ email: "to-deactivate@example.com" });
    const admin = await registerAndLoginAdmin({ email: "admin-audit-check@example.com" });

    const statusRes = await request(app)
      .patch(`/api/v1/admin/members/${member.userId}/status`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "inactive" });
    expect(statusRes.status).toBe(200);

    const auditRes = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(auditRes.status).toBe(200);
    const entry = auditRes.body.data.items.find(
      (item: { targetId: string; action: string }) => item.targetId === member.userId && item.action === "user_deactivated"
    );
    expect(entry).toBeDefined();
  });
});
