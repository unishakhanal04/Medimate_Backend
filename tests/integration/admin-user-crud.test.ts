import request from "supertest";
import app from "../../src/app";
import { registerAndLoginAdmin } from "../helpers/testAuth";

describe("Integration: admin user-management CRUD via /api/v1/admin/users", () => {
  it("creates, lists, updates, and deletes a user as an admin", async () => {
    const admin = await registerAndLoginAdmin({ email: "admin-crud@example.com" });

    const createRes = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ username: "Managed User", email: "managed-user@example.com", gender: "male", password: "Password123" });
    expect(createRes.status).toBe(201);
    const userId = createRes.body.id;
    expect(userId).toBeDefined();

    const listRes = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((u: { id: string }) => u.id === userId)).toBe(true);

    const updateRes = await request(app)
      .patch(`/api/v1/admin/users/${userId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ username: "Renamed User" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.username).toBe("Renamed User");

    const deleteRes = await request(app)
      .delete(`/api/v1/admin/users/${userId}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await request(app)
      .get(`/api/v1/admin/users/${userId}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
