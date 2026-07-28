import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: emergency contact create, update, and delete flow", () => {
  it("creates, lists, updates, and deletes an emergency contact", async () => {
    const user = await registerAndLogin();

    const createRes = await request(app)
      .post("/api/emergency-contacts")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Sita Rai", relationship: "Sister", phone: "9800000000" });
    expect(createRes.status).toBe(201);
    const contactId = createRes.body.data._id;

    const listRes = await request(app).get("/api/emergency-contacts").set("Authorization", `Bearer ${user.token}`);
    expect(listRes.body.data.map((c: { _id: string }) => c._id)).toContain(contactId);

    const updateRes = await request(app)
      .patch(`/api/emergency-contacts/${contactId}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ phone: "9811111111" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.phone).toBe("9811111111");

    const deleteRes = await request(app)
      .delete(`/api/emergency-contacts/${contactId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(deleteRes.status).toBe(200);

    const listAfter = await request(app).get("/api/emergency-contacts").set("Authorization", `Bearer ${user.token}`);
    expect(listAfter.body.data.map((c: { _id: string }) => c._id)).not.toContain(contactId);
  });
});
