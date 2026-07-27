import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Admin API access control", () => {
  it("GET /api/v1/admin/system-health rejects a non-admin user with 403", async () => {
    const user = await registerAndLogin();
    const res = await request(app)
      .get("/api/v1/admin/system-health")
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(403);
  });
});
