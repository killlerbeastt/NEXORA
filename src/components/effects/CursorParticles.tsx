/* ================================================================
   CursorParticles.tsx — AAA Cinematic 3D Energy Sphere Trail
   ================================================================
   A production-ready, ultra-smooth 3D particle trail built with
   Three.js, React Three Fiber, custom GLSL shaders, and object
   pooling.

   Features:
   - Zero-allocation ring buffer (pre-allocated Float32Arrays).
   - Custom GLSL volumetric glowing energy spheres with soft edges,
     additive glow, and bright core highlights.
   - Organic 3D physics: outward burst, gravity, drag, turbulence,
     and Z-axis depth oscillation.
   - Dynamic spawn rate tied to cursor velocity + linear path
     interpolation to prevent gaps during fast mouse flicks.
   - 40-80ms spring delay so the cursor always leads the trail.
   - Responsive and mobile-optimized fallback.
   ================================================================ */
'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ══════════════════════════════════════════════════════════════
   1. COLOR PALETTE & CONSTANTS
══════════════════════════════════════════════════════════════ */
// Electric Cyan, Neon Blue, Violet, Purple, and Bright White highlights
const PARTICLE_COLORS = [
  new THREE.Color('#00F5FF'), // Electric Cyan
  new THREE.Color('#1060FF'), // Neon Blue
  new THREE.Color('#8B00FF'), // Violet
  new THREE.Color('#C040FF'), // Purple
  new THREE.Color('#FFFFFF'), // Pure White highlight
];

const DESKTOP_MAX_PARTICLES = 1000;
const MOBILE_MAX_PARTICLES = 300;

/* ══════════════════════════════════════════════════════════════
   2. CUSTOM GLSL VOLUMETRIC ENERGY SPHERE SHADER
══════════════════════════════════════════════════════════════ */
const ParticleShaderMaterial = {
  vertexShader: `
    attribute float aSize;
    attribute float aAge;
    attribute float aMaxAge;
    attribute vec3 aColor;
    attribute float aSeed;

    varying vec3 vColor;
    varying float vLife;
    varying float vSeed;

    void main() {
      vColor = aColor;
      vLife = clamp(aAge / aMaxAge, 0.0, 1.0);
      vSeed = aSeed;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // Lifecycle scaling: birth pop (0 -> 15%), peak glow, smooth shrink (15% -> 100%)
      float scaleCurve = 1.0;
      if (vLife < 0.15) {
        scaleCurve = smoothstep(0.0, 0.15, vLife);
      } else {
        scaleCurve = smoothstep(1.0, 0.15, vLife);
      }

      // High-impact point size (so energy spheres render crisp at 35px - 65px width)
      gl_PointSize = (aSize * scaleCurve * 1100.0) / max(0.1, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vLife;
    varying float vSeed;

    void main() {
      // Calculate distance from center of particle sprite [0.0 to 1.0]
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord) * 2.0;

      if (dist > 1.0) discard;

      // Volumetric glowing energy sphere
      // Core: intensely bright center (white/cyan glint)
      float core = pow(clamp(1.0 - dist, 0.0, 1.0), 3.5);
      
      // Halo: soft additive outer glow
      float halo = pow(clamp(1.0 - dist, 0.0, 1.0), 1.4);

      // Fade out opacity smoothly over lifecycle
      float alphaFade = 1.0;
      if (vLife > 0.55) {
        alphaFade = smoothstep(1.0, 0.55, vLife);
      } else if (vLife < 0.1) {
        alphaFade = smoothstep(0.0, 0.1, vLife);
      }

      // Mix intense white core into the assigned color halo
      vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), core * 0.85);
      float finalAlpha = clamp((halo * 0.85 + core * 0.8) * alphaFade, 0.0, 1.0);

      gl_FragColor = vec4(finalColor * (1.2 + core * 1.8), finalAlpha);
    }
  `
};

/* ══════════════════════════════════════════════════════════════
   3. GPU PARTICLE SYSTEM (Ring Buffer Engine)
══════════════════════════════════════════════════════════════ */
function ParticleTrailEngine({ isMobile }: { isMobile: boolean }) {
  const maxParticles = isMobile ? MOBILE_MAX_PARTICLES : DESKTOP_MAX_PARTICLES;
  const pointsRef = useRef<THREE.Points>(null!);

  /* ── Pre-allocated Ring Buffer Attributes ── */
  const {
    positions,
    velocities,
    colors,
    sizes,
    ages,
    maxAges,
    seeds,
    geometry,
  } = useMemo(() => {
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const ages = new Float32Array(maxParticles);
    const maxAges = new Float32Array(maxParticles);
    const seeds = new Float32Array(maxParticles);

    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = -9999; // hide inactive offscreen
      positions[i * 3 + 1] = -9999;
      positions[i * 3 + 2] = -9999;
      ages[i] = 999; // inactive
      maxAges[i] = 1.5;
      sizes[i] = 0.3;
      colors[i * 3] = 0; colors[i * 3 + 1] = 0.96; colors[i * 3 + 2] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAge', new THREE.BufferAttribute(ages, 1));
    geo.setAttribute('aMaxAge', new THREE.BufferAttribute(maxAges, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    return { positions, velocities, colors, sizes, ages, maxAges, seeds, geometry: geo };
  }, [maxParticles]);

  /* ── Custom Shader Material ── */
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ParticleShaderMaterial.vertexShader,
      fragmentShader: ParticleShaderMaterial.fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  /* ── State Tracking & Spring Emitter ── */
  const poolIndex = useRef(0);
  const mouseNdc = useRef({ x: 0, y: 0, active: false, lastMoveTime: 0 });
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const emitterPos = useRef(new THREE.Vector3(0, 0, 0));
  const prevEmitterPos = useRef(new THREE.Vector3(0, 0, 0));
  const hasInitialized = useRef(false);
  const spawnFraction = useRef(0);

  /* ── Mouse Listener ── */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseNdc.current = {
        x: ndcX,
        y: ndcY,
        active: true,
        lastMoveTime: performance.now()
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ── Spawn Single Particle Helper ── */
  const spawnParticle = useCallback((pos: THREE.Vector3, velocityBonus: THREE.Vector3) => {
    const idx = poolIndex.current;
    poolIndex.current = (idx + 1) % maxParticles;

    // Assign position with slight organic jitter
    positions[idx * 3]     = pos.x + (Math.random() - 0.5) * 0.12;
    positions[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.12;
    positions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.2; // Z depth variation

    // Randomized explosion velocity + upward drift + inherited cursor velocity
    const angle = Math.random() * TAU;
    const speed = 0.4 + Math.random() * 1.1;
    velocities[idx * 3]     = Math.cos(angle) * speed + velocityBonus.x * 0.3;
    velocities[idx * 3 + 1] = Math.sin(angle) * speed + 0.5 + Math.random() * 0.8 + velocityBonus.y * 0.3;
    velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.8; // depth drift

    // Pick random palette color
    const colorIdx = Math.floor(Math.random() * PARTICLE_COLORS.length);
    const col = PARTICLE_COLORS[colorIdx];
    colors[idx * 3]     = col.r;
    colors[idx * 3 + 1] = col.g;
    colors[idx * 3 + 2] = col.b;

    // Size (between 0.22 and 0.45 world units for high impact)
    sizes[idx] = 0.22 + Math.random() * 0.28;

    // Lifetime (~1.2s to 1.7s)
    ages[idx] = 0.001;
    maxAges[idx] = 1.2 + Math.random() * 0.5;
    seeds[idx] = Math.random() * 100;
  }, [maxParticles, positions, velocities, colors, sizes, ages, maxAges, seeds]);

  /* ── Physics & Render Loop (useFrame) ── */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // cap delta during tab freezes
    const time = state.clock.elapsedTime;
    const { camera, size } = state;

    // Unproject current NDC coordinates inside frame loop to ensure 100% precision
    if (mouseNdc.current.active) {
      const camZ = camera.position.z;
      const fovRad = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
      const viewHeight = 2 * Math.tan(fovRad / 2) * camZ;
      const viewWidth = viewHeight * (size.width / size.height);

      const worldX = (mouseNdc.current.x * viewWidth) / 2;
      const worldY = (mouseNdc.current.y * viewHeight) / 2;
      targetPos.current.set(worldX, worldY, 0);

      if (!hasInitialized.current) {
        emitterPos.current.copy(targetPos.current);
        prevEmitterPos.current.copy(targetPos.current);
        hasInitialized.current = true;
      }
    }

    if (!hasInitialized.current) return;

    /* ── 1. Spring Emitter Position (~50ms delay behind cursor) ── */
    prevEmitterPos.current.copy(emitterPos.current);
    emitterPos.current.lerp(targetPos.current, 1.0 - Math.pow(0.0005, dt)); // ~50ms lag

    /* ── 2. Calculate Cursor Velocity & Dynamic Spawn Rate ── */
    const distMoved = emitterPos.current.distanceTo(prevEmitterPos.current);
    const cursorSpeed = distMoved / dt;
    const velocityBonus = emitterPos.current.clone().sub(prevEmitterPos.current).divideScalar(dt);
    const timeSinceLastMove = performance.now() - mouseNdc.current.lastMoveTime;

    // If mouse moved within last 180ms or speed is active, continuously emit particles
    if (cursorSpeed > 0.05 || timeSinceLastMove < 180) {
      const spawnRate = Math.min(80, 28 + cursorSpeed * 8);
      spawnFraction.current += spawnRate * dt;

      const particlesToSpawn = Math.floor(spawnFraction.current);
      if (particlesToSpawn > 0) {
        spawnFraction.current -= particlesToSpawn;

        for (let i = 0; i < particlesToSpawn; i++) {
          const t = (i + 1) / particlesToSpawn;
          const interpPos = prevEmitterPos.current.clone().lerp(emitterPos.current, t);
          spawnParticle(interpPos, velocityBonus);
        }
      }
    } else {
      spawnFraction.current = 0;
    }

    /* ── 3. Update Existing Active Particles (Zero Allocations) ── */
    let activeCount = 0;
    for (let i = 0; i < maxParticles; i++) {
      if (ages[i] < maxAges[i] && ages[i] > 0) {
        activeCount++;
        ages[i] += dt;

        // Gravity pulls gently downward
        velocities[i * 3 + 1] -= 0.8 * dt;

        // Gentle drag / air resistance
        velocities[i * 3]     *= 0.985;
        velocities[i * 3 + 1] *= 0.985;
        velocities[i * 3 + 2] *= 0.985;

        // Organic 3D turbulence (sinusoidal noise oscillation)
        const seed = seeds[i];
        const turbX = Math.sin(time * 3.0 + seed) * 0.4;
        const turbY = Math.cos(time * 2.5 + seed * 1.3) * 0.4;
        const turbZ = Math.sin(time * 2.0 + seed * 0.7) * 0.3;

        // Apply velocity + turbulence to position
        positions[i * 3]     += (velocities[i * 3]     + turbX) * dt;
        positions[i * 3 + 1] += (velocities[i * 3 + 1] + turbY) * dt;
        positions[i * 3 + 2] += (velocities[i * 3 + 2] + turbZ) * dt;
      } else if (ages[i] >= maxAges[i]) {
        // Retire dead particle offscreen
        ages[i] = 0;
        positions[i * 3]     = -9999;
        positions[i * 3 + 1] = -9999;
        positions[i * 3 + 2] = -9999;
      }
    }

    // Flag ALL buffer attributes for GPU sync so new particles immediately get their color & size!
    if (activeCount > 0 || cursorSpeed > 0.05 || timeSinceLastMove < 180) {
      (geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aAge') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aMaxAge') as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} frustumCulled={false} />
  );
}

/* ══════════════════════════════════════════════════════════════
   4. DEFAULT EXPORT (Canvas Overlay Wrapper)
══════════════════════════════════════════════════════════════ */
export default function CursorParticles() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchOnly, setIsTouchOnly] = useState(false);

  useEffect(() => {
    // Check if device is purely coarse/touch (no mouse)
    if (window.matchMedia('(pointer: coarse)').matches && !('onmousemove' in window)) {
      setIsTouchOnly(true);
      return;
    }
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Do not render on touch-only mobile devices without mouse
  if (isTouchOnly) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9997]" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <ParticleTrailEngine isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
