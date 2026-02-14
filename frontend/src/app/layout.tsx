import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alfred OS",
  description: "Sovereign Dashboard - Single Pane of Glass",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
