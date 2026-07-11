/* ================================================================
   Navigation.tsx — Floating Glass Navbar
   ================================================================
   Minimal, transparent, scroll-aware navigation.
   Disappears on scroll down, returns on scroll up.
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
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      // Show/hide based on scroll direction
      if (currentY > lastScrollY.current + 10) {
        setVisible(false); // Scrolling down
      } else if (currentY < lastScrollY.current - 5) {
        setVisible(true); // Scrolling up
      }

      // Add background when scrolled
      setScrolled(currentY > 50);
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-colors duration-500 ${
            scrolled ? 'glass-strong' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <a href="#hero" className="group flex items-center gap-3 pointer-events-auto">
              {/* Robot icon */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute w-3 h-3 rounded-sm bg-[var(--cyan)] opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute w-5 h-5 rounded-md border border-[var(--cyan)] opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-wide text-[var(--text-primary)]">
                ARCADE
                <span className="text-[var(--cyan)] ml-0.5">HUB</span>
              </span>
            </a>

            {/* Nav links */}
            <div className="flex items-center gap-8 pointer-events-auto">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group relative text-sm tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                >
                  {link.label}
                  {/* Animated underline */}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--cyan)] group-hover:w-full transition-all duration-300 ease-out" />
                  {/* Tiny glow on hover */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-[var(--cyan)] opacity-0 blur-sm group-hover:w-full group-hover:opacity-100 transition-all duration-300 ease-out" />
                </a>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
});

export default Navigation;
