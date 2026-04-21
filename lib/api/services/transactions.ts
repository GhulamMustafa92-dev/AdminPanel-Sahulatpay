import apiClient from "../client";

export type TxnStatus = "completed" | "pending" | "failed" | "reversed";
export type TxnType   = "send" | "receive" | "deposit" | "withdrawal";

export interface Transaction {
  id:               string;
  reference_number: string;
  type:             TxnType;
  amount:           number;
  fee?:             number;
  status:           TxnStatus;
  purpose?:         string;
  sender_id?:       string;
  recipient_id?:    string;
  is_flagged?:      boolean;
  created_at:       string;
}

export interface TransactionListResponse {
  transactions:  Transaction[];
  total:         number;
  page:          number;
}

export interface GetTransactionsParams {
  page?:       number;
  per_page?:   number;
  status?:     string;
  is_flagged?: boolean;
}

export async function getTransactions(
  params: GetTransactionsParams
): Promise<TransactionListResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  );
  const { data } = await apiClient.get("/admin/transactions", { params: cleaned });
  return data;
}

export async function requestReversal(
  txn_id: string,
  reason_code: "fraud_confirmed" | "erroneous_transfer" | "dispute_resolved",
  reason_detail?: string
): Promise<void> {
  await apiClient.post(`/admin/transactions/${txn_id}/request-reversal`, {
    reason_code,
    reason_detail: reason_detail ?? reason_code,
  });
}

export async function flagTransaction(txn_id: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/transactions/${txn_id}/flag`, { reason });
}
