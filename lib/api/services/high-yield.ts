import apiClient from "../client";

export type HighYieldStatus = "active" | "matured" | "withdrawn";

export interface HighYieldDeposit {
  id:               string;
  user_name:        string;
  user_phone:       string;
  amount:           number;
  interest_rate:    number;
  period_days:      number;
  maturity_date:    string;
  status:           HighYieldStatus;
  interest_earned:  number;
}

export interface HighYieldResponse {
  deposits:                    HighYieldDeposit[];
  total:                       number;
  total_deposits:              number;
  total_interest_owed:         number;
  maturing_in_7_days:          number;
  maturing_in_7_days_amount:   number;
  early_withdrawals_this_month: number;
}

export interface GetHighYieldParams {
  page?:   number;
  per_page?: number;
  status?: string;
  search?: string;
}

export async function getHighYieldDeposits(params: GetHighYieldParams = {}): Promise<HighYieldResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/high-yield", { params: cleaned });
  return data;
}
