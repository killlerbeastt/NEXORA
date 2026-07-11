/* ================================================================
   SceneEnvironment.tsx — Immersive Background Environment
   ================================================================
   Floating particles, holographic rings, volumetric fog,
   procedural stars, and animated grid floor.
   ================================================================ */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '@/lib/constants';

/* ── Floating Particles (GPU Instanced) ──────────────────────── */
function FloatingParticles({ count = 300 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate random particle positions and speeds
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 15 - 3,
        speed: 0.1 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        scale: 0.01 + Math.random() * 0.025,
      });
    }
    return data;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.5,
        p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.3,
        p.z
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={COLORS.primary.main}
        emissive={COLORS.primary.main}
        emissiveIntensity={2}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ── Holographic Rings ───────────────────────────────────────── */
function HolographicRings() {
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.15;
      ring1Ref.current.rotation.y = t * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.12;
      ring2Ref.current.rotation.z = t * 0.08;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.1;
      ring3Ref.current.rotation.z = -t * 0.06;
    }
  });

  const ringMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.primary.main,
    emissive: COLORS.primary.main,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  const ringMaterial2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.accent.main,
    emissive: COLORS.accent.main,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  return (
    <group position={[0, 0, -2]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.01, 16, 100]} />
        <primitive object={ringMaterial} attach="material" />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.2, 0.008, 16, 120]} />
        <primitive object={ringMaterial2} attach="material" />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[4.0, 0.006, 16, 140]} />
        <primitive object={ringMaterial} attach="material" />
      </mesh>
    </group>
  );
}

/* ── Main Environment Component ──────────────────────────────── */
export default function SceneEnvironment() {
  return (
    <>
      {/* Deep space stars */}
      <Stars
        radius={50}
        depth={60}
        count={2000}
        factor={3}
        saturation={0.1}
        fade
        speed={0.5}
      />

      {/* Volumetric fog */}
      <fog attach="fog" args={['#050508', 8, 30]} />

      {/* Floating particles */}
      <FloatingParticles count={300} />

      {/* Holographic rings behind robot */}
      <HolographicRings />
    </>
  );
}
