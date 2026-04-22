import apiClient from "../client";

export type StrStatus = "draft" | "reviewed" | "submitted";
export type StrReportType = "STR" | "CTR";

export interface StrReport {
  id:              string;
  user_id:         string;
  transaction_id?: string;
  report_type:     StrReportType;
  amount_pkr:      number;
  ai_narrative?:   string;
  status:          StrStatus;
  generated_at:    string;
  reviewed_by?:    string;
  submitted_at?:   string;
  submission_ref?: string;
}

export interface StrReportsResponse {
  reports: StrReport[];
  total:   number;
  page:    number;
}

export interface GetStrReportsParams {
  status?:   string;
  page?:     number;
  per_page?: number;
}

export async function getStrReports(params: GetStrReportsParams = {}): Promise<StrReportsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get("/admin/str-reports", { params: cleaned });
  return data;
}

export async function reviewStrReport(reportId: string, narrative: string): Promise<void> {
  await apiClient.post(`/admin/str-reports/${reportId}/review`, { narrative });
}

export async function submitStrReport(reportId: string, submission_ref: string): Promise<void> {
  await apiClient.post(`/admin/str-reports/${reportId}/submit`, { submission_ref });
}
