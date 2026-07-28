import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: feedback submission rejects an invalid type", () => {
  it("returns 400 when the type is not one of the allowed values", async () => {
    const user = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ type: "complaint", subject: "Subject", message: "Message" });

    expect(res.status).toBe(400);
  });
});
