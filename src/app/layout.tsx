import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ord",
  description: "Træn dansk ordforråd med gentagelser.",
};

export default function RodLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
