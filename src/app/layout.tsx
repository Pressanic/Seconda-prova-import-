import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ImportCompliance — Gestione Import Macchinari",
  description:
    "Piattaforma SaaS per la compliance CE e doganale di macchinari industriali importati dalla Cina.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body>
        {/* Runs synchronously before hydration — prevents browser from restoring
            scroll position on reload, so the page always starts at the top. */}
        <Script
          id="disable-scroll-restoration"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "history.scrollRestoration='manual';" +
              "window.scrollTo(0,0);" +
              "window.addEventListener('load',function(){window.scrollTo(0,0);});",
          }}
        />
        {children}
      </body>
    </html>
  );
}
