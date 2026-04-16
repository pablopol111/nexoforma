import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoForma",
  description: "NexoForma, donde empieza el cambio.",
};

const themeScript = `(function(){try{var saved=window.localStorage.getItem('nexoforma-theme');var theme=saved||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=theme;}catch(error){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}