import apiClient from "../client";

export type BusinessStatus = "pending" | "approved" | "rejected";

export interface BusinessDocument {
  type: string;
  url:  string;
}

export interface AIAnalysis {
  result:      string;
  confidence:  number;
  analyzed_at: string;
}

export interface BusinessProfile {
  id:                  string;
  profile_id:          string;
  business_name:       string;
  business_type:       string;
  registration_number: string;
  description?:        string;
  status:              BusinessStatus;
  submitted_at:        string;
  owner: {
    name:  string;
    phone: string;
    email: string;
  };
  documents:         BusinessDocument[];
  ai_analysis?:      AIAnalysis;
  rejection_reason?: string;
}

export interface BusinessListResponse {
  profiles: BusinessProfile[];
  total:    number;
}

export async function getPendingBusinesses(): Promise<BusinessListResponse> {
  const { data } = await apiClient.get("/admin/business/pending");
  return data;
}

export async function approveBusiness(profile_id: string): Promise<void> {
  await apiClient.post(`/admin/business/${profile_id}/approve`);
}

export async function rejectBusiness(profile_id: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/business/${profile_id}/reject`, { reason });
}
