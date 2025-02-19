
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Head from "next/head";
import { Toaster } from "react-hot-toast";





const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seo Stuff Admin",
  description: "Admin panel for managing user credits and making adjustments.",
  icons: [
    {
      rel: 'icon',
      url: '/favicon.ico',
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Providers>
      <Toaster position="top-right" />
        {children}
      </Providers>
      </body>
    </html>
  );
}
