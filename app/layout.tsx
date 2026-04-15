import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexoForma Platform",
  description: "Plataforma de control para administrador, nutricionista y cliente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
