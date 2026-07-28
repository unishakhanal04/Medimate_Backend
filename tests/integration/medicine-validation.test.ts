import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: creating a medicine without required fields fails", () => {
  it("rejects a medicine with no dosage or times", async () => {
    const user = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Incomplete Drug", frequency: "daily", startDate: new Date().toISOString() });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});
