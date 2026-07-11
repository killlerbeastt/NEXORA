/* ================================================================
   Lighting.tsx — Cinematic PBR Lighting Rig
   ================================================================
   Studio-grade multi-light setup with HDRI reflections,
   contact shadows, and dramatic rim lighting.
   ================================================================ */
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export default function Lighting() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null!);
  const rimLightRef = useRef<THREE.SpotLight>(null!);

  // Subtle light animation
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (keyLightRef.current) {
      keyLightRef.current.intensity = 1.4 + Math.sin(t * 0.3) * 0.1;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = 2.5 + Math.sin(t * 0.5 + 1) * 0.3;
    }
  });

  return (
    <>
      {/* HDRI Environment for realistic reflections */}
      <Environment preset="studio" environmentIntensity={0.3} />

      {/* Ambient fill — very low to keep drama */}
      <ambientLight intensity={0.15} color="#1a1a3a" />

      {/* Key light — warm white from upper right */}
      <directionalLight
        ref={keyLightRef}
        position={[4, 5, 3]}
        intensity={1.4}
        color="#FFF5E8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-near={0.1}
        shadow-bias={-0.001}
      />

      {/* Fill light — cooler, from lower left */}
      <directionalLight
        position={[-3, -1, 2]}
        intensity={0.5}
        color="#6EA8D4"
      />

      {/* Rim light — bright backlight for edge glow */}
      <spotLight
        ref={rimLightRef}
        position={[0, 3, -4]}
        intensity={2.5}
        color="#00F0FF"
        angle={0.6}
        penumbra={0.8}
        castShadow={false}
      />

      {/* Eye spot — focused on the robot's face */}
      <spotLight
        position={[0, 1.5, 5]}
        intensity={0.8}
        color="#FFFFFF"
        angle={0.3}
        penumbra={0.5}
        target-position={[0, 0.75, 0]}
      />

      {/* Accent light — amber from below for warmth */}
      <pointLight
        position={[0, -2, 2]}
        intensity={0.4}
        color="#FFB347"
        distance={8}
        decay={2}
      />

      {/* Contact shadows on the ground plane */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.5}
        scale={8}
        blur={2.5}
        far={3}
        color="#000010"
      />
    </>
  );
}
