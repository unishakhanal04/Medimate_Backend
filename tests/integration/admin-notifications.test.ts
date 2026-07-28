import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin notifications surface recent signups and clear on mark-seen", () => {
  it("lists a new-user-registered notification, then unreadCount drops to zero after mark-seen", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-notif@example.com" });
    await registerAndLogin({ email: "fresh-signup@example.com" });

    const before = await request(app)
      .get("/api/v1/admin/notifications")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(before.status).toBe(200);
    expect(before.body.data.items.some((i: { type: string }) => i.type === "new_user_registered")).toBe(true);
    expect(before.body.data.unreadCount).toBeGreaterThan(0);

    const markRes = await request(app)
      .post("/api/v1/admin/notifications/mark-seen")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(markRes.status).toBe(200);

    const after = await request(app)
      .get("/api/v1/admin/notifications")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(after.body.data.unreadCount).toBe(0);
  });
});
