/* ================================================================
   GoldCoin3D.tsx — Cinematic Interactive 3D Gold Coin
   ================================================================
   PBR gold coin built procedurally in React Three Fiber.
   No external GLB required — coin geometry + textures built at runtime.

   Animations:
   - Idle:   slow 360° spin (20s linear loop)
   - Hover:  tilt toward cursor + soft glow ring (300ms expo-out)
   - Click:  bounce + 180° flip + spark burst (600ms ease-in-out)
   - Release: flip back / settle (150ms quad-in)

   Post-FX: Bloom + ChromaticAberration via @react-three/postprocessing
   Performance: IntersectionObserver pauses canvas when off-screen
   ================================================================ */
'use client';

import {
  useRef, useState, useMemo, useCallback, useEffect, Suspense,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ══════════════════════════════════════════════
   COIN FACE TEXTURE  (canvas → CanvasTexture)
══════════════════════════════════════════════ */
function makeFaceTexture(front: boolean): THREE.CanvasTexture {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;

  /* ── Gold radial gradient ── */
  const grd = ctx.createRadialGradient(S * 0.45, S * 0.4, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0,    '#FFE87C');
  grd.addColorStop(0.35, '#D4A843');
  grd.addColorStop(0.72, '#B8860B');
  grd.addColorStop(1,    '#7A5500');
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2, 0, TAU);
  ctx.fillStyle = grd;
  ctx.fill();

  /* ── Outer ring engraving ── */
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 22, 0, TAU);
  ctx.stroke();

  /* ── Rim beads (reeded edge illusion on face) ── */
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const r = S / 2 - 38;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 4, 0, TAU);
    ctx.fill();
  }

  /* ── Inner circle ── */
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 54, 0, TAU);
  ctx.stroke();

  if (front) {
    /* FRONT FACE — large "A" monogram + arc text */

    /* Engraved shadow "A" */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.font = 'bold 195px Georgia, "Times New Roman", serif';
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', S / 2, S / 2 + 14);
    ctx.restore();

    /* Bright "A" on top */
    ctx.font = 'bold 195px Georgia, "Times New Roman", serif';
    ctx.fillStyle = 'rgba(255,220,80,0.25)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', S / 2 - 2, S / 2 + 12);

    /* Arc text: ARCADE HUB around the top */
    ctx.save();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    const arcStr = '★  ARCADE HUB  ★';
    const arcR = S / 2 - 68;
    const letterAngle = 0.185;
    ctx.translate(S / 2, S / 2);
    let startA = -Math.PI / 2 - ((arcStr.length - 1) * letterAngle) / 2;
    for (const ch of arcStr) {
      ctx.save();
      ctx.rotate(startA);
      ctx.translate(0, -arcR);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      startA += letterAngle;
    }
    ctx.restore();

    /* Bottom "2026" */
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2  0  2  6', S / 2, S / 2 + 118);

  } else {
    /* BACK FACE — gamepad icon + PLAY NOW */

    const cx = S / 2, cy = S / 2;
    ctx.fillStyle   = 'rgba(0,0,0,0.28)';
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';

    /* Controller body outline */
    ctx.beginPath();
    ctx.roundRect(cx - 96, cy - 52, 192, 104, 32);
    ctx.stroke();

    /* D-pad cross */
    ctx.fillRect(cx - 76, cy - 12, 42, 13);  // horizontal bar
    ctx.fillRect(cx - 61, cy - 30, 13, 49);  // vertical bar

    /* 4 action buttons */
    const btns: [number, number][] = [
      [cx + 56, cy - 12],
      [cx + 74, cy + 6],
      [cx + 38, cy + 6],
      [cx + 56, cy + 24],
    ];
    btns.forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, TAU);
      ctx.fill();
    });

    /* 2 analog sticks */
    [[cx - 36, cy + 32], [cx + 28, cy + 32]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, TAU);
      ctx.stroke();
    });

    /* PLAY NOW text */
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAY NOW', cx, cy + 112);

    /* Star arc bottom */
    const arcStr2 = '·  ·  ·  ·  ·  ·  ·  ·  ·  ·';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    const arcR2 = S / 2 - 68;
    const la2 = 0.13;
    ctx.save();
    ctx.translate(cx, cy);
    let a2 = Math.PI / 2 - ((arcStr2.length - 1) * la2) / 2;
    for (const ch of arcStr2) {
      ctx.save();
      ctx.rotate(a2);
      ctx.translate(0, -arcR2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a2 += la2;
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ══════════════════════════════════════════════
   SPARK PARTICLES
══════════════════════════════════════════════ */
function Sparks({ trigger }: { trigger: number }) {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 70;

  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * TAU;
      const sp = 1.8 + Math.random() * 3.5;
      velocities[i * 3]     = Math.cos(a) * sp;
      velocities[i * 3 + 1] = 1.5 + Math.random() * 4;
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
    if (clock.current > 1.4) { alive.current = false; return; }
    const pa = geo.getAttribute('position') as THREE.BufferAttribute;
    const gravity = 5 * clock.current;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     += velocities[i * 3]     * dt;
      positions[i * 3 + 1] += (velocities[i * 3 + 1] - gravity) * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
    }
    pa.set(positions);
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.06}
        color="#FFD700"
        sizeAttenuation
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </points>
  );
}

/* ══════════════════════════════════════════════
   DUST PARTICLES (always on, slow drift)
══════════════════════════════════════════════ */
function DustParticles() {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 40;

  const { geo, phases } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 6;
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
      arr[i * 3]     += Math.sin(t * 0.3 + phases[i]) * 0.003;
      arr[i * 3 + 1] += Math.cos(t * 0.2 + phases[i] * 1.3) * 0.002;
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.025}
        color="#D4A843"
        sizeAttenuation
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </points>
  );
}

/* ══════════════════════════════════════════════
   GOLD ENVIRONMENT MAP (inline, no CDN needed)
══════════════════════════════════════════════ */
function GoldEnvironment() {
  return (
    <Environment resolution={128}>
      {/* Deep dark sky */}
      <mesh scale={80}>
        <sphereGeometry />
        <meshBasicMaterial color="#0a0b14" side={THREE.BackSide} />
      </mesh>
      {/* Warm key from upper-right */}
      <directionalLight position={[6, 10, 5]} intensity={18} color="#FFE87C" />
      {/* Fill – amber */}
      <directionalLight position={[-5, 4, -3]} intensity={8} color="#D4831A" />
      {/* Cool backlight */}
      <directionalLight position={[0, -6, -5]} intensity={4} color="#4060FF" />
    </Environment>
  );
}

/* ══════════════════════════════════════════════
   COIN MESH — main interactive 3D object
══════════════════════════════════════════════ */
function Coin() {
  const group = useRef<THREE.Group>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(0);

  /* ── Animation state (refs to avoid re-renders) ── */
  const anim = useRef({
    idleY:     0,      // continuous idle rotation
    tiltX:     0, targetTiltX: 0,
    tiltY:     0, targetTiltY: 0,
    flipY:     0, targetFlipY: 0,
    posY:      0, targetPosY: 0,
    glowAlpha: 0, targetGlow: 0,
    blooming:  false,
    animLock:  false,
  });

  /* ── Face textures (browser-only) ── */
  const [frontTex, backTex] = useMemo<[THREE.CanvasTexture, THREE.CanvasTexture]>(() => {
    if (typeof window === 'undefined') return [null!, null!];
    return [makeFaceTexture(true), makeFaceTexture(false)];
  }, []);

  /* ── Materials ── */
  const goldRimMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C89320'),
    metalness: 1.0,
    roughness: 0.12,
    envMapIntensity: 3,
    toneMapped: false,
  }), []);

  const frontMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    map: frontTex,
    metalness: 0.9,
    roughness: 0.18,
    envMapIntensity: 2,
    toneMapped: false,
  }), [frontTex]);

  const backMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    map: backTex,
    metalness: 0.9,
    roughness: 0.18,
    envMapIntensity: 2,
    toneMapped: false,
  }), [backTex]);

  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700',
    emissive: '#FFD700',
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    toneMapped: false,
  }), []);

  const RADIUS    = 1.0;
  const THICKNESS = 0.13;

  /* ── Pointer events ── */
  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    const x =  (e.clientX / window.innerWidth  - 0.5) * 2;
    const y = -(e.clientY / window.innerHeight - 0.5) * 2;
    anim.current.targetTiltX = y * 0.55;
    anim.current.targetTiltY = x * 0.55;
  }, []);

  const handleClick = useCallback(() => {
    const a = anim.current;
    if (a.animLock) return;
    a.animLock = true;
    a.targetFlipY += Math.PI;  // add 180°
    a.targetPosY   = 0.55;     // bounce up
    setSparkTrigger(n => n + 1);

    // Drop back after 330ms
    setTimeout(() => {
      a.targetPosY = 0;
      setTimeout(() => { a.animLock = false; }, 650);
    }, 330);
  }, []);

  /* ── Per-frame animation ── */
  useFrame((state, dt) => {
    const g  = group.current;
    const gr = glowRing.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = anim.current;

    /* Idle spin — pause on hover or during flip anim */
    if (!hovered && !a.animLock) {
      a.idleY += dt * (TAU / 20); // 20-second loop
    }

    /* Exponential-out lerp coefficients */
    const lerpFast = 1 - Math.pow(0.001, dt);  // ~300ms to 99%
    const lerpMid  = 1 - Math.pow(0.005, dt);
    const lerpSlow = 1 - Math.pow(0.01,  dt);

    /* Tilt toward cursor */
    a.tiltX += (a.targetTiltX - a.tiltX) * (hovered ? lerpFast : lerpMid);
    a.tiltY += (a.targetTiltY - a.tiltY) * (hovered ? lerpFast : lerpMid);
    if (!hovered) { a.targetTiltX = 0; a.targetTiltY = 0; }

    /* Flip (ease-in-out via fast lerp) */
    a.flipY += (a.targetFlipY - a.flipY) * lerpFast;

    /* Bounce (ease-out) */
    a.posY  += (a.targetPosY  - a.posY)  * lerpFast;

    /* Gentle float */
    const floatY = Math.sin(t * 0.75) * 0.06;

    /* Apply transforms */
    g.rotation.x = a.tiltX;
    g.rotation.y = a.idleY + a.tiltY + a.flipY;
    g.position.y = a.posY + (a.animLock ? 0 : floatY);

    /* Glow ring alpha */
    a.targetGlow  = hovered ? 1 : 0;
    a.glowAlpha  += (a.targetGlow - a.glowAlpha) * lerpSlow;
    glowMat.opacity = a.glowAlpha * 0.55;
    if (gr) gr.scale.setScalar(1.0 + a.glowAlpha * 0.06);
  });

  return (
    <group
      ref={group}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
    >
      {/* ── Front face ── */}
      <mesh
        position={[0, THICKNESS / 2 + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={frontMat}
      >
        <circleGeometry args={[RADIUS, 128]} />
      </mesh>

      {/* ── Back face ── */}
      <mesh
        position={[0, -(THICKNESS / 2 + 0.001), 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={backMat}
      >
        <circleGeometry args={[RADIUS, 128]} />
      </mesh>

      {/* ── Rim (reeded cylinder side) ── */}
      <mesh material={goldRimMat}>
        <cylinderGeometry args={[RADIUS, RADIUS, THICKNESS, 128, 1, true]} />
      </mesh>

      {/* ── Thin inner bevel rings ── */}
      {[1.001, 0.97].map((r, i) => (
        <mesh key={i} rotation={[0, 0, 0]}>
          <torusGeometry args={[r, 0.008, 8, 128]} />
          <meshStandardMaterial
            color="#FFE87C"
            metalness={1}
            roughness={0.1}
            envMapIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── Glow halo ring (hover) ── */}
      <mesh ref={glowRing} material={glowMat}>
        <torusGeometry args={[RADIUS + 0.08, 0.022, 8, 128]} />
      </mesh>

      {/* ── Sparks on click ── */}
      <Sparks trigger={sparkTrigger} />
    </group>
  );
}

/* ══════════════════════════════════════════════
   COIN SCENE — lights, coin, FX
══════════════════════════════════════════════ */
const CHROMA_OFFSET = new THREE.Vector2(0.0008, 0.0008);

function CoinScene() {
  return (
    <>
      <GoldEnvironment />

      {/* Warm fill lights that complement the gold */}
      <ambientLight intensity={0.3} color="#2a1a00" />
      <pointLight position={[0, 4, 4]} intensity={4} color="#FFD700" distance={12} decay={2} />
      <pointLight position={[3, -2, 3]} intensity={2} color="#FF8C00" distance={8} decay={2} />
      <pointLight position={[-3, 2, -3]} intensity={1} color="#8080FF" distance={8} decay={2} />

      <DustParticles />
      <Coin />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.45}
          luminanceSmoothing={0.3}
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

/* ══════════════════════════════════════════════
   DEFAULT EXPORT — Canvas wrapper
══════════════════════════════════════════════ */
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
        camera={{ position: [0, 0, 3.6], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
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
