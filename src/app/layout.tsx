import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcade 3D — Open-World City & Space Sandbox",
  description:
    "Five browser 3D games in one: drive, fly rockets, ride trains, run demolition contracts, battle friends online with voice chat, run a rocket mission, and explore from the city streets to the Moon and Mars.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
