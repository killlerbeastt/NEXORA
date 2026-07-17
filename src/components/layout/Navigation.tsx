/* ================================================================
   Navigation.tsx — Floating Glass Navbar & Mobile Sheet
   ================================================================
   Desktop/Tablet: Horizontal glass navbar with smooth underline glow.
   Mobile: Animated hamburger toggle + full-screen glass navigation sheet
   with large touch targets (min-h-[48px]) and staggered entrance.
   ================================================================ */
'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Games', href: '#games' },
];

const Navigation = memo(function Navigation() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide navbar if mobile menu is open
      if (mobileMenuOpen) return;

      const currentY = window.scrollY;

      if (currentY > lastScrollY.current + 10) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 5) {
        setVisible(true);
      }

      setScrolled(currentY > 50);
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMenuAndNavigate = (href: string) => {
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className={`fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 transition-colors duration-500 pointer-events-none ${
              scrolled || mobileMenuOpen ? 'glass-strong' : ''
            }`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <a href="#hero" className="group flex items-center gap-3 pointer-events-auto min-h-[40px]">
                {/* Robot icon */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-3 h-3 rounded-sm bg-[var(--cyan)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute w-5 h-5 rounded-md border border-[var(--cyan)] opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />
                </div>
                <span className="text-base md:text-lg font-bold tracking-wide text-[var(--text-primary)]">
                  ARCADE
                  <span className="text-[var(--cyan)] ml-0.5">HUB</span>
                </span>
              </a>

              {/* Desktop / Tablet Nav Links (`hidden md:flex`) */}
              <div className="hidden md:flex items-center gap-6 lg:gap-8 pointer-events-auto">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="group relative text-sm font-medium tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 py-2"
                  >
                    {link.label}
                    {/* Animated underline */}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--cyan)] group-hover:w-full transition-all duration-300 ease-out" />
                    {/* Tiny glow on hover */}
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-[var(--cyan)] opacity-0 blur-sm group-hover:w-full group-hover:opacity-100 transition-all duration-300 ease-out" />
                  </a>
                ))}
              </div>

              {/* Mobile Hamburger Toggle (`flex md:hidden`) */}
              <div className="flex md:hidden pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="min-w-[48px] min-h-[48px] flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[rgba(0,240,255,0.25)] bg-[rgba(10,11,20,0.7)] text-[var(--cyan)] active:scale-95 transition-transform cursor-pointer"
                >
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-[var(--cyan)] rounded-full transition-transform"
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                    className="w-5 h-0.5 bg-[var(--cyan)] rounded-full transition-opacity"
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-[var(--cyan)] rounded-full transition-transform"
                  />
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Full-Screen Mobile Glass Overlay ──────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(28px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-[rgba(5,5,10,0.92)] md:hidden flex flex-col justify-between px-6 py-8 pointer-events-auto"
          >
            {/* Top Bar: Logo & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-3 h-3 rounded-sm bg-[var(--cyan)]" />
                  <div className="absolute w-5 h-5 rounded-md border border-[var(--cyan)] animate-pulse" />
                </div>
                <span className="text-lg font-bold tracking-wide text-[var(--text-primary)]">
                  ARCADE<span className="text-[var(--cyan)] ml-0.5">HUB</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation Menu"
                className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] active:scale-95 transition-transform text-xl"
              >
                ✕
              </button>
            </div>

            {/* Center: Navigation Links */}
            <div className="flex flex-col items-center justify-center gap-6 my-auto">
              {NAV_LINKS.map((link, idx) => (
                <motion.button
                  key={link.label}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.1, duration: 0.4 }}
                  onClick={() => closeMenuAndNavigate(link.href)}
                  className="w-full min-h-[56px] rounded-2xl border border-[rgba(0,240,255,0.15)] bg-[rgba(0,240,255,0.04)] flex items-center justify-center text-2xl font-bold tracking-widest uppercase text-[var(--text-primary)] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.05)]"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            {/* Bottom Status Info Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] flex items-center justify-around font-mono text-xs text-[var(--text-muted)]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-[#4ADE80]">ONLINE</span>
              </div>
              <div className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />
              <span>60 FPS</span>
              <div className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />
              <span className="text-[var(--cyan)]">AAA ENGINE</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Navigation;
