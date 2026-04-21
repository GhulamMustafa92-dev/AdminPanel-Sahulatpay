import apiClient from "../client";

export type CardStatus    = "active" | "blocked" | "pending_delivery";
export type DeliveryStatus =
  | "processing"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export interface Card {
  id:               string;
  user_id:          string;
  card_type:        string;
  status:           CardStatus;
  last_four?:       string;
  network?:         string;
  delivery_status?: DeliveryStatus;
  created_at:       string;
}

export interface CardListResponse {
  cards: Card[];
  total: number;
}

export interface GetCardsParams {
  page?:     number;
  per_page?: number;
  status?:   string;
}

export async function getCards(params: GetCardsParams): Promise<CardListResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/cards", { params: cleaned });
  return data;
}

export async function blockCard(card_id: string, reason = "Blocked by admin"): Promise<void> {
  await apiClient.post(`/admin/cards/${card_id}/block`, { reason });
}

export async function unblockCard(card_id: string, reason = "Unblocked by admin"): Promise<void> {
  await apiClient.post(`/admin/cards/${card_id}/unblock`, { reason });
}

export async function updateDeliveryStatus(
  card_id: string,
  delivery_status: DeliveryStatus,
  reason = ""
): Promise<void> {
  await apiClient.patch(`/admin/cards/${card_id}/delivery-status`, { delivery_status, reason });
}
