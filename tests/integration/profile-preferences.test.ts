import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: updating preferences persists and is reflected on GET", () => {
  it("reflects darkMode:true on a subsequent GET of the profile", async () => {
    const user = await registerAndLogin();

    const updateRes = await request(app)
      .put("/api/v1/profile/preferences")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ darkMode: true, emailNotifications: false });
    expect(updateRes.status).toBe(200);

    const getRes = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${user.token}`);
    expect(getRes.body.data.preferences.darkMode).toBe(true);
    expect(getRes.body.data.preferences.emailNotifications).toBe(false);
  });
});
