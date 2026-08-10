"use client";

import { ContactForm } from "@/app/[locale]/contact-form";

export function InquiryForm({ productId }: { productId: string; productName: string }) {
  return <ContactForm productId={productId} />;
}
