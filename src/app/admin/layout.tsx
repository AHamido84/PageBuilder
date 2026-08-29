import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin — Seven Eleven Trading",
  robots: { index: false, follow: false },
  // Explicit static reference, not the App Router's src/app/favicon.ico convention -- see the
  // comment on generateMetadata in src/app/[locale]/layout.tsx for why that convention was moved
  // out from under src/app entirely (public/favicon.ico is a plain static asset).
  icons: { icon: "/favicon.ico" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
