'use client';

import { useEffect, useRef } from 'react';

/**
 * AmbientField · 全站环境氛围层
 *
 * 三层叠加：
 *   1. 粒子 canvas  — 稀疏金色尘埃，缓慢漂浮
 *   2. 雾气 div     — 极慢漂移的紫红/月雾色斑
 *   3. 烛火光晕     — 跟随鼠标的金色径向渐变
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
}

const PARTICLE_DENSITY = 0.000045;   // 每像素粒子数；1080p ≈ ~94 颗
const MAX_PARTICLES = 110;
const MIN_PARTICLES = 24;

export function AmbientField(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  /* ─── 烛火光晕：鼠标跟随 ─── */
  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    // 初始位置：屏幕上方 1/3，符合 hero 视觉重心
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
      // 鼠标离开窗口时，光晕回到中央偏上
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

  /* ─── 粒子 canvas：金色尘埃 ─── */
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
      r: 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.00006,   // 缓慢横向漂移
      vy: -0.00003 - Math.random() * 0.00007, // 整体微微上升
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      baseAlpha: 0.12 + Math.random() * 0.5,
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

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.phase += dt * 0.0006 * p.speed;

        // wrap 环绕
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.y > 1.02) p.y = -0.02;

        const twinkle = (Math.sin(p.phase) + 1) / 2;          // 0..1
        const alpha = p.baseAlpha * (0.55 + twinkle * 0.45);
        const px = p.x * width;
        const py = p.y * height;

        // 金色微光：内核 + 柔晕
        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3.2);
        grad.addColorStop(0, `rgba(232, 226, 208, ${alpha})`);
        grad.addColorStop(0.4, `rgba(212, 184, 115, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(212, 184, 115, 0)');
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
      {/* 雾气层 — 纯 CSS · 不消耗主线程 */}
      <div className="mist-veil" aria-hidden />

      {/* 粒子 canvas */}
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
