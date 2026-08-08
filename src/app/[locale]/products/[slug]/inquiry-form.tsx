"use client";

import { ContactForm } from "@/app/[locale]/contact-form";

export function InquiryForm({ productName }: { productName: string }) {
  return <ContactForm defaultProductName={productName} />;
}
