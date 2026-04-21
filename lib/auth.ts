import apiClient from "./api/client";

export async function adminLogin(phone: string, password: string): Promise<void> {
  let loginData;
  try {
    const res = await apiClient.post("/auth/login", { phone, password, device_fingerprint: "smartpay-admin-v1" });
    loginData = res.data;
  } catch (loginErr: unknown) {
    const axiosErr = loginErr as { response?: { data?: { detail?: unknown; message?: string }; status?: number } };
    const detail   = axiosErr?.response?.data?.detail;
    const message  = axiosErr?.response?.data?.message;
    const status   = axiosErr?.response?.status;
    const readable =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string; loc?: string[] }) =>
              d.loc?.length ? `"${d.loc.slice(-1)[0]}": ${d.msg}` : (d.msg ?? JSON.stringify(d))
            ).join(" | ")
          : message ?? `Request failed with status code ${status}`;
    throw new Error(readable);
  }

  const { status, tokens, is_superuser } = loginData;

  if (status !== "authenticated" || !tokens) {
    throw new Error("Login incomplete — unexpected response from server.");
  }
  if (!is_superuser) {
    throw new Error("Access denied: superuser privileges required.");
  }

  localStorage.setItem("access_token",  tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);

  try {
    const keyResponse = await apiClient.get("/admin/key", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const keyData = keyResponse.data;
    const adminKey =
      typeof keyData === "string"
        ? keyData
        : keyData?.admin_key ?? keyData?.key ?? null;
    if (adminKey) {
      localStorage.setItem("admin_key", adminKey);
    } else {
      console.warn("[auth] /admin/key returned no key — admin API calls may return 403");
    }
  } catch (keyErr) {
    console.warn("[auth] Could not fetch admin key:", keyErr);
  }
}

export function adminLogout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("admin_key");
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}
