import apiClient from "../client";

export interface TimeSeriesPoint {
  date:  string;
  value: number;
}

export interface DashboardStats {
  total_users:          number;
  active_users:         number;
  locked_users:         number;
  kyc_queue:            number;
  total_transactions:   number;
  total_volume_pkr:     number;
  open_fraud_alerts:    number;
  pending_business:     number;
  unread_notifications: number;
  generated_at:         string;
  time_series?:         TimeSeriesPoint[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/admin/dashboard");
  return data;
}
