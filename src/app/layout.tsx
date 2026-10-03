import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beard Lounge | Premium Men's Salon (Kuwait)",
  description: "A Touch of Luxury in Every Style - Beard Lounge Farwaniya Block 1, Kuwait. Executive sales, booking and salon management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#090C10] text-[#E2E8F0] antialiased min-h-screen selection:bg-[#D4AF37]/30 selection:text-[#F5CF68]">
        {children}
      </body>
    </html>
  );
}

