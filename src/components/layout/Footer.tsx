/* ================================================================
   Footer.tsx — Minimal Cinematic Footer
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

const Footer = memo(function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-[rgba(255,255,255,0.04)]">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-30" />

      <motion.div
        className="max-w-6xl mx-auto flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-[var(--cyan)]" />
          <span className="text-sm font-bold tracking-wider text-[var(--text-secondary)]">
            ARCADE<span className="text-[var(--cyan)]">HUB</span>
          </span>
        </div>

        {/* Credits */}
        <p className="text-xs text-[var(--text-muted)] text-center max-w-sm">
          School Project — Built with Next.js, TypeScript, React Three Fiber,
          Framer Motion, and Tailwind CSS.
        </p>

        {/* Tech badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {['Next.js', 'Three.js', 'TypeScript', 'Tailwind', 'Framer Motion'].map((tech) => (
            <span
              key={tech}
              className="text-[9px] font-mono tracking-wider px-2.5 py-1 rounded-full border border-[var(--text-muted)] text-[var(--text-muted)] opacity-50"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Year */}
        <p className="text-[10px] tracking-[0.3em] text-[var(--text-muted)] opacity-40">
          © 2026
        </p>
      </motion.div>
    </footer>
  );
});

export default Footer;
