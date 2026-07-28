import request from "supertest";
import app from "../../src/app";

describe("Integration: protected routes reject requests without a token", () => {
  it("returns 401 from a protected route with no Authorization header", async () => {
    const res = await request(app).get("/api/v1/medicines");
    expect(res.status).toBe(401);
  });

  it("returns 200 from the public maintenance-status route with no token", async () => {
    const res = await request(app).get("/api/v1/system/maintenance-status");
    expect(res.status).toBe(200);
  });
});
