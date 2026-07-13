/* ================================================================
   HeroSection.tsx — Full-viewport hero (AAA Redesign)
   ================================================================
   - Split title layout: ARCADE left, HUB right, robot center
   - Floating glass info panel below title
   - Foreground cinematic dust particles
   - Floating holographic HUD panels around robot
   - Scroll indicator
   ================================================================ */
'use client';

import { useRef, memo } from 'react';
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

const HeroHUDPanels = dynamic(() => import('./HeroHUDPanels'), { ssr: false });

/* ── Deterministic foreground dust particles ─────────────────── */
const DUST = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 5) % 100}%`,
  top:  `${(i * 23 + 8) % 100}%`,
  size: (i % 3 === 0) ? 2 : (i % 3 === 1) ? 1.5 : 1,
  dur:  6 + (i % 7) * 1.5,
  delay: (i * 0.4) % 5,
  color: i % 3 === 0 ? 'var(--cyan)' : i % 3 === 1 ? 'var(--violet)' : 'var(--amber)',
  opacity: 0.08 + (i % 5) * 0.04,
}));

/* ── Animation variants ──────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.6 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.4, ease: 'easeOut' },
  },
};

const HeroSection = memo(function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen min-h-[640px] overflow-hidden"
      id="hero"
    >
      {/* ── 3D Robot Canvas (background layer) ──────────── */}
      <div className="absolute inset-0 z-0">
        <RobotScene />
      </div>

      {/* ── Gradient overlays for text readability ────── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[var(--bg-deep)]" />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-transparent via-transparent to-[rgba(5,5,8,0.25)]" />
      {/* Side vignettes to help text stand out */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-[rgba(5,5,8,0.55)] via-transparent to-[rgba(5,5,8,0.55)]" />

      {/* ── Foreground cinematic dust ────────────────── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {DUST.map(d => (
          <motion.div
            key={d.id}
            className="absolute rounded-full"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              background: d.color,
              opacity: d.opacity,
            }}
            animate={{
              y: [0, -30, 0, 20, 0],
              x: [0, 15, -10, 5, 0],
              opacity: [d.opacity, d.opacity * 2.5, d.opacity, d.opacity * 1.5, d.opacity],
            }}
            transition={{
              duration: d.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: d.delay,
            }}
          />
        ))}
      </div>

      {/* ── Floating HUD panels around robot ─────────── */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        <HeroHUDPanels />
      </div>

      {/* ── Split title: ARCADE (left) + HUB (right) ── */}
      {/* ARCADE — bottom-left */}
      <motion.div
        className="absolute z-[4] bottom-[22%] left-0 right-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        <div className="relative max-w-7xl mx-auto px-6 flex items-end justify-between">
          {/* Left: ARCADE */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[10px] tracking-[0.35em] text-[var(--text-secondary)] uppercase mb-2">
              Interactive Arcade Experience
            </p>
            <h1 className="font-bold leading-[0.85] tracking-tighter">
              <span
                className="gradient-text block"
                style={{ fontSize: 'clamp(4rem, 11vw, 9rem)' }}
              >
                ARCADE
              </span>
            </h1>
          </motion.div>

          {/* Right: HUB */}
          <motion.div
            className="text-right"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-bold leading-[0.85] tracking-tighter">
              <span
                className="text-[var(--text-primary)] opacity-90 block"
                style={{ fontSize: 'clamp(4rem, 11vw, 9rem)' }}
              >
                HUB
              </span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase mt-2">
              Est. 2026
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bottom center: glass panel + scroll ──────── */}
      <motion.div
        className="absolute z-[4] bottom-0 left-0 right-0 pb-8 flex flex-col items-center gap-5 pointer-events-none"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Sub-text */}
        <motion.p
          variants={fadeUpVariants}
          className="text-sm text-[var(--text-secondary)] text-center max-w-sm leading-relaxed px-6"
        >
          A cinematic playground where classic arcade meets cutting-edge design.
        </motion.p>

        {/* Floating glass info panel */}
        <motion.div
          variants={fadeUpVariants}
          className="relative rounded-2xl px-5 py-3 flex items-center gap-4 mx-6"
          style={{
            background: 'rgba(10, 11, 20, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 240, 255, 0.18)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.06), inset 0 1px 0 rgba(0, 240, 255, 0.1)',
          }}
        >
          {/* Online pulse */}
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#4ADE80] uppercase">
              Online
            </span>
          </div>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.08)]" />

          <div className="flex items-center gap-3 text-center">
            <div>
              <p className="font-mono text-[10px] font-bold text-[var(--cyan)]">2</p>
              <p className="font-mono text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Live</p>
            </div>
            <div className="w-px h-6 bg-[rgba(255,255,255,0.06)]" />
            <div>
              <p className="font-mono text-[10px] font-bold text-[var(--violet)]">2</p>
              <p className="font-mono text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Soon</p>
            </div>
            <div className="w-px h-6 bg-[rgba(255,255,255,0.06)]" />
            <div>
              <p className="font-mono text-[10px] font-bold text-[var(--amber)]">100%</p>
              <p className="font-mono text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Browser</p>
            </div>
          </div>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.08)]" />

          <p className="font-mono text-[9px] text-[var(--text-muted)] shrink-0 hidden sm:block">
            Play instantly · No installs
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={fadeVariants}
          className="flex flex-col items-center gap-2"
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
});

export default HeroSection;
