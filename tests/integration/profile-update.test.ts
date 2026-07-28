import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: updating the profile persists and is reflected on GET", () => {
  it("reflects the updated phone and blood group on a subsequent GET", async () => {
    const user = await registerAndLogin();

    const updateRes = await request(app)
      .put("/api/v1/profile")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ phone: "9812345678", bloodGroup: "O+" });
    expect(updateRes.status).toBe(200);

    const getRes = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${user.token}`);
    expect(getRes.body.data.phone).toBe("9812345678");
    expect(getRes.body.data.bloodGroup).toBe("O+");
  });
});
