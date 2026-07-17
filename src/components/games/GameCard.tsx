/* ================================================================
   GameCard.tsx — Premium Floating Game Card (AAA Redesign)
   ================================================================
   Each card has a unique visual identity per game. Enhanced 3D tilt
   with cursor-tracked shimmer, brightening border glow, and unique
   themed backgrounds per game.
   ================================================================ */
'use client';

import { useRef, useState, useCallback, useMemo, memo } from 'react';
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

/* ── Per-game visual identity config ─────────────────────────── */
const IDENTITY: Record<string, {
  bg: string;
  gridColor: string;
  atmosphere: string;
  label: string;
}> = {
  pacman: {
    bg: 'linear-gradient(135deg, rgba(0,20,25,0.95) 0%, rgba(0,30,40,0.9) 100%)',
    gridColor: 'rgba(0,240,255,0.07)',
    atmosphere: 'radial-gradient(ellipse at 80% 20%, rgba(0,240,255,0.12) 0%, transparent 60%)',
    label: 'CYBER MAZE',
  },
  flappy: {
    bg: 'linear-gradient(135deg, rgba(30,15,0,0.95) 0%, rgba(40,20,0,0.9) 100%)',
    gridColor: 'rgba(255,179,71,0.06)',
    atmosphere: 'radial-gradient(ellipse at 20% 80%, rgba(255,179,71,0.14) 0%, transparent 60%)',
    label: 'NEON SKY',
  },
  runner: {
    bg: 'linear-gradient(135deg, rgba(20,5,40,0.95) 0%, rgba(30,10,55,0.9) 100%)',
    gridColor: 'rgba(168,85,247,0.07)',
    atmosphere: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.12) 0%, transparent 65%)',
    label: 'QUANTUM ZONE',
  },
  shooter: {
    bg: 'linear-gradient(135deg, rgba(30,0,10,0.95) 0%, rgba(40,5,15,0.9) 100%)',
    gridColor: 'rgba(255,77,106,0.06)',
    atmosphere: 'radial-gradient(ellipse at 70% 30%, rgba(255,77,106,0.12) 0%, transparent 60%)',
    label: 'VOID SECTOR',
  },
};

const GameCard = memo(function GameCard({
  id, title, subtitle, description, controls, color, status, index, onLaunch,
}: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const audio = useAudio();

  // 3D tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shimmerX = useMotionValue(50);
  const shimmerY = useMotionValue(50);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 22 });
  const glowOpacity = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx);
    mouseY.set(ny);
    shimmerX.set(((e.clientX - rect.left) / rect.width) * 100);
    shimmerY.set(((e.clientY - rect.top) / rect.height) * 100);
    glowOpacity.set(1);
  }, [mouseX, mouseY, shimmerX, shimmerY, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    glowOpacity.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY, glowOpacity]);

  const handleLaunch = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (status !== 'playable') return;
    try { audio.whoosh(); } catch (err) {}
    onLaunch();
  }, [status, audio, onLaunch]);

  const identity = useMemo(() => IDENTITY[id] ?? IDENTITY.shooter, [id]);

  const shimmerStyle = useTransform(
    [shimmerX, shimmerY],
    ([sx, sy]) => `radial-gradient(circle at ${sx}% ${sy}%, ${color}22 0%, transparent 60%)`
  );

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      style={{ perspective: '1200px' }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] as const }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setIsHovered(true); audio.hoverTick(); }}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden h-full"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* ── Unique game background ────────────────────── */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Base bg */}
          <div className="absolute inset-0" style={{ background: identity.bg }} />
          {/* Atmosphere glow */}
          <div className="absolute inset-0" style={{ background: identity.atmosphere }} />
          {/* Grid pattern */}
          <div className="absolute inset-0">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`g-col-${i}`} className="absolute top-0 bottom-0 w-px"
                style={{ left: `${(i + 1) * 16.67}%`, background: identity.gridColor }} />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`g-row-${i}`} className="absolute left-0 right-0 h-px"
                style={{ top: `${(i + 1) * 20}%`, background: identity.gridColor }} />
            ))}
          </div>
          {/* Hover shimmer */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: shimmerStyle }}
          />
        </div>

        {/* ── Animated gradient border ──────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl p-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${color}70, transparent 40%, transparent 60%, ${color}50)`,
          }}
        />
        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${color}30, inset 0 0 20px ${color}10`,
            opacity: glowOpacity,
          }}
        />

        {/* ── Game-specific scan line for playable ──────── */}
        {status === 'playable' && (
          <motion.div
            className="absolute left-0 right-0 h-px z-[1] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            animate={isHovered ? { top: ['0%', '100%'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* ── Content hierarchy ─────────────────────────── */}
        <div className="relative z-10 flex flex-col h-full p-6 md:p-8">

          {/* Identity label + status badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {/* Game category chip */}
              <span
                className="font-mono text-[9px] tracking-[0.2em] px-2.5 py-1 rounded-full"
                style={{
                  color: `${color}CC`,
                  background: `${color}12`,
                  border: `1px solid ${color}25`,
                }}
              >
                {identity.label}
              </span>
            </div>

            {/* Status indicator */}
            {status === 'playable' ? (
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <span className="text-[10px] font-mono text-[var(--text-muted)]">LIVE</span>
              </div>
            ) : (
              <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--text-muted)]">
                COMING SOON
              </span>
            )}
          </div>

          {/* Game preview area */}
          <div
            className="relative w-full h-40 rounded-xl mb-6 overflow-hidden flex items-center justify-center shrink-0 pointer-events-none"
            style={{ border: `1px solid ${color}18` }}
          >
            {id === 'pacman' && <PacmanPreview color={color} isHovered={isHovered} />}
            {id === 'flappy' && <FlappyPreview color={color} isHovered={isHovered} />}
            {id === 'runner' && <RunnerPreview color={color} isHovered={isHovered} />}
            {id === 'shooter' && <ShooterPreview color={color} isHovered={isHovered} />}
            {status === 'coming-soon' && id !== 'runner' && id !== 'shooter' && <ComingSoonPreview color={color} />}
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            <span style={{ color }}>{title}</span>
            <br />
            <span className="text-[var(--text-primary)]">{subtitle}</span>
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] mt-2 mb-4 leading-relaxed line-clamp-2 flex-1">
            {description}
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-5">
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
            className="group/btn relative z-20 w-full py-3 rounded-xl font-bold text-sm tracking-wider overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto cursor-pointer"
            style={{
              background: status === 'playable' ? `${color}12` : 'transparent',
              border: `1px solid ${color}${status === 'playable' ? '45' : '18'}`,
              color: status === 'playable' ? color : 'var(--text-muted)',
            }}
            onMouseEnter={() => status === 'playable' && audio.hoverTick()}
          >
            <span
              className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${color}25, transparent)` }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {status === 'playable' ? (
                <><span className="text-lg">▶</span>LAUNCH GAME</>
              ) : (
                <><span className="text-lg">🔒</span>COMING SOON</>
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Reflection below card */}
      <div
        className="absolute -bottom-6 left-4 right-4 h-12 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: color }}
      />
    </motion.div>
  );
});

/* ── Preview Components ───────────────────────────────────────── */

function PacmanPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Cyan maze grid */}
      <div className="absolute inset-0">
        {[20, 50, 80].map(p => (
          <div key={`mp-v-${p}`} className="absolute top-4 bottom-4 w-px opacity-20"
            style={{ left: `${p}%`, background: color }} />
        ))}
        {[30, 60].map(p => (
          <div key={`mp-h-${p}`} className="absolute left-4 right-4 h-px opacity-20"
            style={{ top: `${p}%`, background: color }} />
        ))}
        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l opacity-40" style={{ borderColor: color }} />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r opacity-40" style={{ borderColor: color }} />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l opacity-40" style={{ borderColor: color }} />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r opacity-40" style={{ borderColor: color }} />
      </div>

      {/* Pac-Man */}
      <motion.div
        className="w-7 h-7 rounded-full z-10 relative"
        style={{ background: '#FFE066', boxShadow: '0 0 18px rgba(255,224,102,0.7)' }}
        animate={isHovered ? { x: [0, 35, 0, -35, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Ghosts */}
      {['#FF5555', '#FF99CC', '#00FFFF', '#FFB347'].map((gc, i) => (
        <motion.div
          key={gc}
          className="absolute w-4 h-4 rounded-t-full"
          style={{ background: gc, boxShadow: `0 0 10px ${gc}80`, left: `${18 + i * 16}%`, top: '28%' }}
          animate={isHovered ? { y: [0, -6, 0, 6, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Pellets */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-white opacity-50"
          style={{ left: `${15 + i * 17}%`, bottom: '32%' }} />
      ))}
    </div>
  );
}

function FlappyPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Amber sky gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(180deg, rgba(255,179,71,0.06) 0%, rgba(255,100,30,0.04) 100%)`
      }} />
      {/* Clouds */}
      {[15, 45, 75].map((left, i) => (
        <motion.div
          key={left}
          className="absolute h-2 rounded-full opacity-15"
          style={{ left: `${left}%`, top: `${20 + i * 15}%`, width: `${30 + i * 10}px`, background: color }}
          animate={isHovered ? { x: [-10, 10, -10] } : {}}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}
      {/* Stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white opacity-30"
          style={{ left: `${(i * 13 + 7) % 90}%`, top: `${(i * 19 + 11) % 60}%` }}
        />
      ))}
      {/* Bird */}
      <motion.div
        className="absolute w-5 h-4 rounded-full left-[30%]"
        style={{ background: color, boxShadow: `0 0 14px ${color}90` }}
        animate={isHovered ? { y: [55, 35, 65, 40, 55] } : { y: 55 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Pipes */}
      {[55, 82].map(left => (
        <div key={left}>
          <div className="absolute top-0 w-6" style={{ left: `${left}%`, height: '35%', background: `${color}35`, borderRadius: '0 0 4px 4px' }} />
          <div className="absolute bottom-0 w-6" style={{ left: `${left}%`, height: '28%', background: `${color}35`, borderRadius: '4px 4px 0 0' }} />
        </div>
      ))}
    </div>
  );
}

function RunnerPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Violet energy waves */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px opacity-20"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, top: `${35 + i * 15}%` }}
          animate={isHovered ? { scaleX: [0.5, 1, 0.5], opacity: [0.1, 0.3, 0.1] } : {}}
          transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      {/* Ground line */}
      <div className="absolute bottom-8 left-4 right-4 h-px opacity-30" style={{ background: color }} />
      {/* Runner figure */}
      <motion.div
        className="absolute bottom-9 w-3 h-5 rounded-t-full"
        style={{ background: color, boxShadow: `0 0 14px ${color}80`, left: '20%' }}
        animate={isHovered ? { x: [0, 120], scaleX: [1, 0.9, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      {/* Obstacles */}
      {[50, 80].map(l => (
        <motion.div
          key={l}
          className="absolute bottom-8 w-3 h-7 rounded-sm opacity-40"
          style={{ left: `${l}%`, background: color }}
          animate={isHovered ? { x: [-80] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* COMING SOON chip */}
      <div className="absolute top-3 right-3 font-mono text-[8px] tracking-wider px-2 py-0.5 rounded border"
        style={{ borderColor: `${color}40`, color: `${color}80`, background: `${color}08` }}>
        SOON
      </div>
    </div>
  );
}

function ShooterPreview({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red nebula background */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 60% 40%, rgba(255,77,106,0.10) 0%, transparent 70%)`
      }} />
      {/* Floating debris */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm opacity-30"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            background: color,
            left: `${(i * 17 + 5) % 90}%`,
            top: `${(i * 23 + 10) % 80}%`,
          }}
          animate={isHovered ? { rotate: 360, x: [0, (i % 2 ? 8 : -8), 0] } : {}}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* Crosshair center */}
      <div className="relative">
        <div className="w-6 h-6 rounded-full border-2 opacity-50 relative"
          style={{ borderColor: color }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full" style={{ background: color }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-px opacity-30" style={{ background: color }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-12 opacity-30" style={{ background: color }} />
      </div>
      {/* COMING SOON chip */}
      <div className="absolute top-3 right-3 font-mono text-[8px] tracking-wider px-2 py-0.5 rounded border"
        style={{ borderColor: `${color}40`, color: `${color}80`, background: `${color}08` }}>
        SOON
      </div>
    </div>
  );
}

function ComingSoonPreview({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div className="w-16 h-16 rounded-full border"
        style={{ borderColor: `${color}40` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute w-8 h-8 rounded-full border"
        style={{ borderColor: `${color}60` }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
      <div className="absolute w-3 h-3 rounded-full"
        style={{ background: color, boxShadow: `0 0 20px ${color}` }} />
    </div>
  );
}

export default GameCard;
