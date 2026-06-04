import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StudySphere — Your Mindful Study Companion",
  description: "A warm, beautiful study companion for journaling, focus, and mindful learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Reenie+Beanie&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-softly-bg text-softly-dark min-h-screen">
        <div className="grain-overlay" aria-hidden="true">
          <svg width="100%" height="100%">
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
