import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Shelf — Agentic Observability Platform",
  description: "Real-time observability dashboard for a smart stadium agent."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

