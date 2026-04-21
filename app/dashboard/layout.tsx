import AdminLayout from "@/components/layout/AdminLayout";

// AUTH BYPASSED — restore when login API is ready
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
