import type { Metadata } from "next";

// @ts-ignore
import "./globals.css";
import HeaderNav from "@/components/HeaderNav";
import SettingsProvider from "@/providers/SettingsProvider";
import AppDataProvider from "@/providers/AppDataProvider";

export const metadata: Metadata = {
  title: "BskyBackup",
  description: "A simple app to backup and manage your Bluesky posts locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={``}>
        <HeaderNav />
        <div className="container mx-auto px-4 py-6">
          {/* Main content area */}
          <AppDataProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </AppDataProvider>
        </div>
      </body>
    </html>
  );
}
