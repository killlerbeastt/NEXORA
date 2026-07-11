/* ================================================================
   useCursor — Global cursor position tracking hook
   ================================================================
   Tracks mouse position, normalized coordinates, and velocity.
   Used by: CursorGlow, Robot head tracking, parallax effects.
   ================================================================ */
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface CursorState {
  x: number;
  y: number;
  nx: number;   // Normalized X (-1 to 1)
  ny: number;   // Normalized Y (-1 to 1)
  vx: number;   // Velocity X
  vy: number;   // Velocity Y
  speed: number; // Total speed
  isMoving: boolean;
  lastMoveTime: number;
}

// Singleton cursor state shared across all consumers
const cursorState: CursorState = {
  x: 0, y: 0,
  nx: 0, ny: 0,
  vx: 0, vy: 0,
  speed: 0,
  isMoving: false,
  lastMoveTime: Date.now(),
};

let listenerAttached = false;
const subscribers = new Set<() => void>();

function attachGlobalListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;

  let prevX = 0, prevY = 0;

  const handleMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;

    cursorState.x = e.clientX;
    cursorState.y = e.clientY;
    cursorState.nx = (e.clientX / window.innerWidth) * 2 - 1;
    cursorState.ny = -(e.clientY / window.innerHeight) * 2 + 1;
    cursorState.vx = dx;
    cursorState.vy = dy;
    cursorState.speed = Math.sqrt(dx * dx + dy * dy);
    cursorState.isMoving = true;
    cursorState.lastMoveTime = Date.now();

    prevX = e.clientX;
    prevY = e.clientY;

    subscribers.forEach(fn => fn());
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
}

/** Returns the current cursor state (singleton, no re-renders) */
export function useCursor() {
  const stateRef = useRef(cursorState);

  useEffect(() => {
    attachGlobalListener();

    // Check idle state periodically
    const idleCheck = setInterval(() => {
      if (Date.now() - cursorState.lastMoveTime > 100) {
        cursorState.isMoving = false;
        cursorState.speed = 0;
        cursorState.vx *= 0.9;
        cursorState.vy *= 0.9;
      }
    }, 100);

    return () => clearInterval(idleCheck);
  }, []);

  /** Subscribe to cursor updates (for components that need to re-render) */
  const subscribe = useCallback((callback: () => void) => {
    subscribers.add(callback);
    return () => { subscribers.delete(callback); };
  }, []);

  return { cursor: stateRef.current, subscribe };
}

/** Direct access for non-React (e.g., Three.js useFrame) */
export function getCursorState(): CursorState {
  return cursorState;
}
