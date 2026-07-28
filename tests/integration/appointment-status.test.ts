import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: completing a future appointment moves it from upcoming to past", () => {
  it("no longer appears in /upcoming and appears in /past once marked completed", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Karki",
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "09:00",
        purpose: "Follow-up",
      });
    const appointmentId = createRes.body.data._id;

    const beforeUpcoming = await request(app)
      .get("/api/appointments/upcoming")
      .set("Authorization", `Bearer ${user.token}`);
    expect(beforeUpcoming.body.data.map((a: { _id: string }) => a._id)).toContain(appointmentId);

    const updateRes = await request(app)
      .put(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ status: "completed" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("completed");

    const afterUpcoming = await request(app)
      .get("/api/appointments/upcoming")
      .set("Authorization", `Bearer ${user.token}`);
    expect(afterUpcoming.body.data.map((a: { _id: string }) => a._id)).not.toContain(appointmentId);

    const pastRes = await request(app).get("/api/appointments/past").set("Authorization", `Bearer ${user.token}`);
    expect(pastRes.body.data.map((a: { _id: string }) => a._id)).toContain(appointmentId);
  });
});
