import apiClient from "../client";

export type InsuranceStatus = "active" | "pending" | "expired" | "cancelled";

export interface InsurancePolicy {
  id:                   string;
  user_id:              string;
  user_name:            string;
  user_phone:           string;
  policy_type:          string;
  plan_name:            string;
  policy_number:        string | null;
  premium:              number;
  coverage:             number;
  status:               InsuranceStatus;
  start_date:           string;
  expiry_date:          string | null;
  activated_at:         string | null;
  auto_deduct_enabled:  boolean;
  auto_deduct_freq:     string;
}

export interface InsuranceResponse {
  policies:              InsurancePolicy[];
  total:                 number;
  active_policies:       number;
  total_premium_monthly: number;
  expiring_in_30_days:   number;
  claims_this_month:     number;
}

export interface GetInsuranceParams {
  page?:     number;
  per_page?: number;
  status?:   string;
  search?:   string;
}

export async function getInsurance(params: GetInsuranceParams = {}): Promise<InsuranceResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/insurance", { params: cleaned });
  return data;
}

export async function cancelInsurancePolicy(policyId: string): Promise<{ message: string; refund_amount: string }> {
  const { data } = await apiClient.post(`/admin/insurance/${policyId}/cancel`);
  return data;
}
