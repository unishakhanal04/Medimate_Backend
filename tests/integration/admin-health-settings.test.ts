import request from "supertest";
import app from "../../src/app";
import { registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin system health and system settings endpoints", () => {
  it("reports an ok/connected system health snapshot", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-health@example.com" });

    const res = await request(app).get("/api/v1/admin/system-health").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.apiStatus).toBe("ok");
    expect(res.body.data.databaseStatus).toBe("connected");
  });

  it("returns the system settings summary including app version and gemini status", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-settings@example.com" });

    const res = await request(app)
      .get("/api/v1/admin/system-settings")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.appVersion).toBeDefined();
    expect(["configured", "not_configured"]).toContain(res.body.data.geminiStatus);
  });
});
