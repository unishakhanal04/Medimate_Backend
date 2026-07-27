import request from "supertest";
import app from "../../src/app";

const validUser = (suffix: string) => ({
  username: `Auth Tester ${suffix}`,
  email: `auth-${suffix}@example.com`,
  gender: "other",
  password: "Password123",
});

describe("Auth API", () => {
  it("POST /api/v1/auth/register creates a user and never returns the password", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(validUser("register-ok"));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("auth-register-ok@example.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("POST /api/v1/auth/register rejects an invalid email with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validUser("bad-email"), email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  it("POST /api/v1/auth/register rejects a duplicate email with 409", async () => {
    const user = validUser("duplicate");
    await request(app).post("/api/v1/auth/register").send(user);
    const res = await request(app).post("/api/v1/auth/register").send(user);
    expect(res.status).toBe(409);
  });

  it("POST /api/v1/auth/login succeeds with correct credentials and returns a token", async () => {
    const user = validUser("login-ok");
    await request(app).post("/api/v1/auth/register").send(user);
    const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user.email).toBe(user.email);
  });

  it("POST /api/v1/auth/login rejects an incorrect password with 401", async () => {
    const user = validUser("login-bad");
    await request(app).post("/api/v1/auth/register").send(user);
    const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "WrongPassword1" });
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/auth/whoami rejects a request with no token", async () => {
    const res = await request(app).get("/api/v1/auth/whoami");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/auth/whoami returns the authenticated user's profile", async () => {
    const user = validUser("whoami");
    await request(app).post("/api/v1/auth/register").send(user);
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
    const token = loginRes.body.data.token;

    const res = await request(app).get("/api/v1/auth/whoami").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });
});
