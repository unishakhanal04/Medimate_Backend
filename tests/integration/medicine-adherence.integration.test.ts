import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: marking a dose taken updates adherence stats", () => {
  it("reflects the logged dose in the weekly adherence stats", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Ibuprofen",
        dosage: "200mg",
        frequency: "daily",
        times: ["07:00"],
        startDate: new Date().toISOString(),
      });
    const medicineId = createRes.body.data._id;

    const beforeStats = await request(app)
      .get("/api/v1/medicines/stats/adherence")
      .set("Authorization", `Bearer ${user.token}`);
    expect(beforeStats.body.data.medicinesTaken).toBe(0);

    const takeRes = await request(app)
      .post(`/api/v1/medicines/${medicineId}/take`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ scheduledTime: "07:00" });
    expect(takeRes.status).toBe(200);

    const afterStats = await request(app)
      .get("/api/v1/medicines/stats/adherence")
      .set("Authorization", `Bearer ${user.token}`);
    expect(afterStats.body.data.medicinesTaken).toBe(1);
    expect(afterStats.body.data.totalScheduled).toBeGreaterThan(0);
  });
});
