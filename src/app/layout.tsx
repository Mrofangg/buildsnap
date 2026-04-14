import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuildSnap – Baudokumentation",
  description: "Einfache Fotodokumentation für Bauprojekte",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuildSnap",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={dmSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased bg-white">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
