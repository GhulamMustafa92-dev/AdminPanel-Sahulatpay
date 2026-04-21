import apiClient from "../client";

export type FraudSeverity = "high" | "medium" | "low";
export type FraudStatus   = "open" | "resolved" | "escalated";
export type FraudAction   = "resolved" | "escalated";

export interface FraudAlert {
  id:             string;
  user_id?:       string;
  transaction_id?: string;
  reason:         string;
  severity:       FraudSeverity;
  is_resolved:    boolean;
  created_at:     string;
}

export interface FraudListResponse {
  flags: FraudAlert[];
}

export interface FraudFeedItem {
  flag_id:                  string;
  user_id?:                 string;
  user_risk_score?:         number;
  transaction_id?:          string;
  amount?:                  number;
  fraud_score?:             number;
  deepseek_score?:          number;
  deepseek_recommendation?: string;
  txn_status?:              string;
  hold_expires_at?:         string;
  severity:                 FraudSeverity;
  reason:                   string;
  created_at:               string;
}

export interface FraudFeedResponse {
  feed:  FraudFeedItem[];
  count: number;
  page:  number;
}

export interface GetFraudParams {
  page?:     number;
  per_page?: number;
  resolved?: boolean;
}

export interface GetFraudFeedParams {
  severity?: string;
  page?:     number;
  per_page?: number;
}

export async function getFraudAlerts(params: GetFraudParams = {}): Promise<FraudListResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/fraud-alerts", { params: cleaned });
  return data;
}

export async function getFraudFeed(params: GetFraudFeedParams = {}): Promise<FraudFeedResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/fraud-feed", { params: cleaned });
  return data;
}

export async function resolveAlert(flag_id: string, resolution_note: string): Promise<void> {
  await apiClient.post(`/admin/fraud-alerts/${flag_id}/resolve`, { resolution_note });
}
