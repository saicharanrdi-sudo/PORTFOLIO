import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sai Charan Reddy — Product Designer & Creative Developer",
  description:
    "Product, UI & UX designer crafting intuitive products and interactive web experiences, from first sketch to final launch.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={interTight.variable}>
      <body className="bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
