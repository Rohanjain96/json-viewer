import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSON Explorer",
  description: "A single-tab JSON workbench — import, explore, query, diff, and transform JSON without leaving the browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
