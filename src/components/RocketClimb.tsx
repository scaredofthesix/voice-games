import { useEffect, useRef } from 'react';
import type { LadderZone } from '../gameLogic';

// Canvas rocket-climb scene for Word Ladder. Purely visual: the rocket rises as
// the climb `progress` (0..1) grows, the background shifts through altitude
// zones (ground -> clouds -> sky -> space), and each correct word triggers an
// exhaust boost. Game state and rules live in gameLogic.ts and WordLadderGame,
// so the game stays unit testable and this canvas is decorative (aria-hidden).

interface RocketClimbProps {
  progress: number; // 0..1 climb progress
  zone: LadderZone;
  boostNonce: number; // bump on each successful climb step
  won: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
}

interface ClimbState {
  w: number;
  h: number;
  t: number;
  progress: number; // eased display progress
  targetProgress: number;
  zone: LadderZone;
  won: boolean;
  shake: number;
  particles: Particle[];
  stars: Star[];
}

const FLAME = ['#fbbf24', '#f97316', '#ef4444', '#fde68a'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function zoneColors(zone: LadderZone): [string, string] {
  switch (zone) {
    case 'ground':
      return ['#7dd3fc', '#86efac'];
    case 'clouds':
      return ['#bae6fd', '#e0f2fe'];
    case 'sky':
      return ['#3b82f6', '#1d4ed8'];
    case 'space':
      return ['#0b1026', '#312e81'];
  }
}

function drawBackground(c: CanvasRenderingContext2D, s: ClimbState): void {
  const { w, h, zone } = s;
  const [top, bottom] = zoneColors(zone);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // stars (brighter in sky/space)
  const starAlpha = zone === 'space' ? 0.9 : zone === 'sky' ? 0.5 : 0.15;
  c.fillStyle = '#ffffff';
  for (const st of s.stars) {
    const tw = 0.6 + 0.4 * Math.sin((s.t + st.x) * 0.05);
    c.globalAlpha = starAlpha * tw;
    c.fillRect(st.x, st.y, st.r, st.r);
  }
  c.globalAlpha = 1;

  // drifting clouds in the lower zones
  if (zone === 'ground' || zone === 'clouds') {
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 120 + s.t * 0.4) % (w + 120)) - 60;
      const cy = h * 0.25 + i * 36;
      c.beginPath();
      c.arc(cx, cy, 18, 0, Math.PI * 2);
      c.arc(cx + 20, cy + 4, 14, 0, Math.PI * 2);
      c.arc(cx - 18, cy + 6, 12, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ground strip at the very bottom of the climb
  if (zone === 'ground') {
    c.fillStyle = '#16a34a';
    c.fillRect(0, h - 18, w, 18);
  }
}

function updateParticles(c: CanvasRenderingContext2D, s: ClimbState): void {
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life += 1;
    const alpha = 1 - p.life / p.maxLife;
    if (alpha <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    c.globalAlpha = alpha;
    c.fillStyle = p.color;
    c.fillRect(p.x, p.y, p.size, p.size);
  }
  c.globalAlpha = 1;
}

function drawRocket(c: CanvasRenderingContext2D, s: ClimbState): void {
  const cx = s.w / 2 + (s.shake > 0 ? (Math.random() - 0.5) * 6 : 0);
  // rocket rises from near the bottom to near the top as progress grows
  const rocketY = s.h * 0.86 - s.progress * (s.h * 0.72);
  const size = Math.min(s.w, s.h) * 0.16;

  // animated exhaust flame, straight below the rocket
  const flick = 0.7 + Math.random() * 0.6;
  c.fillStyle = pick(FLAME);
  c.beginPath();
  c.moveTo(cx - size * 0.18, rocketY + size * 0.5);
  c.lineTo(cx + size * 0.18, rocketY + size * 0.5);
  c.lineTo(cx, rocketY + size * (0.5 + 0.5 * flick));
  c.closePath();
  c.fill();

  // The 🚀 glyph points up-and-to-the-right; rotate it -45 degrees around its
  // centre so the nose points straight up and it reads as flying vertically.
  c.save();
  c.translate(cx, rocketY);
  c.rotate(-Math.PI / 4);
  c.font = `${size}px serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('🚀', 0, 0);
  c.restore();
}

function emitExhaust(s: ClimbState): void {
  const cx = s.w / 2;
  const rocketY = s.h * 0.86 - s.progress * (s.h * 0.72);
  for (let i = 0; i < 14; i++) {
    s.particles.push({
      x: cx + (Math.random() - 0.5) * 14,
      y: rocketY + 14,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1,
      life: 0,
      maxLife: Math.random() * 22 + 12,
      color: pick(FLAME),
      size: Math.random() * 4 + 2,
    });
  }
}

export function RocketClimb(props: RocketClimbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ClimbState>({
    w: 400,
    h: 320,
    t: 0,
    progress: 0,
    targetProgress: props.progress,
    zone: props.zone,
    won: props.won,
    shake: 0,
    particles: [],
    stars: [],
  });

  useEffect(() => {
    stateRef.current.targetProgress = props.progress;
  }, [props.progress]);
  useEffect(() => {
    stateRef.current.zone = props.zone;
  }, [props.zone]);
  useEffect(() => {
    stateRef.current.won = props.won;
  }, [props.won]);

  useEffect(() => {
    if (props.boostNonce <= 0) return;
    const s = stateRef.current;
    s.shake = 10;
    emitExhaust(s);
  }, [props.boostNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return; // jsdom or unsupported: render the element, skip animation
    const c = ctx;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cw = parent.clientWidth || 400;
      canvas.width = cw;
      canvas.height = Math.max(280, Math.min(420, Math.round(cw * 0.8)));
      const s = stateRef.current;
      s.w = canvas.width;
      s.h = canvas.height;
      s.stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * s.w,
        y: Math.random() * s.h,
        r: Math.random() < 0.2 ? 2 : 1,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = () => {
      const s = stateRef.current;
      s.t += 1;
      s.progress += (s.targetProgress - s.progress) * 0.1;

      drawBackground(c, s);
      updateParticles(c, s);
      drawRocket(c, s);

      if (s.won && s.t % 5 === 0) {
        s.particles.push({
          x: Math.random() * s.w,
          y: 0,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 1,
          life: 0,
          maxLife: 60,
          color: pick(['#fde68a', '#ffffff', '#a5b4fc']),
          size: 2,
        });
      }
      if (s.shake > 0) s.shake--;

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full block rounded-2xl"
      aria-hidden="true"
    />
  );
}
