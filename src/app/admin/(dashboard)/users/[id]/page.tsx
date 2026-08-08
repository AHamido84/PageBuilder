import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { EditUserForm } from "./edit-user-form";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "users", "update");

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, isActive: true, roleId: true },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!user) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit user</h1>
      <EditUserForm user={user} roles={roles} />
    </div>
  );
}
