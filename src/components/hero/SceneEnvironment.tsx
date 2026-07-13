/* ================================================================
   SceneEnvironment.tsx — Immersive Background Environment (Enhanced)
   ================================================================
   Multiple rotating rings, orbiting arc meshes, volumetric fog,
   procedural stars, depth layers and floating particles.
   ================================================================ */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '@/lib/constants';

/* ── Floating Particles (GPU Instanced) ──────────────────────── */
function FloatingParticles({ count = 350 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const rng = (seed: number, offset = 0) => ((Math.sin(seed * 9301 + offset * 49297 + 233) * 0.5 + 0.5));
    return Array.from({ length: count }, (_, i) => ({
      x: (rng(i, 0) - 0.5) * 22,
      y: (rng(i, 1) - 0.5) * 14,
      z: (rng(i, 2) - 0.5) * 18 - 3,
      speed: 0.08 + rng(i, 3) * 0.28,
      phase: rng(i, 4) * Math.PI * 2,
      scale: 0.008 + rng(i, 5) * 0.022,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.6,
        p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.35,
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
      <sphereGeometry args={[1, 5, 5]} />
      <meshStandardMaterial
        color={COLORS.primary.main}
        emissive={COLORS.primary.main}
        emissiveIntensity={2.5}
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ── Depth Layer Particles (behind robot, slower) ─────────────── */
function DepthParticles({ count = 120 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const rng = (seed: number, offset = 0) => ((Math.sin(seed * 7919 + offset * 31337 + 127) * 0.5 + 0.5));
    return Array.from({ length: count }, (_, i) => ({
      x: (rng(i, 10) - 0.5) * 16,
      y: (rng(i, 11) - 0.5) * 10,
      z: -4 - rng(i, 12) * 8,
      speed: 0.03 + rng(i, 13) * 0.08,
      phase: rng(i, 14) * Math.PI * 2,
      scale: 0.02 + rng(i, 15) * 0.06,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.8,
        p.y + Math.cos(t * p.speed * 0.5 + p.phase) * 0.5,
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
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial
        color={COLORS.accent.main}
        emissive={COLORS.accent.main}
        emissiveIntensity={1.5}
        transparent
        opacity={0.25}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ── Multi-Layer Holographic Rings ────────────────────────────── */
function HolographicRings() {
  const refs = [
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
  ];

  const cyanMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.primary.main,
    emissive: COLORS.primary.main,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  const violetMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.accent.main,
    emissive: COLORS.accent.main,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  const amberMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.secondary.main,
    emissive: COLORS.secondary.main,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (refs[0].current) { refs[0].current.rotation.x = t * 0.14; refs[0].current.rotation.y = t * 0.09; }
    if (refs[1].current) { refs[1].current.rotation.x = -t * 0.11; refs[1].current.rotation.z = t * 0.07; }
    if (refs[2].current) { refs[2].current.rotation.y = t * 0.08; refs[2].current.rotation.z = -t * 0.05; }
    if (refs[3].current) { refs[3].current.rotation.x = t * 0.06; refs[3].current.rotation.y = -t * 0.12; }
    if (refs[4].current) { refs[4].current.rotation.z = t * 0.04; refs[4].current.rotation.x = -t * 0.07; }
  });

  return (
    <group position={[0, 0.2, -2.5]}>
      {/* Core rings */}
      <mesh ref={refs[0]}>
        <torusGeometry args={[2.2, 0.012, 16, 100]} />
        <primitive object={cyanMat} attach="material" />
      </mesh>
      <mesh ref={refs[1]}>
        <torusGeometry args={[3.0, 0.008, 16, 120]} />
        <primitive object={violetMat} attach="material" />
      </mesh>
      <mesh ref={refs[2]}>
        <torusGeometry args={[3.8, 0.006, 16, 140]} />
        <primitive object={cyanMat} attach="material" />
      </mesh>
      {/* Outer accent rings */}
      <mesh ref={refs[3]}>
        <torusGeometry args={[4.8, 0.004, 12, 160]} />
        <primitive object={amberMat} attach="material" />
      </mesh>
      <mesh ref={refs[4]}>
        <torusGeometry args={[5.8, 0.003, 12, 180]} />
        <primitive object={violetMat} attach="material" />
      </mesh>
    </group>
  );
}

/* ── Orbiting Glowing Arcs ────────────────────────────────────── */
function OrbitingArcs() {
  const groupRef = useRef<THREE.Group>(null!);
  const arc1 = useRef<THREE.Mesh>(null!);
  const arc2 = useRef<THREE.Mesh>(null!);
  const arc3 = useRef<THREE.Mesh>(null!);

  const arcMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.primary.main,
    emissive: COLORS.primary.main,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.18,
    toneMapped: false,
  }), []);

  const arcMat2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.accent.main,
    emissive: COLORS.accent.main,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.14,
    toneMapped: false,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.05;
    if (arc1.current) arc1.current.rotation.z = t * 0.3;
    if (arc2.current) arc2.current.rotation.z = -t * 0.2;
    if (arc3.current) arc3.current.rotation.x = t * 0.25;
  });

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      <mesh ref={arc1}>
        <torusGeometry args={[1.6, 0.015, 8, 60, Math.PI * 0.6]} />
        <primitive object={arcMat} attach="material" />
      </mesh>
      <mesh ref={arc2} rotation={[0, Math.PI * 0.7, 0]}>
        <torusGeometry args={[2.1, 0.012, 8, 60, Math.PI * 0.5]} />
        <primitive object={arcMat2} attach="material" />
      </mesh>
      <mesh ref={arc3} rotation={[Math.PI * 0.4, 0, Math.PI * 0.3]}>
        <torusGeometry args={[2.6, 0.008, 8, 60, Math.PI * 0.7]} />
        <primitive object={arcMat} attach="material" />
      </mesh>
    </group>
  );
}

/* ── Main Environment Component ──────────────────────────────── */
export default function SceneEnvironment() {
  return (
    <>
      {/* Deep space stars — dual layers for parallax */}
      <Stars radius={60} depth={80} count={2500} factor={3} saturation={0.1} fade speed={0.4} />
      <Stars radius={25} depth={30} count={800} factor={1.5} saturation={0.2} fade speed={0.8} />

      {/* Volumetric fog */}
      <fog attach="fog" args={['#050508', 10, 35]} />

      {/* Foreground floating particles */}
      <FloatingParticles count={350} />

      {/* Deep background depth particles */}
      <DepthParticles count={120} />

      {/* Multi-layer rotating rings */}
      <HolographicRings />

      {/* Orbiting glowing arc segments */}
      <OrbitingArcs />
    </>
  );
}
