/* ================================================================
   GoldCoin3D.tsx — Ultra-Realistic Minted Bullion Gold Coin
   ================================================================
   Creates a cinematic, physically accurate minted gold coin with:
   - High-precision procedural Heightmaps (bumpMap) & Normal effects
     so raised lettering, monograms, circuit lines, and rim beads
     catch realistic 3D specular glints when rotating.
   - Physically distinct Roughness & Metalness maps (mirror-smooth
     raised reliefs vs. brushed antique gold recessed field).
   - Real 3D reeded edge (160 physical metallic ridges + bump rim).
   - Multi-layered 3D geometry: raised outer lip, inner stepped bevel,
     and deep embossed medallion field.
   - Subtle emissive cyber-engravings + volumetric gold dust & sparks.
   ================================================================ */
'use client';

import {
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

/* ══════════════════════════════════════════════════════════════
   1. PROCEDURAL COIN TEXTURE GENERATOR (Albedo, Bump, Roughness, Emissive)
══════════════════════════════════════════════════════════════ */
interface CoinMaps {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

function makeCoinFaceMaps(front: boolean): CoinMaps {
  const S = 1024; // Ultra-high 1024x1024 resolution for crisp embossed detail

  /* ── Canvas 1: Heightmap / BumpMap (Grayscale height) ── */
  const cvBump = document.createElement('canvas');
  cvBump.width = cvBump.height = S;
  const ctxB = cvBump.getContext('2d')!;

  /* ── Canvas 2: Albedo (PBR Color + Ambient Occlusion Patina) ── */
  const cvAlbedo = document.createElement('canvas');
  cvAlbedo.width = cvAlbedo.height = S;
  const ctxA = cvAlbedo.getContext('2d')!;

  /* ── Canvas 3: Roughness Map (Polished relief vs brushed grain field) ── */
  const cvRough = document.createElement('canvas');
  cvRough.width = cvRough.height = S;
  const ctxR = cvRough.getContext('2d')!;

  /* ── Canvas 4: Emissive Map (Glowing cybernetic circuit accents) ── */
  const cvEmiss = document.createElement('canvas');
  cvEmiss.width = cvEmiss.height = S;
  const ctxE = cvEmiss.getContext('2d')!;

  const cx = S / 2;
  const cy = S / 2;

  /* ── Base Fill ── */
  // Bump base: medium gray (sunk field)
  ctxB.fillStyle = '#606060';
  ctxB.fillRect(0, 0, S, S);

  // Albedo base: rich deep gold radial gradient with subtle brushed texture
  const grdA = ctxA.createRadialGradient(cx * 0.8, cy * 0.8, 0, cx, cy, cx);
  grdA.addColorStop(0, '#FFE87C');
  grdA.addColorStop(0.35, '#E5BA50');
  grdA.addColorStop(0.75, '#B8860B');
  grdA.addColorStop(1, '#684805');
  ctxA.fillStyle = grdA;
  ctxA.fillRect(0, 0, S, S);

  // Add radial/circular brushed metal grain to albedo & roughness base
  for (let i = 0; i < 400; i++) {
    const r = (i / 400) * (cx - 20);
    ctxA.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctxA.lineWidth = 1.5;
    ctxA.beginPath();
    ctxA.arc(cx, cy, r, 0, TAU);
    ctxA.stroke();

    ctxR.strokeStyle = i % 2 === 0 ? '#383838' : '#282828'; // 0.22 - 0.16 roughness grain
    ctxR.lineWidth = 1.5;
    ctxR.beginPath();
    ctxR.arc(cx, cy, r, 0, TAU);
    ctxR.stroke();
  }

  // Emissive base: black (no glow initially)
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, S, S);

  /* ── Outer Raised Rim Ring (Height 255 - pure white) ── */
  const rimOuterR = cx - 8;
  const rimInnerR = cx - 72;
  ctxB.fillStyle = '#FFFFFF';
  ctxB.beginPath();
  ctxB.arc(cx, cy, rimOuterR, 0, TAU);
  ctxB.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxB.fill();

  ctxA.fillStyle = '#FFF2A6'; // bright polished gold rim
  ctxA.beginPath();
  ctxA.arc(cx, cy, rimOuterR, 0, TAU);
  ctxA.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxA.fill();

  ctxR.fillStyle = '#101010'; // mirror smooth rim (roughness 0.06)
  ctxR.beginPath();
  ctxR.arc(cx, cy, rimOuterR, 0, TAU);
  ctxR.arc(cx, cy, rimInnerR, 0, TAU, true);
  ctxR.fill();

  /* ── Inner Stepped Bevel & Crevice Shadow (Patina / AO) ── */
  ctxB.strokeStyle = '#303030'; // recessed groove right inside the rim
  ctxB.lineWidth = 14;
  ctxB.beginPath();
  ctxB.arc(cx, cy, rimInnerR - 7, 0, TAU);
  ctxB.stroke();

  ctxA.strokeStyle = 'rgba(30, 18, 0, 0.85)'; // dark patina shadow inside groove
  ctxA.lineWidth = 14;
  ctxA.beginPath();
  ctxA.arc(cx, cy, rimInnerR - 7, 0, TAU);
  ctxA.stroke();

  /* ── Bead Ring (Reeded dots around the coin border) ── */
  const beadR = rimInnerR - 26;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const bx = cx + Math.cos(a) * beadR;
    const by = cy + Math.sin(a) * beadR;

    ctxB.fillStyle = '#FFFFFF'; // raised hemisphere bead
    ctxB.beginPath();
    ctxB.arc(bx, by, 7, 0, TAU);
    ctxB.fill();

    ctxA.fillStyle = '#FFF5B8';
    ctxA.beginPath();
    ctxA.arc(bx, by, 7, 0, TAU);
    ctxA.fill();

    ctxR.fillStyle = '#080808'; // ultra shiny beads
    ctxR.beginPath();
    ctxR.arc(bx, by, 7, 0, TAU);
    ctxR.fill();
  }

  /* ── Guilloche / Geometric Security Pattern in Background Field ── */
  ctxB.strokeStyle = '#757575'; // slightly raised fine security lines
  ctxB.lineWidth = 1.2;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    ctxB.beginPath();
    ctxB.ellipse(cx, cy, cx * 0.6, cx * 0.25, a, 0, TAU);
    ctxB.stroke();
  }

  /* ── Circuit Traces & Cybernetic Nodes (Emissive + Embossed) ── */
  const circuitColors = ['#FFD700', '#00F0FF', '#FF8C00'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + (front ? 0 : 0.25);
    const r1 = beadR - 18;
    const r2 = beadR - 85;
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * r2;
    const y2 = cy + Math.sin(a) * r2;

    // Raised circuit line
    ctxB.strokeStyle = '#D0D0D0';
    ctxB.lineWidth = 4;
    ctxB.beginPath();
    ctxB.moveTo(x1, y1);
    ctxB.lineTo(x2, y2);
    ctxB.stroke();

    // Circuit node dot (glowing!)
    ctxB.fillStyle = '#FFFFFF';
    ctxB.beginPath();
    ctxB.arc(x2, y2, 8, 0, TAU);
    ctxB.fill();

    ctxE.fillStyle = circuitColors[i % circuitColors.length];
    ctxE.beginPath();
    ctxE.arc(x2, y2, 6, 0, TAU);
    ctxE.fill();
  }

  /* ── Helper to draw sharp embossed text & symbols ── */
  const drawEmbossedText = (
    text: string,
    x: number,
    y: number,
    font: string,
    align: CanvasTextAlign = 'center'
  ) => {
    // 1. Dark drop-shadow / crevice undercut below text
    ctxB.font = font;
    ctxB.textAlign = align;
    ctxB.textBaseline = 'middle';
    ctxB.fillStyle = '#202020';
    ctxB.fillText(text, x + 3, y + 4);

    // 2. Pure white raised plateau heightmap
    ctxB.fillStyle = '#FFFFFF';
    ctxB.fillText(text, x, y);

    // 3. Albedo bright gold with dark outline
    ctxA.font = font;
    ctxA.textAlign = align;
    ctxA.textBaseline = 'middle';
    ctxA.fillStyle = 'rgba(20, 10, 0, 0.75)'; // dark crease border
    ctxA.fillText(text, x + 2, y + 3);
    ctxA.fillStyle = '#FFF6CC'; // pure polished gold crest
    ctxA.fillText(text, x, y);

    // 4. Roughness pure black (0.02 - mirror reflection on lettering)
    ctxR.font = font;
    ctxR.textAlign = align;
    ctxR.textBaseline = 'middle';
    ctxR.fillStyle = '#050505';
    ctxR.fillText(text, x, y);
  };

  /* ── Arc Text Helper ── */
  const drawArcText = (str: string, r: number, startAngle: number, letterSpacing: number) => {
    ctxB.save();
    ctxA.save();
    ctxR.save();
    ctxB.translate(cx, cy);
    ctxA.translate(cx, cy);
    ctxR.translate(cx, cy);

    let angle = startAngle;
    const font = 'bold 36px "Courier New", monospace';
    for (const ch of str) {
      ctxB.save(); ctxA.save(); ctxR.save();
      ctxB.rotate(angle); ctxA.rotate(angle); ctxR.rotate(angle);
      ctxB.translate(0, -r); ctxA.translate(0, -r); ctxR.translate(0, -r);
      ctxB.rotate(Math.PI / 2); ctxA.rotate(Math.PI / 2); ctxR.rotate(Math.PI / 2);

      // Heightmap
      ctxB.font = font; ctxB.textAlign = 'center'; ctxB.textBaseline = 'middle';
      ctxB.fillStyle = '#202020'; ctxB.fillText(ch, 2, 3);
      ctxB.fillStyle = '#FFFFFF'; ctxB.fillText(ch, 0, 0);

      // Albedo
      ctxA.font = font; ctxA.textAlign = 'center'; ctxA.textBaseline = 'middle';
      ctxA.fillStyle = 'rgba(20,10,0,0.8)'; ctxA.fillText(ch, 2, 3);
      ctxA.fillStyle = '#FFF4B8'; ctxA.fillText(ch, 0, 0);

      // Roughness
      ctxR.font = font; ctxR.textAlign = 'center'; ctxR.textBaseline = 'middle';
      ctxR.fillStyle = '#050505'; ctxR.fillText(ch, 0, 0);

      ctxB.restore(); ctxA.restore(); ctxR.restore();
      angle += letterSpacing;
    }
    ctxB.restore(); ctxA.restore(); ctxR.restore();
  };

  /* ══════════════════════════════════════════════════════════════
     FACE SPECIFIC ENGRAVINGS
  ══════════════════════════════════════════════════════════════ */
  if (front) {
    /* ── FRONT FACE: THE ARCADE SOVEREIGN CREST ── */

    // Top & Bottom Arc Text
    const topStr = '★  ARCADE HUB BULLION  ★';
    drawArcText(topStr, rimInnerR - 64, -Math.PI / 2 - ((topStr.length - 1) * 0.088) / 2, 0.088);

    const btmStr = '999.9 FINE GOLD  ·  2026';
    drawArcText(btmStr, rimInnerR - 64, Math.PI / 2 - ((btmStr.length - 1) * 0.09) / 2, 0.09);

    // Center Shield / Crest Plateau
    ctxB.fillStyle = '#A0A0A0'; // raised shield base
    ctxB.beginPath();
    ctxB.arc(cx, cy, 180, 0, TAU);
    ctxB.fill();
    ctxB.strokeStyle = '#FFFFFF';
    ctxB.lineWidth = 8;
    ctxB.stroke();

    ctxA.fillStyle = '#E5C068';
    ctxA.beginPath();
    ctxA.arc(cx, cy, 180, 0, TAU);
    ctxA.fill();
    ctxA.strokeStyle = '#FFF6CC';
    ctxA.lineWidth = 8;
    ctxA.stroke();

    // Massive Embossed Monogram "A"
    drawEmbossedText('A', cx, cy - 10, 'bold 260px Georgia, "Times New Roman", serif');

    // Crossbar Star Accent
    drawEmbossedText('✦', cx, cy + 95, 'bold 44px sans-serif');

  } else {
    /* ── BACK FACE: HIGH-RELIEF GAMEPAD & ARCADE CORE ── */

    const topStr2 = '★  PLAYER ONE READY  ★';
    drawArcText(topStr2, rimInnerR - 64, -Math.PI / 2 - ((topStr2.length - 1) * 0.09) / 2, 0.09);

    const btmStr2 = 'NO INSTALLS  ·  INSTANT PLAY';
    drawArcText(btmStr2, rimInnerR - 64, Math.PI / 2 - ((btmStr2.length - 1) * 0.082) / 2, 0.082);

    // Center Raised Controller Relief Shield
    ctxB.fillStyle = '#909090';
    ctxB.beginPath();
    ctxB.roundRect(cx - 210, cy - 110, 420, 220, 64);
    ctxB.fill();
    ctxB.strokeStyle = '#FFFFFF';
    ctxB.lineWidth = 10;
    ctxB.stroke();

    ctxA.fillStyle = '#DEB85C';
    ctxA.beginPath();
    ctxA.roundRect(cx - 210, cy - 110, 420, 220, 64);
    ctxA.fill();
    ctxA.strokeStyle = '#FFF4B8';
    ctxA.lineWidth = 10;
    ctxA.stroke();

    ctxR.fillStyle = '#151515';
    ctxR.beginPath();
    ctxR.roundRect(cx - 210, cy - 110, 420, 220, 64);
    ctxR.fill();

    // D-Pad Relief (Left)
    ctxB.fillStyle = '#FFFFFF';
    ctxB.fillRect(cx - 150, cy - 18, 80, 36);
    ctxB.fillRect(cx - 128, cy - 40, 36, 80);
    ctxA.fillStyle = '#FFF8D0';
    ctxA.fillRect(cx - 150, cy - 18, 80, 36);
    ctxA.fillRect(cx - 128, cy - 40, 36, 80);

    // Action Buttons Relief (Right)
    const btns: [number, number][] = [
      [cx + 110, cy - 35],
      [cx + 145, cy],
      [cx + 75, cy],
      [cx + 110, cy + 35],
    ];
    btns.forEach(([bx, by], idx) => {
      ctxB.fillStyle = '#FFFFFF';
      ctxB.beginPath();
      ctxB.arc(bx, by, 22, 0, TAU);
      ctxB.fill();

      ctxA.fillStyle = '#FFF8D0';
      ctxA.beginPath();
      ctxA.arc(bx, by, 22, 0, TAU);
      ctxA.fill();

      // Emissive glow on button tops
      if (idx === 0) {
        ctxE.fillStyle = '#00F0FF';
        ctxE.beginPath();
        ctxE.arc(bx, by, 12, 0, TAU);
        ctxE.fill();
      } else if (idx === 3) {
        ctxE.fillStyle = '#FF8C00';
        ctxE.beginPath();
        ctxE.arc(bx, by, 12, 0, TAU);
        ctxE.fill();
      }
    });

    // Center Arcade Joystick Ball
    ctxB.fillStyle = '#FFFFFF';
    ctxB.beginPath();
    ctxB.arc(cx - 10, cy + 5, 36, 0, TAU);
    ctxB.fill();

    ctxA.fillStyle = '#FFF8D0';
    ctxA.beginPath();
    ctxA.arc(cx - 10, cy + 5, 36, 0, TAU);
    ctxA.fill();

    // Subtext below controller
    drawEmbossedText('100% BROWSER BASED', cx, cy + 165, 'bold 36px "Courier New", monospace');
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
   2. REEDED EDGE TEXTURE (Vertical alternating teeth for rim cylinder)
══════════════════════════════════════════════════════════════ */
function makeReededEdgeMaps() {
  const W = 1024;
  const H = 64;
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
    // alternating high (white) and low (gray) ridges
    ctxB.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#404040';
    ctxB.fillRect(x, 0, toothWidth * 0.6, H);
    ctxB.fillStyle = '#202020';
    ctxB.fillRect(x + toothWidth * 0.6, 0, toothWidth * 0.4, H);

    // albedo shading for teeth
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

/* ══════════════════════════════════════════════════════════════
   3. PHYSICAL REEDED TEETH (Instanced radial gold bars on edge)
══════════════════════════════════════════════════════════════ */
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
      <meshPhysicalMaterial
        color="#FFE87C"
        metalness={1.0}
        roughness={0.1}
        envMapIntensity={3.5}
      />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. SPARK PARTICLES ON CLICK
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
  }, []);

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
      <pointsMaterial
        size={0.065}
        color="#FFD700"
        sizeAttenuation
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. AMBIENT GOLD DUST PARTICLES
══════════════════════════════════════════════════════════════ */
function DustParticles() {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 50;

  const { geo, phases } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      phases[i] = Math.random() * TAU;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return { geo: g, phases };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pa = geo.getAttribute('position') as THREE.BufferAttribute;
    const arr = pa.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] += Math.sin(t * 0.3 + phases[i]) * 0.003;
      arr[i * 3 + 1] += Math.cos(t * 0.2 + phases[i] * 1.3) * 0.002;
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.03}
        color="#FFE87C"
        sizeAttenuation
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. STUDIO GOLD ENVIRONMENT MAP
══════════════════════════════════════════════════════════════ */
function GoldEnvironment() {
  return (
    <Environment resolution={128}>
      <mesh scale={80}>
        <sphereGeometry />
        <meshBasicMaterial color="#0b0b14" side={THREE.BackSide} />
      </mesh>
      {/* Intense warm golden key light */}
      <directionalLight position={[6, 10, 5]} intensity={25} color="#FFE87C" />
      {/* Rich amber rim reflection */}
      <directionalLight position={[-6, 4, -4]} intensity={14} color="#FF9900" />
      {/* Cyan cool rim edge highlight */}
      <directionalLight position={[0, -6, -5]} intensity={8} color="#00F0FF" />
    </Environment>
  );
}

/* ══════════════════════════════════════════════════════════════
   7. MAIN COIN MESH ASSEMBLY
══════════════════════════════════════════════════════════════ */
function Coin() {
  const group = useRef<THREE.Group>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(0);

  const anim = useRef({
    idleY: 0,
    tiltX: 0, targetTiltX: 0,
    tiltY: 0, targetTiltY: 0,
    flipY: 0, targetFlipY: 0,
    posY: 0, targetPosY: 0,
    glowAlpha: 0, targetGlow: 0,
    animLock: false,
  });

  /* ── Generate Procedural PBR Maps (Browser-Only) ── */
  const [frontMaps, backMaps, edgeMaps] = useMemo(() => {
    if (typeof window === 'undefined') return [null!, null!, null!];
    return [makeCoinFaceMaps(true), makeCoinFaceMaps(false), makeReededEdgeMaps()];
  }, []);

  const RADIUS = 1.15;
  const THICKNESS = 0.16;

  /* ── Face Materials with Bump/Height mapping ── */
  const frontMat = useMemo(() => {
    if (!frontMaps) return new THREE.MeshStandardMaterial({ color: '#D4A843' });
    return new THREE.MeshPhysicalMaterial({
      map: frontMaps.albedoMap,
      bumpMap: frontMaps.bumpMap,
      bumpScale: 0.06, // High physical relief bump!
      roughnessMap: frontMaps.roughnessMap,
      roughness: 0.15,
      metalness: 1.0,
      emissiveMap: frontMaps.emissiveMap,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 2.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 3.2,
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
      envMapIntensity: 3.2,
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
      envMapIntensity: 3.5,
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

  /* ── Interaction Handlers ── */
  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = -(e.clientY / window.innerHeight - 0.5) * 2;
    anim.current.targetTiltX = y * 0.6;
    anim.current.targetTiltY = x * 0.6;
  }, []);

  const handleClick = useCallback(() => {
    const a = anim.current;
    if (a.animLock) return;
    a.animLock = true;
    a.targetFlipY += Math.PI; // 180° flip
    a.targetPosY = 0.65;      // majestic bounce up
    setSparkTrigger(n => n + 1);

    setTimeout(() => {
      a.targetPosY = 0;
      setTimeout(() => { a.animLock = false; }, 650);
    }, 330);
  }, []);

  /* ── Per-frame animation loop ── */
  useFrame((state, dt) => {
    const g = group.current;
    const gr = glowRing.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = anim.current;

    /* Idle spin (20s loop) */
    if (!hovered && !a.animLock) {
      a.idleY += dt * (TAU / 20);
    }

    const lerpFast = 1 - Math.pow(0.001, dt);
    const lerpMid = 1 - Math.pow(0.005, dt);
    const lerpSlow = 1 - Math.pow(0.01, dt);

    a.tiltX += (a.targetTiltX - a.tiltX) * (hovered ? lerpFast : lerpMid);
    a.tiltY += (a.targetTiltY - a.tiltY) * (hovered ? lerpFast : lerpMid);
    if (!hovered) { a.targetTiltX = 0; a.targetTiltY = 0; }

    a.flipY += (a.targetFlipY - a.flipY) * lerpFast;
    a.posY += (a.targetPosY - a.posY) * lerpFast;

    const floatY = Math.sin(t * 0.8) * 0.05;

    g.rotation.x = a.tiltX;
    g.rotation.y = a.idleY + a.tiltY + a.flipY;
    g.position.y = a.posY + (a.animLock ? 0 : floatY);

    /* Glow alpha */
    a.targetGlow = hovered ? 1 : 0;
    a.glowAlpha += (a.targetGlow - a.glowAlpha) * lerpSlow;
    glowMat.opacity = a.glowAlpha * 0.6;
    if (gr) gr.scale.setScalar(1.0 + a.glowAlpha * 0.07);
  });

  return (
    <group
      ref={group}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
    >
      {/* ── 1. Front Stamped Bullion Face ── */}
      <mesh
        position={[0, THICKNESS / 2 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={frontMat}
      >
        <circleGeometry args={[RADIUS - 0.04, 128]} />
      </mesh>

      {/* ── 2. Back Stamped Bullion Face ── */}
      <mesh
        position={[0, -(THICKNESS / 2 + 0.002), 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={backMat}
      >
        <circleGeometry args={[RADIUS - 0.04, 128]} />
      </mesh>

      {/* ── 3. Outer Raised Beveled Rim Ring (Top & Bottom) ── */}
      {[THICKNESS / 2, -THICKNESS / 2].map((py, idx) => (
        <mesh key={idx} position={[0, py, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RADIUS - 0.04, 0.04, 16, 128]} />
          <meshPhysicalMaterial
            color="#FFE87C"
            metalness={1.0}
            roughness={0.08}
            clearcoat={0.8}
            envMapIntensity={4}
          />
        </mesh>
      ))}

      {/* ── 4. Main Edge Cylinder Core ── */}
      <mesh material={rimMat}>
        <cylinderGeometry args={[RADIUS, RADIUS, THICKNESS, 128, 1, true]} />
      </mesh>

      {/* ── 5. Physical Reeded Teeth (160 Raised Gold Bars) ── */}
      <ReededTeeth radius={RADIUS} thickness={THICKNESS} />

      {/* ── 6. Hover Golden Glow Halo ── */}
      <mesh ref={glowRing} material={glowMat}>
        <torusGeometry args={[RADIUS + 0.12, 0.025, 16, 128]} />
      </mesh>

      {/* ── 7. Interactive Sparks ── */}
      <Sparks trigger={sparkTrigger} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════
   8. SCENE WRAPPER & POST-FX
══════════════════════════════════════════════════════════════ */
const CHROMA_OFFSET = new THREE.Vector2(0.0008, 0.0008);

function CoinScene() {
  return (
    <>
      <GoldEnvironment />
      <ambientLight intensity={0.4} color="#3a2200" />
      <pointLight position={[0, 4, 4]} intensity={6} color="#FFE87C" distance={12} decay={2} />
      <pointLight position={[3, -2, 3]} intensity={3} color="#FF8C00" distance={8} decay={2} />
      <pointLight position={[-3, 2, -3]} intensity={2} color="#00F0FF" distance={8} decay={2} />

      <DustParticles />
      <Coin />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.42}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
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
   9. CANVAS EXPORT
══════════════════════════════════════════════════════════════ */
export default function GoldCoin3D({ className }: { className?: string }) {
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
    <div ref={containerRef} className={className} style={{ touchAction: 'none' }}>
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
          <CoinScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
