"use server";

import { submitLead, type LeadFormState } from "@/lib/leads/submit-lead";

/** Shared submission action for page-builder CONTACT_FORM and QUOTE_FORM blocks. */
export async function submitBlockLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  return submitLead(formData, "block-lead");
}
