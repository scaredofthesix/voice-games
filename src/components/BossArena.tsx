import { useEffect, useRef } from 'react';
import type { BossPhase } from '../gameLogic';

// Canvas boss arena for Boss Fight. It is purely a visual layer: it draws the
// hero, the boss creature (an emoji rendered on the canvas), hit/attack effects
// and particles from the props it is given. All game state and rules live in
// gameLogic.ts and the BossFightGame component, so the game stays unit testable
// and this canvas is decorative (aria-hidden). Mirrors the GameCanvas pattern
// from Voice Racer (requestAnimationFrame loop reading a mutable stateRef).

export type BossTheme = 'castle' | 'lava' | 'forest' | 'abyss';

interface BossArenaProps {
  bossEmoji: string;
  bossColor: string;
  bossHpFrac: number; // 0..1 of the current boss
  phase: BossPhase;
  hitNonce: number; // bump on every word that hits the boss
  attackNonce: number; // bump when the boss attacks (a timed-out word)
  defeated: boolean; // final victory: fade the last boss out
  killNonce: number; // bump on every boss kill (celebration burst)
  victory: boolean; // whole gauntlet won
  bossName?: string; // name of the boss
  theme?: BossTheme;
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
  gravity: boolean;
}

interface Orb {
  x: number;
  y: number;
  tx: number;
  ty: number;
  p: number;
  color: string;
}

interface ArenaState {
  w: number;
  h: number;
  t: number;
  bossEmoji: string;
  bossColor: string;
  bossHpFrac: number;
  phase: BossPhase;
  defeated: boolean;
  victory: boolean;
  shake: number;
  flash: number;
  lunge: number;
  bossAnim: number; // 0 hidden .. 1 present (drives fade in/out)
  orbs: Orb[];
  particles: Particle[];
  bossName: string;
  theme: BossTheme;
  strikeAnim: number; // sword strike frame counter
}

const CONFETTI = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffffff'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function spawnBurst(
  s: ArenaState,
  x: number,
  y: number,
  color: string,
  n: number,
  gravity = false,
 ): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = Math.random() * 5 + 1.5;
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (gravity ? 0 : 1),
      life: 0,
      maxLife: Math.random() * 28 + 18,
      color,
      size: Math.random() * 4 + 2,
      gravity,
    });
  }
}

function drawBackground(c: CanvasRenderingContext2D, s: ArenaState): void {
  const { w, h, phase, theme } = s;
  let top = '#1e293b';
  let bottom = '#0f172a';

  if (theme === 'lava') {
    top = phase === 'enraged' ? '#991b1b' : phase === 'angry' ? '#782e10' : '#44403c';
    bottom = phase === 'enraged' ? '#450a0a' : phase === 'angry' ? '#451a03' : '#1c1917';
  } else if (theme === 'forest') {
    top = phase === 'enraged' ? '#3f6212' : phase === 'angry' ? '#14532d' : '#064e3b';
    bottom = phase === 'enraged' ? '#1a2e05' : phase === 'angry' ? '#052e16' : '#022c22';
  } else if (theme === 'abyss') {
    top = phase === 'enraged' ? '#4d072b' : phase === 'angry' ? '#2e1065' : '#172554';
    bottom = phase === 'enraged' ? '#701a75' : phase === 'angry' ? '#4c1d95' : '#0c4a6e';
  } else {
    // castle (default)
    top = phase === 'enraged' ? '#581c87' : phase === 'angry' ? '#312e81' : '#1e293b';
    bottom = phase === 'enraged' ? '#2e1065' : phase === 'angry' ? '#1e1b4b' : '#0f172a';
  }

  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // Distant decorations & Theme-specific rich environment:
  if (theme === 'castle') {
    // Draw castle brick wall patterns
    c.save();
    c.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    c.lineWidth = 2;
    // Horizontal bricks
    for (let y = 0; y < h - 26; y += 24) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
      // Vertical joints
      const shift = (y / 24) % 2 === 0 ? 0 : 20;
      for (let x = shift; x < w; x += 40) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 24);
        c.stroke();
      }
    }
    // Draw columns/pillars
    c.fillStyle = 'rgba(0, 0, 0, 0.15)';
    c.fillRect(w * 0.1, 0, 30, h);
    c.fillRect(w * 0.85, 0, 30, h);
    c.restore();

  } else if (theme === 'lava') {
    // Draw jagged caves, stalactites at the top, and waves of bubbling lava at the bottom!
    c.save();
    // Stalactites
    c.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let i = 0; i < w; i += 50) {
      const depth = 20 + ((i * 7) % 30) + Math.sin(s.t * 0.05 + i) * 3;
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + 25, depth);
      c.lineTo(i + 50, 0);
      c.fill();
    }
    // Bubbling lava waves at the bottom (above the solid floor)
    c.fillStyle = '#ea580c';
    c.beginPath();
    c.moveTo(0, h - 26);
    for (let x = 0; x <= w; x += 20) {
      const ly = h - 26 - 6 + Math.sin(s.t * 0.1 + x * 0.05) * 4;
      c.lineTo(x, ly);
    }
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();

    // Small glowing rising bubbles
    c.fillStyle = '#f97316';
    c.globalAlpha = 0.6;
    for (let i = 0; i < 6; i++) {
      const bx = ((i * 83 + s.t * 0.5) % w);
      const by = h - 35 - ((s.t * 0.8 + i * 25) % 60);
      c.beginPath();
      c.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

  } else if (theme === 'forest') {
    // Draw lush tree silhouettes and glowing fireflies
    c.save();
    c.fillStyle = 'rgba(4, 47, 46, 0.45)';
    // Tree silhouettes on left & right sides
    for (let i = 0; i < 4; i++) {
      const tx = i * 25 - 10;
      const ty = h - 26 - 60 - i * 15;
      c.beginPath();
      c.moveTo(tx, h - 26);
      c.lineTo(tx + 25, ty);
      c.lineTo(tx + 50, h - 26);
      c.fill();

      const rx = w - 40 - i * 25;
      c.beginPath();
      c.moveTo(rx, h - 26);
      c.lineTo(rx + 25, ty);
      c.lineTo(rx + 50, h - 26);
      c.fill();
    }
    // Floating glowing yellow/green fireflies
    c.fillStyle = '#a3e635';
    for (let i = 0; i < 8; i++) {
      const fx = ((i * 97 + s.t * 0.4) % (w - 40)) + 20;
      const fy = ((i * 47 + Math.sin(s.t * 0.08 + i) * 15) % (h * 0.6)) + h * 0.1;
      const size = 1.5 + Math.abs(Math.sin(s.t * 0.05 + i)) * 2;
      c.globalAlpha = 0.3 + Math.abs(Math.sin(s.t * 0.1 + i)) * 0.7;
      c.beginPath();
      c.arc(fx, fy, size, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

  } else if (theme === 'abyss') {
    // Draw stars and swirling cosmic void nebula circles in background
    c.save();
    c.globalAlpha = 0.3;
    c.strokeStyle = '#a855f7';
    c.lineWidth = 1.5;
    // Draw concentric cosmic rift lines
    c.beginPath();
    c.arc(w / 2, h / 2, 50 + Math.sin(s.t * 0.03) * 10, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 90 + Math.cos(s.t * 0.02) * 15, 0, Math.PI * 2);
    c.stroke();

    // Glowing dark portals
    c.fillStyle = 'rgba(139, 92, 246, 0.15)';
    c.beginPath();
    c.arc(w / 2, h / 2, 35, 0, Math.PI * 2);
    c.fill();

    // Shimmering cosmic stars
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 15; i++) {
      const sx = ((i * 61) % w);
      const sy = (i * 31) % (h * 0.7);
      const alpha = 0.2 + Math.abs(Math.sin(s.t * 0.05 + i)) * 0.8;
      c.globalAlpha = alpha;
      c.fillRect(sx, sy, 2.5, 2.5);
    }
    c.restore();
  }

  // ground
  c.fillStyle = theme === 'lava' ? '#450a0a' : theme === 'forest' ? '#064e3b' : theme === 'abyss' ? '#120b24' : '#1e1b4b';
  c.fillRect(0, h - 26, w, 26);
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.fillRect(0, h - 26, w, 4); // dark rim edge
}

function drawHero(c: CanvasRenderingContext2D, s: ArenaState): void {
  const bob = Math.sin(s.t * 0.08) * 4;
  const recoil = s.lunge > 0 ? -8 : 0; // step back when the boss attacks
  
  // Calculate forward lunge distance when striking the boss - lunge quickly all the way to the boss
  const lungeDistance = s.w * 0.44;
  const strikeLunge = s.strikeAnim > 0 
    ? Math.sin(((16 - s.strikeAnim) / 16) * Math.PI) * lungeDistance
    : 0;
    
  const x = s.w * 0.22 + recoil + strikeLunge;
  const size = Math.min(s.w, s.h) * 0.33;
  const y = s.h * 0.7 + bob;

  // 1. Ground shadow
  c.save();
  c.globalAlpha = 0.28;
  c.fillStyle = '#000000';
  c.beginPath();
  c.ellipse(x, s.h * 0.86, size * 0.42, size * 0.14, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // 2. Draw the Knight (рыцарь)
  c.save();
  c.globalAlpha = 1;
  c.shadowColor = 'rgba(0, 0, 0, 0.4)';
  c.shadowBlur = 4;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 3;

  // Helper values for drawing parts of the knight
  const headRadius = size * 0.16;
  const headX = x;
  const headY = y - size * 0.28;

  // Draw Legs & Greaves
  c.fillStyle = '#475569'; // steel blue legs
  c.fillRect(x - size * 0.12, y + size * 0.08, size * 0.08, size * 0.15); // left leg
  c.fillRect(x + size * 0.04, y + size * 0.08, size * 0.08, size * 0.15); // right leg
  
  // Steel Sabatons (boots)
  c.fillStyle = '#334155';
  c.fillRect(x - size * 0.15, y + size * 0.21, size * 0.11, size * 0.05); // left boot
  c.fillRect(x + size * 0.04, y + size * 0.21, size * 0.11, size * 0.05); // right boot

  // Draw Knight Body (Steel Breastplate)
  c.fillStyle = '#94a3b8'; // steel gray breastplate
  c.beginPath();
  c.moveTo(x - size * 0.16, y - size * 0.14);
  c.lineTo(x + size * 0.16, y - size * 0.14);
  c.lineTo(x + size * 0.14, y + size * 0.1);
  c.lineTo(x - size * 0.14, y + size * 0.1);
  c.closePath();
  c.fill();

  // Draw Golden Cross/Emblem on Breastplate
  c.fillStyle = '#fbbf24'; // bright gold
  c.fillRect(x - 3, y - size * 0.08, 6, size * 0.13); // vertical line
  c.fillRect(x - size * 0.07, y - size * 0.04, size * 0.14, 6); // horizontal line

  // Draw Shoulders (Pauldrons)
  c.fillStyle = '#64748b';
  c.beginPath();
  c.arc(x - size * 0.16, y - size * 0.12, size * 0.06, 0, Math.PI * 2);
  c.arc(x + size * 0.16, y - size * 0.12, size * 0.06, 0, Math.PI * 2);
  c.fill();

  // Draw Head / Helmet
  c.fillStyle = '#475569'; // darker steel for helm
  c.beginPath();
  c.arc(headX, headY, headRadius, 0, Math.PI * 2);
  c.fill();

  // Visor Slit
  c.fillStyle = '#0f172a'; // obsidian visor cavity
  c.fillRect(headX - headRadius * 0.8, headY - headRadius * 0.2, headRadius * 1.6, headRadius * 0.3);

  // Visor Eye Gleams (glowing cyan eyes)
  c.fillStyle = '#38bdf8';
  c.beginPath();
  c.arc(headX - headRadius * 0.22, headY - headRadius * 0.05, 2.5, 0, Math.PI * 2);
  c.arc(headX + headRadius * 0.22, headY - headRadius * 0.05, 2.5, 0, Math.PI * 2);
  c.fill();

  // Royal Feather Plume on Helmet
  c.fillStyle = '#ef4444'; // royal red plume
  c.beginPath();
  c.moveTo(headX, headY - headRadius);
  c.quadraticCurveTo(headX - size * 0.12, headY - headRadius * 1.8, headX - size * 0.22, headY - headRadius * 1.3);
  c.quadraticCurveTo(headX - size * 0.1, headY - headRadius * 1.1, headX, headY - headRadius);
  c.fill();

  // Draw Knight's Shield (Heater Shield) on left arm / side
  c.save();
  c.translate(x - size * 0.15, y + size * 0.02);
  c.fillStyle = '#2563eb'; // blue shield background
  c.beginPath();
  c.moveTo(-size * 0.08, -size * 0.1);
  c.lineTo(size * 0.08, -size * 0.1);
  c.lineTo(size * 0.08, 0);
  c.quadraticCurveTo(size * 0.08, size * 0.1, 0, size * 0.14);
  c.quadraticCurveTo(-size * 0.08, size * 0.1, -size * 0.08, 0);
  c.closePath();
  c.fill();

  // Gold rim around shield
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 2;
  c.stroke();
  c.restore();

  // Draw Sword (animates on strike!)
  c.save();
  
  // Resting hand position
  const handX = x + size * 0.12;
  const handY = y + size * 0.04;
  
  let swordAngle = -Math.PI / 4; // default raised angle
  let hOffsetX = 0;
  let hOffsetY = 0;
  
  if (s.strikeAnim > 0) {
    const progress = (16 - s.strikeAnim) / 16;
    // Hand lunges forward and downward
    hOffsetX = Math.sin(progress * Math.PI) * 22;
    hOffsetY = -Math.cos(progress * Math.PI) * 12;
    
    // Sword sweeps downwards in a beautiful slashing motion
    swordAngle = -Math.PI * 0.55 + progress * (Math.PI * 1.1);
  }
  
  c.translate(handX + hOffsetX, handY + hOffsetY);
  c.rotate(swordAngle);

  // Draw Hilt (guard + grip + pommel)
  c.fillStyle = '#78350f'; // wood/leather grip
  c.fillRect(-2, 0, 4, size * 0.12); // handle grip
  
  c.fillStyle = '#fbbf24'; // gold guard and pommel
  c.fillRect(-size * 0.08, 0, size * 0.16, 3); // hand guard
  c.beginPath();
  c.arc(0, size * 0.12, 3, 0, Math.PI * 2); // pommel cap
  c.fill();

  // Draw Blade
  const bladeLen = size * 0.44;
  const bladeHalfW = size * 0.032;
  const gBlade = c.createLinearGradient(-bladeHalfW, 0, bladeHalfW, 0);
  gBlade.addColorStop(0, '#e2e8f0'); // lighter side
  gBlade.addColorStop(0.5, '#cbd5e1'); // center seam
  gBlade.addColorStop(1, '#94a3b8'); // darker shadow side
  c.fillStyle = gBlade;

  c.beginPath();
  c.moveTo(-bladeHalfW, 0);
  c.lineTo(-bladeHalfW * 0.6, -bladeLen * 0.85);
  c.lineTo(0, -bladeLen); // sharp tip
  c.lineTo(bladeHalfW * 0.6, -bladeLen * 0.85);
  c.lineTo(bladeHalfW, 0);
  c.closePath();
  c.fill();

  // Draw bevel center ridge line on blade for 3D depth
  c.strokeStyle = '#475569';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -bladeLen + 2);
  c.stroke();

  c.restore(); // sword

  c.restore(); // Knight body
}

function drawBoss(c: CanvasRenderingContext2D, s: ArenaState): void {
  if (s.bossAnim < 0.02) return;
  const bob = Math.sin(s.t * 0.06) * 6;
  const sx = s.shake > 0 ? (Math.random() - 0.5) * 14 : 0;
  const sy = s.shake > 0 ? (Math.random() - 0.5) * 14 : 0;
  const lunge = s.lunge > 0 ? -22 : 0; // boss lunges toward the hero on attack
  const cx = s.w * 0.72 + sx + lunge;
  const cy = s.h * 0.42 + bob + sy;
  const size = Math.min(s.w, s.h) * 0.34 * (0.4 + 0.6 * s.bossAnim);

  // boss HP bar above the creature
  if (!s.defeated && s.bossAnim > 0.6) {
    const bw = size * 1.2;
    const bx = cx - bw / 2;
    const by = cy - size * 0.78;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(bx - 2, by - 2, bw + 4, 12);
    c.fillStyle = '#1f2937';
    c.fillRect(bx, by, bw, 8);
    c.fillStyle = s.bossColor;
    c.fillRect(bx, by, bw * Math.max(0, s.bossHpFrac), 8);
  }

  c.save();
  c.globalAlpha = s.bossAnim;

  // Reverted back to classic emoji boss as requested by user
  c.font = `${size}px serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(s.bossEmoji, cx, cy);

  // red hit flash overlay
  if (s.flash > 0) {
    c.globalAlpha = (s.flash / 10) * 0.5 * s.bossAnim;
    c.fillStyle = '#ef4444';
    c.beginPath();
    c.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    c.fill();
  }

  // beautiful sword slash sweep arc overlay
  if (s.strikeAnim > 0) {
    const progress = (16 - s.strikeAnim) / 16;
    c.save();
    c.globalAlpha = Math.sin(progress * Math.PI); // fade in and out nicely
    
    // Position of the slash arc slightly shifted/slanted diagonally
    c.translate(cx, cy);
    c.rotate(-Math.PI / 6); // slanted cut angle
    
    // Draw glowing energy aura
    c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    c.shadowColor = '#38bdf8'; // bright magic cyan glow
    c.shadowBlur = 18;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    
    c.beginPath();
    // Beautiful sweep arc
    c.arc(0, 0, size * 0.7, -Math.PI * 0.6, Math.PI * 0.6);
    c.lineWidth = 8 * (1 - progress * 0.5);
    c.stroke();
    
    // Bright white sharp center line
    c.shadowBlur = 0;
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.5;
    c.stroke();

    // Draw little yellow-white impact spark particles exploding from the slash
    c.fillStyle = '#fbbf24';
    for (let i = 0; i < 4; i++) {
      const sa = -Math.PI * 0.4 + i * (Math.PI * 0.3) + Math.sin(s.t + i) * 0.2;
      const sr = size * (0.6 + progress * 0.2);
      const spSize = Math.max(1.5, 4 * (1 - progress));
      c.fillRect(Math.cos(sa) * sr, Math.sin(sa) * sr, spSize, spSize);
    }
    
    c.restore();
  }

  c.restore();
}

function updateOrbs(c: CanvasRenderingContext2D, s: ArenaState, dtFactor: number): void {
  for (let i = s.orbs.length - 1; i >= 0; i--) {
    const o = s.orbs[i];
    o.p += 0.06 * dtFactor;
    const x = o.x + (o.tx - o.x) * o.p;
    const y = o.y + (o.ty - o.y) * o.p - Math.sin(o.p * Math.PI) * 40;
    c.save();
    c.shadowBlur = 14;
    c.shadowColor = o.color;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = o.color;
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.fill();
    c.restore();
    if (o.p >= 1) s.orbs.splice(i, 1);
  }
}

function updateParticles(c: CanvasRenderingContext2D, s: ArenaState, dtFactor: number): void {
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    if (p.gravity) p.vy += 0.25 * dtFactor;
    else p.vy += 0.08 * dtFactor;
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

export function BossArena(props: BossArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ArenaState>({
    w: 400,
    h: 280,
    t: 0,
    bossEmoji: props.bossEmoji,
    bossColor: props.bossColor,
    bossHpFrac: props.bossHpFrac,
    phase: props.phase,
    defeated: props.defeated,
    victory: props.victory,
    shake: 0,
    flash: 0,
    lunge: 0,
    bossAnim: 0,
    orbs: [],
    particles: [],
    bossName: props.bossName || '',
    theme: props.theme || 'castle',
    strikeAnim: 0,
  });

  useEffect(() => {
    stateRef.current.theme = props.theme || 'castle';
  }, [props.theme]);

  useEffect(() => {
    stateRef.current.bossEmoji = props.bossEmoji;
    stateRef.current.bossAnim = 0.25; // pop the new boss in
  }, [props.bossEmoji]);
  useEffect(() => {
    stateRef.current.bossName = props.bossName || '';
  }, [props.bossName]);
  useEffect(() => {
    stateRef.current.bossColor = props.bossColor;
  }, [props.bossColor]);
  useEffect(() => {
    stateRef.current.bossHpFrac = props.bossHpFrac;
  }, [props.bossHpFrac]);
  useEffect(() => {
    stateRef.current.phase = props.phase;
  }, [props.phase]);
  useEffect(() => {
    stateRef.current.victory = props.victory;
  }, [props.victory]);
  useEffect(() => {
    stateRef.current.defeated = props.defeated;
    if (props.defeated) {
      const s = stateRef.current;
      spawnBurst(s, s.w * 0.72, s.h * 0.42, s.bossColor, 40);
    }
  }, [props.defeated]);

  // Any boss kill: celebratory burst at the boss position.
  useEffect(() => {
    if (props.killNonce <= 0) return;
    const s = stateRef.current;
    spawnBurst(s, s.w * 0.72, s.h * 0.42, s.bossColor, 28);
  }, [props.killNonce]);

  // A word hit: the hero lunges forward and strikes, the boss shakes and flashes.
  useEffect(() => {
    if (props.hitNonce <= 0) return;
    const s = stateRef.current;
    s.shake = 12;
    s.flash = 10;
    s.strikeAnim = 16; // sword strike duration
  }, [props.hitNonce]);

  // A timed-out word: the boss lunges at the hero.
  useEffect(() => {
    if (props.attackNonce <= 0) return;
    const s = stateRef.current;
    s.lunge = 16;
    spawnBurst(s, s.w * 0.24, s.h * 0.68, '#ef4444', 16);
  }, [props.attackNonce]);

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
      canvas.height = Math.max(240, Math.min(340, Math.round(cw * 0.62)));
      stateRef.current.w = canvas.width;
      stateRef.current.h = canvas.height;
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
      // ease bossAnim toward present(1) unless dying / won
      const target = s.defeated ? 0 : 1;
      s.bossAnim += (target - s.bossAnim) * (1 - Math.pow(1 - 0.12, dtFactor));

      drawBackground(c, s);
      drawHero(c, s);
      updateOrbs(c, s, dtFactor);
      drawBoss(c, s);
      updateParticles(c, s, dtFactor);

      if (s.victory && Math.random() < 0.25 * dtFactor) {
        spawnBurst(s, Math.random() * s.w, -4, pick(CONFETTI), 2, true);
      }
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dtFactor);
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dtFactor);
      if (s.lunge > 0) s.lunge = Math.max(0, s.lunge - dtFactor);
      if (s.strikeAnim > 0) s.strikeAnim = Math.max(0, s.strikeAnim - dtFactor);

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
