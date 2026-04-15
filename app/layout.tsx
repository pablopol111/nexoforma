import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexoForma",
  description: "Base nueva de NexoForma con Next.js, TypeScript y Supabase"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
