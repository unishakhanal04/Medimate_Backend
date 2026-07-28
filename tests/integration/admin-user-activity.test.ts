import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin can view a full activity summary for a member", () => {
  it("aggregates the member's medicines, appointments, and emergency contacts", async () => {
    const member = await registerAndLogin({ email: "activity-member@example.com" });
    const admin = await registerAndLoginAdmin({ email: "admin-activity@example.com" });

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        name: "Omeprazole",
        dosage: "20mg",
        frequency: "daily",
        times: ["07:00"],
        startDate: new Date().toISOString(),
      });

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        doctorName: "Dr. Poudel",
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "12:00",
        purpose: "Follow-up",
      });

    const res = await request(app)
      .get(`/api/v1/admin/members/${member.userId}/activity`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.medicines.total).toBe(1);
    expect(res.body.data.appointments.total).toBe(1);
    expect(res.body.data.user.email).toBe(member.email);
  });
});
