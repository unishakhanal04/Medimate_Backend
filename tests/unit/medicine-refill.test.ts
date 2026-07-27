import { MedicineService } from "../../src/services/medicine.services";
import { MedicineRepository } from "../../src/repositories/medicine.repository";

jest.mock("../../src/repositories/medicine.repository");

const baseMedicine = (overrides: Record<string, unknown>) => ({
  _id: { toString: () => overrides.id },
  name: overrides.name,
  dosage: "10mg",
  quantity: overrides.quantity,
  refillThreshold: overrides.refillThreshold,
});

describe("MedicineService.getRefillAlerts", () => {
  it("flags medicines at or below their refill threshold", async () => {
    (MedicineRepository.findActiveByUserId as jest.Mock).mockResolvedValue([
      baseMedicine({ id: "m1", name: "Metformin", quantity: 3, refillThreshold: 5 }),
      baseMedicine({ id: "m2", name: "Paracetamol", quantity: 20, refillThreshold: 5 }),
    ]);

    const alerts = await MedicineService.getRefillAlerts("user1");

    expect(alerts).toHaveLength(1);
    expect(alerts[0].name).toBe("Metformin");
  });

  it("returns an empty list when no medicines have a tracked quantity", async () => {
    (MedicineRepository.findActiveByUserId as jest.Mock).mockResolvedValue([
      baseMedicine({ id: "m3", name: "Vitamin D", quantity: undefined, refillThreshold: 5 }),
    ]);

    const alerts = await MedicineService.getRefillAlerts("user1");

    expect(alerts).toHaveLength(0);
  });
});
