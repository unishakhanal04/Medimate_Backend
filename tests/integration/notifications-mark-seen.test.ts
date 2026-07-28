import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: marking notifications seen clears the unread count", () => {
  it("has zero unreadCount after POST /mark-seen", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Metformin",
        dosage: "500mg",
        frequency: "daily",
        times: ["08:00"],
        startDate: new Date().toISOString(),
        quantity: 1,
        refillThreshold: 5,
      });

    const before = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    expect(before.body.data.unreadCount).toBeGreaterThan(0);

    const markRes = await request(app)
      .post("/api/v1/notifications/mark-seen")
      .set("Authorization", `Bearer ${user.token}`);
    expect(markRes.status).toBe(200);

    const after = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    expect(after.body.data.unreadCount).toBe(0);
  });
});
