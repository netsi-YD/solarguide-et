import * as React from "react";
import type { Metadata } from "next";
import { Noto_Sans_Ethiopic } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SolarGuide Ethiopia | የኢትዮጵያ የሶላር ማስያ",
  description:
    "Mobile-first solar sizing, battery storage, and ETB cost estimator for Ethiopian homes, small shops, and clinics in Amharic and English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="am"
      className={`${notoSansEthiopic.variable} ${notoSansEthiopic.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <React.Suspense
          fallback={
            <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center text-sm text-slate-500">
              በመጫን ላይ... / Loading...
            </div>
          }
        >
          <LanguageProvider>{children}</LanguageProvider>
        </React.Suspense>
      </body>
    </html>
  );
}
