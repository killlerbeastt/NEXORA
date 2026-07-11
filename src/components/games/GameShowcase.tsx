/* ================================================================
   GameShowcase.tsx — Games Section with Scroll Reveal
   ================================================================
   Section wrapper with heading, game card grid, and
   Framer Motion scroll-triggered entrance.
   ================================================================ */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GAMES } from '@/lib/constants';
import GameCard from './GameCard';
import GameModal from './GameModal';

type GameItem = typeof GAMES[number];

export default function GameShowcase() {
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);

  return (
    <section id="games" className="relative py-32 px-6">
      {/* Background gradient accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--cyan)] opacity-[0.02] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[var(--violet)] opacity-[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <p className="font-mono text-xs tracking-[0.3em] text-[var(--cyan)] uppercase mb-4">
            Select Your Game
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-[var(--text-primary)]">The </span>
            <span className="gradient-text">Arcade</span>
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-md mx-auto">
            Choose your challenge. Launch directly inside our cinematic
            full-screen overlay or pop out to a dedicated arcade window.
          </p>
        </motion.div>

        {/* Game cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {GAMES.map((game, index) => (
            <GameCard
              key={game.id}
              {...game}
              index={index}
              onLaunch={() => setSelectedGame(game)}
            />
          ))}
        </div>

        {/* Bottom accent */}
        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[var(--text-muted)]" />
            <span className="text-[10px] tracking-[0.3em] text-[var(--text-muted)] font-mono">
              MORE GAMES IN DEVELOPMENT
            </span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[var(--text-muted)]" />
          </div>
        </motion.div>
      </div>

      {/* Cinematic In-Page Game Modal Overlay */}
      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </section>
  );
}
