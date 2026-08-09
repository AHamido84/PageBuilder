import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac/current-user";
import { AdminProviders } from "@/components/admin/ui/providers";

/** Full-screen shell for the Page Builder — deliberately omits the dashboard sidebar/header chrome. */
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminProviders>
      <div className="h-screen overflow-hidden bg-neutral-950 text-neutral-100">{children}</div>
    </AdminProviders>
  );
}
