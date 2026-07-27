import request from "supertest";
import app from "../../src/app";

describe("Integration: duplicate registration does not corrupt the existing account", () => {
  it("keeps the original account's data and login working after a rejected duplicate signup", async () => {
    const email = "integrity-check@example.com";

    const firstRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: "Original User", email, gender: "male", password: "Password123" });
    expect(firstRes.status).toBe(201);

    const duplicateRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: "Impostor", email, gender: "female", password: "DifferentPass1" });
    expect(duplicateRes.status).toBe(409);

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "Password123" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.username).toBe("Original User");

    const loginWithImpostorPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "DifferentPass1" });
    expect(loginWithImpostorPassword.status).toBe(401);
  });
});
