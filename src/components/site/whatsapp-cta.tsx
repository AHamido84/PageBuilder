import { MessageCircle } from "lucide-react";

interface WhatsAppCtaProps {
  /** Raw number as configured in Settings, e.g. "+966 5X XXX XXXX". Never rendered if unset. */
  whatsapp: string | null | undefined;
  label: string;
}

/** Floating WhatsApp CTA -- only renders when a real number is configured in the admin; never invents one. */
export function WhatsAppCta({ whatsapp, label }: WhatsAppCtaProps) {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/[^\d]/g, "");
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 rtl:right-auto rtl:left-5"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
    </a>
  );
}
