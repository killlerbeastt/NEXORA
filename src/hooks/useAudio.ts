/* ================================================================
   useAudio — Web Audio API hook for UI sound effects
   ================================================================
   Synthesizes sounds procedurally — no external audio files needed.
   Provides: hover tick, button click, robot servo, whoosh.
   ================================================================ */
'use client';

import { useRef, useCallback, useEffect } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Tiny hover tick — soft high-frequency blip */
function playHoverTick() {
  const ctx = getAudioContext();
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
}

/** Button click — satisfying mechanical pop */
function playClick() {
  const ctx = getAudioContext();

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
}

/** Robot servo — mechanical whirring sound */
function playServo() {
  const ctx = getAudioContext();
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
}

/** Whoosh — for transitions and game launches */
function playWhoosh() {
  const ctx = getAudioContext();

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
}

export function useAudio() {
  // Initialize context on first user interaction
  useEffect(() => {
    const initOnInteraction = () => {
      getAudioContext();
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
