/* ================================================================
   StatsStrip.tsx — Animated horizontal stats divider
   ================================================================
   Sits between Hero and Games. Animated glowing line separators
   with key stats: 4 Games · 60 FPS · Browser Based · No Downloads
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { value: '4', label: 'Games', color: 'var(--cyan)' },
  { value: '60', label: 'FPS', color: 'var(--violet)' },
  { value: '100%', label: 'Browser', color: 'var(--amber)' },
  { value: '0', label: 'Downloads', color: 'var(--cyan)' },
];

const StatsStrip = memo(function StatsStrip() {
  return (
    <motion.section
      className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8 }}
    >
      {/* Top glowing line */}
      <div className="relative h-px mb-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-30" />
        <motion.div
          className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent"
          animate={{ x: ['-100vw', '200vw'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      </div>

      {/* Stats row */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center gap-1 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <span
                className="font-bold text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight"
                style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}
              >
                {stat.value}
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[var(--text-muted)] uppercase font-mono">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom glowing line */}
      <div className="relative h-px mt-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--violet)] to-transparent opacity-20" />
        <motion.div
          className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-[var(--violet)] to-transparent"
          animate={{ x: ['200vw', '-100vw'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
      </div>
    </motion.section>
  );
});

export default StatsStrip;
