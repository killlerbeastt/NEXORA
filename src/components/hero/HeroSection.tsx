/* ================================================================
   HeroSection.tsx — Full-viewport hero with 3D robot
   ================================================================
   Overlays premium typography on top of the RobotScene Canvas.
   Framer Motion entrance animations with staggered reveal.
   ================================================================ */
'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, type Variants } from 'framer-motion';

// Dynamic import for the 3D scene (no SSR for WebGL)
const RobotScene = dynamic(() => import('./RobotScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

/* ── Animation variants ──────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.5 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' },
  },
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen min-h-[600px] overflow-hidden"
      id="hero"
    >
      {/* ── 3D Robot Canvas (background layer) ──────────────── */}
      <div className="absolute inset-0 z-0">
        <RobotScene />
      </div>

      {/* ── Gradient overlay for text readability ──────────── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[var(--bg-deep)]" />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-transparent via-transparent to-[rgba(5,5,8,0.3)]" />

      {/* ── Hero content overlay ───────────────────────────── */}
      <motion.div
        className="relative z-[2] flex flex-col items-center justify-end h-full pb-24 px-6 pointer-events-none"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tagline */}
        <motion.p
          variants={fadeUpVariants}
          className="font-mono text-xs tracking-[0.35em] text-[var(--text-secondary)] uppercase mb-4"
        >
          Interactive Arcade Experience
        </motion.p>

        {/* Main heading */}
        <motion.h1
          variants={fadeUpVariants}
          className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-center leading-[0.9]"
        >
          <span className="gradient-text">ARCADE</span>
          <br />
          <span className="text-[var(--text-primary)] opacity-90">HUB</span>
        </motion.h1>

        {/* Sub-text */}
        <motion.p
          variants={fadeUpVariants}
          className="mt-6 text-sm md:text-base text-[var(--text-secondary)] text-center max-w-md leading-relaxed"
        >
          Step into the future of gaming. A cinematic playground
          where classic arcade meets cutting-edge design.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          variants={fadeVariants}
          className="mt-12 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">
            Scroll to explore
          </span>
          <motion.div
            className="w-5 h-8 rounded-full border border-[var(--text-muted)] flex items-start justify-center p-1.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-1.5 rounded-full bg-[var(--cyan)]"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
