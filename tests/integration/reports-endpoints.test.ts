import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: reports & analytics endpoints return computed data for a user's medicines", () => {
  it("returns 200 with sensible shapes across every reports endpoint", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "daily",
        times: ["08:00"],
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: 3,
        refillThreshold: 5,
      });

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        doctorName: "Dr. Adhikari",
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: "10:00",
        purpose: "Routine visit",
      });

    const overview = await request(app).get("/api/v1/reports/overview").set("Authorization", `Bearer ${user.token}`);
    expect(overview.status).toBe(200);
    expect(overview.body.data.totalMedicines).toBeGreaterThan(0);

    const adherence = await request(app)
      .get("/api/v1/reports/adherence?period=weekly&buckets=4")
      .set("Authorization", `Bearer ${user.token}`);
    expect(adherence.status).toBe(200);
    expect(adherence.body.data.series).toHaveLength(4);

    const medicines = await request(app)
      .get("/api/v1/reports/medicines?days=30")
      .set("Authorization", `Bearer ${user.token}`);
    expect(medicines.status).toBe(200);
    expect(medicines.body.data.refillAlerts.length).toBeGreaterThan(0);

    const prescriptions = await request(app)
      .get("/api/v1/reports/prescriptions")
      .set("Authorization", `Bearer ${user.token}`);
    expect(prescriptions.status).toBe(200);
    expect(prescriptions.body.data.totalPrescriptions).toBe(0);

    const appointments = await request(app)
      .get("/api/v1/reports/appointments")
      .set("Authorization", `Bearer ${user.token}`);
    expect(appointments.status).toBe(200);
    expect(appointments.body.data.upcomingAppointments).toBeGreaterThan(0);
    expect(appointments.body.data.nextAppointment).not.toBeNull();

    const insights = await request(app).get("/api/v1/reports/insights").set("Authorization", `Bearer ${user.token}`);
    expect(insights.status).toBe(200);
    expect(insights.body.data.insights.adherenceTrend).toBeDefined();

    const adherenceSeriesDaily = await request(app)
      .get("/api/v1/reports/adherence-series?period=daily&buckets=5")
      .set("Authorization", `Bearer ${user.token}`);
    expect(adherenceSeriesDaily.status).toBe(200);
    expect(adherenceSeriesDaily.body.data).toHaveLength(5);

    const refillAlerts = await request(app)
      .get("/api/v1/reports/refill-alerts")
      .set("Authorization", `Bearer ${user.token}`);
    expect(refillAlerts.status).toBe(200);
    expect(refillAlerts.body.data[0].name).toBe("Lisinopril");

    const medicineProgress = await request(app)
      .get("/api/v1/reports/medicine-progress?days=10")
      .set("Authorization", `Bearer ${user.token}`);
    expect(medicineProgress.status).toBe(200);
  });
});
