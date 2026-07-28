import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: /api/v1/admin/users is forbidden for a non-admin user", () => {
  it("returns 403 when a regular user lists admin users", async () => {
    const user = await registerAndLogin();

    const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(403);
  });
});
