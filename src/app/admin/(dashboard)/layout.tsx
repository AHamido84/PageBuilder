import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac/current-user";
import { can } from "@/lib/rbac/current-user";
import { logoutAction } from "@/lib/auth/actions";
import type { Resource } from "@/lib/rbac/permissions";

const NAV_ITEMS: { href: string; label: string; resource: Resource | null }[] = [
  { href: "/admin", label: "Dashboard", resource: null },
  { href: "/admin/products", label: "Products", resource: "products" },
  { href: "/admin/categories", label: "Categories", resource: "categories" },
  { href: "/admin/leads", label: "Leads", resource: "leads" },
  { href: "/admin/users", label: "Users", resource: "users" },
  { href: "/admin/roles", label: "Roles", resource: "roles" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const visibleNav = NAV_ITEMS.filter((item) => item.resource === null || can(user, item.resource, "read"));

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="w-56 shrink-0 border-r border-neutral-800 p-4">
        <p className="mb-6 text-sm font-semibold">Seven Eleven Trading</p>
        <nav className="space-y-1">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
          <div className="text-sm text-neutral-400">
            {user.name} <span className="text-neutral-600">·</span> {user.roleName}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-neutral-400 hover:text-neutral-100">
              Sign out
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
