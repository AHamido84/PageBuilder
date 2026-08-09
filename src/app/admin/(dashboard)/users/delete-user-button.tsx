"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteUserAction } from "./actions";

export function DeleteUserButton({ userId }: { userId: string }) {
  return <DeleteButton onDelete={() => deleteUserAction(userId)} itemLabel="this user" />;
}
