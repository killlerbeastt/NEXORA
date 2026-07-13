/* ================================================================
   Footer.tsx — Cinematic "Ready? Play." Footer (AAA Redesign)
   ================================================================
   Large bold CTA with animated underline sweep, pulsing arrow,
   glowing tech stack badges, and an elegant scanline separator.
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

const TECH = [
  { name: 'Next.js', color: 'var(--text-muted)' },
  { name: 'Three.js', color: 'var(--cyan)' },
  { name: 'TypeScript', color: 'var(--violet)' },
  { name: 'Tailwind', color: 'var(--cyan)' },
  { name: 'Framer Motion', color: 'var(--amber)' },
  { name: 'React Three Fiber', color: 'var(--violet)' },
];

const Footer = memo(function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* ── Scanline separator ──────────────────────── */}
      <div className="relative h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-20" />
        <motion.div
          className="absolute top-0 h-full w-40 bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-60"
          animate={{ x: ['-200px', '110vw'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      </div>

      {/* ── Background atmosphere ───────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--cyan)] opacity-[0.02] blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] rounded-full bg-[var(--violet)] opacity-[0.02] blur-[80px]" />
      </div>

      <motion.div
        className="relative max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
      >
        {/* ── CTA "Ready?" ────────────────────────── */}
        <motion.p
          className="font-mono text-[10px] tracking-[0.4em] text-[var(--text-muted)] uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Player One Ready
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h2
            className="font-bold leading-tight tracking-tighter gradient-text"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            Ready?
          </h2>
        </motion.div>

        {/* "Play." with animated underline */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2
            className="font-bold leading-tight tracking-tighter text-[var(--text-primary)]"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            Play.
          </h2>
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--cyan), var(--violet), var(--amber))' }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>

        {/* ── Pulsing scroll arrow ─────────────────── */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div
            className="font-mono text-2xl text-[var(--text-muted)]"
            animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px mb-12 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />

        {/* ── Logo ────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="w-2 h-2 rounded-sm bg-[var(--cyan)]" />
          <span className="text-sm font-bold tracking-wider text-[var(--text-secondary)]">
            ARCADE<span className="text-[var(--cyan)]">HUB</span>
          </span>
        </motion.div>

        {/* ── Credits ─────────────────────────────── */}
        <motion.p
          className="text-xs text-[var(--text-muted)] mb-8 max-w-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          School Project — built with love, code, and way too much caffeine.
        </motion.p>

        {/* ── Tech stack badges ───────────────────── */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {TECH.map((tech, i) => (
            <motion.span
              key={tech.name}
              className="font-mono text-[9px] tracking-wider px-3 py-1.5 rounded-full relative overflow-hidden"
              style={{
                border: `1px solid ${tech.color}30`,
                color: tech.color,
                background: `${tech.color}08`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
              whileHover={{ scale: 1.08 }}
            >
              {/* Subtle inner glow on hover */}
              <span
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `inset 0 0 12px ${tech.color}20` }}
              />
              {tech.name}
            </motion.span>
          ))}
        </motion.div>

        {/* ── Year ────────────────────────────────── */}
        <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] opacity-30">
          © 2026
        </p>
      </motion.div>
    </footer>
  );
});

export default Footer;
