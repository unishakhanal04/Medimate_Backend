import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin can see registered members, portal access is enforced", () => {
  it("lists a regular user in the admin members view, and blocks that user from the admin portal", async () => {
    const member = await registerAndLogin({ username: "Regular Member", email: "regular-member@example.com" });
    const admin = await registerAndLoginAdmin({ email: "admin-flow@example.com" });

    const membersRes = await request(app)
      .get("/api/v1/admin/members")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(membersRes.status).toBe(200);
    const found = membersRes.body.data.data.find((u: { email: string }) => u.email === member.email);
    expect(found).toBeDefined();
    expect(found.username).toBe("Regular Member");

    const wrongPortalLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: member.email, password: "Password123", portal: "admin" });
    expect(wrongPortalLogin.status).toBe(403);
  });
});
