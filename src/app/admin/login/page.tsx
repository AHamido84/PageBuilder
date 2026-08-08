import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac/current-user";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-1 text-lg font-semibold text-neutral-100">Seven Eleven Trading</h1>
        <p className="mb-6 text-sm text-neutral-400">Sign in to the admin dashboard</p>
        <LoginForm />
      </div>
    </div>
  );
}
