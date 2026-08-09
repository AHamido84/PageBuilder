"use client";

import { AdminToastProvider } from "./toast";
import { ConfirmProvider } from "./confirm-dialog";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </AdminToastProvider>
  );
}
