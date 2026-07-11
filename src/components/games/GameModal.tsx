/* ================================================================
   GameModal.tsx — Cinematic In-Page Arcade Game Modal
   ================================================================
   Renders the game in an iframe overlay with glassmorphism header,
   keyboard capture, full screen toggle, pop-out option, and close.
   ================================================================ */
'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';

interface GameModalProps {
  game: {
    id: string;
    title: string;
    subtitle: string;
    color: string;
    file: string;
    controls: readonly string[];
    windowSize: { w: number; h: number };
  } | null;
  onClose: () => void;
}

export default function GameModal({ game, onClose }: GameModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audio = useAudio();

  // Focus iframe on mount so keyboard controls work immediately
  useEffect(() => {
    if (game && iframeRef.current) {
      // Small timeout to allow iframe to render before focusing
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [game]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && game) {
        audio.hoverTick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, onClose, audio]);

  const handlePopOut = () => {
    if (!game) return;
    audio.whoosh();
    const left = (screen.width - game.windowSize.w) / 2;
    const top = (screen.height - game.windowSize.h) / 2;
    window.open(
      game.file,
      `${game.id}_window`,
      `width=${game.windowSize.w},height=${game.windowSize.h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-[rgba(5,5,8,0.85)] backdrop-blur-2xl"
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl overflow-hidden glass-strong shadow-2xl border"
            style={{ borderColor: `${game.color}40` }}
            onClick={(e) => e.stopPropagation()} // Prevent outside click from closing when clicking inside
          >
            {/* Top Header Bar */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{
                borderColor: `${game.color}20`,
                background: `linear-gradient(90deg, ${game.color}15, transparent)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ background: game.color, boxShadow: `0 0 12px ${game.color}` }}
                />
                <div>
                  <h3 className="text-lg font-bold tracking-wide leading-none text-[var(--text-primary)]">
                    <span style={{ color: game.color }}>{game.title}</span> {game.subtitle}
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1 tracking-widest uppercase">
                    ACTIVE ARCADE SESSION
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Pop Out Button */}
                <button
                  onClick={handlePopOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider border transition-all duration-200 flex items-center gap-1.5 hover:bg-white/5 text-[var(--text-secondary)] hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  title="Open in separate window"
                >
                  <span>↗</span> POP OUT
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    audio.hoverTick();
                    onClose();
                  }}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 text-[var(--text-secondary)] border-white/10"
                  title="Close game (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Game Frame Viewport */}
            <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
              <iframe
                ref={iframeRef}
                src={game.file}
                title={`${game.title} ${game.subtitle}`}
                className="w-full h-full border-none outline-none"
                allow="autoplay; fullscreen; keyboard"
              />
            </div>

            {/* Bottom Controls Bar */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-t text-xs shrink-0 bg-black/40"
              style={{ borderColor: `${game.color}15` }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                  CONTROLS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {game.controls.map((ctrl) => (
                    <span
                      key={ctrl}
                      className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-[var(--text-secondary)] bg-white/5"
                    >
                      {ctrl}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                Press <kbd className="px-1.5 py-0.5 rounded border border-white/20 text-white bg-white/10">ESC</kbd> or click ✕ to exit
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
