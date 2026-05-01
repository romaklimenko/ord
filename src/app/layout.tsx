import type { Metadata } from "next";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
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
      <body>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
