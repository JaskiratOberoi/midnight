import { useEffect, useRef } from 'react';
import { sky, reducedMotion } from '../lib/sky';
import { nightAudio } from '../lib/audio';

type Star = {
  x: number; // 0..1
  y: number; // 0..1
  z: number; // depth 0.15..1 (1 = nearest, moves most)
  r: number; // radius px at dpr 1
  phase: number;
  speed: number;
  warm: boolean; // a few stars are slightly gold
};

type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

const STAR_COUNT = 260;

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const z = 0.15 + Math.pow(Math.random(), 1.6) * 0.85;
    stars.push({
      x: Math.random(),
      y: Math.random(),
      z,
      r: 0.5 + z * 1.5 + (Math.random() < 0.06 ? 1.2 : 0),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.4,
      warm: Math.random() < 0.12,
    });
  }
  return stars;
}

/** Pre-rendered glow sprite so we never build gradients per star per frame. */
function makeSprite(warm: boolean): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const core = warm ? '255, 240, 200' : '236, 234, 255';
  g.addColorStop(0, `rgba(${core}, 1)`);
  g.addColorStop(0.18, `rgba(${core}, 0.85)`);
  g.addColorStop(0.45, `rgba(${core}, 0.18)`);
  g.addColorStop(1, `rgba(${core}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * Canvas starfield: three-ish depth layers, twinkle, pointer parallax,
 * occasional meteors, a music-reactive shimmer and a warp streak that the
 * scene transition drives through `sky.warp`.
 */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const stars = makeStars();
    const spriteCool = makeSprite(false);
    const spriteWarm = makeSprite(true);
    const meteors: Meteor[] = [];
    const reduce = reducedMotion();

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let nextMeteor = 3 + Math.random() * 5;
    // smoothed pointer offset
    let ox = 0;
    let oy = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnMeteor = () => {
      const fromLeft = Math.random() < 0.5;
      const speed = 900 + Math.random() * 500;
      const angle = 0.35 + Math.random() * 0.25;
      meteors.push({
        x: fromLeft ? -40 + Math.random() * w * 0.4 : w * 0.6 + Math.random() * w * 0.4 + 40,
        y: -20 + Math.random() * h * 0.35,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 0.9 + Math.random() * 0.5,
      });
    };

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.42;
      const dim = Math.max(0, Math.min(1, sky.dim));
      const warp = sky.warp;
      const pulse = sky.pulse;

      // parallax easing
      const targetX = reduce ? 0 : sky.px;
      const targetY = reduce ? 0 : sky.py;
      ox += (targetX - ox) * Math.min(1, dt * 2.2);
      oy += (targetY - oy) * Math.min(1, dt * 2.2);

      ctx.globalCompositeOperation = 'lighter';

      for (const s of stars) {
        const sx = s.x * w + ox * s.z * 26;
        const sy = s.y * h + oy * s.z * 26;
        const twinkle = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * s.speed + s.phase);
        const alpha = dim * (0.35 + 0.65 * s.z) * twinkle * (1 + pulse * 0.35 * s.z);
        if (alpha <= 0.01) continue;

        if (warp > 0.01) {
          // streak away from the centre of the sky
          const dx = sx - cx;
          const dy = sy - cy;
          const len = Math.hypot(dx, dy) || 1;
          const stretch = warp * warp * (40 + 160 * s.z) * (len / Math.max(w, h) + 0.25);
          ctx.strokeStyle = s.warm ? `rgba(255,240,200,${alpha * 0.9})` : `rgba(236,234,255,${alpha * 0.9})`;
          ctx.lineWidth = s.r * 0.9;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (dx / len) * stretch, sy + (dy / len) * stretch);
          ctx.stroke();
        }

        const size = s.r * 6 * (1 + pulse * 0.25 * s.z);
        ctx.globalAlpha = alpha;
        ctx.drawImage(s.warm ? spriteWarm : spriteCool, sx - size / 2, sy - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      // meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const p = m.life / m.max;
        if (p >= 1 || m.y > h + 50) {
          meteors.splice(i, 1);
          continue;
        }
        const fade = Math.sin(p * Math.PI);
        const tail = 110 + 60 * fade;
        const nx = m.vx / Math.hypot(m.vx, m.vy);
        const ny = m.vy / Math.hypot(m.vx, m.vy);
        const g = ctx.createLinearGradient(m.x, m.y, m.x - nx * tail, m.y - ny * tail);
        g.addColorStop(0, `rgba(255,250,235,${0.9 * fade * dim})`);
        g.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - nx * tail, m.y - ny * tail);
        ctx.stroke();
        ctx.globalAlpha = fade * dim;
        ctx.drawImage(spriteWarm, m.x - 9, m.y - 9, 18, 18);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      // music -> gentle shimmer
      const { bass } = nightAudio.levels(1);
      sky.pulse += (bass * 0.9 - sky.pulse) * Math.min(1, dt * 6);

      if (!reduce) {
        nextMeteor -= dt;
        if (nextMeteor <= 0 && sky.dim > 0.5 && sky.warp < 0.05) {
          spawnMeteor();
          nextMeteor = 5 + Math.random() * 9;
        }
      }
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);

    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
