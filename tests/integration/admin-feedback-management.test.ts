import request from "supertest";
import app from "../../src/app";
import { registerAndLogin, registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin can list submitted feedback and update its status", () => {
  it("shows the submitted feedback with the reporter's username and updates its status", async () => {
    const member = await registerAndLogin({ username: "Feedback Reporter", email: "feedback-reporter@example.com" });
    const admin = await registerAndLoginAdmin({ email: "admin-feedback@example.com" });

    await request(app)
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${member.token}`)
      .send({ type: "suggestion", subject: "Add dark mode", message: "Please add a dark theme." });

    const listRes = await request(app)
      .get("/api/v1/admin/feedback?type=suggestion&status=new")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(listRes.status).toBe(200);
    const entry = listRes.body.data.data.find((f: { subject: string }) => f.subject === "Add dark mode");
    expect(entry).toBeDefined();
    expect(entry.username).toBe("Feedback Reporter");

    const updateRes = await request(app)
      .patch(`/api/v1/admin/feedback/${entry.id}/status`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "reviewed" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("reviewed");
  });
});
