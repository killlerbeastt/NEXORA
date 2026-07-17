/* ================================================================
   CursorParticles.tsx (<CursorParticle /> Component)
   ================================================================
   A premium, high-performance 3D particle effect that follows the cursor
   smoothly, matching the exact specifications of the 3D Particle Cursor
   prompt and preview thumbnails.

   Behavior & Interactive States:
   - Smooth Follow: follows the pointer with a cinematic energy trail.
   - Fast Movement: particles stretch into longer trails and scatter wider.
   - Slow Movement: particles tighten and flow smoothly in a concentrated stream.
   - Stop (Idle/Orbit): when cursor stops, particles transition into an orbiting
     ring around the stationary mouse position.
   - Click (Burst): left click triggers a circular explosion burst where particles
     fly outward in 3D space and fade.
   - 3D Depth: particles oscillate along Z-axis (some closer, some farther).
   - Configurable props: particleCount, trailLength, particleSize, colors,
     glowIntensity, orbitRadius, burstStrength, speedSensitivity.
   ================================================================ */
'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TAU = Math.PI * 2;

export interface CursorParticleProps {
  particleCount?: number;       // default 1000 (desktop) / 300 (mobile)
  trailLength?: number;         // trail stretch factor (default 1.0)
  particleSize?: number;        // base size multiplier (default 1.0)
  colors?: string[];            // custom hex palette or default neon cyan -> purple
  glowIntensity?: number;       // glow boost (default 1.2)
  orbitRadius?: number;         // idle ring radius (default 0.55)
  burstStrength?: number;       // click explosion velocity (default 4.5)
  speedSensitivity?: number;    // speed response (default 1.0)
  className?: string;
}

/* ══════════════════════════════════════════════════════════════
   1. DEFAULT COLOR PALETTE (Electric Cyan -> Purple Gradient)
══════════════════════════════════════════════════════════════ */
const DEFAULT_PALETTE = [
  '#00F5FF', // Electric Cyan
  '#1060FF', // Neon Blue
  '#8B00FF', // Violet
  '#C040FF', // Purple
  '#FFFFFF', // Bright Energy Core Highlight
];

/* ══════════════════════════════════════════════════════════════
   2. VOLUMETRIC GLOWING ORB SHADER (Additive Blending)
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

      // Birth pop (0 -> 12%), smooth plateau, fade out (12% -> 100%)
      float scaleCurve = 1.0;
      if (vLife < 0.12) {
        scaleCurve = smoothstep(0.0, 0.12, vLife);
      } else {
        scaleCurve = smoothstep(1.0, 0.12, vLife);
      }

      gl_PointSize = (aSize * scaleCurve * 1150.0) / max(0.1, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vLife;
    varying float vSeed;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord) * 2.0;

      if (dist > 1.0) discard;

      // Volumetric core + soft additive halo
      float core = pow(clamp(1.0 - dist, 0.0, 1.0), 3.2);
      float halo = pow(clamp(1.0 - dist, 0.0, 1.0), 1.4);

      float alphaFade = 1.0;
      if (vLife > 0.5) {
        alphaFade = smoothstep(1.0, 0.5, vLife);
      } else if (vLife < 0.08) {
        alphaFade = smoothstep(0.0, 0.08, vLife);
      }

      vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), core * 0.85);
      float finalAlpha = clamp((halo * 0.9 + core * 0.8) * alphaFade, 0.0, 1.0);

      gl_FragColor = vec4(finalColor * (1.2 + core * 2.0), finalAlpha);
    }
  `
};

/* ══════════════════════════════════════════════════════════════
   3. PARTICLE ENGINE (Ring Buffer + Orbit + Burst Physics)
══════════════════════════════════════════════════════════════ */
interface EngineProps extends CursorParticleProps {
  isMobile: boolean;
}

function ParticleTrailEngine({
  isMobile,
  particleCount,
  trailLength = 1.0,
  particleSize = 1.0,
  colors = DEFAULT_PALETTE,
  orbitRadius = 0.55,
  burstStrength = 4.5,
  speedSensitivity = 1.0,
}: EngineProps) {
  const maxParticles = useMemo(() => {
    if (particleCount) return particleCount;
    return isMobile ? 300 : 1000;
  }, [particleCount, isMobile]);

  const pointsRef = useRef<THREE.Points>(null!);
  const poolIndex = useRef(0);
  const mouseNdc = useRef({ x: 0, y: 0, active: false, lastMoveTime: 0 });
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const emitterPos = useRef(new THREE.Vector3(0, 0, 0));
  const prevEmitterPos = useRef(new THREE.Vector3(0, 0, 0));
  const hasInitialized = useRef(false);
  const spawnFraction = useRef(0);

  // Pre-parse Three.js Color objects from hex strings
  const colorObjects = useMemo(() => {
    return colors.map(c => new THREE.Color(c));
  }, [colors]);

  /* ── Ring Buffer Attributes ── */
  const {
    positions, velocities, colorsArr, sizes, ages, maxAges, seeds, modes, geometry,
  } = useMemo(() => {
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const colorsArr = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const ages = new Float32Array(maxParticles);
    const maxAges = new Float32Array(maxParticles);
    const seeds = new Float32Array(maxParticles);
    const modes = new Uint8Array(maxParticles); // 0 = trail, 1 = orbit, 2 = burst

    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = -9999; positions[i * 3 + 1] = -9999; positions[i * 3 + 2] = -9999;
      ages[i] = 999; maxAges[i] = 1.5; sizes[i] = 0.3;
      colorsArr[i * 3] = 0; colorsArr[i * 3 + 1] = 0.96; colorsArr[i * 3 + 2] = 1;
      modes[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colorsArr, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAge', new THREE.BufferAttribute(ages, 1));
    geo.setAttribute('aMaxAge', new THREE.BufferAttribute(maxAges, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    return { positions, velocities, colorsArr, sizes, ages, maxAges, seeds, modes, geometry: geo };
  }, [maxParticles]);

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

  /* ── Spawn Single Particle Helper ── */
  const spawnParticle = useCallback((
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    mode: number, // 0 = trail, 1 = orbit, 2 = burst
    sizeMultiplier: number = 1.0,
    lifeMultiplier: number = 1.0
  ) => {
    const idx = poolIndex.current;
    poolIndex.current = (idx + 1) % maxParticles;

    modes[idx] = mode;
    positions[idx * 3]     = pos.x;
    positions[idx * 3 + 1] = pos.y;
    positions[idx * 3 + 2] = pos.z;

    velocities[idx * 3]     = vel.x;
    velocities[idx * 3 + 1] = vel.y;
    velocities[idx * 3 + 2] = vel.z;

    const col = colorObjects[Math.floor(Math.random() * colorObjects.length)];
    colorsArr[idx * 3]     = col.r;
    colorsArr[idx * 3 + 1] = col.g;
    colorsArr[idx * 3 + 2] = col.b;

    sizes[idx] = (0.2 + Math.random() * 0.28) * particleSize * sizeMultiplier;
    ages[idx] = 0.001;
    maxAges[idx] = (1.1 + Math.random() * 0.6) * lifeMultiplier;
    seeds[idx] = Math.random() * 100;
  }, [maxParticles, positions, velocities, colorObjects, colorsArr, sizes, ages, maxAges, seeds, modes, particleSize]);

  /* ── Event Listeners (Move + Click Explosion) ── */
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

    const handlePointerDown = () => {
      if (!mouseNdc.current.active) return;
      // Trigger Circular 3D Explosion Burst (~70 particles)
      const burstCount = Math.min(80, Math.floor(maxParticles * 0.22));
      for (let i = 0; i < burstCount; i++) {
        const a = Math.random() * TAU;
        const elev = (Math.random() - 0.5) * Math.PI * 0.6;
        const sp = (2.2 + Math.random() * 3.8) * burstStrength * 0.35;

        const vx = Math.cos(a) * Math.cos(elev) * sp;
        const vy = Math.sin(a) * Math.cos(elev) * sp;
        const vz = Math.sin(elev) * sp * 0.6;

        const jitterPos = emitterPos.current.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        ));

        spawnParticle(jitterPos, new THREE.Vector3(vx, vy, vz), 2, 1.4, 1.25);
      }
      (geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aMaxAge') as THREE.BufferAttribute).needsUpdate = true;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [maxParticles, burstStrength, spawnParticle, geometry]);

  /* ── Physics & Render Loop (useFrame) ── */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const { camera, size } = state;

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

    /* 1. Spring Emitter Position */
    prevEmitterPos.current.copy(emitterPos.current);
    emitterPos.current.lerp(targetPos.current, 1.0 - Math.pow(0.0005, dt));

    /* 2. Calculate Velocity & Dynamic Spawn/Orbit Modes */
    const distMoved = emitterPos.current.distanceTo(prevEmitterPos.current);
    const cursorSpeed = (distMoved / dt) * speedSensitivity;
    const velocityBonus = emitterPos.current.clone().sub(prevEmitterPos.current).divideScalar(dt);
    const timeSinceLastMove = performance.now() - mouseNdc.current.lastMoveTime;

    const isIdle = timeSinceLastMove > 130 && cursorSpeed < 0.12;

    if (!isIdle) {
      // ── TRAIL & FAST MOVEMENT SCATTER ──
      // Fast movement = higher spawn rate + longer trail spread + wider scatter
      const scatterFactor = Math.min(2.5, 1.0 + cursorSpeed * 0.4) * trailLength;
      const spawnRate = Math.min(95, 30 + cursorSpeed * 10);
      spawnFraction.current += spawnRate * dt;

      const toSpawn = Math.floor(spawnFraction.current);
      if (toSpawn > 0) {
        spawnFraction.current -= toSpawn;
        for (let i = 0; i < toSpawn; i++) {
          const t = (i + 1) / toSpawn;
          const interpPos = prevEmitterPos.current.clone().lerp(emitterPos.current, t);

          // Scatter sideways based on speed
          const angle = Math.random() * TAU;
          const spread = 0.3 + Math.random() * 0.8 * scatterFactor;
          const vx = Math.cos(angle) * spread + velocityBonus.x * 0.25;
          const vy = Math.sin(angle) * spread + velocityBonus.y * 0.25 + 0.3;
          const vz = (Math.random() - 0.5) * 0.9 * scatterFactor;

          interpPos.add(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2));
          spawnParticle(interpPos, new THREE.Vector3(vx, vy, vz), 0, 1.0, 1.0);
        }
        (geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
        (geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
        (geometry.getAttribute('aMaxAge') as THREE.BufferAttribute).needsUpdate = true;
      }
    } else {
      // ── IDLE / ORBIT RING AROUND CURSOR ──
      // Spawn gentle orbiting particles right around cursor position
      spawnFraction.current += 16 * dt;
      const toSpawn = Math.floor(spawnFraction.current);
      if (toSpawn > 0) {
        spawnFraction.current -= toSpawn;
        for (let i = 0; i < toSpawn; i++) {
          const angle = Math.random() * TAU;
          const r = orbitRadius * (0.8 + Math.random() * 0.4);
          const ox = emitterPos.current.x + Math.cos(angle) * r;
          const oy = emitterPos.current.y + Math.sin(angle) * r;
          const oz = (Math.random() - 0.5) * 0.6;

          // Tangential orbit velocity
          const vx = -Math.sin(angle) * 1.2;
          const vy = Math.cos(angle) * 1.2;
          const vz = (Math.random() - 0.5) * 0.3;

          spawnParticle(new THREE.Vector3(ox, oy, oz), new THREE.Vector3(vx, vy, vz), 1, 0.9, 1.4);
        }
        (geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
        (geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
        (geometry.getAttribute('aMaxAge') as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    /* 3. Update Active Particles Physics */
    let activeCount = 0;
    for (let i = 0; i < maxParticles; i++) {
      if (ages[i] < maxAges[i] && ages[i] > 0) {
        activeCount++;
        ages[i] += dt;

        const mode = modes[i];
        const seed = seeds[i];

        if (mode === 0) {
          // Trail: gentle drag + organic turbulence + slight upward buoyancy
          velocities[i * 3]     *= 0.98;
          velocities[i * 3 + 1] *= 0.98;
          velocities[i * 3 + 2] *= 0.98;
          velocities[i * 3 + 1] += 0.3 * dt; // buoyant flow

          positions[i * 3]     += (velocities[i * 3]     + Math.sin(time * 3 + seed) * 0.35) * dt;
          positions[i * 3 + 1] += (velocities[i * 3 + 1] + Math.cos(time * 2.5 + seed * 1.2) * 0.35) * dt;
          positions[i * 3 + 2] += (velocities[i * 3 + 2] + Math.sin(time * 2 + seed * 0.8) * 0.25) * dt;
        } else if (mode === 1) {
          // Orbit: centripetal attraction toward cursor + tangential rotation
          const dx = positions[i * 3]     - emitterPos.current.x;
          const dy = positions[i * 3 + 1] - emitterPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const angle = Math.atan2(dy, dx);

          // Pull toward target orbit radius while spinning
          const targetR = orbitRadius;
          const pull = (targetR - dist) * 3.5;
          velocities[i * 3]     += (Math.cos(angle) * pull - Math.sin(angle) * 2.8) * dt;
          velocities[i * 3 + 1] += (Math.sin(angle) * pull + Math.cos(angle) * 2.8) * dt;
          velocities[i * 3]     *= 0.95;
          velocities[i * 3 + 1] *= 0.95;

          positions[i * 3]     += velocities[i * 3] * dt;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += Math.sin(time * 2 + seed) * 0.15 * dt;
        } else if (mode === 2) {
          // Burst: fast initial expansion + drag + gravity fade
          velocities[i * 3]     *= 0.96;
          velocities[i * 3 + 1] *= 0.96;
          velocities[i * 3 + 2] *= 0.96;
          velocities[i * 3 + 1] -= 1.2 * dt; // slight downward gravity on explosion debris

          positions[i * 3]     += velocities[i * 3] * dt;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
        }
      } else if (ages[i] >= maxAges[i]) {
        ages[i] = 0;
        positions[i * 3] = -9999; positions[i * 3 + 1] = -9999; positions[i * 3 + 2] = -9999;
      }
    }

    if (activeCount > 0 || !isIdle) {
      (geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aAge') as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} frustumCulled={false} />
  );
}

/* ══════════════════════════════════════════════════════════════
   4. DEFAULT EXPORT (Canvas Overlay Wrapper)
══════════════════════════════════════════════════════════════ */
export function CursorParticles(props: CursorParticleProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchOnly, setIsTouchOnly] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches && !('onmousemove' in window)) {
      setIsTouchOnly(true);
      return;
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleVisibilityChange = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isTouchOnly) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9997] ${props.className || ''}`} style={{ touchAction: 'none' }}>
      <Canvas
        frameloop={isVisible ? 'always' : 'never'}
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <ParticleTrailEngine isMobile={isMobile} {...props} />
      </Canvas>
    </div>
  );
}

export { CursorParticles as CursorParticle };
export default CursorParticles;
