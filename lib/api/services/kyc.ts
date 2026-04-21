import apiClient from "../client";

export type KycStatus = "pending" | "approved" | "rejected";

export interface KycItem {
  id:                 string;
  user_id:            string;
  user_name?:         string;
  user_phone?:        string;
  account_cnic?:      string;
  status?:            string;
  extracted_cnic?:    string;
  extracted_name?:    string;
  extracted_dob?:     string;
  extracted_father?:  string;
  extracted_address?: string;
  cnic_masked?:       string;
  front_image_url?:   string;
  back_image_url?:    string;
  rejection_reason?:  string;
  submitted_at?:      string;
  reviewed_at?:       string;
}

export interface KycQueueResponse {
  reviews: KycItem[];
  total:   number;
  page:    number;
}

export interface KycQueueParams {
  page?:     number;
  per_page?: number;
  status?:   string;
}

export async function getKycQueue(params: KycQueueParams = {}): Promise<KycQueueResponse> {
  const { data } = await apiClient.get<KycQueueResponse>("/admin/kyc-reviews", { params });
  return data;
}

export async function approveKyc(reviewId: string, reason = "Approved"): Promise<void> {
  await apiClient.post(`/admin/kyc-reviews/${reviewId}/approve`, { reason });
}

export async function rejectKyc(reviewId: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/kyc-reviews/${reviewId}/reject`, { reason });
}
