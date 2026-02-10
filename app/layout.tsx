import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cobain kapan-kapan yuk!",
  description: "Tek, kapan-kapan cobain ini yuk!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
