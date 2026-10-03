import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan, can } from "@/lib/rbac/current-user";
import { parseDesignTokens } from "@/lib/design-tokens/schema";
import { ThemeEditor } from "./theme-editor";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "read");

  const record = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { designTokens: true } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Appearance</h1>
        <p className="mt-1 text-sm text-neutral-500">
          The site-wide theme: colors, fonts, spacing, corners, shadows and buttons. Anything left on Default keeps the current design. Changes show in the
          preview right away and go live when you save.
        </p>
      </div>
      <ThemeEditor initialTokens={parseDesignTokens(record?.designTokens)} canUpdate={can(currentUser, "settings", "update")} />
    </div>
  );
}
