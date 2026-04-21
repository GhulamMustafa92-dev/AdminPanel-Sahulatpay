import apiClient from "../client";

export type NotificationType = "promotional" | "transactional" | "alert" | "system";
export type BroadcastStatus  = "sent" | "failed" | "pending";

export interface BroadcastPayload {
  title:              string;
  body:               string;
  type?:              string;
  notification_type?: string;
  target_all?:        boolean;
  user_ids?:          string[];
}

export interface BroadcastHistoryItem {
  id:                string;
  title:             string;
  body:              string;
  notification_type: NotificationType;
  target_all:        boolean;
  recipient_count:   number;
  status:            BroadcastStatus;
  sent_at:           string;
  created_by?:       string;
}

export interface BroadcastHistoryResponse {
  items: BroadcastHistoryItem[];
  total: number;
}

export async function broadcastNotification(payload: BroadcastPayload): Promise<void> {
  await apiClient.post("/admin/notifications/broadcast", payload);
}

// Note: backend has no GET history endpoint — this is a placeholder
export async function getBroadcastHistory(): Promise<BroadcastHistoryResponse> {
  return { items: [], total: 0 };
}
