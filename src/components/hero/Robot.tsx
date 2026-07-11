/* ================================================================
   Robot.tsx — Procedural 3D Robot Mascot
   ================================================================
   Built entirely from R3F primitives (boxes, spheres, cylinders).
   Stylized geometric design — Astro Bot meets Portal's Atlas.
   
   Features:
   - Natural breathing (torso Y-scale sine oscillation)
   - Floating motion (Y-position sine)
   - Idle sway (Z-rotation)
   - Cursor head tracking (yaw + pitch LERP)
   - Independent eye tracking
   - Randomized blinking
   - Click reactions (head tilt + body recoil)
   - Extended idle animations (scanning, neck stretch)
   ================================================================ */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCursorState } from '@/hooks/useCursor';
import { ANIMATION, COLORS } from '@/lib/constants';
import { lerp, clamp, randomRange } from '@/lib/utils';

/* ── Material definitions (created once, reused) ────────────── */
function useRobotMaterials() {
  return useMemo(() => ({
    body: new THREE.MeshStandardMaterial({
      color: COLORS.robot.body,
      metalness: 0.7,
      roughness: 0.3,
    }),
    bodyLight: new THREE.MeshStandardMaterial({
      color: COLORS.robot.bodyLight,
      metalness: 0.6,
      roughness: 0.35,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: COLORS.robot.metal,
      metalness: 0.85,
      roughness: 0.2,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: COLORS.robot.joint,
      metalness: 0.5,
      roughness: 0.4,
    }),
    eyeGlow: new THREE.MeshStandardMaterial({
      color: COLORS.robot.eye,
      emissive: COLORS.robot.eye,
      emissiveIntensity: 2.5,
      toneMapped: false,
    }),
    eyeInner: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 4,
      toneMapped: false,
    }),
    accentAmber: new THREE.MeshStandardMaterial({
      color: COLORS.secondary.main,
      emissive: COLORS.secondary.main,
      emissiveIntensity: 1.2,
      toneMapped: false,
    }),
    accentCyan: new THREE.MeshStandardMaterial({
      color: COLORS.primary.main,
      emissive: COLORS.primary.main,
      emissiveIntensity: 0.8,
      toneMapped: false,
    }),
    visor: new THREE.MeshPhysicalMaterial({
      color: '#0A1020',
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.7,
      envMapIntensity: 2.0,
    }),
    antenna: new THREE.MeshStandardMaterial({
      color: COLORS.robot.metal,
      metalness: 0.9,
      roughness: 0.15,
    }),
  }), []);
}

/* ── Animation state (mutable refs for 60fps updates) ──────── */
interface AnimState {
  // Blink
  blinkTimer: number;
  nextBlinkAt: number;
  isBlinking: boolean;
  blinkProgress: number;

  // Head tracking
  headYaw: number;
  headPitch: number;
  targetHeadYaw: number;
  targetHeadPitch: number;

  // Eye tracking (small offset within visor)
  eyeOffsetX: number;
  eyeOffsetY: number;

  // Click reaction
  clickRecoil: number;
  clickHeadTilt: number;
  eyeFlash: number;

  // Idle
  idleTimer: number;
  idleAction: 'none' | 'scanLeft' | 'scanRight' | 'neckStretch' | 'shoulderRoll';
  idleProgress: number;

  // Finger wiggle
  fingerTimer: number;
}

export default function Robot() {
  const materials = useRobotMaterials();

  // Group refs for animated parts
  const rootRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const torsoRef = useRef<THREE.Mesh>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const leftEyeRef = useRef<THREE.Mesh>(null!);
  const rightEyeRef = useRef<THREE.Mesh>(null!);
  const leftEyeInnerRef = useRef<THREE.Mesh>(null!);
  const rightEyeInnerRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftHandRef = useRef<THREE.Group>(null!);
  const rightHandRef = useRef<THREE.Group>(null!);
  const antennaRef = useRef<THREE.Mesh>(null!);

  // Mutable animation state
  const anim = useRef<AnimState>({
    blinkTimer: 0,
    nextBlinkAt: randomRange(ANIMATION.blinkInterval[0], ANIMATION.blinkInterval[1]),
    isBlinking: false,
    blinkProgress: 0,
    headYaw: 0,
    headPitch: 0,
    targetHeadYaw: 0,
    targetHeadPitch: 0,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    clickRecoil: 0,
    clickHeadTilt: 0,
    eyeFlash: 0,
    idleTimer: 0,
    idleAction: 'none',
    idleProgress: 0,
    fingerTimer: 0,
  });

  // Click handler
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const handleClick = (e: MouseEvent) => {
      const a = anim.current;
      a.clickRecoil = 1.0;
      a.clickHeadTilt = 1.0;
      a.eyeFlash = 1.0;
      a.idleTimer = 0; // Reset idle counter
      // Aim head toward click
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      a.targetHeadYaw = nx * ANIMATION.headYawMax * 1.5;
      a.targetHeadPitch = ny * ANIMATION.headPitchMax * 1.5;
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /* ── Main animation loop (runs every frame) ────────────────── */
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const a = anim.current;
    const cursor = getCursorState();

    if (!rootRef.current) return;

    // ── 1. Floating motion ──────────────────────────────────
    rootRef.current.position.y = Math.sin(t * (Math.PI * 2 / ANIMATION.floatPeriod)) * ANIMATION.floatAmplitude;

    // ── 2. Idle sway ────────────────────────────────────────
    rootRef.current.rotation.z = Math.sin(t * (Math.PI * 2 / ANIMATION.swayPeriod)) * ANIMATION.swayAmplitude;

    // ── 3. Breathing (torso Y-scale) ────────────────────────
    if (torsoRef.current) {
      const breathScale = 1 + Math.sin(t * (Math.PI * 2 / ANIMATION.breathPeriod)) * ANIMATION.breathAmplitude;
      torsoRef.current.scale.y = breathScale;
    }

    // ── 4. Head tracking toward cursor ──────────────────────
    if (cursor.isMoving || Date.now() - cursor.lastMoveTime < 2000) {
      a.targetHeadYaw = clamp(cursor.nx * ANIMATION.headYawMax, -ANIMATION.headYawMax, ANIMATION.headYawMax);
      a.targetHeadPitch = clamp(cursor.ny * ANIMATION.headPitchMax, -ANIMATION.headPitchMax, ANIMATION.headPitchMax);
      a.idleTimer = 0;
    }

    // LERP head rotation
    a.headYaw = lerp(a.headYaw, a.targetHeadYaw, ANIMATION.headTrackLerp);
    a.headPitch = lerp(a.headPitch, a.targetHeadPitch, ANIMATION.headTrackLerp);

    if (headRef.current) {
      headRef.current.rotation.y = a.headYaw;
      headRef.current.rotation.x = a.headPitch;
    }

    // ── 5. Eye tracking (independent small offset) ──────────
    const targetEyeX = clamp(cursor.nx * 0.04, -0.04, 0.04);
    const targetEyeY = clamp(cursor.ny * 0.025, -0.025, 0.025);
    a.eyeOffsetX = lerp(a.eyeOffsetX, targetEyeX, 0.08);
    a.eyeOffsetY = lerp(a.eyeOffsetY, targetEyeY, 0.08);

    // Apply to eye meshes
    [leftEyeRef, rightEyeRef, leftEyeInnerRef, rightEyeInnerRef].forEach(ref => {
      if (ref.current) {
        ref.current.position.x = ref.current.userData.baseX + a.eyeOffsetX;
        ref.current.position.y = ref.current.userData.baseY + a.eyeOffsetY;
      }
    });

    // ── 6. Blinking ─────────────────────────────────────────
    a.blinkTimer += delta;
    if (!a.isBlinking && a.blinkTimer >= a.nextBlinkAt) {
      a.isBlinking = true;
      a.blinkProgress = 0;
    }
    if (a.isBlinking) {
      a.blinkProgress += delta / ANIMATION.blinkDuration;
      if (a.blinkProgress >= 1) {
        a.isBlinking = false;
        a.blinkTimer = 0;
        a.nextBlinkAt = randomRange(ANIMATION.blinkInterval[0], ANIMATION.blinkInterval[1]);
      }
      // Scale eyes on Y: goes to 0 at midpoint, back to 1
      const blinkScale = a.blinkProgress < 0.5
        ? 1 - (a.blinkProgress * 2)
        : (a.blinkProgress - 0.5) * 2;

      [leftEyeRef, rightEyeRef, leftEyeInnerRef, rightEyeInnerRef].forEach(ref => {
        if (ref.current) ref.current.scale.y = Math.max(0.05, blinkScale);
      });
    }

    // ── 7. Click reaction decay ─────────────────────────────
    if (a.clickRecoil > 0.01) {
      a.clickRecoil *= 0.92;
      if (bodyRef.current) {
        bodyRef.current.position.z = -a.clickRecoil * 0.08;
      }
    }
    if (a.clickHeadTilt > 0.01) {
      a.clickHeadTilt *= 0.94;
      if (headRef.current) {
        headRef.current.rotation.z = Math.sin(t * 15) * a.clickHeadTilt * 0.1;
      }
    }
    if (a.eyeFlash > 0.01) {
      a.eyeFlash *= 0.9;
      materials.eyeGlow.emissiveIntensity = 2.5 + a.eyeFlash * 5;
      materials.eyeInner.emissiveIntensity = 4 + a.eyeFlash * 8;
    } else {
      materials.eyeGlow.emissiveIntensity = 2.5;
      materials.eyeInner.emissiveIntensity = 4;
    }

    // ── 8. Extended idle animations ─────────────────────────
    a.idleTimer += delta;
    if (a.idleTimer > ANIMATION.idleDelay && a.idleAction === 'none') {
      const actions: AnimState['idleAction'][] = ['scanLeft', 'scanRight', 'neckStretch', 'shoulderRoll'];
      a.idleAction = actions[Math.floor(Math.random() * actions.length)];
      a.idleProgress = 0;
    }

    if (a.idleAction !== 'none') {
      a.idleProgress += delta * 0.5;

      switch (a.idleAction) {
        case 'scanLeft':
          a.targetHeadYaw = Math.sin(a.idleProgress * Math.PI) * -ANIMATION.headYawMax * 0.8;
          break;
        case 'scanRight':
          a.targetHeadYaw = Math.sin(a.idleProgress * Math.PI) * ANIMATION.headYawMax * 0.8;
          break;
        case 'neckStretch':
          a.targetHeadPitch = Math.sin(a.idleProgress * Math.PI) * ANIMATION.headPitchMax;
          break;
        case 'shoulderRoll':
          if (leftArmRef.current) {
            leftArmRef.current.rotation.z = Math.sin(a.idleProgress * Math.PI * 2) * 0.15;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.z = -Math.sin(a.idleProgress * Math.PI * 2) * 0.15;
          }
          break;
      }

      if (a.idleProgress >= 1) {
        a.idleAction = 'none';
        a.idleTimer = 0;
      }
    }

    // ── 9. Finger wiggle ────────────────────────────────────
    a.fingerTimer += delta;
    if (leftHandRef.current) {
      leftHandRef.current.rotation.x = Math.sin(a.fingerTimer * 1.5) * 0.08;
    }
    if (rightHandRef.current) {
      rightHandRef.current.rotation.x = Math.sin(a.fingerTimer * 1.8 + 1) * 0.08;
    }

    // ── 10. Antenna bob ─────────────────────────────────────
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(t * 2) * 0.05;
      antennaRef.current.rotation.x = Math.sin(t * 1.5 + 0.5) * 0.03;
    }
  });

  /* ── Geometry definitions ──────────────────────────────────── */
  const headGeo = useMemo(() => new THREE.BoxGeometry(0.7, 0.55, 0.55, 4, 4, 4), []);
  const torsoGeo = useMemo(() => new THREE.BoxGeometry(0.65, 0.7, 0.4, 3, 3, 3), []);
  const shoulderGeo = useMemo(() => new THREE.SphereGeometry(0.12, 16, 16), []);
  const armGeo = useMemo(() => new THREE.CylinderGeometry(0.065, 0.055, 0.35, 12), []);
  const elbowGeo = useMemo(() => new THREE.SphereGeometry(0.07, 12, 12), []);
  const forearmGeo = useMemo(() => new THREE.CylinderGeometry(0.055, 0.05, 0.3, 12), []);
  const handGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.08, 0.08, 2, 2, 2), []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.08, 16, 12), []);
  const eyeInnerGeo = useMemo(() => new THREE.SphereGeometry(0.04, 12, 8), []);
  const visorGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.22, 0.08), []);
  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), []);
  const antennaStickGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), []);
  const antennaTipGeo = useMemo(() => new THREE.SphereGeometry(0.04, 12, 8), []);
  const legGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.08, 0.25, 10), []);
  const footGeo = useMemo(() => new THREE.BoxGeometry(0.15, 0.06, 0.18, 2, 2, 2), []);
  const accentStripGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.03, 0.42), []);
  const chestPanelGeo = useMemo(() => new THREE.BoxGeometry(0.3, 0.2, 0.02), []);

  /* Eye base positions (stored in userData for tracking offset) */
  const leftEyeBaseX = -0.15;
  const rightEyeBaseX = 0.15;
  const eyeBaseY = 0.05;

  return (
    <group ref={rootRef} position={[0, 0, 0]}>
      <group ref={bodyRef}>

        {/* ── NECK ──────────────────────────────────────────── */}
        <mesh geometry={neckGeo} material={materials.joint} position={[0, 0.41, 0]} />

        {/* ── HEAD ──────────────────────────────────────────── */}
        <group ref={headRef} position={[0, 0.75, 0]}>
          {/* Head box */}
          <mesh geometry={headGeo} material={materials.body}>
            {/* Rounded edges via slight scale on a smoothed geometry */}
          </mesh>

          {/* Visor (glass panel across eyes) */}
          <mesh geometry={visorGeo} material={materials.visor} position={[0, 0, 0.26]} />

          {/* Left Eye (outer glow) */}
          <mesh
            ref={leftEyeRef}
            geometry={eyeGeo}
            material={materials.eyeGlow}
            position={[leftEyeBaseX, eyeBaseY, 0.27]}
            userData={{ baseX: leftEyeBaseX, baseY: eyeBaseY }}
          />
          {/* Left Eye (inner bright) */}
          <mesh
            ref={leftEyeInnerRef}
            geometry={eyeInnerGeo}
            material={materials.eyeInner}
            position={[leftEyeBaseX, eyeBaseY, 0.3]}
            userData={{ baseX: leftEyeBaseX, baseY: eyeBaseY }}
          />

          {/* Right Eye (outer glow) */}
          <mesh
            ref={rightEyeRef}
            geometry={eyeGeo}
            material={materials.eyeGlow}
            position={[rightEyeBaseX, eyeBaseY, 0.27]}
            userData={{ baseX: rightEyeBaseX, baseY: eyeBaseY }}
          />
          {/* Right Eye (inner bright) */}
          <mesh
            ref={rightEyeInnerRef}
            geometry={eyeInnerGeo}
            material={materials.eyeInner}
            position={[rightEyeBaseX, eyeBaseY, 0.3]}
            userData={{ baseX: rightEyeBaseX, baseY: eyeBaseY }}
          />

          {/* Antenna */}
          <group ref={antennaRef} position={[0, 0.32, 0]}>
            <mesh geometry={antennaStickGeo} material={materials.antenna} position={[0, 0.1, 0]} />
            <mesh geometry={antennaTipGeo} material={materials.accentCyan} position={[0, 0.22, 0]} />
          </group>

          {/* Ear panels */}
          <mesh geometry={new THREE.BoxGeometry(0.06, 0.2, 0.15)} material={materials.bodyLight} position={[-0.38, 0, 0]} />
          <mesh geometry={new THREE.BoxGeometry(0.06, 0.2, 0.15)} material={materials.bodyLight} position={[0.38, 0, 0]} />
        </group>

        {/* ── TORSO ─────────────────────────────────────────── */}
        <mesh ref={torsoRef} geometry={torsoGeo} material={materials.body} position={[0, 0, 0]} />

        {/* Chest accent strip (amber glow) */}
        <mesh geometry={accentStripGeo} material={materials.accentAmber} position={[0, 0.08, 0.01]} />

        {/* Chest panel (darker inset) */}
        <mesh geometry={chestPanelGeo} material={materials.bodyLight} position={[0, -0.05, 0.21]} />

        {/* Chest light (cyan glow) */}
        <mesh position={[0, -0.05, 0.23]}>
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial
            color={COLORS.primary.main}
            emissive={COLORS.primary.main}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        {/* ── LEFT ARM ──────────────────────────────────────── */}
        <group ref={leftArmRef} position={[-0.45, 0.15, 0]}>
          {/* Shoulder joint */}
          <mesh geometry={shoulderGeo} material={materials.joint} />
          {/* Upper arm */}
          <mesh geometry={armGeo} material={materials.metal} position={[0, -0.22, 0]} />
          {/* Elbow */}
          <mesh geometry={elbowGeo} material={materials.joint} position={[0, -0.4, 0]} />
          {/* Forearm */}
          <mesh geometry={forearmGeo} material={materials.metal} position={[0, -0.57, 0]} />
          {/* Hand */}
          <group ref={leftHandRef} position={[0, -0.72, 0]}>
            <mesh geometry={handGeo} material={materials.bodyLight} />
          </group>
        </group>

        {/* ── RIGHT ARM ─────────────────────────────────────── */}
        <group ref={rightArmRef} position={[0.45, 0.15, 0]}>
          <mesh geometry={shoulderGeo} material={materials.joint} />
          <mesh geometry={armGeo} material={materials.metal} position={[0, -0.22, 0]} />
          <mesh geometry={elbowGeo} material={materials.joint} position={[0, -0.4, 0]} />
          <mesh geometry={forearmGeo} material={materials.metal} position={[0, -0.57, 0]} />
          <group ref={rightHandRef} position={[0, -0.72, 0]}>
            <mesh geometry={handGeo} material={materials.bodyLight} />
          </group>
        </group>

        {/* ── LEGS ──────────────────────────────────────────── */}
        {/* Left leg */}
        <mesh geometry={legGeo} material={materials.metal} position={[-0.15, -0.48, 0]} />
        <mesh geometry={footGeo} material={materials.bodyLight} position={[-0.15, -0.63, 0.03]} />

        {/* Right leg */}
        <mesh geometry={legGeo} material={materials.metal} position={[0.15, -0.48, 0]} />
        <mesh geometry={footGeo} material={materials.bodyLight} position={[0.15, -0.63, 0.03]} />

        {/* ── ACCENT LIGHTS ─────────────────────────────────── */}
        {/* Shoulder glow strips */}
        <mesh position={[-0.33, 0.35, 0.2]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={COLORS.primary.main} emissive={COLORS.primary.main} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[0.33, 0.35, 0.2]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={COLORS.primary.main} emissive={COLORS.primary.main} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>

      </group>
    </group>
  );
}
