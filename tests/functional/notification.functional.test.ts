import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Notification API", () => {
  it("GET /api/v1/notifications rejects a request with no token", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/notifications returns an empty list for a brand-new user", async () => {
    const user = await registerAndLogin();
    const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.unreadCount).toBe(0);
  });

  it("POST /api/v1/notifications/mark-seen records a lastSeenAt timestamp", async () => {
    const user = await registerAndLogin();
    const res = await request(app)
      .post("/api/v1/notifications/mark-seen")
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.notificationsLastSeenAt).toBe("string");
  });
});
