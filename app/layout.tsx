import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoForma",
  description: "Plataforma web de control de peso con Supabase y Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
