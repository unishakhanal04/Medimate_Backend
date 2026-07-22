export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminUsername: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  description: string;
  date: string;
}

export interface AuditLogListResult {
  items: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  action?: string;
  adminId?: string;
}

export interface LogAuditParams {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  description: string;
}
