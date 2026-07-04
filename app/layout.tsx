import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CLUB_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `${CLUB_NAME} – Platzbuchung`,
  description: "Sicheres Tennisplatz-Buchungssystem für fünf Plätze",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: `${CLUB_NAME} Buchung`,
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f7a3d"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#einfach-buchen">Direkt zur einfachen Buchung</a>
        {children}
      </body>
    </html>
  );
}
