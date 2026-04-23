import apiClient from "../client";

export type InvestmentStatus = "active" | "matured" | "cancelled" | "withdrawn";

export interface Investment {
  id:             string;
  user_id:        string;
  user_name:      string;
  user_phone:     string;
  plan_name:      string;
  amount:         number;
  returns:        number;
  roi_percentage: number;
  status:         InvestmentStatus;
  start_date:     string;
  maturity_date:  string | null;
}

export interface InvestmentsResponse {
  investments:       Investment[];
  total:             number;
  total_invested:    number;
  active_plans:      number;
  matured_this_month: number;
  total_returns:     number;
}

export interface GetInvestmentsParams {
  page?:   number;
  per_page?: number;
  status?: string;
  search?: string;
}

export async function getInvestments(params: GetInvestmentsParams = {}): Promise<InvestmentsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/investments", { params: cleaned });
  return data;
}
