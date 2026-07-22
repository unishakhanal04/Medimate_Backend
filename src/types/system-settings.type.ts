export interface SystemSettingsSummary {
  appVersion: string;
  smtpStatus: "connected" | "not_configured" | "error";
  smtpError?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  geminiStatus: "configured" | "not_configured";
  recentGeminiFailures: number;
  databaseStatus: "connected" | "disconnected" | "connecting" | "disconnecting";
  uptimeSeconds: number;
  maintenanceMode: boolean;
}
