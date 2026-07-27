import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("AI history API", () => {
  it("GET /api/v1/ai/history rejects a request with no token", async () => {
    const res = await request(app).get("/api/v1/ai/history");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/ai/history returns an empty list for a brand-new user", async () => {
    const user = await registerAndLogin();
    const res = await request(app).get("/api/v1/ai/history").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
