import apiClient from "../client";

export interface ZakatMonthlyData {
  month:  string;
  amount: number;
}

export interface ZakatStatsResponse {
  total_zakat_paid:      number;
  users_paid_this_year:  number;
  this_month_collection: number;
  avg_per_user:          number;
  monthly_data:          ZakatMonthlyData[];
}

export async function getZakatStats(): Promise<ZakatStatsResponse> {
  const { data } = await apiClient.get("/admin/zakat/stats");
  return data;
}
