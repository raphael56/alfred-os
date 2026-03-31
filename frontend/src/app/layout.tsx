import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Alfred OS",
  description: "Sovereign Dashboard - Single Pane of Glass",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#030712",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <html lang="fr" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <SessionProvider>
          {isAuthenticated ? (
            <>
              <MobileNav />
              <div className="flex min-h-screen">
                <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
                  <Sidebar />
                </aside>
                <aside className="hidden md:block lg:hidden w-16 shrink-0 fixed inset-y-0 left-0 z-30">
                  <Sidebar />
                </aside>
                <main className="flex-1 md:ml-16 lg:ml-64 pt-14 md:pt-0 min-h-screen">
                  {children}
                </main>
              </div>
            </>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
