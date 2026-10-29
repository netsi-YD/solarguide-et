import type { Metadata } from "next";
import Link from "next/link";
import { Sun } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolarGuide Ethiopia | Solar Sizing & Cost Calculator",
  description:
    "Mobile-first solar sizing, battery storage, and ETB cost estimator for Ethiopian homes, small shops, and clinics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-slate-900"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <Sun className="size-4.5" />
              </span>
              <span>
                SolarGuide <span className="text-amber-600">ET</span>
              </span>
            </Link>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/70">
              Ethiopia Solar Estimator
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-3xl px-4">
            SolarGuide ET • Designed for fast, low-bandwidth access across Ethiopia
          </div>
        </footer>
      </body>
    </html>
  );
}
