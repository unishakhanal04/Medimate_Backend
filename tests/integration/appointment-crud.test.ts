import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: creating an appointment makes it retrievable by id and in the list", () => {
  it("returns the created appointment from GET /:id and GET /", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Shrestha",
        specialization: "Cardiology",
        hospital: "City Hospital",
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "10:30",
        purpose: "Checkup",
      });
    expect(createRes.status).toBe(201);
    const appointmentId = createRes.body.data._id;

    const getRes = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.doctorName).toBe("Dr. Shrestha");
    expect(getRes.body.data.status).toBe("scheduled");

    const listRes = await request(app).get("/api/appointments").set("Authorization", `Bearer ${user.token}`);
    expect(listRes.body.data.map((a: { _id: string }) => a._id)).toContain(appointmentId);
  });
});
