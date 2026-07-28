import { DrugInteractionService } from "../../src/services/drug-interaction.services";
import { MedicineService } from "../../src/services/medicine.services";

jest.mock("../../src/services/medicine.services");

const medicine = (id: string, name: string) => ({ _id: { toString: () => id }, name });

const fetchSpy = jest.spyOn(global, "fetch");

afterEach(() => fetchSpy.mockReset());
afterAll(() => fetchSpy.mockRestore());

describe("DrugInteractionService.checkAgainstActiveMedicines", () => {
  it("returns no warnings when the user has no other active medicines", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([]);
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "Aspirin");
    expect(warnings).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("excludes the medicine currently being edited from the comparison set", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "SoloDrug")]);
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "SoloDrug", "m1");
    expect(warnings).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("flags a warning when the FDA label mentions the other medicine by name", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "WarfarinCase3")]);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ drug_interactions: ["Avoid combining with warfarincase3."] }] }),
    } as Response);
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "IbuprofenCase3");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].otherMedicineName).toBe("WarfarinCase3");
    expect(warnings[0].otherMedicineId).toBe("m1");
  });

  it("returns no warning when the FDA label does not mention the other medicine", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "MetforminCase4")]);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ drug_interactions: ["No known interactions."] }] }),
    } as Response);
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "NaproxenCase4");
    expect(warnings).toEqual([]);
  });

  it("treats a non-OK FDA response as no label data without throwing", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "InsulinCase5")]);
    fetchSpy.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "LosartanCase5");
    expect(warnings).toEqual([]);
  });

  it("swallows fetch errors and treats them as no label data", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "ClopidogrelCase6")]);
    fetchSpy.mockRejectedValue(new Error("network down"));
    const warnings = await DrugInteractionService.checkAgainstActiveMedicines("u1", "AtorvastatinCase6");
    expect(warnings).toEqual([]);
  });
});

describe("DrugInteractionService.checkAllActiveMedicines", () => {
  it("returns an empty list when the user has fewer than two active medicines", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([medicine("m1", "AspirinCase7")]);
    const result = await DrugInteractionService.checkAllActiveMedicines("u1");
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("groups warnings per medicine and de-duplicates the reverse-direction pair", async () => {
    (MedicineService.getActiveMedicinesByUserId as jest.Mock).mockResolvedValue([
      medicine("m1", "WarfarinCase8"),
      medicine("m2", "AspirinCase8"),
    ]);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ drug_interactions: ["Avoid combining warfarincase8 with aspirincase8."] }] }),
    } as Response);
    const result = await DrugInteractionService.checkAllActiveMedicines("u1");
    const totalWarnings = result.reduce((sum, r) => sum + r.warnings.length, 0);
    expect(totalWarnings).toBe(1);
  });
});
