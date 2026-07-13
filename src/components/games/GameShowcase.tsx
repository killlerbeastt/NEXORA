/* ================================================================
   GameShowcase.tsx — Games Section (AAA Redesign)
   ================================================================
   Perfectly centered section with animated glowing dividers,
   ambient drifting particles, FeaturedGame spotlight card,
   asymmetric game grid, and breathing room from the hero.
   ================================================================ */
'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { GAMES } from '@/lib/constants';
import GameCard from './GameCard';
import GameModal from './GameModal';
import FeaturedGame from '@/components/sections/FeaturedGame';

type GameItem = typeof GAMES[number];

/* ── Deterministic ambient particles ─────────────────────────── */
const AMBIENT = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 19 + 3) % 100}%`,
  top:  `${(i * 31 + 7) % 100}%`,
  size: (i % 3 === 0) ? 1.5 : 1,
  dur:  8 + (i % 5) * 2,
  delay: (i * 0.6) % 7,
  color: i % 3 === 0 ? 'var(--cyan)' : i % 3 === 1 ? 'var(--violet)' : 'var(--amber)',
  opacity: 0.04 + (i % 4) * 0.02,
}));

/* ── Animated Section Divider ─────────────────────────────────── */
function SectionDivider({ color = 'var(--cyan)' }: { color?: string }) {
  return (
    <div className="relative h-px my-2 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`, opacity: 0.25 }}
      />
      <motion.div
        className="absolute top-0 h-full w-32"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }}
        animate={{ x: ['-200px', '120vw'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </div>
  );
}

const GameShowcase = memo(function GameShowcase() {
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);

  const launchHandlers = useMemo(() => {
    const map: Record<string, () => void> = {};
    GAMES.forEach(game => {
      map[game.id] = () => setSelectedGame(game);
    });
    return map;
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGame(null);
  }, []);

  // Split games: pacman is featured, rest are in the grid
  const featuredGame = GAMES[0]; // pacman
  const gridGames = GAMES.slice(1); // flappy + coming soon games

  return (
    <section id="games" className="relative pt-0 pb-32 px-6 overflow-hidden">
      {/* ── Ambient background particles ──────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {AMBIENT.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
            }}
            animate={{
              y: [0, -25, 0, 20, 0],
              x: [0, 12, -8, 4, 0],
              opacity: [p.opacity, p.opacity * 2.5, p.opacity],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        {/* Soft background glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[var(--cyan)] opacity-[0.025] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-[var(--violet)] opacity-[0.025] blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-[var(--amber)] opacity-[0.015] blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* ── Section header ─────────────────────────── */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Top decorative line */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <SectionDivider color="var(--cyan)" />
            <span className="font-mono text-[9px] tracking-[0.35em] text-[var(--cyan)] uppercase shrink-0 px-2">
              Select Your Game
            </span>
            <SectionDivider color="var(--cyan)" />
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-[var(--text-primary)]">The </span>
            <span className="gradient-text">Arcade</span>
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-md mx-auto text-sm leading-relaxed">
            Choose your challenge. Launch directly inside our cinematic
            full-screen overlay or pop out to a dedicated arcade window.
          </p>
        </motion.div>

        {/* Divider below heading */}
        <div className="mb-14">
          <SectionDivider color="var(--violet)" />
        </div>

        {/* ── Featured game (Pac-Man) ─────────────────── */}
        <FeaturedGame onLaunch={launchHandlers[featuredGame.id]} />

        {/* ── Grid: Flappy Bird (full-width) + Coming Soon 2-col ── */}
        <div className="space-y-8">
          {/* Flappy Bird — full width */}
          <div className="grid grid-cols-1">
            <GameCard
              key={gridGames[0].id}
              {...gridGames[0]}
              index={0}
              onLaunch={launchHandlers[gridGames[0].id]}
            />
          </div>

          {/* Coming Soon — 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {gridGames.slice(1).map((game, i) => (
              <GameCard
                key={game.id}
                {...game}
                index={i + 1}
                onLaunch={launchHandlers[game.id]}
              />
            ))}
          </div>
        </div>

        {/* ── Bottom accent ───────────────────────────── */}
        <motion.div
          className="mt-20 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <SectionDivider color="var(--amber)" />
          <span className="text-[10px] tracking-[0.3em] text-[var(--text-muted)] font-mono uppercase">
            More Games In Development
          </span>
          <SectionDivider color="var(--amber)" />
        </motion.div>
      </div>

      {/* Game modal */}
      <GameModal game={selectedGame} onClose={handleCloseModal} />
    </section>
  );
});

export default GameShowcase;
