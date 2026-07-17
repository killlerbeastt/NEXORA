/* ================================================================
   GoldCoin3D.tsx (<GoldenCoin /> Component)
   ================================================================
   A premium, interactive 3D golden coin matching the exact specification
   and behavior of the interactive credit card reference animation.

   Features:
   - Realistic 3D golden coin with high-quality PBR materials (MeshPhysicalMaterial).
   - Front face engraved with a sleek 3D game controller icon and star accents.
   - Back face engraved with the text "ARCADE HUB" + detailed ridged edges.
   - 160 physical metallic ridges on coin thickness for true 3D realism.
   - Idle state: slowly floating up/down and rotating on Y-axis.
   - Magnetic Cursor Follow: tilts and slightly rotates towards the cursor smoothly.
   - Hover state: slight scale up (1.08x), stronger tilt, and soft bloom/glow.
   - Click state: press down slightly (scale down + depth dip) + sparkle particles.
   - Configurable props: size, icon, backText, color, onClick, onHover.
   ================================================================ */
'use client';

import React, {
  useRef, useState, useMemo, useCallback, useEffect, Suspense,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const TAU = Math.PI * 2;

export interface GoldenCoinProps {
  size?: number;                    // default 2
  icon?: React.ReactNode | string;  // optional front face icon spec
  backText?: string;                // default "ARCADE HUB"
  color?: string;                   // default "gold" (#FFE87C)
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  className?: string;
}

/* ══════════════════════════════════════════════════════════════
   1. PROCEDURAL COIN TEXTURE GENERATOR (Albedo, Bump, Roughness, Emissive)
══════════════════════════════════════════════════════════════ */
interface CoinMaps {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

function makeCoinFaceMaps(front: boolean, backTextStr: string = 'ARCADE HUB'): CoinMaps {
  const S = 1024; // Ultra-high 1024x1024 resolution for crisp embossed detail

  const cvBump = document.createElement('canvas');
  const cvAlbedo = document.createElement('canvas');
  const cvRough = document.createElement('canvas');
  const cvEmiss = document.createElement('canvas');
  cvBump.width = cvBump.height = S;
  cvAlbedo.width = cvAlbedo.height = S;
  cvRough.width = cvRough.height = S;
  cvEmiss.width = cvEmiss.height = S;

  const ctxB = cvBump.getContext('2d')!;
  const ctxA = cvAlbedo.getContext('2d')!;
  const ctxR = cvRough.getContext('2d')!;
  const ctxE = cvEmiss.getContext('2d')!;

  const cx = S / 2;
  const cy = S / 2;

  /* ── Base Fill ── */
  ctxB.fillStyle = '#606060';
  ctxB.fillRect(0, 0, S, S);

  const grdA = ctxA.createRadialGradient(cx * 0.8, cy * 0.8, 0, cx, cy, cx);
  grdA.addColorStop(0, '#FFE87C');
  grdA.addColorStop(0.35, '#E5BA50');
  grdA.addColorStop(0.75, '#B8860B');
  grdA.addColorStop(1, '#684805');
  ctxA.fillStyle = grdA;
  ctxA.fillRect(0, 0, S, S);

  // Brushed antique gold grain
  for (let i = 0; i < 400; i++) {
    const r = (i / 400) * (cx - 20);
    ctxA.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctxA.lineWidth = 1.5;
    ctxA.beginPath();
    ctxA.arc(cx, cy, r, 0, TAU);
    ctxA.stroke();

    ctxR.strokeStyle = i % 2 === 0 ? '#383838' : '#282828';
    ctxR.lineWidth = 1.5;
    ctxR.beginPath();
    ctxR.arc(cx, cy, r, 0, TAU);
    ctxR.stroke();
  }

  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, S, S);

  /* ── Outer Raised Rim Ring ── */
  const rimOuterR = cx - 8;
  const rimInnerR = cx - 72;
  ctxB.fillStyle = '#FFFFFF';
  ctxB.beginPath();
  ctxB.arc(cx, cy, rimOuterR, 0, TAU);
  ctxB.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxB.fill();

  ctxA.fillStyle = '#FFF2A6';
  ctxA.beginPath();
  ctxA.arc(cx, cy, rimOuterR, 0, TAU);
  ctxA.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxA.fill();

  ctxR.fillStyle = '#101010';
  ctxR.beginPath();
  ctxR.arc(cx, cy, rimOuterR, 0, TAU);
  ctxR.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxR.fill();

  /* ── Inner Stepped Bevel Groove ── */
  ctxB.strokeStyle = '#303030';
  ctxB.lineWidth = 14;
  ctxB.beginPath();
  ctxB.arc(cx, cy, rimInnerR - 7, 0, TAU);
  ctxB.stroke();

  ctxA.strokeStyle = 'rgba(30, 18, 0, 0.85)';
  ctxA.lineWidth = 14;
  ctxA.beginPath();
  ctxA.arc(cx, cy, rimInnerR - 7, 0, TAU);
  ctxA.stroke();

  /* ── Concentric Reeded Bead Ring ── */
  const beadR = rimInnerR - 26;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const bx = cx + Math.cos(a) * beadR;
    const by = cy + Math.sin(a) * beadR;

    ctxB.fillStyle = '#FFFFFF';
    ctxB.beginPath();
    ctxB.arc(bx, by, 7, 0, TAU);
    ctxB.fill();

    ctxA.fillStyle = '#FFF5B8';
    ctxA.beginPath();
    ctxA.arc(bx, by, 7, 0, TAU);
    ctxA.fill();

    ctxR.fillStyle = '#080808';
    ctxR.beginPath();
    ctxR.arc(bx, by, 7, 0, TAU);
    ctxR.fill();
  }

  /* ── Helper: Embossed Text ── */
  const drawEmbossedText = (
    text: string,
    x: number,
    y: number,
    font: string,
    align: CanvasTextAlign = 'center'
  ) => {
    ctxB.font = font;
    ctxB.textAlign = align;
    ctxB.textBaseline = 'middle';
    ctxB.fillStyle = '#202020';
    ctxB.fillText(text, x + 3, y + 4);
    ctxB.fillStyle = '#FFFFFF';
    ctxB.fillText(text, x, y);

    ctxA.font = font;
    ctxA.textAlign = align;
    ctxA.textBaseline = 'middle';
    ctxA.fillStyle = 'rgba(20, 10, 0, 0.75)';
    ctxA.fillText(text, x + 2, y + 3);
    ctxA.fillStyle = '#FFF6CC';
    ctxA.fillText(text, x, y);

    ctxR.font = font;
    ctxR.textAlign = align;
    ctxR.textBaseline = 'middle';
    ctxR.fillStyle = '#050505';
    ctxR.fillText(text, x, y);
  };

  /* ── Helper: Arc Text ── */
  const drawArcText = (str: string, r: number, startAngle: number, letterSpacing: number) => {
    ctxB.save(); ctxA.save(); ctxR.save();
    ctxB.translate(cx, cy); ctxA.translate(cx, cy); ctxR.translate(cx, cy);

    let angle = startAngle;
    const font = 'bold 36px "Courier New", monospace';
    for (const ch of str) {
      ctxB.save(); ctxA.save(); ctxR.save();
      ctxB.rotate(angle); ctxA.rotate(angle); ctxR.rotate(angle);
      ctxB.translate(0, -r); ctxA.translate(0, -r); ctxR.translate(0, -r);
      ctxB.rotate(Math.PI / 2); ctxA.rotate(Math.PI / 2); ctxR.rotate(Math.PI / 2);

      ctxB.font = font; ctxB.textAlign = 'center'; ctxB.textBaseline = 'middle';
      ctxB.fillStyle = '#202020'; ctxB.fillText(ch, 2, 3);
      ctxB.fillStyle = '#FFFFFF'; ctxB.fillText(ch, 0, 0);

      ctxA.font = font; ctxA.textAlign = 'center'; ctxA.textBaseline = 'middle';
      ctxA.fillStyle = 'rgba(20,10,0,0.8)'; ctxA.fillText(ch, 2, 3);
      ctxA.fillStyle = '#FFF4B8'; ctxA.fillText(ch, 0, 0);

      ctxR.font = font; ctxR.textAlign = 'center'; ctxR.textBaseline = 'middle';
      ctxR.fillStyle = '#050505'; ctxR.fillText(ch, 0, 0);

      ctxB.restore(); ctxA.restore(); ctxR.restore();
      angle += letterSpacing;
    }
    ctxB.restore(); ctxA.restore(); ctxR.restore();
  };

  /* ══════════════════════════════════════════════════════════════
     FACE SPECIFIC ENGRAVINGS (Front: Gamepad Icon | Back: "ARCADE HUB")
  ══════════════════════════════════════════════════════════════ */
  if (front) {
    /* ── FRONT FACE: GAMEPAD ICON & ARCADE SOVEREIGN CREST ── */
    const topStr = '★  PLAYER ONE READY  ★';
    drawArcText(topStr, rimInnerR - 64, -Math.PI / 2 - ((topStr.length - 1) * 0.088) / 2, 0.088);

    const btmStr = 'THE ARCADE SOVEREIGN · 2026';
    drawArcText(btmStr, rimInnerR - 64, Math.PI / 2 - ((btmStr.length - 1) * 0.088) / 2, 0.088);

    // Center Shield Ring
    ctxB.fillStyle = '#888888';
    ctxB.beginPath();
    ctxB.arc(cx, cy, 210, 0, TAU);
    ctxB.fill();
    ctxB.strokeStyle = '#FFFFFF';
    ctxB.lineWidth = 10;
    ctxB.stroke();

    ctxA.fillStyle = '#E5C068';
    ctxA.beginPath();
    ctxA.arc(cx, cy, 210, 0, TAU);
    ctxA.fill();
    ctxA.strokeStyle = '#FFF6CC';
    ctxA.lineWidth = 10;
    ctxA.stroke();

    // ── PROMINENT 3D EMBOSSED GAMEPAD SILHOUETTE ──
    ctxB.fillStyle = '#FFFFFF';
    ctxB.beginPath();
    ctxB.roundRect(cx - 165, cy - 85, 330, 170, 56);
    ctxB.fill();
    ctxB.strokeStyle = '#202020';
    ctxB.lineWidth = 6;
    ctxB.stroke();

    ctxA.fillStyle = '#FFF6CC';
    ctxA.beginPath();
    ctxA.roundRect(cx - 165, cy - 85, 330, 170, 56);
    ctxA.fill();
    ctxA.strokeStyle = 'rgba(40,20,0,0.8)';
    ctxA.lineWidth = 6;
    ctxA.stroke();

    ctxR.fillStyle = '#050505';
    ctxR.beginPath();
    ctxR.roundRect(cx - 165, cy - 85, 330, 170, 56);
    ctxR.fill();

    // D-Pad Cross (Left)
    ctxB.fillStyle = '#404040';
    ctxB.fillRect(cx - 120, cy - 15, 66, 30);
    ctxB.fillRect(cx - 102, cy - 33, 30, 66);
    ctxA.fillStyle = '#C89628';
    ctxA.fillRect(cx - 120, cy - 15, 66, 30);
    ctxA.fillRect(cx - 102, cy - 33, 30, 66);

    // Action Buttons (Right)
    const btns: [number, number][] = [
      [cx + 85, cy - 28], [cx + 115, cy], [cx + 55, cy], [cx + 85, cy + 28],
    ];
    btns.forEach(([bx, by], idx) => {
      ctxB.fillStyle = '#404040';
      ctxB.beginPath(); ctxB.arc(bx, by, 18, 0, TAU); ctxB.fill();
      ctxA.fillStyle = '#C89628';
      ctxA.beginPath(); ctxA.arc(bx, by, 18, 0, TAU); ctxA.fill();

      // Emissive LED glints
      if (idx === 0) {
        ctxE.fillStyle = '#00F0FF'; ctxE.beginPath(); ctxE.arc(bx, by, 10, 0, TAU); ctxE.fill();
      } else if (idx === 3) {
        ctxE.fillStyle = '#FF8C00'; ctxE.beginPath(); ctxE.arc(bx, by, 10, 0, TAU); ctxE.fill();
      }
    });

    // Twin Analog Sticks
    [cx - 50, cx + 25].forEach((sx) => {
      ctxB.fillStyle = '#505050'; ctxB.beginPath(); ctxB.arc(sx, cy + 42, 22, 0, TAU); ctxB.fill();
      ctxA.fillStyle = '#D4A843'; ctxA.beginPath(); ctxA.arc(sx, cy + 42, 22, 0, TAU); ctxA.fill();
    });

  } else {
    /* ── BACK FACE: ENGRAVED "ARCADE HUB" TEXT & CREST ── */
    const topStr2 = '★  SOVEREIGN GAMING COIN  ★';
    drawArcText(topStr2, rimInnerR - 64, -Math.PI / 2 - ((topStr2.length - 1) * 0.088) / 2, 0.088);

    const btmStr2 = '100% BROWSER BASED · INSTANT PLAY';
    drawArcText(btmStr2, rimInnerR - 64, Math.PI / 2 - ((btmStr2.length - 1) * 0.082) / 2, 0.082);

    // Center Shield
    ctxB.fillStyle = '#888888';
    ctxB.beginPath(); ctxB.arc(cx, cy, 210, 0, TAU); ctxB.fill();
    ctxB.strokeStyle = '#FFFFFF'; ctxB.lineWidth = 10; ctxB.stroke();

    ctxA.fillStyle = '#E5C068';
    ctxA.beginPath(); ctxA.arc(cx, cy, 210, 0, TAU); ctxA.fill();
    ctxA.strokeStyle = '#FFF6CC'; ctxA.lineWidth = 10; ctxA.stroke();

    // Massive Embossed Back Text ("ARCADE HUB")
    const words = backTextStr.split(' ');
    if (words.length > 1 && backTextStr.length > 8) {
      drawEmbossedText(words[0], cx, cy - 45, 'bold 96px Georgia, serif');
      drawEmbossedText(words.slice(1).join(' '), cx, cy + 50, 'bold 96px Georgia, serif');
    } else {
      drawEmbossedText(backTextStr, cx, cy, 'bold 110px Georgia, serif');
    }

    // Star Accents
    drawEmbossedText('✦  ✦  ✦', cx, cy + 140, 'bold 36px sans-serif');
  }

  const albedoMap = new THREE.CanvasTexture(cvAlbedo);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(cvBump);
  const roughnessMap = new THREE.CanvasTexture(cvRough);
  const emissiveMap = new THREE.CanvasTexture(cvEmiss);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { albedoMap, bumpMap, roughnessMap, emissiveMap };
}

/* ══════════════════════════════════════════════════════════════
   2. REEDED EDGE TEXTURE & TEETH
══════════════════════════════════════════════════════════════ */
function makeReededEdgeMaps() {
  const W = 1024, H = 64;
  const cvB = document.createElement('canvas');
  const cvA = document.createElement('canvas');
  cvB.width = cvA.width = W;
  cvB.height = cvA.height = H;
  const ctxB = cvB.getContext('2d')!;
  const ctxA = cvA.getContext('2d')!;

  const teethCount = 160;
  const toothWidth = W / teethCount;

  for (let i = 0; i < teethCount; i++) {
    const x = i * toothWidth;
    ctxB.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#404040';
    ctxB.fillRect(x, 0, toothWidth * 0.6, H);
    ctxB.fillStyle = '#202020';
    ctxB.fillRect(x + toothWidth * 0.6, 0, toothWidth * 0.4, H);

    ctxA.fillStyle = i % 2 === 0 ? '#FFE87C' : '#906815';
    ctxA.fillRect(x, 0, toothWidth, H);
  }

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = THREE.RepeatWrapping;
  const albedo = new THREE.CanvasTexture(cvA);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;

  return { bump, albedo };
}

function ReededTeeth({ radius, thickness }: { radius: number; thickness: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 160;

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * TAU;
      dummy.position.set(Math.cos(a) * (radius + 0.008), 0, Math.sin(a) * (radius + 0.008));
      dummy.rotation.set(0, -a, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [radius, thickness]);

  return (
    <instancedMesh ref={meshRef} args={[null!, null!, COUNT]}>
      <boxGeometry args={[0.012, thickness * 0.88, 0.02]} />
      <meshPhysicalMaterial color="#FFE87C" metalness={1.0} roughness={0.1} envMapIntensity={3.5} />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. CLICK SPARK EXPLOSION
══════════════════════════════════════════════════════════════ */
function Sparks({ trigger }: { trigger: number }) {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 80;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * TAU;
      const sp = 2 + Math.random() * 4.5;
      velocities[i * 3] = Math.cos(a) * sp;
      velocities[i * 3 + 1] = 2 + Math.random() * 5;
      velocities[i * 3 + 2] = Math.sin(a) * sp;
    }
    return { positions, velocities };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  const alive = useRef(false);
  const clock = useRef(0);

  useEffect(() => {
    if (!trigger) return;
    alive.current = true;
    clock.current = 0;
    for (let i = 0; i < COUNT * 3; i++) positions[i] = 0;
    (geo.getAttribute('position') as THREE.BufferAttribute).set(positions);
    geo.getAttribute('position').needsUpdate = true;
  }, [trigger, geo, positions]);

  useFrame((_, dt) => {
    if (!alive.current) return;
    clock.current += dt;
    if (clock.current > 1.5) { alive.current = false; return; }
    const pa = geo.getAttribute('position') as THREE.BufferAttribute;
    const gravity = 6 * clock.current;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] += velocities[i * 3] * dt;
      positions[i * 3 + 1] += (velocities[i * 3 + 1] - gravity) * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
    }
    pa.set(positions);
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.065} color="#FFD700" sizeAttenuation transparent opacity={0.95} toneMapped={false} />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. COIN MESH ASSEMBLY (Magnetic Tilt & Press Animations)
══════════════════════════════════════════════════════════════ */
function CoinMesh({ size = 2, backText = 'ARCADE HUB', onClick, onHover }: GoldenCoinProps) {
  const group = useRef<THREE.Group>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(0);

  const RADIUS = (size / 2) * 1.15;
  const THICKNESS = RADIUS * 0.14;

  const anim = useRef({
    idleY: 0,
    tiltX: 0, targetTiltX: 0,
    tiltY: 0, targetTiltY: 0,
    scale: 1.0, targetScale: 1.0,
    pressZ: 0, targetPressZ: 0,
    glowAlpha: 0, targetGlow: 0,
    isPressed: false,
  });

  const [frontMaps, backMaps, edgeMaps] = useMemo(() => {
    if (typeof window === 'undefined') return [null!, null!, null!];
    return [makeCoinFaceMaps(true, backText), makeCoinFaceMaps(false, backText), makeReededEdgeMaps()];
  }, [backText]);

  const frontMat = useMemo(() => {
    if (!frontMaps) return new THREE.MeshStandardMaterial({ color: '#D4A843' });
    return new THREE.MeshPhysicalMaterial({
      map: frontMaps.albedoMap,
      bumpMap: frontMaps.bumpMap,
      bumpScale: 0.06,
      roughnessMap: frontMaps.roughnessMap,
      roughness: 0.15,
      metalness: 1.0,
      emissiveMap: frontMaps.emissiveMap,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 2.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 3.5,
    });
  }, [frontMaps]);

  const backMat = useMemo(() => {
    if (!backMaps) return new THREE.MeshStandardMaterial({ color: '#D4A843' });
    return new THREE.MeshPhysicalMaterial({
      map: backMaps.albedoMap,
      bumpMap: backMaps.bumpMap,
      bumpScale: 0.06,
      roughnessMap: backMaps.roughnessMap,
      roughness: 0.15,
      metalness: 1.0,
      emissiveMap: backMaps.emissiveMap,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 2.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 3.5,
    });
  }, [backMaps]);

  const rimMat = useMemo(() => {
    if (!edgeMaps) return new THREE.MeshStandardMaterial({ color: '#D4A843' });
    return new THREE.MeshPhysicalMaterial({
      map: edgeMaps.albedo,
      bumpMap: edgeMaps.bump,
      bumpScale: 0.04,
      metalness: 1.0,
      roughness: 0.12,
      envMapIntensity: 3.8,
    });
  }, [edgeMaps]);

  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700',
    emissive: '#FFD700',
    emissiveIntensity: 5,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    toneMapped: false,
  }), []);

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    // Normalized cursor tracking (-1 to 1) exactly like credit card tilt
    const ndcX = (e.clientX / window.innerWidth - 0.5) * 2;
    const ndcY = -(e.clientY / window.innerHeight - 0.5) * 2;
    anim.current.targetTiltX = ndcY * 0.65;
    anim.current.targetTiltY = ndcX * 0.75;
  }, []);

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    onHover?.(true);
    anim.current.targetScale = 1.08;
  }, [onHover]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    onHover?.(false);
    anim.current.targetScale = 1.0;
    anim.current.targetTiltX = 0;
    anim.current.targetTiltY = 0;
  }, [onHover]);

  const handleClick = useCallback(() => {
    const a = anim.current;
    a.isPressed = true;
    a.targetScale = 0.92; // press down slightly
    a.targetPressZ = -0.3;
    setSparkTrigger(n => n + 1);
    onClick?.();

    setTimeout(() => {
      a.targetScale = hovered ? 1.08 : 1.0;
      a.targetPressZ = 0;
      setTimeout(() => { a.isPressed = false; }, 350);
    }, 180);
  }, [hovered, onClick]);

  useFrame((state, dt) => {
    const g = group.current;
    const gr = glowRing.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = anim.current;

    /* Idle spin (floating & slow 360 rotation on Y-axis) */
    if (!hovered && !a.isPressed) {
      a.idleY += dt * (TAU / 18);
    }

    const lerpFast = 1 - Math.pow(0.001, dt);
    const lerpSlow = 1 - Math.pow(0.01, dt);

    a.tiltX += (a.targetTiltX - a.tiltX) * lerpFast;
    a.tiltY += (a.targetTiltY - a.tiltY) * lerpFast;
    a.scale += (a.targetScale - a.scale) * lerpFast;
    a.pressZ += (a.targetPressZ - a.pressZ) * lerpFast;

    const floatY = Math.sin(t * 1.5) * 0.08;

    g.rotation.x = a.tiltX;
    g.rotation.y = a.idleY + a.tiltY;
    g.position.y = floatY;
    g.position.z = a.pressZ;
    g.scale.setScalar(a.scale);

    /* Glow ring alpha */
    a.targetGlow = hovered ? 1 : 0;
    a.glowAlpha += (a.targetGlow - a.glowAlpha) * lerpSlow;
    glowMat.opacity = a.glowAlpha * 0.65;
    if (gr) gr.scale.setScalar(1.0 + a.glowAlpha * 0.08);
  });

  return (
    <group
      ref={group}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      {/* Front Face (Gamepad Icon) */}
      <mesh position={[0, THICKNESS / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={frontMat}>
        <circleGeometry args={[RADIUS - 0.04, 128]} />
      </mesh>

      {/* Back Face ("ARCADE HUB") */}
      <mesh position={[0, -(THICKNESS / 2 + 0.002), 0]} rotation={[Math.PI / 2, 0, 0]} material={backMat}>
        <circleGeometry args={[RADIUS - 0.04, 128]} />
      </mesh>

      {/* Outer Raised Beveled Rim Rings */}
      {[THICKNESS / 2, -THICKNESS / 2].map((py, idx) => (
        <mesh key={idx} position={[0, py, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RADIUS - 0.04, 0.04, 16, 128]} />
          <meshPhysicalMaterial color="#FFE87C" metalness={1.0} roughness={0.08} clearcoat={0.8} envMapIntensity={4} />
        </mesh>
      ))}

      {/* Edge Cylinder Core */}
      <mesh material={rimMat}>
        <cylinderGeometry args={[RADIUS, RADIUS, THICKNESS, 128, 1, true]} />
      </mesh>

      {/* 160 Physical Reeded Teeth */}
      <ReededTeeth radius={RADIUS} thickness={THICKNESS} />

      {/* Hover Glow Halo */}
      <mesh ref={glowRing} material={glowMat}>
        <torusGeometry args={[RADIUS + 0.12, 0.025, 16, 128]} />
      </mesh>

      {/* Click Spark Explosion */}
      <Sparks trigger={sparkTrigger} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. ENVIRONMENT & POST-FX
══════════════════════════════════════════════════════════════ */
const CHROMA_OFFSET = new THREE.Vector2(0.0008, 0.0008);

function CoinScene(props: GoldenCoinProps) {
  return (
    <>
      <Environment resolution={128}>
        <mesh scale={80}>
          <sphereGeometry />
          <meshBasicMaterial color="#0b0b14" side={THREE.BackSide} />
        </mesh>
        <directionalLight position={[6, 10, 5]} intensity={25} color="#FFE87C" />
        <directionalLight position={[-6, 4, -4]} intensity={14} color="#FF9900" />
        <directionalLight position={[0, -6, -5]} intensity={8} color="#00F0FF" />
      </Environment>

      <ambientLight intensity={0.4} color="#3a2200" />
      <pointLight position={[0, 4, 4]} intensity={6} color="#FFE87C" distance={12} decay={2} />
      <pointLight position={[3, -2, 3]} intensity={3} color="#FF8C00" distance={8} decay={2} />

      <CoinMesh {...props} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={2.2} luminanceThreshold={0.42} luminanceSmoothing={0.35} mipmapBlur />
        <ChromaticAberration
          offset={CHROMA_OFFSET as any}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. EXPORTS (<GoldenCoin /> and <GoldCoin3D /> wrapper)
══════════════════════════════════════════════════════════════ */
export function GoldenCoin(props: GoldenCoinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={props.className || 'w-full h-full'} style={{ touchAction: 'none' }}>
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 0, 3.8], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <CoinScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default GoldenCoin;
