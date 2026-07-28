import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin dashboard summary and reports overview aggregate platform-wide data", () => {
  it("returns non-negative aggregate counts reflecting seeded users, medicines, and appointments", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-dashboard@example.com" });
    const member = await registerAndLogin({ email: "dashboard-member@example.com" });

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        name: "Cetirizine",
        dosage: "10mg",
        frequency: "daily",
        times: ["21:00"],
        startDate: new Date().toISOString(),
      });

    const summaryRes = await request(app)
      .get("/api/v1/admin/dashboard-summary")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalUsers).toBeGreaterThanOrEqual(2);
    expect(summaryRes.body.data.totalMedicines).toBeGreaterThanOrEqual(1);

    const overviewRes = await request(app)
      .get("/api/v1/admin/reports-overview")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.userGrowth.length).toBeGreaterThan(0);
    expect(overviewRes.body.data.medicinesByStatus.active).toBeGreaterThanOrEqual(1);
  });
});
