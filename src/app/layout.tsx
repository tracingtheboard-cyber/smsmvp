import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { RoleProvider } from "@/lib/RoleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMS Pro | School Management System",
  description: "Next-generation vocational school management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex`}>
        <RoleProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 h-full">
              {children}
            </div>
          </main>
        </RoleProvider>
      </body>
    </html>
  );
}
