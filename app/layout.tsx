import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/common/QueryProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digitalne Pozivnice",
  description: "Elegantne digitalne pozivnice sa RSVP, seating chart i photo gallery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: "12px", fontFamily: "Inter, sans-serif" },
                success: { iconTheme: { primary: "#8B5A8E", secondary: "white" } },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
