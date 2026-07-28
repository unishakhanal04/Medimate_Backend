import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: emergency contact creation requires name, relationship, and phone", () => {
  it("rejects a contact missing the phone field with 400", async () => {
    const user = await registerAndLogin();

    const res = await request(app)
      .post("/api/emergency-contacts")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Ram Bahadur", relationship: "Father" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
