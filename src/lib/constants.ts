/* ================================================================
   CONSTANTS — Design tokens, color palette, animation config
   ================================================================
   Evolved cinematic palette:
   - Background: Deep space charcoal
   - Primary: Electric Cyan (#00F0FF)
   - Secondary: Warm Amber (#FFB347)
   - Accent: Neon Violet (#A855F7)
   - Text: Soft white / silver
   ================================================================ */

/** Evolved cinematic color palette */
export const COLORS = {
  // Backgrounds
  bg: {
    deep:    '#050508',   // Almost black with blue undertone
    dark:    '#0A0B14',   // Main background
    card:    '#12131F',   // Card surfaces
    glass:   'rgba(18, 19, 31, 0.6)', // Glassmorphism
  },

  // Primary accent — Electric Cyan
  primary: {
    main:    '#00F0FF',
    dim:     '#00B4CC',
    glow:    'rgba(0, 240, 255, 0.4)',
    subtle:  'rgba(0, 240, 255, 0.08)',
  },

  // Secondary accent — Warm Amber
  secondary: {
    main:    '#FFB347',
    dim:     '#CC8A2E',
    glow:    'rgba(255, 179, 71, 0.4)',
    subtle:  'rgba(255, 179, 71, 0.08)',
  },

  // Tertiary accent — Neon Violet
  accent: {
    main:    '#A855F7',
    dim:     '#7E3BD4',
    glow:    'rgba(168, 85, 247, 0.4)',
    subtle:  'rgba(168, 85, 247, 0.08)',
  },

  // Text
  text: {
    primary: '#F0F0F5',
    secondary: '#8A8BA3',
    muted:   '#4A4B63',
  },

  // Robot-specific
  robot: {
    body:      '#1A1D2E',    // Dark steel blue
    bodyLight: '#252840',    // Lighter panels
    metal:     '#3A3D52',    // Metallic accents
    eye:       '#00F0FF',    // Cyan glow
    eyeInner:  '#FFFFFF',    // Bright white center
    accent:    '#FFB347',    // Amber accent strips
    joint:     '#2A2D3E',    // Joint/hinge color
  },
} as const;

/** Animation timing & easing constants */
export const ANIMATION = {
  // Robot motion
  breathPeriod:     3.0,        // seconds per breath cycle
  breathAmplitude:  0.015,      // Y-scale oscillation
  floatPeriod:      4.0,        // seconds per float cycle
  floatAmplitude:   0.12,       // Y-position oscillation
  swayPeriod:       5.0,        // seconds per sway cycle
  swayAmplitude:    0.03,       // Z-rotation in radians
  idleDelay:        5.0,        // seconds before idle anims trigger
  blinkInterval:    [3.5, 7.0], // [min, max] seconds between blinks
  blinkDuration:    0.15,       // seconds for blink

  // Head tracking
  headYawMax:       0.45,       // max radians (~25°)
  headPitchMax:     0.26,       // max radians (~15°)
  headTrackLerp:    0.06,       // LERP speed for head tracking

  // Camera
  cameraBreathAmp:  0.03,
  cameraBreathPeriod: 6.0,
  cameraTiltLerp:   0.02,
  cameraTiltMax:    0.015,

  // UI
  scrollRevealDuration: 0.8,
  staggerDelay:     0.1,
  magneticRange:    80,         // pixels
  magneticStrength: 0.3,
} as const;

/** Game metadata for the showcase cards */
export const GAMES = [
  {
    id: 'pacman',
    title: 'ANTI-GRAVITY',
    subtitle: 'PAC-MAN',
    description: 'Classic maze gameplay with a twist — toggle anti-gravity to phase through walls and escape ghosts.',
    controls: ['←→↑↓ Move', 'SPACE Float'],
    color: COLORS.primary.main,
    file: '/games/pacman.html',
    status: 'playable' as const,
    windowSize: { w: 680, h: 820 },
  },
  {
    id: 'flappy',
    title: 'NEON',
    subtitle: 'FLAPPY BIRD',
    description: 'Navigate through neon-lit obstacles in this cyberpunk-themed endless runner.',
    controls: ['SPACE / Click to flap'],
    color: COLORS.secondary.main,
    file: '/games/flappy.html',
    status: 'playable' as const,
    windowSize: { w: 480, h: 700 },
  },
  {
    id: 'runner',
    title: 'QUANTUM',
    subtitle: 'RUNNER',
    description: 'An infinite runner through procedurally generated holographic landscapes.',
    controls: ['SPACE Jump', '↓ Slide'],
    color: COLORS.accent.main,
    file: '',
    status: 'coming-soon' as const,
    windowSize: { w: 800, h: 600 },
  },
  {
    id: 'shooter',
    title: 'VOID',
    subtitle: 'BLASTER',
    description: 'Defend your sector against waves of rogue AI in this twin-stick shooter.',
    controls: ['WASD Move', 'Mouse Aim'],
    color: '#FF4D6A',
    file: '',
    status: 'coming-soon' as const,
    windowSize: { w: 800, h: 600 },
  },
] as const;
