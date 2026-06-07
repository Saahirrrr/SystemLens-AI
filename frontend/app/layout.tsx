import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discovery Agent — Enterprise System Intelligence",
  description:
    "AI-powered enterprise document analysis that maps your IT systems, traces data flows, and surfaces automation opportunities.",
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
