import apiClient from "../client";

export type SavingsGoalStatus = "active" | "completed" | "paused" | "cancelled";

export interface SavingsGoal {
  id:                  string;
  user_name:           string;
  user_phone:          string;
  goal_name:           string;
  target_amount:       number;
  current_amount:      number;
  progress_percentage: number;
  status:              SavingsGoalStatus;
  created_at:          string;
}

export interface SavingsOverviewResponse {
  total_goals:         number;
  active_goals:        number;
  completed_goals:     number;
  auto_deduct_enabled: number;
  total_saved_pkr:     number;
  goals?:              SavingsGoal[];
  total?:              number;
  avg_progress?:       number;
  completed_this_month?: number;
}

export interface GetSavingsParams {
  page?:     number;
  per_page?: number;
  status?:   string;
  search?:   string;
}

export async function getSavingsOverview(params: GetSavingsParams = {}): Promise<SavingsOverviewResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/savings/overview", { params: cleaned });
  return data;
}
