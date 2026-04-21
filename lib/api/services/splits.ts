import apiClient from "../client";

export type SplitType   = "equal" | "custom" | "percentage";
export type SplitStatus = "completed" | "pending" | "partial";

export interface Split {
  id:                 string;
  split_id:           string;
  creator_name:       string;
  creator_phone:      string;
  title:              string;
  total_amount:       number;
  split_type:         SplitType;
  participants_count: number;
  status:             SplitStatus;
  created_at:         string;
  is_flagged?:        boolean;
}

export interface SplitsResponse {
  splits:              Split[];
  total:               number;
  total_splits:        number;
  total_settled:       number;
  pending_settlements: number;
  flagged_this_month:  number;
}

export interface GetSplitsParams {
  page?:       number;
  per_page?: number;
  status?:     string;
  from_date?:  string;
  to_date?:    string;
  search?:     string;
  min_amount?: number;
  max_amount?: number;
}

export async function getSplits(params: GetSplitsParams = {}): Promise<SplitsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== 0)
  );
  const { data } = await apiClient.get("/admin/splits", { params: cleaned });
  return data;
}

export async function flagSplit(split_id: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/splits/${split_id}/flag`, { reason });
}
