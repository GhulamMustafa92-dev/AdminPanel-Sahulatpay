import apiClient from "../client";

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Dispute {
  id:              string;
  transaction_id:  string;
  user_id:         string;
  dispute_type:    string;
  reason:          string;
  evidence_note?:  string;
  status:          DisputeStatus;
  created_at:      string;
  resolved_at?:    string;
  resolved_by?:    string;
  resolution_note?: string;
}

export interface DisputesResponse {
  disputes: Dispute[];
  page:     number;
  per_page: number;
}

export interface GetDisputesParams {
  status?:   string;
  page?:     number;
  per_page?: number;
}

export async function getDisputes(
  params: GetDisputesParams = {}
): Promise<DisputesResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/disputes", { params: cleaned });
  return data;
}

export async function reviewDispute(
  disputeId:  string,
  decision:   "accept" | "dismiss",
  admin_note?: string
): Promise<void> {
  await apiClient.post(`/admin/disputes/${disputeId}/review`, {
    decision,
    admin_note: admin_note ?? "",
  });
}
