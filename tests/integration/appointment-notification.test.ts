import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: appointment tomorrow triggers a notification", () => {
  it("surfaces an appointment_tomorrow notification once an appointment is created for tomorrow", async () => {
    const user = await registerAndLogin();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Gurung",
        appointmentDate: tomorrow.toISOString(),
        appointmentTime: "14:00",
        purpose: "Follow-up",
      });

    const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    const notification = res.body.data.items.find((item: { type: string }) => item.type === "appointment_tomorrow");
    expect(notification).toBeDefined();
    expect(notification.message).toContain("Dr. Gurung");
    expect(res.body.data.unreadCount).toBeGreaterThan(0);
  });
});
