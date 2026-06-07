import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SystemLens AI",
  description:
    "AI-powered enterprise intelligence platform that discovers systems, maps data flows, identifies integration gaps, and generates implementation-ready integration artifacts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080b14] antialiased">{children}</body>
    </html>
  );
}
