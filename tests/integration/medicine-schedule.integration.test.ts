import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: created medicine appears in today's schedule", () => {
  it("shows a newly created daily medicine as pending in today/list", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Amoxicillin",
        dosage: "250mg",
        frequency: "daily",
        times: ["09:00"],
        startDate: new Date().toISOString(),
      });

    const res = await request(app)
      .get("/api/v1/medicines/today/list")
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: "Amoxicillin", time: "09:00", status: "pending" });
  });
});
