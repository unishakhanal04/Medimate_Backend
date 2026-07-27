import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

describe("Integration: low medicine stock triggers a notification", () => {
  it("surfaces a low_stock notification when quantity drops to the refill threshold", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Insulin",
        dosage: "10 units",
        frequency: "daily",
        times: ["20:00"],
        startDate: new Date().toISOString(),
        quantity: 2,
        refillThreshold: 5,
      });

    const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    const lowStock = res.body.data.items.find((item: { type: string }) => item.type === "low_stock");
    expect(lowStock).toBeDefined();
    expect(lowStock.message).toContain("Insulin");
  });
});
