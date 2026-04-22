import apiClient from "../client";

export type ReversalReasonCode = "fraud_confirmed" | "erroneous_transfer" | "dispute_resolved";
export type ReversalStatus = "pending" | "approved" | "rejected";

export interface ReversalRequest {
  id:             string;
  txn_id:         string;
  requested_by:   string;
  reason_code:    ReversalReasonCode;
  reason_detail?: string;
  status:         ReversalStatus;
  reviewed_by?:   string;
  reviewed_at?:   string;
  review_note?:   string;
  created_at:     string;
}

export interface ReversalRequestsResponse {
  requests: ReversalRequest[];
  page:     number;
  per_page: number;
}

export interface GetReversalRequestsParams {
  status?:   string;
  page?:     number;
  per_page?: number;
}

export async function getReversalRequests(
  params: GetReversalRequestsParams = {}
): Promise<ReversalRequestsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/reversal-requests", { params: cleaned });
  return data;
}

export async function reviewReversalRequest(
  reqId:        string,
  decision:     "approved" | "rejected",
  review_note?: string
): Promise<void> {
  await apiClient.post(`/admin/reversal-requests/${reqId}/review`, {
    decision,
    review_note: review_note ?? "",
  });
}
