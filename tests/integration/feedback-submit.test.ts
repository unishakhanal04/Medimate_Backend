import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: submitted feedback appears in the user's feedback list", () => {
  it("creates a feedback entry and returns it from GET /api/v1/feedback", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ type: "bug_report", subject: "Reminder not firing", message: "The 9am reminder never showed up." });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get("/api/v1/feedback").set("Authorization", `Bearer ${user.token}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((f: { subject: string }) => f.subject === "Reminder not firing");
    expect(found).toBeDefined();
    expect(found.type).toBe("bug_report");
  });
});
