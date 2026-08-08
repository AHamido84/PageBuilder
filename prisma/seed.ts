import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_SLUGS } from "../src/lib/rbac/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding permissions...");
  for (const { resource, action } of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      create: { resource, action },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();

  console.log("Seeding roles...");
  const roleDefs: { slug: string; name: string; description: string; isSystem: boolean }[] = [
    { slug: ROLE_SLUGS.SUPER_ADMIN, name: "Super Admin", description: "Full access to every resource.", isSystem: true },
    { slug: ROLE_SLUGS.CONTENT_MANAGER, name: "Content Manager", description: "Manages pages, products, catalog content, and media.", isSystem: true },
    { slug: ROLE_SLUGS.MARKETING_MANAGER, name: "Marketing Manager", description: "Manages leads, forms, blog, and campaign content.", isSystem: true },
    { slug: ROLE_SLUGS.SALES, name: "Sales", description: "Works leads and views the product catalog.", isSystem: true },
    { slug: ROLE_SLUGS.VIEWER, name: "Viewer", description: "Read-only access for stakeholder review.", isSystem: true },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name, description: def.description, isSystem: def.isSystem },
      update: { name: def.name, description: def.description },
    });
    roles[def.slug] = role;
  }

  console.log("Assigning permissions to roles...");
  // Super Admin: every permission, kept in sync with the catalog automatically.
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles[ROLE_SLUGS.SUPER_ADMIN].id, permissionId: permission.id } },
      create: { roleId: roles[ROLE_SLUGS.SUPER_ADMIN].id, permissionId: permission.id },
      update: {},
    });
  }

  for (const [slug, grants] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const grant of grants) {
      const permission = allPermissions.find((p) => p.resource === grant.resource && p.action === grant.action);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles[slug].id, permissionId: permission.id } },
        create: { roleId: roles[slug].id, permissionId: permission.id },
        update: {},
      });
    }
  }

  console.log("Seeding super admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        roleId: roles[ROLE_SLUGS.SUPER_ADMIN].id,
      },
      update: {},
    });
    console.log(`Super admin ready: ${adminEmail}`);
  } else {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping super admin creation.");
  }

  console.log("Seeding menus...");
  await prisma.menu.upsert({ where: { location: "HEADER" }, create: { location: "HEADER" }, update: {} });
  await prisma.menu.upsert({ where: { location: "FOOTER" }, create: { location: "FOOTER" }, update: {} });

  console.log("Seeding site settings...");
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteNameEn: "Seven Eleven Trading",
      siteNameAr: "سفن إليفن للتجارة",
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
