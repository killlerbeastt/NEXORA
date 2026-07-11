/* ================================================================
   layout.tsx — Root Layout
   ================================================================
   Configures fonts (Geist Sans + Mono), metadata, and wraps
   the app in smooth scroll and cursor providers.
   ================================================================ */
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ARCADE HUB — Interactive Gaming Experience',
  description: 'A cinematic, interactive arcade website featuring a living 3D robot mascot, Anti-Gravity Pac-Man, Neon Flappy Bird, and cutting-edge web design.',
  keywords: ['arcade', 'games', 'pac-man', 'flappy bird', '3D', 'robot', 'interactive'],
  openGraph: {
    title: 'ARCADE HUB — Interactive Gaming Experience',
    description: 'Step into the future of gaming. A cinematic playground where classic arcade meets cutting-edge design.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#050508] text-[#F0F0F5] scanlines film-grain">
        {children}
      </body>
    </html>
  );
}
