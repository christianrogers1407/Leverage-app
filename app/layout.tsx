import "@/styles/globals.css";
import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Leverage",
  description: "Production core + audit mode"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <div className="pb-20 md:pb-6">{children}</div>
          <BottomNav />
        </AuthGate>
      </body>
    </html>
  );
}
