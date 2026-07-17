/* ================================================================
   CoinShowcase.tsx — Cinematic Gold Coin Section
   ================================================================
   Inspired by the Flowcard credit-card interaction:
   interactive 3D coin on right, text + hints on left.
   Split layout desktop, stacked mobile.
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const GoldCoin3D = dynamic(() => import('@/components/ui/GoldCoin3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-24 h-24 rounded-full border-2 border-[#D4A843] border-t-transparent animate-spin"
        style={{ boxShadow: '0 0 30px rgba(212,168,67,0.3)' }}
      />
    </div>
  ),
});

const GOLD = '#D4A843';

const INTERACTIONS = [
  {
    icon: '⟳',
    key: 'Idle',
    desc: 'Slow 360° spin — 20 second loop',
    color: GOLD,
  },
  {
    icon: '⤢',
    key: 'Hover',
    desc: 'Coin tilts toward cursor + golden glow ring',
    color: '#FFD700',
  },
  {
    icon: '⊕',
    key: 'Click',
    desc: 'Flip 180° + spark burst. Reveals reverse side.',
    color: '#FF8C00',
  },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const CoinShowcase = memo(function CoinShowcase() {
  return (
    <section
      id="coin-showcase"
      className="relative py-28 px-6 overflow-hidden"
    >
      {/* ── Background atmosphere ──────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle warm gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(30,18,0,0.25) 50%, rgba(5,5,8,0) 100%)' }}
        />
        {/* Gold center bloom */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'rgba(212,168,67,0.06)' }}
        />
        {/* Left-side vertical line */}
        <div
          className="absolute top-0 left-[10%] w-px h-full"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(212,168,67,0.08), transparent)' }}
        />
        {/* Right-side vertical line */}
        <div
          className="absolute top-0 right-[10%] w-px h-full"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(212,168,67,0.08), transparent)' }}
        />
      </div>

      {/* ── Glowing horizontal divider top ─────────── */}
      <div className="relative h-px mb-16 max-w-6xl mx-auto pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.40), transparent)' }}
        />
        <motion.div
          className="absolute top-0 h-full w-48"
          style={{ background: 'linear-gradient(90deg, transparent, #D4A843, transparent)' }}
          animate={{ x: ['-300px', '120vw'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />
      </div>

      {/* ── Main content row ────────────────────────── */}
      <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-4">

        {/* ── LEFT: Text panel ───────────────────────── */}
        <motion.div
          className="flex-1 order-2 lg:order-1 text-center lg:text-left lg:pr-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Category chip */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mb-6">
            <div
              className="h-px w-12"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }}
            />
            <span
              className="font-mono text-[9px] tracking-[0.35em] uppercase"
              style={{ color: GOLD }}
            >
              Arcade Token
            </span>
            <div
              className="h-px w-12"
              style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }}
            />
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="font-bold tracking-tight leading-tight mb-5"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}
          >
            <span className="text-[var(--text-primary)]">Your </span>
            <span style={{ color: GOLD, textShadow: `0 0 40px rgba(212,168,67,0.4)` }}>
              Golden
            </span>
            <br />
            <span className="text-[var(--text-primary)]">Pass to </span>
            <span
              className="gradient-text"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #FF8C00 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Play
            </span>
          </motion.h2>

          {/* Body text */}
          <motion.p
            variants={fadeUp}
            className="text-sm text-[var(--text-secondary)] leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0"
          >
            Every great arcade has a token. Ours is cinematic, interactive, and fully
            browser-native — powered by React Three Fiber with PBR gold shading,
            bloom post-processing, and real-time spring physics.
          </motion.p>

          {/* Interaction hints */}
          <motion.div variants={fadeUp} className="space-y-4">
            {INTERACTIONS.map(({ icon, key, desc, color }) => (
              <div key={key} className="flex items-center gap-4 justify-center lg:justify-start">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}30`,
                    color,
                    boxShadow: `0 0 12px ${color}12`,
                  }}
                >
                  {icon}
                </div>
                {/* Label */}
                <div className="text-left">
                  <span
                    className="font-mono text-[10px] tracking-[0.2em] uppercase block mb-0.5"
                    style={{ color }}
                  >
                    {key}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{desc}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Tech badge row */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap gap-2 justify-center lg:justify-start"
          >
            {['WebGL 2.0', 'Three.js', 'PBR Gold', 'Bloom', 'GLSL Shader'].map(tag => (
              <span
                key={tag}
                className="font-mono text-[9px] tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  border: `1px solid rgba(212,168,67,0.22)`,
                  color: 'rgba(212,168,67,0.65)',
                  background: 'rgba(212,168,67,0.05)',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: 3D coin ─────────────────────────── */}
        <motion.div
          className="flex-1 order-1 lg:order-2 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Glow under coin */}
          <div className="relative">
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full blur-2xl"
              style={{ background: 'rgba(212,168,67,0.25)' }}
            />
            <GoldCoin3D className="w-72 h-72 md:w-[380px] md:h-[380px] lg:w-[480px] lg:h-[480px]" />
          </div>
        </motion.div>
      </div>

      {/* ── Bottom divider ──────────────────────────── */}
      <div className="relative h-px mt-16 max-w-6xl mx-auto pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.25), transparent)' }}
        />
      </div>
    </section>
  );
});

export default CoinShowcase;
