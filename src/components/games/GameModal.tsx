/* ================================================================
   GameModal.tsx — Fullscreen In-Page Arcade Game Player
   ================================================================
   Replaces the entire viewport with the game iframe.
   A minimal HUD overlay at the top provides:
     - Game title + live indicator
     - Controls hint
     - "Return to Main Menu" button (primary CTA)
   The game runs at 100vw × 100vh — no backdrop, no window pop-out.
   ================================================================ */
'use client';

import { useEffect, useRef, useState, memo } from 'react';
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

const GameModal = memo(function GameModal({ game, onClose }: GameModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audio = useAudio();
  const [hudVisible, setHudVisible] = useState(true);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus iframe immediately so keyboard controls work
  useEffect(() => {
    if (game && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [game]);

  // Auto-hide HUD after 3 s of inactivity; show again on mouse move
  useEffect(() => {
    if (!game) return;

    const resetTimer = () => {
      setHudVisible(true);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
      hudTimerRef.current = setTimeout(() => setHudVisible(false), 3000);
    };

    resetTimer(); // start on mount
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [game]);

  // ESC key and postMessage from iframe both close the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && game) {
        try { audio.hoverTick(); } catch {}
        onClose();
      }
    };
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'CLOSE_MODAL' && game) {
        try { audio.hoverTick(); } catch {}
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [game, onClose, audio]);

  // Lock body scroll while game is open
  useEffect(() => {
    if (game) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [game]);

  const handleReturn = () => {
    try { audio.whoosh(); } catch {}
    onClose();
  };

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          key="game-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[10000] bg-black flex flex-col"
          style={{ width: '100vw', height: '100vh' }}
        >
          {/* ── Fullscreen iframe ──────────────────────── */}
          <iframe
            ref={iframeRef}
            src={`${game.file}?autostart=1`}
            title={`${game.title} ${game.subtitle}`}
            className="w-full flex-1 border-none outline-none"
            style={{ display: 'block' }}
            allow="autoplay; fullscreen; keyboard; touch"
          />

          {/* ── Floating HUD overlay ────────────────────
              Sits absolutely at the top, auto-hides after inactivity.
              Pointer-events none on the container so the game below
              still receives mouse input; buttons re-enable them.        */}
          <AnimatePresence>
            {hudVisible && (
              <motion.div
                key="hud"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{ zIndex: 10001 }}
              >
                <div
                  className="relative mx-4 mt-4 rounded-2xl flex items-center justify-between gap-4 px-4 py-2.5 pointer-events-auto"
                  style={{
                    background: 'rgba(5, 5, 10, 0.82)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${game.color}35`,
                    boxShadow: `0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px ${game.color}12`,
                  }}
                >
                  {/* Left: game identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                      style={{ background: game.color, boxShadow: `0 0 10px ${game.color}` }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold tracking-wide text-white leading-none truncate">
                        <span style={{ color: game.color }}>{game.title}</span>
                        {' '}{game.subtitle}
                      </p>
                      <p className="text-[9px] font-mono text-white/40 mt-0.5 tracking-[0.2em] uppercase">
                        ARCADE SESSION — LIVE
                      </p>
                    </div>
                  </div>

                  {/* Center: controls */}
                  <div className="hidden md:flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-[9px] font-mono text-white/30 tracking-wider uppercase mr-1">
                      CONTROLS:
                    </span>
                    {game.controls.map((ctrl) => (
                      <span
                        key={ctrl}
                        className="text-[9px] font-mono px-2 py-0.5 rounded border text-white/50"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
                      >
                        {ctrl}
                      </span>
                    ))}
                  </div>

                  {/* Right: ESC hint + Return button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:block text-[9px] font-mono text-white/25 tracking-wider">
                      ESC to exit
                    </span>
                    <button
                      onClick={handleReturn}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-widest transition-all duration-200 active:scale-95"
                      style={{
                        background: `${game.color}20`,
                        border: `1px solid ${game.color}60`,
                        color: game.color,
                        boxShadow: `0 0 16px ${game.color}25`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = `${game.color}35`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${game.color}45`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = `${game.color}20`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${game.color}25`;
                      }}
                    >
                      <span className="text-base leading-none">←</span>
                      <span className="hidden sm:inline">MAIN MENU</span>
                      <span className="sm:hidden">MENU</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default GameModal;
