/* ================================================================
   RobotScene.tsx — R3F Canvas with post-processing
   ================================================================
   Wraps the Robot, Lighting, and Environment in a Canvas with
   Bloom, SSAO, vignette, and adaptive performance.
   ================================================================ */
'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, Preload } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import Robot from './Robot';
import Lighting from './Lighting';
import SceneEnvironment from './SceneEnvironment';
import { getCursorState } from '@/hooks/useCursor';
import { ANIMATION } from '@/lib/constants';
import { lerp } from '@/lib/utils';

const CHROMATIC_OFFSET = new THREE.Vector2(0.0006, 0.0006);

/* ── Animated Camera ─────────────────────────────────────────── */
function AnimatedCamera() {
  const cameraTarget = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cursor = getCursorState();

    // Camera breathing
    const breathY = Math.sin(t * (Math.PI * 2 / ANIMATION.cameraBreathPeriod)) * ANIMATION.cameraBreathAmp;

    // Cursor-responsive subtle tilt
    cameraTarget.current.x = lerp(cameraTarget.current.x, cursor.nx * ANIMATION.cameraTiltMax, ANIMATION.cameraTiltLerp);
    cameraTarget.current.y = lerp(cameraTarget.current.y, cursor.ny * ANIMATION.cameraTiltMax, ANIMATION.cameraTiltLerp);

    state.camera.position.x = cameraTarget.current.x * 0.5;
    state.camera.position.y = 0.3 + breathY + cameraTarget.current.y * 0.3;
    state.camera.lookAt(0, 0.1, 0);
  });

  return null;
}

/* ── Loading Fallback ────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#1a1d2e" wireframe />
    </mesh>
  );
}

/* ── Main Scene Canvas ───────────────────────────────────────── */
export default function RobotScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ pointerEvents: 'none' }}>
      <Canvas
        events={() => ({ priority: 1, enabled: false } as any)}
        frameloop={inView ? 'always' : 'never'}
        camera={{
          position: [0, 0.3, 4.2],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <AdaptiveDpr pixelated />

        <Suspense fallback={<LoadingFallback />}>
          {/* Camera animation system */}
          <AnimatedCamera />

          {/* Cinematic lighting rig */}
          <Lighting />

          {/* Immersive environment */}
          <SceneEnvironment />

          {/* THE ROBOT — the soul of the site */}
          <Robot />

          {/* Post-processing effects */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
            <Vignette
              eskil={false}
              offset={0.15}
              darkness={0.7}
              blendFunction={BlendFunction.NORMAL}
            />
            <ChromaticAberration
              offset={CHROMATIC_OFFSET}
              blendFunction={BlendFunction.NORMAL}
              radialModulation={true}
              modulationOffset={0.5}
            />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
