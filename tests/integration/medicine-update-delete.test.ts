import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: updating and deleting a medicine", () => {
  it("reflects the updated dosage and returns 404 after deletion", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "daily",
        times: ["08:00"],
        startDate: new Date().toISOString(),
      });
    const medicineId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/v1/medicines/${medicineId}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ dosage: "10mg" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.dosage).toBe("10mg");

    const deleteRes = await request(app)
      .delete(`/api/v1/medicines/${medicineId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/medicines/${medicineId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(getRes.status).toBe(404);
  });
});
