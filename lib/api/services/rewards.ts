import apiClient from "../client";

export type DiscountType = "percent" | "flat";

export interface OfferTemplate {
  id:               string;
  name:             string;
  type:             string;
  discount_type:    DiscountType;
  value:            number;
  min_spend:        number;
  expiry_date:      string;
  description?:     string;
  is_active:        boolean;
  completion_rate:  number;
  assignments_count: number;
  created_at:       string;
}

export interface OfferListResponse {
  templates:              OfferTemplate[];
  total:                  number;
  active_count:           number;
  inactive_count:         number;
  assignments_this_month: number;
}

export interface CreateOfferPayload {
  name:          string;
  type:          string;
  discount_type: DiscountType;
  value:         number;
  min_spend:     number;
  expiry_date:   string;
  description?:  string;
}

export interface AssignOfferPayload {
  template_id: string;
  user_ids:    string[];
}

export async function getOfferTemplates(): Promise<OfferListResponse> {
  const { data } = await apiClient.get("/admin/offers/templates");
  return data;
}

export async function createOfferTemplate(payload: CreateOfferPayload): Promise<OfferTemplate> {
  const { data } = await apiClient.post("/admin/offers/templates", payload);
  return data;
}

export async function updateOfferTemplate(
  id: string,
  payload: Partial<CreateOfferPayload> & { is_active?: boolean }
): Promise<void> {
  await apiClient.patch(`/admin/offers/templates/${id}`, payload);
}

export async function deleteOfferTemplate(id: string): Promise<void> {
  await apiClient.delete(`/admin/offers/templates/${id}`);
}

export async function assignOffer(payload: AssignOfferPayload): Promise<void> {
  await apiClient.post("/admin/offers/assign", payload);
}
