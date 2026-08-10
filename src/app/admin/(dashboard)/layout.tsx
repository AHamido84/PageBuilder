import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac/current-user";
import { can } from "@/lib/rbac/current-user";
import { logoutAction } from "@/lib/auth/actions";
import type { Resource } from "@/lib/rbac/permissions";
import { AdminProviders } from "@/components/admin/ui/providers";

interface NavItem {
  href: string;
  label: string;
  resource: Resource | null;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", resource: null }] },
  {
    label: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", resource: "pages" },
      { href: "/admin/media", label: "Media Library", resource: "media" },
      { href: "/admin/menus", label: "Menus", resource: "menus" },
      { href: "/admin/blog", label: "Blog", resource: "blog" },
      { href: "/admin/faqs", label: "FAQs", resource: "faqs" },
      { href: "/admin/redirects", label: "Redirects", resource: "redirects" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", resource: "products" },
      { href: "/admin/categories", label: "Categories", resource: "categories" },
      { href: "/admin/brands", label: "Brands", resource: "brands" },
      { href: "/admin/certifications", label: "Certifications", resource: "certifications" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/leads", label: "Leads", resource: "leads" },
      { href: "/admin/forms", label: "Forms", resource: "forms" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", resource: "users" },
      { href: "/admin/roles", label: "Roles", resource: "roles" },
      { href: "/admin/settings", label: "Settings", resource: "settings" },
      { href: "/admin/activity", label: "Activity Log", resource: "activityLogs" },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.resource === null || can(user, item.resource, "read")),
  })).filter((group) => group.items.length > 0);

  return (
    <AdminProviders>
      <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-neutral-800 p-4">
          <p className="mb-6 text-sm font-semibold">Seven Eleven Trading</p>
          <nav className="space-y-5">
            {visibleGroups.map((group) => (
              <div key={group.label ?? "root"}>
                {group.label ? (
                  <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-600">{group.label}</p>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
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
    </AdminProviders>
  );
}
