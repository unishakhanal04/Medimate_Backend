import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin cannot create a user with an email already in use", () => {
  it("returns 409 when the email already belongs to an existing user", async () => {
    const existing = await registerAndLogin({ email: "already-taken@example.com" });
    const admin = await registerAndLoginAdmin({ email: "admin-dup-check@example.com" });

    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ username: "Duplicate", email: existing.email, gender: "female", password: "Password123" });

    expect(res.status).toBe(409);
  });
});
