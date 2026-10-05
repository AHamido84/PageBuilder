"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";
import { issuesToFieldErrors, optionTypeInput } from "@/lib/catalog/variants/schema";

export interface OptionActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
  key?: string;
}

function revalidateOptions() {
  revalidatePath("/admin/options");
  revalidatePath("/[locale]/products", "page");
  revalidatePath("/[locale]/products/[slug]", "page");
}

/** Create or update a global option type (also used inline from the product editor). */
export async function saveOptionTypeAction(raw: unknown): Promise<OptionActionResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const parsed = optionTypeInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "راجع الحقول", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const { id, key, labelAr, labelEn, display } = parsed.data;
  const rich = parsed.data.rich ?? Prisma.DbNull;

  const clash = await prisma.optionType.findFirst({ where: { key, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) return { ok: false, error: "هذا المفتاح مستخدم لخيار آخر", fieldErrors: { key: "هذا المفتاح مستخدم لخيار آخر" } };

  if (id) {
    const existing = await prisma.optionType.findUnique({ where: { id }, include: { _count: { select: { productOptions: true } } } });
    if (!existing) return { ok: false, error: "الخيار غير موجود" };
    // The key is part of public URLs (?size=7mm) -- frozen once products use the option.
    if (existing.key !== key && existing._count.productOptions > 0) {
      return { ok: false, error: "لا يمكن تغيير مفتاح خيار مستخدم في منتجات", fieldErrors: { key: "لا يمكن تغيير مفتاح خيار مستخدم في منتجات" } };
    }
    await prisma.optionType.update({ where: { id }, data: { key, labelAr, labelEn, display, rich } });
    await logActivity({ userId: currentUser.id, action: "optionType.update", entityType: "OptionType", entityId: id });
    revalidateOptions();
    return { ok: true, id, key };
  }

  const last = await prisma.optionType.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.optionType.create({ data: { key, labelAr, labelEn, display, rich, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  await logActivity({ userId: currentUser.id, action: "optionType.create", entityType: "OptionType", entityId: created.id });
  revalidateOptions();
  return { ok: true, id: created.id, key: created.key };
}

export async function reorderOptionTypesAction(ids: unknown): Promise<OptionActionResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");
  const parsed = z.array(z.string().min(1).max(64)).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "ترتيب غير صالح" };
  await prisma.$transaction(parsed.data.map((id, i) => prisma.optionType.update({ where: { id }, data: { sortOrder: i + 1 } })));
  revalidateOptions();
  return { ok: true };
}

/** Blocked while any product uses the option type (the editor lists which ones). */
export async function deleteOptionTypeAction(id: string): Promise<OptionActionResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "delete");
  const existing = await prisma.optionType.findUnique({
    where: { id: String(id) },
    include: { productOptions: { select: { product: { select: { sku: true } } } } },
  });
  if (!existing) return { ok: false, error: "الخيار غير موجود" };
  if (existing.productOptions.length > 0) {
    return { ok: false, error: `مستخدم في ${existing.productOptions.length} منتج — أزله منها أولًا: ${existing.productOptions.map((p) => p.product.sku).join("، ")}` };
  }
  await prisma.optionType.delete({ where: { id: existing.id } });
  await logActivity({ userId: currentUser.id, action: "optionType.delete", entityType: "OptionType", entityId: existing.id });
  revalidateOptions();
  return { ok: true };
}

/** Public-site switch for variant rendering (the VARIANTS_ENABLED env var can still force it off). */
export async function setVariantsEnabledAction(enabled: boolean): Promise<OptionActionResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");
  await prisma.siteSetting.update({ where: { id: "singleton" }, data: { variantsEnabled: Boolean(enabled) } });
  await logActivity({ userId: currentUser.id, action: enabled ? "variants.enable" : "variants.disable", entityType: "SiteSetting", entityId: "singleton" });
  revalidatePath("/admin/options");
  revalidatePath("/", "layout");
  return { ok: true };
}
