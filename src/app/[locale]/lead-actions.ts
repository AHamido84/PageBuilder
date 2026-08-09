"use server";

import { submitLead, type LeadFormState } from "@/lib/leads/submit-lead";

export type { LeadFormState };

export async function submitLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  return submitLead(formData, "lead");
}
