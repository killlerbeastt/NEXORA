/* ================================================================
   GameCard.tsx — Premium Floating Game Card
   ================================================================
   Glassmorphism card with 3D tilt on hover, animated border,
   live preview, magnetic hover, and launch button.
   ================================================================ */
'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';

interface GameCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  controls: readonly string[];
  color: string;
  file: string;
  status: 'playable' | 'coming-soon';
  windowSize: { w: number; h: number };
  index: number;
  onLaunch: () => void;
}

export default function GameCard({
  id, title, subtitle, description, controls, color, file, status, windowSize, index, onLaunch,
}: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const audio = useAudio();

  // 3D tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleLaunch = () => {
    if (status !== 'playable') return;
    audio.whoosh();
    onLaunch();
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      style={{
        perspective: '1200px',
      }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setIsHovered(true); audio.hoverTick(); }}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Animated gradient border */}
        <div
          className="absolute inset-0 rounded-2xl p-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${color}66, transparent 40%, transparent 60%, ${color}44)`,
          }}
        />

        {/* Card body */}
        <div className="relative glass rounded-2xl p-6 md:p-8 h-full" style={{ transform: 'translateZ(0)' }}>
          {/* Status badge */}
          <div className="flex items-center justify-between mb-6">
            <div
              className="text-[10px] tracking-[0.2em] font-mono px-3 py-1 rounded-full border"
              style={{
                color,
                borderColor: `${color}33`,
                background: `${color}0A`,
              }}
            >
              {status === 'playable' ? `GAME 0${index + 1}` : 'COMING SOON'}
            </div>

            {status === 'playable' && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span className="text-[10px] font-mono text-[var(--text-muted)]">LIVE</span>
              </div>
            )}
          </div>

          {/* Game preview area */}
          <div
            className="relative w-full h-40 rounded-xl mb-6 overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}08, ${color}15)`,
              border: `1px solid ${color}15`,
            }}
          >
            {/* Animated preview elements */}
            {id === 'pacman' && <PacmanPreview color={color} isHovered={isHovered} />}
            {id === 'flappy' && <FlappyPreview color={color} isHovered={isHovered} />}
            {status === 'coming-soon' && <ComingSoonPreview color={color} />}

            {/* Hover brightness overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at center, ${color}15, transparent 70%)` }}
            />
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-1">
            <span style={{ color }}>{title}</span>
            <br />
            <span className="text-[var(--text-primary)]">{subtitle}</span>
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] mt-3 mb-5 leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-6">
            {controls.map((ctrl) => (
              <span
                key={ctrl}
                className="text-[10px] font-mono px-2 py-1 rounded border border-[var(--text-muted)] text-[var(--text-muted)]"
              >
                {ctrl}
              </span>
            ))}
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={status !== 'playable'}
            className="group/btn relative w-full py-3 rounded-xl font-bold text-sm tracking-wider overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: status === 'playable' ? `${color}15` : 'transparent',
              border: `1px solid ${color}${status === 'playable' ? '40' : '15'}`,
              color: status === 'playable' ? color : 'var(--text-muted)',
            }}
            onMouseEnter={() => status === 'playable' && audio.hoverTick()}
          >
            {/* Shine sweep */}
            <span
              className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {status === 'playable' ? (
                <>
                  <span className="text-lg">▶</span>
                  LAUNCH GAME
                </>
              ) : (
                <>
                  <span className="text-lg">🔒</span>
                  COMING SOON
                </>
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Reflection below card */}
      <div
        className="absolute -bottom-6 left-4 right-4 h-12 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: color }}
      />
    </motion.div>
  );
}

/* ── Preview Components ──────────────────────────────────────── */

function PacmanPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Maze lines */}
      <div className="absolute top-6 left-6 right-6 h-px" style={{ background: `${color}30` }} />
      <div className="absolute bottom-6 left-6 right-6 h-px" style={{ background: `${color}30` }} />
      <div className="absolute top-6 bottom-6 left-1/2 w-px" style={{ background: `${color}30` }} />
      <div className="absolute top-6 bottom-6 left-6 w-px" style={{ background: `${color}20` }} />
      <div className="absolute top-6 bottom-6 right-6 w-px" style={{ background: `${color}20` }} />

      {/* Pac-Man */}
      <motion.div
        className="w-6 h-6 rounded-full"
        style={{ background: '#FFE066', boxShadow: '0 0 16px rgba(255, 224, 102, 0.6)' }}
        animate={isHovered ? { x: [0, 30, 0, -30, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Ghosts */}
      {['#FF5555', '#FF99CC', '#00FFFF', '#FFB347'].map((ghostColor, i) => (
        <motion.div
          key={ghostColor}
          className="absolute w-4 h-4 rounded-t-full"
          style={{
            background: ghostColor,
            boxShadow: `0 0 10px ${ghostColor}80`,
            left: `${20 + i * 15}%`,
            top: '30%',
          }}
          animate={isHovered ? { y: [0, -5, 0, 5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Dots */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white opacity-50"
          style={{ left: `${15 + i * 18}%`, bottom: '35%' }}
        />
      ))}
    </div>
  );
}

function FlappyPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white opacity-30"
          style={{ left: `${Math.random() * 90}%`, top: `${Math.random() * 60}%` }}
        />
      ))}

      {/* Bird */}
      <motion.div
        className="absolute w-5 h-4 rounded-full left-[30%]"
        style={{ background: color, boxShadow: `0 0 12px ${color}80` }}
        animate={isHovered ? { y: [60, 40, 70, 45, 60] } : { y: 60 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pipes */}
      {[55, 80].map((left) => (
        <div key={left}>
          <div
            className="absolute top-0 w-6"
            style={{ left: `${left}%`, height: '35%', background: `${color}30`, borderRadius: '0 0 4px 4px' }}
          />
          <div
            className="absolute bottom-0 w-6"
            style={{ left: `${left}%`, height: '30%', background: `${color}30`, borderRadius: '4px 4px 0 0' }}
          />
        </div>
      ))}
    </div>
  );
}

function ComingSoonPreview({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Pulsing ring */}
      <motion.div
        className="w-16 h-16 rounded-full border"
        style={{ borderColor: `${color}40` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-8 h-8 rounded-full border"
        style={{ borderColor: `${color}60` }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      <div
        className="absolute w-3 h-3 rounded-full"
        style={{ background: color, boxShadow: `0 0 20px ${color}` }}
      />
    </div>
  );
}
