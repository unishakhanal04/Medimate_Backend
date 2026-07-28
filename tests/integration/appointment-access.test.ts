import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: a user cannot access another user's appointment", () => {
  it("returns 403 when a different user requests the appointment by id", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        doctorName: "Dr. Gurung",
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "11:00",
        purpose: "Checkup",
      });
    const appointmentId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });
});
