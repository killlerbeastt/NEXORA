/* ================================================================
   page.tsx — Homepage Assembly (AAA Redesign)
   ================================================================
   Assembles all sections in order:
   Navigation → Hero → StatsStrip → Games → Footer
   ================================================================ */
'use client';

import dynamic from 'next/dynamic';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useCursor } from '@/hooks/useCursor';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/hero/HeroSection';
import GameShowcase from '@/components/games/GameShowcase';
import StatsStrip from '@/components/sections/StatsStrip';
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
        {/* Hero — Full viewport with 3D robot, split title, floating glass panel */}
        <HeroSection />

        {/* Stats strip — 4 Games · 60 FPS · 100% Browser · 0 Downloads */}
        <StatsStrip />

        {/* Games Showcase — Featured → Flappy full-width → Coming Soon 2-col */}
        <GameShowcase />
      </main>

      {/* Cinematic "Ready? Play." footer */}
      <Footer />
    </>
  );
}
