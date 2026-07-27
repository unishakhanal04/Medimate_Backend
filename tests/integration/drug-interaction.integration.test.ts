import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: interaction check flags a warning across a user's active medicines", () => {
  const fetchSpy = jest.spyOn(global, "fetch");

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it("returns a warning when the FDA label text mentions the other active medicine", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            drug_interactions: ["Avoid combining with warfarin due to increased bleeding risk."],
          },
        ],
      }),
    } as Response);

    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Warfarin",
        dosage: "5mg",
        frequency: "daily",
        times: ["21:00"],
        startDate: new Date().toISOString(),
      });

    const res = await request(app)
      .post("/api/v1/medicines/check-interactions")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Aspirin" });

    expect(res.status).toBe(200);
    expect(res.body.data.warnings).toHaveLength(1);
    expect(res.body.data.warnings[0].otherMedicineName).toBe("Warfarin");
  });
});
