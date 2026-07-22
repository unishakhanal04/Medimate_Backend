import mongoose from "mongoose";
import { AppSettingsModel } from "../models/app-settings.model";
import { SystemErrorLogModel } from "../models/system-error-log.model";
import { CONSTANTS } from "../config/constant";
import { verifySmtpConnection } from "../utils/mailer.util";
import { SystemSettingsSummary } from "../types/system-settings.type";

const DB_STATE_LABELS: Record<number, SystemSettingsSummary["databaseStatus"]> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const getOrCreateSettings = async () => {
  let settings = await AppSettingsModel.findOne();
  if (!settings) {
    settings = await AppSettingsModel.create({ maintenanceMode: false });
  }
  return settings;
};

export const SystemSettingsService = {
  async getSummary(): Promise<SystemSettingsSummary> {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    const [settings, recentGeminiFailures, smtpResult] = await Promise.all([
      getOrCreateSettings(),
      SystemErrorLogModel.countDocuments({ source: "gemini_api", createdAt: { $gte: dayAgo } }),
      verifySmtpConnection()
        .then(() => ({ ok: true as const }))
        .catch((err) => ({ ok: false as const, error: err instanceof Error ? err.message : "SMTP verification failed" })),
    ]);

    let smtpStatus: SystemSettingsSummary["smtpStatus"] = "not_configured";
    let smtpError: string | undefined;
    if (CONSTANTS.SMTP_HOST) {
      if (smtpResult.ok) {
        smtpStatus = "connected";
      } else {
        smtpStatus = "error";
        smtpError = smtpResult.error;
      }
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      appVersion: require("../../package.json").version,
      smtpStatus,
      smtpError,
      smtpHost: CONSTANTS.SMTP_HOST || undefined,
      smtpPort: CONSTANTS.SMTP_HOST ? CONSTANTS.SMTP_PORT : undefined,
      smtpSecure: CONSTANTS.SMTP_HOST ? CONSTANTS.SMTP_PORT === 465 : undefined,
      geminiStatus: CONSTANTS.GEMINI_API_KEY ? "configured" : "not_configured",
      recentGeminiFailures,
      databaseStatus: DB_STATE_LABELS[mongoose.connection.readyState] ?? "disconnected",
      uptimeSeconds: Math.floor(process.uptime()),
      maintenanceMode: settings.maintenanceMode,
    };
  },

  async getMaintenanceMode(): Promise<boolean> {
    const settings = await getOrCreateSettings();
    return settings.maintenanceMode;
  },

  async setMaintenanceMode(enabled: boolean): Promise<boolean> {
    const settings = await getOrCreateSettings();
    settings.maintenanceMode = enabled;
    await settings.save();
    return settings.maintenanceMode;
  },
};
