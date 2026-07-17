/* ================================================================
   FeaturedGame.tsx — Cinematic Featured Game Card
   ================================================================
   Large hero card above the 2×2 grid spotlighting the flagship
   game (Anti-Gravity Pac-Man). Launches the game modal on click.
   ================================================================ */
'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';

interface FeaturedGameProps {
  onLaunch: () => void;
}

const FeaturedGame = memo(function FeaturedGame({ onLaunch }: FeaturedGameProps) {
  const audio = useAudio();

  const handleLaunch = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    try { audio.whoosh(); } catch (err) {}
    onLaunch();
  }, [audio, onLaunch]);

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Label */}
      <div className="flex items-center gap-4 mb-6 justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--cyan)] opacity-30 max-w-[120px]" />
        <p className="font-mono text-[9px] tracking-[0.35em] text-[var(--cyan)] uppercase">Featured Game</p>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--cyan)] opacity-30 max-w-[120px]" />
      </div>

      {/* Card */}
      <div
        className="group relative rounded-3xl overflow-hidden cursor-pointer"
        onClick={handleLaunch}
        style={{
          background: 'rgba(10, 11, 20, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.06)',
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Cyan grid lines */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`col-${i}`}
              className="absolute top-0 bottom-0 w-px opacity-[0.06]"
              style={{ left: `${(i + 1) * 12.5}%`, background: 'var(--cyan)' }}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`row-${i}`}
              className="absolute left-0 right-0 h-px opacity-[0.04]"
              style={{ top: `${(i + 1) * 16.67}%`, background: 'var(--cyan)' }}
            />
          ))}
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.08] blur-[80px]"
            style={{ background: 'var(--cyan)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.05] blur-[60px]"
            style={{ background: 'var(--violet)' }} />
          {/* Scan line sweep */}
          <motion.div
            className="absolute left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Hover border glow */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: 'inset 0 0 40px rgba(0, 240, 255, 0.08), 0 0 60px rgba(0, 240, 255, 0.12)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
          {/* Left: info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-4">
              <motion.div
                className="w-2 h-2 rounded-full bg-[var(--cyan)]"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--cyan)] uppercase">Live Now</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-3">
              <span className="text-[var(--cyan)]">ANTI-GRAVITY</span>
              <br />
              <span className="text-[var(--text-primary)]">PAC-MAN</span>
            </h2>

            <p className="text-[var(--text-secondary)] max-w-md mb-6 text-sm leading-relaxed">
              Classic maze gameplay reimagined. Toggle anti-gravity to phase through walls,
              escape ghosts, and defy physics in this cyberpunk arcade experience.
            </p>

            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
              {['←→↑↓ Move', 'SPACE Float', 'Mobile Touch'].map(ctrl => (
                <span
                  key={ctrl}
                  className="font-mono text-[10px] px-3 py-1 rounded-full border"
                  style={{ borderColor: 'rgba(0, 240, 255, 0.25)', color: 'var(--text-muted)' }}
                >
                  {ctrl}
                </span>
              ))}
            </div>

            {/* CTA button */}
            <motion.button
              onClick={handleLaunch}
              className="relative group/btn overflow-hidden rounded-xl px-8 py-3.5 font-bold text-sm tracking-widest"
              style={{
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: 'var(--cyan)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => audio.hoverTick()}
            >
              <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent)' }} />
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">▶</span>
                PLAY NOW
              </span>
            </motion.button>
          </div>

          {/* Right: animated preview */}
          <div
            className="w-full md:w-72 h-48 md:h-64 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 240, 255, 0.12)',
            }}
          >
            {/* Mini maze preview */}
            {[10, 25, 50, 75, 90].map(left => (
              <div key={left} className="absolute top-0 bottom-0 w-px opacity-10"
                style={{ left: `${left}%`, background: 'var(--cyan)' }} />
            ))}
            {[20, 50, 80].map(top => (
              <div key={top} className="absolute left-0 right-0 h-px opacity-10"
                style={{ top: `${top}%`, background: 'var(--cyan)' }} />
            ))}
            {/* Pac-Man dot */}
            <motion.div
              className="w-8 h-8 rounded-full relative z-10"
              style={{ background: '#FFE066', boxShadow: '0 0 24px rgba(255,224,102,0.8)' }}
              animate={{ x: [-50, 60, -50], y: [0, -20, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Ghosts */}
            {['#FF5555', '#00FFFF', '#FFB6C1'].map((c, i) => (
              <motion.div
                key={c}
                className="absolute w-5 h-5 rounded-t-full"
                style={{ background: c, boxShadow: `0 0 12px ${c}`, bottom: '25%' }}
                animate={{ x: [20 + i * 25, -10 + i * 25, 20 + i * 25] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default FeaturedGame;
