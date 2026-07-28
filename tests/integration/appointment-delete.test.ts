import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: deleting an appointment removes it", () => {
  it("returns 404 on GET /:id after the appointment is deleted", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Thapa",
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "14:00",
        purpose: "Consultation",
      });
    const appointmentId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(getRes.status).toBe(404);
  });
});
