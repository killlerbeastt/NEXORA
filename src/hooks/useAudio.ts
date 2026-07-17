/* ================================================================
   useAudio — Web Audio API hook for UI sound effects (Resilient)
   ================================================================
   Synthesizes sounds procedurally — no external audio files needed.
   Provides: hover tick, button click, robot servo, whoosh.
   All functions are wrapped in safe try/catch blocks to guarantee
   that audio restrictions NEVER block game launches or UI clicks.
   ================================================================ */
'use client';

import { useRef, useCallback, useEffect } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {/* ignore autoplay restrictions */});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/** Tiny hover tick — soft high-frequency blip */
function playHoverTick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    // Ignore audio synthesis exceptions
  }
}

/** Button click — satisfying mechanical pop */
function playClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Click body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);

    // Hi-freq transient
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4200, ctx.currentTime);
    gain2.gain.setValueAtTime(0.02, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // Ignore audio synthesis exceptions
  }
}

/** Robot servo — mechanical whirring sound */
function playServo() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio synthesis exceptions
  }
}

/** Whoosh — for transitions and game launches */
function playWhoosh() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Noise-like whoosh using multiple detuned oscillators
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 + i * 150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Ignore audio synthesis exceptions
  }
}

export function useAudio() {
  useEffect(() => {
    const initOnInteraction = () => {
      try {
        getAudioContext();
      } catch (e) {}
      window.removeEventListener('click', initOnInteraction);
      window.removeEventListener('keydown', initOnInteraction);
    };
    window.addEventListener('click', initOnInteraction, { once: true });
    window.addEventListener('keydown', initOnInteraction, { once: true });
    return () => {
      window.removeEventListener('click', initOnInteraction);
      window.removeEventListener('keydown', initOnInteraction);
    };
  }, []);

  return {
    hoverTick: useCallback(playHoverTick, []),
    click: useCallback(playClick, []),
    servo: useCallback(playServo, []),
    whoosh: useCallback(playWhoosh, []),
  };
}

