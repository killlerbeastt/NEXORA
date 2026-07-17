/* ================================================================
   CursorGlow.tsx — Custom Cursor with Glow Trail
   ================================================================
   Replaces native cursor with a glowing circle that follows
   mouse with LERP delay. Expands on hoverable elements.
   ================================================================ */
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 300, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 300, damping: 28 });

  const isHovering = useRef(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      setIsTouch(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    // Detect hoverable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]')
      ) {
        isHovering.current = true;
        if (ringRef.current) {
          ringRef.current.style.width = '48px';
          ringRef.current.style.height = '48px';
          ringRef.current.style.borderColor = 'var(--cyan)';
          ringRef.current.style.opacity = '0.8';
        }
        if (dotRef.current) {
          dotRef.current.style.transform = 'translate(-50%, -50%) scale(0.5)';
          dotRef.current.style.opacity = '0';
        }
      }
    };

    const handleMouseOut = () => {
      isHovering.current = false;
      if (ringRef.current) {
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
        ringRef.current.style.borderColor = 'rgba(240, 240, 245, 0.3)';
        ringRef.current.style.opacity = '1';
      }
      if (dotRef.current) {
        dotRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
        dotRef.current.style.opacity = '1';
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [cursorX, cursorY]);

  if (isTouch) {
    return null;
  }

  return (
    <>
      {/* Dot (center) */}
      <motion.div
        ref={dotRef}
        className="hidden md:block fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-white transition-all duration-200 pointer-events-none" />
      </motion.div>

      {/* Ring (outer) */}
      <motion.div
        ref={ringRef}
        className="hidden md:block fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
        }}
      >
        <div
          className="w-8 h-8 rounded-full border border-[rgba(240,240,245,0.3)] transition-all duration-300 ease-out"
          style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)' }}
        />
      </motion.div>
    </>
  );
}
