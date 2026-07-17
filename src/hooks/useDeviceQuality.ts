/* ================================================================
   useDeviceQuality.ts — Adaptive Hardware & Viewport Quality Hook
   ================================================================
   Measures device hardware capabilities (RAM, CPU cores, touch, screen width)
   to dynamically throttle Three.js post-processing, particle counts,
   and canvas resolution (`dpr`) ensuring 60-120 FPS on all tiers.
   ================================================================ */
'use client';

import { useState, useEffect } from 'react';

export type QualityTier = 'high' | 'medium' | 'low';

export interface DeviceQuality {
  tier: QualityTier;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  particleScale: number; // 1.0 (100%), 0.7 (70%), 0.4 (40%)
  enableBloom: boolean;
  dpr: [number, number];
  robotScale: number; // 1.0 desktop, 0.8 tablet, 0.6 mobile
}

const DEFAULT_QUALITY: DeviceQuality = {
  tier: 'high',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouch: false,
  particleScale: 1.0,
  enableBloom: true,
  dpr: [1, 1.5],
  robotScale: 1.0,
};

export function useDeviceQuality(): DeviceQuality {
  const [quality, setQuality] = useState<DeviceQuality>(DEFAULT_QUALITY);

  useEffect(() => {
    const evaluateDevice = () => {
      const width = window.innerWidth;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Evaluate hardware memory/CPU if supported by browser
      const nav = navigator as unknown as {
        deviceMemory?: number;
        hardwareConcurrency?: number;
      };
      const memory = nav.deviceMemory || 8; // default to 8GB if unknown
      const cores = nav.hardwareConcurrency || 8;

      let tier: QualityTier = 'high';
      if (isMobile || memory < 4 || cores <= 4) {
        tier = 'low';
      } else if (isTablet || memory < 8 || cores <= 6) {
        tier = 'medium';
      }

      // Determine adaptive scaling
      let particleScale = 1.0;
      let robotScale = 1.0;
      let enableBloom = true;
      let dpr: [number, number] = [1, 1.5];

      if (isMobile) {
        particleScale = 0.4;
        robotScale = 0.6;
        enableBloom = false; // Disable heavy post-processing on mobile for solid 60 FPS
        dpr = [1, 1.25];
      } else if (isTablet) {
        particleScale = 0.7;
        robotScale = 0.8;
        enableBloom = tier !== 'low';
        dpr = [1, 1.35];
      } else {
        // Desktop / Ultrawide
        particleScale = tier === 'low' ? 0.6 : tier === 'medium' ? 0.8 : 1.0;
        robotScale = 1.0;
        enableBloom = tier !== 'low';
        dpr = tier === 'high' ? [1, 1.5] : [1, 1.25];
      }

      setQuality({
        tier,
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
        particleScale,
        enableBloom,
        dpr,
        robotScale,
      });
    };

    evaluateDevice();
    window.addEventListener('resize', evaluateDevice, { passive: true });
    return () => window.removeEventListener('resize', evaluateDevice);
  }, []);

  return quality;
}
