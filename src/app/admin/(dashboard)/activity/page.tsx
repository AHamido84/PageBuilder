import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import type { Prisma } from "@prisma/client";
import { ActivityFilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ q?: string; userId?: string }> }) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "activityLogs", "read");
  const params = await searchParams;

  const where: Prisma.ActivityLogWhereInput = {};
  if (params.userId) where.userId = params.userId;
  if (params.q) {
    where.OR = [
      { action: { contains: params.q, mode: "insensitive" } },
      { entityType: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [entries, users] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Activity Log</h1>
      <ActivityFilterBar users={users} />
      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-2 text-neutral-400">
                  {entry.entityType ?? "—"}
                  {entry.entityId ? <span className="text-neutral-600"> #{entry.entityId.slice(-6)}</span> : null}
                </td>
                <td className="px-4 py-2 text-neutral-400">{entry.user?.name ?? "System"}</td>
                <td className="px-4 py-2 text-neutral-500">{entry.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No activity recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
