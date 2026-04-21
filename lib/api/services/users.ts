import apiClient from "../client";

export type UserStatus = "active" | "blocked";
export type KYCStatus = "approved" | "pending" | "rejected" | "not_submitted";

export interface User {
  id:                string;
  full_name:         string;
  phone_number:      string;
  email?:            string;
  verification_tier: number;
  account_type:      string;
  is_active:         boolean;
  is_locked:         boolean;
  is_flagged:        boolean;
  created_at:        string;
}

export interface UserDetail extends User {
  country?:              string;
  age?:                  number;
  is_superuser:          boolean;
  risk_score?:           number;
  cnic_verified:         boolean;
  biometric_verified:    boolean;
  fingerprint_verified:  boolean;
  nadra_verified:        boolean;
  wallet_balance:        number;
  wallet_frozen:         boolean;
  member_since?:         string;
  last_login_at?:        string;
}

export interface UsersListResponse {
  users:    User[];
  total:    number;
  page:     number;
  per_page: number;
  has_next: boolean;
}

export interface UsersListParams {
  page?:      number;
  per_page?:  number;
  search?:    string;
  is_active?: boolean;
  tier?:      number;
}

export async function getUsers(params: UsersListParams = {}): Promise<UsersListResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  );
  const { data } = await apiClient.get<UsersListResponse>("/admin/users", { params: cleaned });
  return data;
}

export async function getUserById(userId: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/admin/users/${userId}`);
  return data;
}

export async function blockUser(userId: string, reason = "Blocked by admin"): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/block`, { reason });
}

export async function unblockUser(userId: string, reason = "Unblocked by admin"): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/unblock`, { reason });
}

export async function overrideTier(userId: string, tier: number): Promise<void> {
  await apiClient.patch(`/admin/users/${userId}/tier`, { tier });
}
