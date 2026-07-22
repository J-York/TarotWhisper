'use client';

import { useEffect, useRef } from 'react';

/**
 * AmbientField · 全站环境氛围层 — 沉浸式神秘剧场
 *
 * 四层叠加：
 *   1. 粒子 canvas  — 金色与星辰蓝双色尘埃 + 星座连线
 *   2. 雾气 div     — 极慢漂移的紫红/月雾/靛蓝色斑
 *   3. 烛火光晕     — 跟随鼠标的金色+微蓝径向渐变
 *   4. 颗粒覆层     — 由 layout.tsx 的 .grain-overlay 提供
 *
 * 设计原则：
 *   · 任何一层都不应「抢眼」；离开页面看才察觉
 *   · 尊重 prefers-reduced-motion
 *   · 不接收 children · 不参与文档流 · 全部 fixed pointer-events:none
 */

interface Particle {
  x: number;            // 0..1 of width
  y: number;            // 0..1 of height
  r: number;            // px radius
  vx: number;           // per-frame drift
  vy: number;
  phase: number;        // 闪烁相位
  speed: number;        // 闪烁速度
  baseAlpha: number;    // 透明度基线
  hue: 'gold' | 'celestial'; // 色相
}

const PARTICLE_DENSITY = 0.00005;    // 每像素粒子数；1080p ≈ ~104 颗
const MAX_PARTICLES = 120;
const MIN_PARTICLES = 28;
const CONSTELLATION_DIST = 0.12;     // 星座连线阈值（占视口宽度的比例）
const CONSTELLATION_ALPHA = 0.06;    // 连线最大透明度

export function AmbientField(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  /* ─── 烛火光晕：鼠标跟随 ─── */
  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    aura.style.setProperty('--mx', '50%');
    aura.style.setProperty('--my', '32%');

    let raf = 0;
    let pendingX = window.innerWidth / 2;
    let pendingY = window.innerHeight * 0.32;

    const handleMove = (e: PointerEvent): void => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        aura.style.setProperty('--mx', `${pendingX}px`);
        aura.style.setProperty('--my', `${pendingY}px`);
        raf = 0;
      });
    };

    const handleLeave = (): void => {
      aura.style.setProperty('--mx', '50%');
      aura.style.setProperty('--my', '32%');
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ─── 粒子 canvas：双色星尘 + 星座连线 ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];
    let raf = 0;
    let lastT = 0;
    let visible = true;

    const buildParticles = (): void => {
      const count = Math.max(
        MIN_PARTICLES,
        Math.min(MAX_PARTICLES, Math.round(width * height * PARTICLE_DENSITY))
      );
      particles = Array.from({ length: count }, () => makeParticle());
    };

    const makeParticle = (): Particle => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.00006,
      vy: -0.00003 - Math.random() * 0.00007,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      baseAlpha: 0.12 + Math.random() * 0.5,
      hue: Math.random() < 0.72 ? 'gold' : 'celestial',
    });

    const resize = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      buildParticles();
    };

    const tick = (t: number): void => {
      const dt = lastT === 0 ? 16 : t - lastT;
      lastT = t;

      ctx.clearRect(0, 0, width, height);

      // ─── 星座连线 · 距离内的粒子间绘制极淡线段 ───
      const linkDist = CONSTELLATION_DIST * width;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x * width;
        const ay = a.y * height;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = b.x * width;
          const by = b.y * height;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = CONSTELLATION_ALPHA * (1 - dist / linkDist);
            ctx.strokeStyle = `rgba(178, 168, 214, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // ─── 粒子本体 ───
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.phase += dt * 0.0006 * p.speed;

        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.y > 1.02) p.y = -0.02;

        const twinkle = (Math.sin(p.phase) + 1) / 2;
        const alpha = p.baseAlpha * (0.55 + twinkle * 0.45);
        const px = p.x * width;
        const py = p.y * height;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3.2);
        if (p.hue === 'gold') {
          grad.addColorStop(0, `rgba(234, 228, 212, ${alpha})`);
          grad.addColorStop(0.4, `rgba(212, 184, 115, ${alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(212, 184, 115, 0)');
        } else {
          grad.addColorStop(0, `rgba(200, 210, 240, ${alpha * 0.9})`);
          grad.addColorStop(0.4, `rgba(139, 159, 212, ${alpha * 0.45})`);
          grad.addColorStop(1, 'rgba(139, 159, 212, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    const start = (): void => {
      if (raf) return;
      lastT = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const handleVisibility = (): void => {
      visible = document.visibilityState === 'visible';
      if (visible) start();
      else stop();
    };

    resize();
    start();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      {/* 雾幕层 — 纯 CSS · 不消耗主线程 */}
      <div className="mist-veil" aria-hidden />

      {/* 星尘 canvas · 含星座连线 */}
      <canvas
        ref={canvasRef}
        className="particle-field"
        aria-hidden
      />

      {/* 烛火光晕 · 跟随鼠标 */}
      <div ref={auraRef} className="candle-aura" aria-hidden />
    </>
  );
}
