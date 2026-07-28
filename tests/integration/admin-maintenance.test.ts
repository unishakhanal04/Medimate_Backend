import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: toggling maintenance mode blocks and then unblocks regular API access", () => {
  it("blocks a non-exempt route while enabled and restores access once disabled", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-maintenance@example.com" });
    const user = await registerAndLogin({ email: "regular-during-maintenance@example.com" });

    const enableRes = await request(app)
      .patch("/api/v1/admin/system-settings/maintenance-mode")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ enabled: true });
    expect(enableRes.status).toBe(200);
    expect(enableRes.body.data.maintenanceMode).toBe(true);

    const statusRes = await request(app).get("/api/v1/system/maintenance-status");
    expect(statusRes.body.data.maintenanceMode).toBe(true);

    const blockedRes = await request(app)
      .get("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`);
    expect(blockedRes.status).toBe(503);

    const disableRes = await request(app)
      .patch("/api/v1/admin/system-settings/maintenance-mode")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ enabled: false });
    expect(disableRes.body.data.maintenanceMode).toBe(false);

    const restoredRes = await request(app)
      .get("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`);
    expect(restoredRes.status).toBe(200);
  });
});
