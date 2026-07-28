import request from "supertest";
import app from "../../src/app";

describe("Integration: register -> login -> whoami", () => {
  it("keeps user identity consistent across the full auth lifecycle", async () => {
    const payload = {
      username: "Flow Tester",
      email: "flow-tester@example.com",
      gender: "male",
      password: "Password123",
    };

    const registerRes = await request(app).post("/api/v1/auth/register").send(payload);
    expect(registerRes.status).toBe(201);
    const registeredId = registerRes.body.data.id;

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.id).toBe(registeredId);

    const whoamiRes = await request(app)
      .get("/api/v1/auth/whoami")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);
    expect(whoamiRes.status).toBe(200);
    expect(whoamiRes.body.data.id).toBe(registeredId);
    expect(whoamiRes.body.data.username).toBe(payload.username);
  });
});
