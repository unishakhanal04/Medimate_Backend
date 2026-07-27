import request from "supertest";
import app from "../../src/app";

describe("Integration: changing password logs a notification and swaps valid credentials", () => {
  it("invalidates the old password and accepts the new one after a change", async () => {
    const email = "password-flow@example.com";
    const oldPassword = "OldPassword123";
    const newPassword = "NewPassword456";

    await request(app)
      .post("/api/v1/auth/register")
      .send({ username: "Password Flow", email, gender: "female", password: oldPassword });

    const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password: oldPassword });
    const token = loginRes.body.data.token;

    const changeRes = await request(app)
      .put("/api/v1/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: oldPassword, newPassword });
    expect(changeRes.status).toBe(200);

    const oldLoginRes = await request(app).post("/api/v1/auth/login").send({ email, password: oldPassword });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app).post("/api/v1/auth/login").send({ email, password: newPassword });
    expect(newLoginRes.status).toBe(200);

    const notificationsRes = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${newLoginRes.body.data.token}`);
    const passwordChanged = notificationsRes.body.data.items.find(
      (item: { type: string }) => item.type === "password_changed"
    );
    expect(passwordChanged).toBeDefined();
  });
});
