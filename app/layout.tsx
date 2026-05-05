import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Removed Dancing_Script
import localFont from "next/font/local";
import "./globals.css";
// import { Sidebar } from "@/components/layout/sidebar"; // Removed: Managed by AppShell
import { AppShell } from "@/components/layout/app-shell"; // Added: New Layout Manager
// import { Header } from "@/components/layout/header"; // Removed: Managed by AppShell
// import { Footer } from "@/components/layout/footer"; // Footer logic can be inside AppShell if needed
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Font Configuration
const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-heading',
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-body',
});

// Custom OTF Font for Tirtowening Brand
const fontMsStufi = localFont({
  src: "../public/acuasafe/fonts/MsStusi.otf",
  variable: "--font-ms-stufi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PAMSIMAS Tirtowening - Web Admin",
  description: "Sistem Manajemen PAMSIMAS Desa Kemasan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/acuasafe/fonts/flaticon.css" />
      </head>
      <body className={`${fontBody.className} ${fontMsStufi.variable} bg-[#f0f1f6]`}>
        <TooltipProvider>
          {/* Refactored to use Client-Side AppShell for interactivity */}
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
