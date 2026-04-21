import apiClient from "../client";

export interface AITopUser {
  id:            string;
  user_name:     string;
  user_phone:    string;
  message_count: number;
  last_active:   string;
}

export interface AIHealthScoreDistribution {
  good: number;
  fair: number;
  poor: number;
}

export interface AIMonitorResponse {
  chat_messages_today:       number;
  chat_messages_this_month:  number;
  total_api_calls:           number;
  error_rate:                number;
  cache_hit_rate:            number;
  top_users:                 AITopUser[];
  health_score_distribution: AIHealthScoreDistribution;
}

export async function getAIMonitor(): Promise<AIMonitorResponse> {
  const { data } = await apiClient.get("/admin/ai/monitor");
  return data;
}
