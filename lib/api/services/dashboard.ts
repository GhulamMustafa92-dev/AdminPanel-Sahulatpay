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
  days?:                number;
  time_series?:         TimeSeriesPoint[];
  category_data?:       { name: string; value: number }[];
  weekly_revenue?:      { date: string; value: number }[];
  purpose_breakdown?:   { name: string; count: number }[];
  health_data?:         { name: string; value: number; color: string }[];
}

export async function getDashboardStats(days = 7): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>(`/admin/dashboard?days=${days}`);
  return data;
}
