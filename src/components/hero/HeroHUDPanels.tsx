/* ================================================================
   HeroHUDPanels.tsx — Floating Holographic HUD & Mobile Status Row
   ================================================================
   Desktop (1024px+): 6 floating glassmorphism panels around robot.
   Tablet (768px - 1023px): 3 closer orbital panels (`FRAME RATE`, `SERVER STATUS`, `GAMES`).
   Mobile (< 768px): Compact inline status pill strip (`ONLINE · 60 FPS`).
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface HUDPanelData {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  /** Tailwind position classes (hidden on mobile, tailored for md and lg+) */
  pos: string;
  delay: number;
  floatDir: [number, number];
}

const PANELS: HUDPanelData[] = [
  {
    id: 'fps',
    label: 'FRAME RATE',
    value: '60 FPS',
    color: '#00F0FF',
    pos: 'hidden md:block md:left-[3%] lg:left-[4%] md:top-[20%] lg:top-[28%]',
    delay: 0,
    floatDir: [-6, 6],
  },
  {
    id: 'status',
    label: 'SERVER STATUS',
    value: 'ONLINE',
    subtext: '● Live',
    color: '#4ADE80',
    pos: 'hidden md:block md:right-[3%] lg:right-[4%] md:top-[18%] lg:top-[22%]',
    delay: 0.4,
    floatDir: [-8, 4],
  },
  {
    id: 'games',
    label: 'ARCADE GAMES',
    value: '4 TITLES',
    subtext: '2 Live · 2 Soon',
    color: '#A855F7',
    pos: 'hidden md:block md:left-[5%] lg:left-[3%] md:bottom-[24%] lg:bottom-[30%]',
    delay: 0.8,
    floatDir: [-4, 8],
  },
  {
    id: 'engine',
    label: 'ENGINE',
    value: 'WebGL 2',
    subtext: 'Three.js + R3F',
    color: '#FFB347',
    pos: 'hidden lg:block lg:right-[3%] lg:bottom-[28%]',
    delay: 1.2,
    floatDir: [-6, 6],
  },
  {
    id: 'browser',
    label: 'PLATFORM',
    value: 'BROWSER',
    subtext: '100% web-native',
    color: '#00F0FF',
    pos: 'hidden xl:block xl:left-[14%] xl:top-[15%]',
    delay: 1.6,
    floatDir: [-5, 9],
  },
  {
    id: 'cpu',
    label: 'SYSTEM',
    value: 'READY',
    subtext: 'No installs needed',
    color: '#FF4D6A',
    pos: 'hidden xl:block xl:right-[14%] xl:top-[14%]',
    delay: 2.0,
    floatDir: [-7, 5],
  },
];

const HUDPanelItem = memo(function HUDPanelItem({ panel }: { panel: HUDPanelData }) {
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
        opacity: { duration: 0.8, delay: panel.delay + 1.2 },
        scale: { duration: 0.8, delay: panel.delay + 1.2 },
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
          minWidth: '115px',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${panel.color}80, transparent)` }}
        />

        <div className="px-3 py-2.5">
          <p
            className="font-mono text-[8px] tracking-[0.25em] uppercase mb-1"
            style={{ color: `${panel.color}80` }}
          >
            {panel.label}
          </p>

          <p
            className="font-mono font-bold text-sm tracking-wide"
            style={{ color: panel.color, textShadow: `0 0 12px ${panel.color}60` }}
          >
            {panel.value}
          </p>

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
      {PANELS.map((panel) => (
        <HUDPanelItem key={panel.id} panel={panel} />
      ))}
    </>
  );
}

/**
 * Mobile status row displayed inside the vertical hero stack right above/below the robot.
 */
export const MobileHeroHUDRow = memo(function MobileHeroHUDRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex md:hidden items-center justify-center gap-3 my-4 pointer-events-none select-none w-full px-4"
    >
      {/* ONLINE pill */}
      <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-[#4ADE80]/30 bg-[#4ADE80]/10 backdrop-blur-md shadow-[0_0_15px_rgba(74,222,128,0.1)]">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
        <span className="font-mono text-[10px] font-bold tracking-widest text-[#4ADE80]">ONLINE</span>
      </div>

      {/* 60 FPS pill */}
      <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--cyan)]">60 FPS</span>
      </div>

      {/* WEBGL 2 pill */}
      <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-[var(--violet)]/30 bg-[var(--violet)]/10 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--violet)]">3D READY</span>
      </div>
    </motion.div>
  );
});
