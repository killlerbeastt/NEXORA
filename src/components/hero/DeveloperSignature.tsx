/* ================================================================
   DeveloperSignature.tsx — Subtle AAA Studio Founder Signature
   ================================================================
   Subtly communicates authorship ("DESIGNED & DEVELOPED BY AVIGYAN JHA")
   beneath the hero title and EST. 2026 label.
   
   Features:
     - Entrance: 0.8s fade + 10px upward lift with 1.2s delay (power3.out)
     - Hover: Smooth 250ms scale (1.02) + slightly stronger glow
     - Status Dot: Low-intensity cyan dot softly pulsing every 4.5s
     - Pointer Events: Isolated (never blocks surrounding 3D canvas)
   ================================================================ */
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface DeveloperSignatureProps {
  className?: string;
}

const DeveloperSignature = memo(function DeveloperSignature({ className = '' }: DeveloperSignatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 1.2,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={`select-none pointer-events-auto ${className}`}
    >
      <motion.div
        whileHover={{
          scale: 1.02,
          filter: 'brightness(1.15)',
        }}
        transition={{
          duration: 0.25,
          ease: 'easeOut',
        }}
        className="group inline-flex flex-col items-center md:items-end transition-all duration-250 cursor-default py-1"
      >
        {/* Top Label with pulsing status indicator */}
        <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs font-light uppercase tracking-[0.35em] text-white/50 group-hover:text-white/65 transition-colors duration-250">
          <span className="relative flex h-1.5 w-1.5 items-center justify-center">
            {/* Low-intensity soft pulse every ~4.5 seconds */}
            <motion.span
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)] opacity-40 blur-[1px]"
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--cyan)] opacity-75"
              style={{ boxShadow: '0 0 6px rgba(0, 240, 255, 0.35)' }}
            />
          </span>
          <span>DESIGNED & DEVELOPED BY</span>
        </div>

        {/* Founder Name */}
        <div
          className="mt-1 font-sans text-sm md:text-[16px] font-semibold tracking-[0.15em] text-[#F5F5F5]/90 group-hover:text-white transition-all duration-250"
          style={{
            textShadow: '0 0 12px rgba(245, 245, 245, 0.25)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.textShadow = '0 0 20px rgba(0, 240, 255, 0.45), 0 0 8px rgba(245, 245, 245, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.textShadow = '0 0 12px rgba(245, 245, 245, 0.25)';
          }}
        >
          AVIGYAN JHA
        </div>
      </motion.div>
    </motion.div>
  );
});

export default DeveloperSignature;
