import apiClient from "../client";

export interface AuditLogEntry {
  id:               string;
  admin_id:         string;
  action_type:      string;
  target_user_id?:  string;
  target_txn_id?:   string;
  reason?:          string;
  action_metadata?: Record<string, unknown>;
  created_at:       string;
}

export interface AuditLogResponse {
  actions: AuditLogEntry[];
  total:   number;
  page:    number;
}

export interface GetAuditLogParams {
  page?:            number;
  per_page?:        number;
  admin_id?:        string;
  action_type?:     string;
  target_user_id?:  string;
  from_date?:       string;
  to_date?:         string;
}

export async function getAuditLog(params: GetAuditLogParams = {}): Promise<AuditLogResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/audit-log", { params: cleaned });
  return data;
}
