import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

const medicinePayload = {
  name: "Metformin",
  dosage: "500mg",
  frequency: "daily",
  times: ["08:00"],
  startDate: new Date().toISOString(),
};

describe("Medicine API", () => {
  it("POST /api/v1/medicines rejects a request with no token", async () => {
    const res = await request(app).post("/api/v1/medicines").send(medicinePayload);
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/medicines creates a medicine for the authenticated user", async () => {
    const user = await registerAndLogin();
    const res = await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send(medicinePayload);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Metformin");
    expect(res.body.data.userId).toBe(user.userId);
  });

  it("GET /api/v1/medicines lists only the authenticated user's medicines", async () => {
    const user = await registerAndLogin();
    await request(app).post("/api/v1/medicines").set("Authorization", `Bearer ${user.token}`).send(medicinePayload);

    const res = await request(app).get("/api/v1/medicines").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Metformin");
  });

  it("DELETE /api/v1/medicines/:id blocks deleting another user's medicine with 403", async () => {
    const owner = await registerAndLogin();
    const createRes = await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(medicinePayload);
    const medicineId = createRes.body.data._id;

    const intruder = await registerAndLogin();
    const res = await request(app)
      .delete(`/api/v1/medicines/${medicineId}`)
      .set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });
});
