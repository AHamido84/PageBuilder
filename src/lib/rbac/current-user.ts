import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { Action, Resource } from "@/lib/rbac/permissions";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  permissions: Set<string>;
}

function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/** Loads the authenticated user and their effective permission set. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          permissions: {
            select: { permission: { select: { resource: true, action: true } } },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const permissions = new Set(
    user.role.permissions.map(({ permission }) => permissionKey(permission.resource, permission.action))
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.role.id,
    roleName: user.role.name,
    roleSlug: user.role.slug,
    permissions,
  };
});

export function can(user: CurrentUser | null, resource: Resource, action: Action): boolean {
  if (!user) return false;
  return user.permissions.has(permissionKey(resource, action));
}

/** Throws if the user lacks the permission — use at the top of server actions / route handlers. */
export function assertCan(user: CurrentUser | null, resource: Resource, action: Action): asserts user is CurrentUser {
  if (!can(user, resource, action)) {
    throw new Error(`Forbidden: missing permission ${resource}:${action}`);
  }
}
