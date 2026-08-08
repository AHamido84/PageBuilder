import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "roles", "read");

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isSystem: true,
      _count: { select: { users: true } },
      permissions: {
        select: { permission: { select: { resource: true, action: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Roles</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Roles and their granular permissions are seeded from the RBAC catalog. Custom role editing is planned for a
        later phase — this view shows the real, enforced permission set for each role.
      </p>
      <div className="space-y-4">
        {roles.map((role) => {
          const byResource = new Map<string, string[]>();
          for (const { permission } of role.permissions) {
            const list = byResource.get(permission.resource) ?? [];
            list.push(permission.action);
            byResource.set(permission.resource, list);
          }

          return (
            <div key={role.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-medium">{role.name}</h2>
                <span className="text-xs text-neutral-500">
                  {role._count.users} user{role._count.users === 1 ? "" : "s"}
                </span>
              </div>
              {role.description ? <p className="mb-3 text-sm text-neutral-400">{role.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                {[...byResource.entries()].map(([resource, actions]) => (
                  <span key={resource} className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                    {resource}: {actions.sort().join(", ")}
                  </span>
                ))}
                {byResource.size === 0 ? <span className="text-xs text-neutral-600">No permissions granted</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
