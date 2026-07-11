/* ================================================================
   page.tsx — Homepage Assembly
   ================================================================
   Assembles all sections: Navigation → Hero → Games → Footer
   with smooth scroll and custom cursor.
   ================================================================ */
'use client';

import dynamic from 'next/dynamic';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useCursor } from '@/hooks/useCursor';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/hero/HeroSection';
import GameShowcase from '@/components/games/GameShowcase';
import Footer from '@/components/layout/Footer';

// Dynamic import for cursor (client-only, avoid SSR flash)
const CursorGlow = dynamic(() => import('@/components/effects/CursorGlow'), {
  ssr: false,
});

export default function Home() {
  // Initialize smooth scroll
  useSmoothScroll();

  // Initialize global cursor tracking
  useCursor();

  return (
    <>
      {/* Custom cursor */}
      <CursorGlow />

      {/* Floating glass navigation */}
      <Navigation />

      {/* Main content */}
      <main>
        {/* Hero — Full viewport with 3D robot */}
        <HeroSection />

        {/* Games Showcase — Premium floating cards */}
        <GameShowcase />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
