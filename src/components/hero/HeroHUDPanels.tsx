/* ================================================================
   HeroHUDPanels.tsx — Floating Holographic HUD around robot
   ================================================================
   Absolutely-positioned glassmorphism panels that slowly float
   around the 3D robot, giving the scene a living, data-driven feel.
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface HUDPanel {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  /** Tailwind position classes */
  pos: string;
  delay: number;
  floatDir: [number, number]; // [yMin, yMax] for float animation
}

const PANELS: HUDPanel[] = [
  {
    id: 'fps',
    label: 'FRAME RATE',
    value: '60 FPS',
    color: '#00F0FF',
    pos: 'left-[4%] top-[28%] hidden lg:block',
    delay: 0,
    floatDir: [-6, 6],
  },
  {
    id: 'status',
    label: 'SERVER STATUS',
    value: 'ONLINE',
    subtext: '● Live',
    color: '#4ADE80',
    pos: 'right-[4%] top-[22%] hidden lg:block',
    delay: 0.4,
    floatDir: [-8, 4],
  },
  {
    id: 'games',
    label: 'ARCADE GAMES',
    value: '4 TITLES',
    subtext: '2 Live · 2 Soon',
    color: '#A855F7',
    pos: 'left-[3%] bottom-[30%] hidden lg:block',
    delay: 0.8,
    floatDir: [-4, 8],
  },
  {
    id: 'engine',
    label: 'ENGINE',
    value: 'WebGL 2',
    subtext: 'Three.js + R3F',
    color: '#FFB347',
    pos: 'right-[3%] bottom-[28%] hidden lg:block',
    delay: 1.2,
    floatDir: [-6, 6],
  },
  {
    id: 'browser',
    label: 'PLATFORM',
    value: 'BROWSER',
    subtext: '100% web-native',
    color: '#00F0FF',
    pos: 'left-[14%] top-[15%] hidden xl:block',
    delay: 1.6,
    floatDir: [-5, 9],
  },
  {
    id: 'cpu',
    label: 'SYSTEM',
    value: 'READY',
    subtext: 'No installs needed',
    color: '#FF4D6A',
    pos: 'right-[14%] top-[14%] hidden xl:block',
    delay: 2.0,
    floatDir: [-7, 5],
  },
];

const HUDPanel = memo(function HUDPanel({ panel }: { panel: HUDPanel }) {
  return (
    <motion.div
      className={`absolute pointer-events-none select-none ${panel.pos}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 1],
        scale: [0.8, 1],
        y: panel.floatDir,
      }}
      transition={{
        opacity: { duration: 0.8, delay: panel.delay + 1.5 },
        scale: { duration: 0.8, delay: panel.delay + 1.5 },
        y: {
          duration: 4 + panel.delay * 0.5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
          delay: panel.delay,
        },
      }}
    >
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(10, 11, 20, 0.65)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${panel.color}28`,
          boxShadow: `0 0 20px ${panel.color}10, inset 0 1px 0 ${panel.color}15`,
          minWidth: '120px',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${panel.color}80, transparent)` }}
        />

        <div className="px-3 py-2.5">
          {/* Label */}
          <p
            className="font-mono text-[8px] tracking-[0.25em] uppercase mb-1"
            style={{ color: `${panel.color}80` }}
          >
            {panel.label}
          </p>

          {/* Value */}
          <p
            className="font-mono font-bold text-sm tracking-wide"
            style={{ color: panel.color, textShadow: `0 0 12px ${panel.color}60` }}
          >
            {panel.value}
          </p>

          {/* Subtext */}
          {panel.subtext && (
            <p className="font-mono text-[9px] text-[var(--text-muted)] mt-0.5">
              {panel.subtext}
            </p>
          )}
        </div>

        {/* Animated scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px opacity-20"
          style={{ background: panel.color }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3 + panel.delay, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
});

export default function HeroHUDPanels() {
  return (
    <>
      {PANELS.map(panel => (
        <HUDPanel key={panel.id} panel={panel} />
      ))}
    </>
  );
}
