import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: the timeline aggregates events from across the app", () => {
  it("includes medicine, appointment, and contact events, and honors the type filter", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Vitamin D",
        dosage: "1000IU",
        frequency: "daily",
        times: ["09:00"],
        startDate: new Date().toISOString(),
      });

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Bhattarai",
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "15:00",
        purpose: "Checkup",
      });

    await request(app)
      .post("/api/emergency-contacts")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Backup Contact", relationship: "Friend", phone: "9800009999" });

    const fullRes = await request(app).get("/api/v1/timeline").set("Authorization", `Bearer ${user.token}`);
    expect(fullRes.status).toBe(200);
    const types = fullRes.body.data.items.map((e: { type: string }) => e.type);
    expect(types).toContain("medicine_added");
    expect(types).toContain("appointment_created");
    expect(types).toContain("emergency_contact_added");

    const filteredRes = await request(app)
      .get("/api/v1/timeline?type=medicine_added&pageSize=5&page=1")
      .set("Authorization", `Bearer ${user.token}`);
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.data.items.every((e: { type: string }) => e.type === "medicine_added")).toBe(true);

    const rangedRes = await request(app)
      .get(
        `/api/v1/timeline?from=${new Date(Date.now() - 60 * 60 * 1000).toISOString()}&to=${new Date(
          Date.now() + 60 * 60 * 1000
        ).toISOString()}`
      )
      .set("Authorization", `Bearer ${user.token}`);
    expect(rangedRes.status).toBe(200);
  });
});
