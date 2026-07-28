import { SystemSettingsService } from "../../src/services/system-settings.services";
import { AppSettingsModel } from "../../src/models/app-settings.model";

jest.mock("../../src/models/app-settings.model");

describe("SystemSettingsService.getMaintenanceMode", () => {
  it("returns false from existing settings", async () => {
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue({ maintenanceMode: false });
    await expect(SystemSettingsService.getMaintenanceMode()).resolves.toBe(false);
  });

  it("returns true from existing settings", async () => {
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue({ maintenanceMode: true });
    await expect(SystemSettingsService.getMaintenanceMode()).resolves.toBe(true);
  });

  it("creates default settings (maintenanceMode false) when none exist yet", async () => {
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue(null);
    (AppSettingsModel.create as jest.Mock).mockResolvedValue({ maintenanceMode: false });
    const result = await SystemSettingsService.getMaintenanceMode();
    expect(AppSettingsModel.create).toHaveBeenCalledWith({ maintenanceMode: false });
    expect(result).toBe(false);
  });
});

describe("SystemSettingsService.setMaintenanceMode", () => {
  it("flips maintenanceMode to true and persists it", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const settings: Record<string, unknown> = { maintenanceMode: false, save };
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue(settings);
    const result = await SystemSettingsService.setMaintenanceMode(true);
    expect(settings.maintenanceMode).toBe(true);
    expect(save).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("flips maintenanceMode to false and persists it", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const settings: Record<string, unknown> = { maintenanceMode: true, save };
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue(settings);
    const result = await SystemSettingsService.setMaintenanceMode(false);
    expect(result).toBe(false);
  });

  it("creates default settings first when none exist, then applies the update", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    (AppSettingsModel.findOne as jest.Mock).mockResolvedValue(null);
    (AppSettingsModel.create as jest.Mock).mockResolvedValue({ maintenanceMode: false, save });
    const result = await SystemSettingsService.setMaintenanceMode(true);
    expect(result).toBe(true);
    expect(save).toHaveBeenCalled();
  });
});
