import { useEffect, useRef } from 'react';
import type { BossPhase } from '../gameLogic';

// Canvas boss arena for Boss Fight. It is purely a visual layer: it draws the
// hero, the boss creature (an emoji rendered on the canvas), hit/attack effects
// and particles from the props it is given. All game state and rules live in
// gameLogic.ts and the BossFightGame component, so the game stays unit testable
// and this canvas is decorative (aria-hidden). Mirrors the GameCanvas pattern
// from Voice Racer (requestAnimationFrame loop reading a mutable stateRef).

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
  const { w, h, phase } = s;
  const top =
    phase === 'enraged' ? '#3b0764' : phase === 'angry' ? '#7c2d12' : '#0c4a6e';
  const bottom =
    phase === 'enraged' ? '#7f1d1d' : phase === 'angry' ? '#b45309' : '#1e3a8a';
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // distant stars
  c.globalAlpha = 0.5;
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 53) % w) + Math.sin((s.t + i * 30) * 0.01) * 4;
    const sy = (i * 37) % (h * 0.6);
    c.fillRect(sx, sy, 2, 2);
  }
  c.globalAlpha = 1;

  // ground
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.fillRect(0, h - 26, w, 26);
}

function drawHero(c: CanvasRenderingContext2D, s: ArenaState): void {
  const bob = Math.sin(s.t * 0.08) * 4;
  const recoil = s.lunge > 0 ? -8 : 0; // step back when the boss attacks
  const x = s.w * 0.2 + recoil;
  const y = s.h * 0.72 + bob;
  const size = Math.min(s.w, s.h) * 0.18;
  c.font = `${size}px serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('🧙', x, y);
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
  c.restore();
}

function updateOrbs(c: CanvasRenderingContext2D, s: ArenaState): void {
  for (let i = s.orbs.length - 1; i >= 0; i--) {
    const o = s.orbs[i];
    o.p += 0.06;
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

function updateParticles(c: CanvasRenderingContext2D, s: ArenaState): void {
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += 0.25;
    else p.vy += 0.08;
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
  });

  useEffect(() => {
    stateRef.current.bossEmoji = props.bossEmoji;
    stateRef.current.bossAnim = 0.25; // pop the new boss in
  }, [props.bossEmoji]);
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

  // A word hit: the hero throws a glowing orb, the boss shakes and flashes.
  useEffect(() => {
    if (props.hitNonce <= 0) return;
    const s = stateRef.current;
    s.shake = 12;
    s.flash = 10;
    s.orbs.push({
      x: s.w * 0.24,
      y: s.h * 0.68,
      tx: s.w * 0.72,
      ty: s.h * 0.42,
      p: 0,
      color: s.bossColor,
    });
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

    const frame = () => {
      const s = stateRef.current;
      s.t += 1;
      // ease bossAnim toward present(1) unless dying / won
      const target = s.defeated ? 0 : 1;
      s.bossAnim += (target - s.bossAnim) * 0.12;

      drawBackground(c, s);
      drawHero(c, s);
      updateOrbs(c, s);
      drawBoss(c, s);
      updateParticles(c, s);

      if (s.victory && s.t % 4 === 0) {
        spawnBurst(s, Math.random() * s.w, -4, pick(CONFETTI), 2, true);
      }
      if (s.shake > 0) s.shake--;
      if (s.flash > 0) s.flash--;
      if (s.lunge > 0) s.lunge--;

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
