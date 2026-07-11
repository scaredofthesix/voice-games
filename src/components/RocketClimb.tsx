import { useEffect, useRef } from 'react';
import type { LadderZone } from '../gameLogic';

// Canvas rocket-climb scene for Word Ladder. Purely visual: the rocket rises as
// the climb `progress` (0..1) grows, the background shifts through altitude
// zones (ground -> clouds -> sky -> space), and each correct word triggers an
// exhaust boost. Game state and rules live in gameLogic.ts and WordLadderGame,
// so the game stays unit testable and this canvas is decorative (aria-hidden).

export type RocketTheme = 'earth' | 'mars' | 'nebula';

interface RocketClimbProps {
  progress: number; // 0..1 climb progress
  zone: LadderZone;
  boostNonce: number; // bump on each successful climb step
  won: boolean;
  theme?: RocketTheme;
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
  theme: RocketTheme;
}

const FLAME = ['#fbbf24', '#f97316', '#ef4444', '#fde68a'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function zoneColors(zone: LadderZone, theme: RocketTheme): [string, string] {
  if (theme === 'mars') {
    switch (zone) {
      case 'ground':
        return ['#f97316', '#7c2d12'];
      case 'clouds':
        return ['#fed7aa', '#f97316'];
      case 'sky':
        return ['#9a3412', '#431407'];
      case 'space':
        return ['#1e0a03', '#450a0a'];
    }
  } else if (theme === 'nebula') {
    switch (zone) {
      case 'ground':
        return ['#06b6d4', '#4a044e'];
      case 'clouds':
        return ['#fae8ff', '#0284c7'];
      case 'sky':
        return ['#701a75', '#1e1b4b'];
      case 'space':
        return ['#042f2e', '#0f172a'];
    }
  } else {
    // earth (default)
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
}

function drawBackground(c: CanvasRenderingContext2D, s: ClimbState): void {
  const { w, h, zone, theme } = s;
  const [top, bottom] = zoneColors(zone, theme);
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

  // Theme-specific rich environments:
  if (theme === 'earth') {
    if (zone === 'space' || zone === 'sky') {
      // Draw a beautiful blue Earth at the bottom of the viewport (curved arc)
      c.save();
      c.fillStyle = '#1e3a8a'; // ocean
      c.beginPath();
      c.arc(w / 2, h + 180, 240, 0, Math.PI * 2);
      c.fill();
      // Draw green continents
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.arc(w / 2 - 40, h + 10, 50, 0, Math.PI * 2);
      c.arc(w / 2 + 50, h + 40, 60, 0, Math.PI * 2);
      c.fill();
      // Draw atmosphere glow
      c.strokeStyle = 'rgba(125, 211, 252, 0.4)';
      c.lineWidth = 8;
      c.beginPath();
      c.arc(w / 2, h + 180, 244, Math.PI, 0);
      c.stroke();
      c.restore();

      // Cute little moon in the upper right
      c.save();
      c.fillStyle = '#fef08a';
      c.beginPath();
      c.arc(w - 40, 50, 12, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    // Flying birds in lower atmosphere
    if (zone === 'ground' || zone === 'clouds') {
      c.save();
      c.strokeStyle = '#475569';
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 150 + s.t * 0.3) % (w + 60)) - 30;
        const by = h * 0.4 + Math.sin(s.t * 0.1 + i) * 10;
        // Draw simple bird "v" wings
        c.beginPath();
        c.moveTo(bx - 6, by);
        c.quadraticCurveTo(bx - 3, by - 4, bx, by);
        c.quadraticCurveTo(bx + 3, by - 4, bx + 6, by);
        c.stroke();
      }
      c.restore();
    }

  } else if (theme === 'mars') {
    // Draw red planet Mars arc at the bottom or Martian mountains!
    if (zone === 'space' || zone === 'sky') {
      c.save();
      c.fillStyle = '#9a3412'; // rusty red surface
      c.beginPath();
      c.arc(w / 2, h + 180, 240, 0, Math.PI * 2);
      c.fill();
      // Dark red iron oxide craters
      c.fillStyle = '#451a03';
      c.beginPath();
      c.arc(w / 2 - 30, h + 20, 30, 0, Math.PI * 2);
      c.arc(w / 2 + 40, h + 10, 45, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    if (zone === 'ground' || zone === 'clouds') {
      // Martian mountain ridges
      c.save();
      c.fillStyle = '#7c2d12';
      c.beginPath();
      c.moveTo(0, h - 18);
      c.lineTo(w * 0.25, h - 45);
      c.lineTo(w * 0.5, h - 25);
      c.lineTo(w * 0.75, h - 55);
      c.lineTo(w, h - 18);
      c.closePath();
      c.fill();
      c.restore();
    }

  } else if (theme === 'nebula') {
    // Glowing ringed Saturn-like planet floating and swirling purple mist
    c.save();
    // Swirling purple nebula rings
    c.strokeStyle = 'rgba(168, 85, 247, 0.15)';
    c.lineWidth = 14;
    c.beginPath();
    c.arc(w / 2, h / 2, 70 + Math.sin(s.t * 0.04) * 8, 0, Math.PI * 2);
    c.stroke();

    // Floating planet with rings in upper corner
    const px = w * 0.25;
    const py = h * 0.25;
    // Rings
    c.strokeStyle = '#f472b6';
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(px, py, 22, 6, Math.PI / 6, 0, Math.PI * 2);
    c.stroke();
    // Planet body
    c.fillStyle = '#ec4899';
    c.beginPath();
    c.arc(px, py, 11, 0, Math.PI * 2);
    c.fill();

    // Cute flying green UFO in space!
    const ux = w * 0.75 + Math.sin(s.t * 0.03) * 20;
    const uy = h * 0.35 + Math.cos(s.t * 0.05) * 15;
    c.fillStyle = '#a855f7'; // dome
    c.beginPath();
    c.arc(ux, uy - 2, 6, Math.PI, 0);
    c.fill();
    c.fillStyle = '#10b981'; // saucer body
    c.beginPath();
    c.ellipse(ux, uy, 12, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // drifting clouds or cosmic dust in the lower zones
  if (zone === 'ground' || zone === 'clouds') {
    c.fillStyle = theme === 'mars' ? 'rgba(254,215,170,0.22)' : theme === 'nebula' ? 'rgba(217,70,239,0.18)' : 'rgba(255,255,255,0.36)';
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
    c.fillStyle = theme === 'mars' ? '#9a3412' : theme === 'nebula' ? '#14b8a6' : '#16a34a';
    c.fillRect(0, h - 18, w, 18);
  }
}

function updateParticles(c: CanvasRenderingContext2D, s: ClimbState, dtFactor: number): void {
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vy += 0.12 * dtFactor;
    p.life += dtFactor;
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
  const size = Math.min(s.w, s.h) * 0.18;

  c.save();

  // Apply subtle flight hover bobbing
  const hoverY = Math.sin(s.t * 0.15) * 2;
  const ry = rocketY + hoverY;

  // 1. Sleek exhaust nozzle flame trail
  const flamePulse = 1 + 0.15 * Math.sin(s.t * 0.4);
  const flameHeight = size * (0.8 + 0.3 * flamePulse);

  // Outer red flame
  c.save();
  c.shadowColor = '#ef4444';
  c.shadowBlur = 15;
  const outerG = c.createLinearGradient(cx, ry, cx, ry + flameHeight);
  outerG.addColorStop(0, '#f97316');
  outerG.addColorStop(0.5, '#ef4444');
  outerG.addColorStop(1, 'rgba(239, 68, 68, 0)');
  c.fillStyle = outerG;
  c.beginPath();
  c.moveTo(cx - size * 0.18, ry + size * 0.35);
  c.lineTo(cx + size * 0.18, ry + size * 0.35);
  c.quadraticCurveTo(cx + size * 0.25, ry + size * 0.8, cx, ry + flameHeight);
  c.quadraticCurveTo(cx - size * 0.25, ry + size * 0.8, cx - size * 0.18, ry + size * 0.35);
  c.closePath();
  c.fill();

  // Inner yellow/white core
  const innerG = c.createLinearGradient(cx, ry, cx, ry + flameHeight * 0.6);
  innerG.addColorStop(0, '#ffffff');
  innerG.addColorStop(0.4, '#fbbf24');
  innerG.addColorStop(1, 'rgba(245, 158, 11, 0)');
  c.fillStyle = innerG;
  c.beginPath();
  c.moveTo(cx - size * 0.09, ry + size * 0.35);
  c.lineTo(cx + size * 0.09, ry + size * 0.35);
  c.lineTo(cx, ry + flameHeight * 0.65);
  c.closePath();
  c.fill();
  c.restore();

  // 2. Left stabilizer wing
  c.fillStyle = '#ef4444'; // crimson fin
  c.beginPath();
  c.moveTo(cx - size * 0.15, ry + size * 0.1);
  c.lineTo(cx - size * 0.38, ry + size * 0.42);
  c.lineTo(cx - size * 0.15, ry + size * 0.35);
  c.closePath();
  c.fill();
  // wing detail
  c.fillStyle = '#991b1b';
  c.beginPath();
  c.moveTo(cx - size * 0.15, ry + size * 0.22);
  c.lineTo(cx - size * 0.32, ry + size * 0.39);
  c.lineTo(cx - size * 0.15, ry + size * 0.34);
  c.closePath();
  c.fill();

  // 3. Right stabilizer wing
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.moveTo(cx + size * 0.15, ry + size * 0.1);
  c.lineTo(cx + size * 0.38, ry + size * 0.42);
  c.lineTo(cx + size * 0.15, ry + size * 0.35);
  c.closePath();
  c.fill();
  // wing detail
  c.fillStyle = '#991b1b';
  c.beginPath();
  c.moveTo(cx + size * 0.15, ry + size * 0.22);
  c.lineTo(cx + size * 0.32, ry + size * 0.39);
  c.lineTo(cx + size * 0.15, ry + size * 0.34);
  c.closePath();
  c.fill();

  // 4. Central engine nozzle
  c.fillStyle = '#475569'; // steel gray nozzle
  c.beginPath();
  const nx = cx - size * 0.12;
  const ny = ry + size * 0.32;
  const nw = size * 0.24;
  const nh = size * 0.08;
  c.rect(nx, ny, nw, nh);
  c.fill();

  // 5. Main Fuselage Body (bullet-shape with metallic gradient)
  const bodyGrad = c.createLinearGradient(cx - size * 0.2, ry, cx + size * 0.2, ry);
  bodyGrad.addColorStop(0, '#f1f5f9');
  bodyGrad.addColorStop(0.3, '#ffffff');
  bodyGrad.addColorStop(0.7, '#cbd5e1');
  bodyGrad.addColorStop(1, '#94a3b8');
  c.fillStyle = bodyGrad;

  c.beginPath();
  c.moveTo(cx - size * 0.18, ry + size * 0.32);
  c.lineTo(cx - size * 0.18, ry - size * 0.1);
  // sleek rounded cone nose
  c.quadraticCurveTo(cx - size * 0.18, ry - size * 0.55, cx, ry - size * 0.72);
  c.quadraticCurveTo(cx + size * 0.18, ry - size * 0.55, cx + size * 0.18, ry - size * 0.1);
  c.lineTo(cx + size * 0.18, ry + size * 0.32);
  c.closePath();
  c.fill();

  // 6. Red tip nose cone trim
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.moveTo(cx - size * 0.13, ry - size * 0.44);
  c.quadraticCurveTo(cx - size * 0.1, ry - size * 0.6, cx, ry - size * 0.72);
  c.quadraticCurveTo(cx + size * 0.1, ry - size * 0.6, cx + size * 0.13, ry - size * 0.44);
  c.quadraticCurveTo(cx, ry - size * 0.49, cx - size * 0.13, ry - size * 0.44);
  c.closePath();
  c.fill();

  // 7. Cockpit circular window
  const winRadius = size * 0.12;
  const winY = ry - size * 0.12;

  // Window rim
  c.fillStyle = '#475569';
  c.beginPath();
  c.arc(cx, winY, winRadius, 0, Math.PI * 2);
  c.fill();

  // Glass background
  c.fillStyle = '#38bdf8'; // sky blue
  c.beginPath();
  c.arc(cx, winY, winRadius * 0.8, 0, Math.PI * 2);
  c.fill();

  // Cute Little Alien Pilot! 👽
  c.fillStyle = '#22c55e'; // alien green head
  c.beginPath();
  c.ellipse(cx, winY + 3, winRadius * 0.5, winRadius * 0.4, 0, 0, Math.PI * 2);
  c.fill();

  // Alien eyes
  c.fillStyle = '#000000';
  c.beginPath();
  c.ellipse(cx - 3, winY + 1, 2, 3, Math.PI / 12, 0, Math.PI * 2);
  c.ellipse(cx + 3, winY + 1, 2, 3, -Math.PI / 12, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff'; // sparkle
  c.beginPath();
  c.arc(cx - 2.5, winY, 0.6, 0, Math.PI * 2);
  c.arc(cx + 3.5, winY, 0.6, 0, Math.PI * 2);
  c.fill();

  // Glass glare shine
  c.fillStyle = 'rgba(255, 255, 255, 0.4)';
  c.beginPath();
  c.arc(cx - 3, winY - 3, 2, 0, Math.PI * 2);
  c.fill();

  // 8. Lateral body lines / rivets
  c.strokeStyle = '#94a3b8';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(cx - size * 0.18, ry + size * 0.15);
  c.lineTo(cx + size * 0.18, ry + size * 0.15);
  c.stroke();

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
    theme: props.theme || 'earth',
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
    stateRef.current.theme = props.theme || 'earth';
  }, [props.theme]);

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

    let lastTime = performance.now();

    const frame = () => {
      const s = stateRef.current;
      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;
      if (dt > 100) dt = 16.67;
      const dtFactor = dt / (1000 / 160);

      s.t += dtFactor;
      s.progress += (s.targetProgress - s.progress) * (1 - Math.pow(1 - 0.1, dtFactor));

      drawBackground(c, s);
      updateParticles(c, s, dtFactor);
      drawRocket(c, s);

      if (s.won && Math.random() < 0.2 * dtFactor) {
        s.particles.push({
          x: Math.random() * s.w,
          y: 0,
          vx: (Math.random() - 0.5) * 2 * dtFactor,
          vy: (Math.random() * 2 + 1) * dtFactor,
          life: 0,
          maxLife: 60,
          color: pick(['#fde68a', '#ffffff', '#a5b4fc']),
          size: 2,
        });
      }
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dtFactor);

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
