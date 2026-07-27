import request from "supertest";
import app from "../../src/app";
import { registerAndLogin } from "../helpers/testAuth";

const pad = (n: number) => String(n).padStart(2, "0");

// A couple of minutes before "now", so it's always in the past for today without
// depending on the wall-clock time the test suite happens to run at.
const recentlyPastTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 2);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

describe("Integration: a missed dose surfaces a notification, then can be marked read", () => {
  it("flags an unlogged past dose as medicine_missed, and mark-seen clears it", async () => {
    const user = await registerAndLogin();

    await request(app)
      .post("/api/v1/medicines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "Losartan",
        dosage: "50mg",
        frequency: "daily",
        times: [recentlyPastTime()],
        startDate: new Date().toISOString(),
      });

    const before = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    const missed = before.body.data.items.find((item: { type: string }) => item.type === "medicine_missed");
    expect(missed).toBeDefined();
    expect(missed.read).toBe(false);

    await request(app).post("/api/v1/notifications/mark-seen").set("Authorization", `Bearer ${user.token}`);

    const after = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${user.token}`);
    const missedAfter = after.body.data.items.find((item: { type: string }) => item.type === "medicine_missed");
    expect(missedAfter.read).toBe(true);
    expect(after.body.data.unreadCount).toBe(0);
  });
});
