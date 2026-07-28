import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: a user cannot update another user's emergency contact", () => {
  it("returns 404 when the contact belongs to a different user", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/emergency-contacts")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Owner Contact", relationship: "Friend", phone: "9800001111" });
    const contactId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/emergency-contacts/${contactId}`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ phone: "9800002222" });

    expect(res.status).toBe(404);
  });
});
