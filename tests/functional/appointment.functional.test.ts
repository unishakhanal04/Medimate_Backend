import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const appointmentPayload = () => ({
  doctorName: "Dr. Sharma",
  specialization: "Cardiology",
  appointmentDate: tomorrow(),
  appointmentTime: "10:00",
  purpose: "Checkup",
});

describe("Appointment API", () => {
  it("POST /api/appointments rejects a request with no token", async () => {
    const res = await request(app).post("/api/appointments").send(appointmentPayload());
    expect(res.status).toBe(401);
  });

  it("POST /api/appointments creates an appointment for the authenticated user", async () => {
    const user = await registerAndLogin();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send(appointmentPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.doctorName).toBe("Dr. Sharma");
    expect(res.body.data.status).toBe("scheduled");
  });

  it("GET /api/appointments lists only the authenticated user's appointments", async () => {
    const user = await registerAndLogin();
    await request(app).post("/api/appointments").set("Authorization", `Bearer ${user.token}`).send(appointmentPayload());

    const res = await request(app).get("/api/appointments").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
