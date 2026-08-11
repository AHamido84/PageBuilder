import { z } from "zod";
import { Mail, MessageCircle, PackageSearch } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { LeadFormEdit, LeadFormRender } from "./forms/lead-form";
import { NewsletterEdit, NewsletterRender } from "./forms/newsletter";

const leadFormSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(400).optional().default(""),
  submitLabel: z.string().max(60).optional().default(""),
  showMessage: z.boolean().default(true),
  inquiryType: z.enum(["GENERAL", "QUOTE", "BECOME_CUSTOMER", "SALES_INQUIRY"]).default("GENERAL"),
});
export type LeadFormData = z.infer<typeof leadFormSchema>;

const newsletterSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(300).optional().default(""),
  submitLabel: z.string().max(60).optional().default(""),
});
export type NewsletterData = z.infer<typeof newsletterSchema>;

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formsBlocks: BlockDefinition<any>[] = [
  {
    type: "CONTACT_FORM",
    label: "Contact Form",
    category: "forms",
    icon: MessageCircle,
    dataSchema: leadFormSchema,
    defaultData: {
      en: { heading: "Get in touch", body: "Tell us what your business needs.", submitLabel: "Send message", showMessage: true, inquiryType: "GENERAL" },
      ar: { heading: "تواصل معنا", body: "أخبرنا بما تحتاجه شركتك.", submitLabel: "إرسال الرسالة", showMessage: true, inquiryType: "GENERAL" },
    },
    defaultSettings: defaultSectionSettings({ background: "frost" }),
    Edit: LeadFormEdit,
    Render: LeadFormRender,
  } as BlockDefinition<LeadFormData>,
  {
    type: "QUOTE_FORM",
    label: "Quote Form",
    category: "forms",
    icon: PackageSearch,
    dataSchema: leadFormSchema,
    defaultData: {
      en: { heading: "Request a quote", body: "Send us your product categories and order volumes.", submitLabel: "Request a quote", showMessage: true, inquiryType: "QUOTE" },
      ar: { heading: "اطلب عرض سعر", body: "أرسل لنا فئات المنتجات وأحجام الطلب.", submitLabel: "طلب عرض سعر", showMessage: true, inquiryType: "QUOTE" },
    },
    defaultSettings: defaultSectionSettings({ background: "frost" }),
    Edit: LeadFormEdit,
    Render: LeadFormRender,
  } as BlockDefinition<LeadFormData>,
  {
    type: "NEWSLETTER",
    label: "Newsletter",
    category: "forms",
    icon: Mail,
    dataSchema: newsletterSchema,
    defaultData: {
      en: { heading: "Stay in the loop", body: "", submitLabel: "Subscribe" },
      ar: { heading: "ابق على اطلاع", body: "", submitLabel: "اشترك" },
    },
    defaultSettings: defaultSectionSettings({ background: "ink" }),
    Edit: NewsletterEdit,
    Render: NewsletterRender,
  } as BlockDefinition<NewsletterData>,
];
