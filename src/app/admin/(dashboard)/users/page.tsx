import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateUserForm } from "./create-user-form";
import { DeleteUserButton } from "./delete-user-button";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "users", "read");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, isActive: true, role: { select: { name: true } } },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const canCreate = currentUser.permissions.has("users:create");
  const canDelete = currentUser.permissions.has("users:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Users</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateUserForm roles={roles} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    {user.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">{user.email}</td>
                <td className="px-4 py-2">{user.role.name}</td>
                <td className="px-4 py-2">{user.isActive ? "Active" : "Disabled"}</td>
                <td className="px-4 py-2 text-right">{canDelete ? <DeleteUserButton userId={user.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
