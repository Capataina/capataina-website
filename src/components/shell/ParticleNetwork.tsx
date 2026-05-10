"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  // Visibility flag toggled by IntersectionObserver — when the canvas is
  // scrolled off-screen, the rAF loop short-circuits before doing any
  // physics / drawing work. Same node count, same physics, just no CPU
  // burned drawing pixels nobody is looking at.
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    const particleCount = 320;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 2,
      });
    }
    particlesRef.current = particles;

    // Hoisted constants — physics tuning. Moved out of the per-particle body
    // so they're not redeclared 320× per frame.
    const cellSize = 120; // Matches maxDistance so a 3×3 cell scan is sufficient.
    const repulsionRadius = 80;
    const repulsionRadiusSquared = repulsionRadius * repulsionRadius;
    const maxDistance = 120;
    const maxDistanceSquared = maxDistance * maxDistance;
    const minDistance = 450; // Mouse repulsion radius.
    const minDistanceSquared = minDistance * minDistance;
    const fillStyle = "rgba(168, 150, 200, 0.6)";
    const TWO_PI = Math.PI * 2;

    // Grid is allocated once and cleared each frame. Map outperforms a plain
    // object for this access pattern (lots of dynamic keys, frequent clear).
    const grid = new Map<string, Particle[]>();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Animation loop
    const animate = () => {
      // Pause work entirely when off-screen — the IntersectionObserver
      // will restart us by calling animate() when we re-enter the viewport.
      if (!isVisibleRef.current) {
        animationRef.current = undefined;
        return;
      }

      const cw = canvas.width;
      const chh = canvas.height;
      const centerX = cw / 2;
      const centerY = chh / 2;
      const maxDistanceFromCenter = Math.sqrt(
        centerX * centerX + centerY * centerY
      );
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const particleLen = particles.length;

      ctx.clearRect(0, 0, cw, chh);

      // Build spatial grid for this frame
      grid.clear();
      for (let i = 0; i < particleLen; i++) {
        const p = particles[i];
        const key = `${Math.floor(p.x / cellSize)},${Math.floor(
          p.y / cellSize
        )}`;
        const cellList = grid.get(key);
        if (cellList) {
          cellList.push(p);
        } else {
          grid.set(key, [p]);
        }
      }

      ctx.lineWidth = 1;

      for (let i = 0; i < particleLen; i++) {
        const particle = particles[i];

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen edges like asteroids
        if (particle.x < 0) particle.x = cw;
        else if (particle.x > cw) particle.x = 0;
        if (particle.y < 0) particle.y = chh;
        else if (particle.y > chh) particle.y = 0;

        // Random drift to keep particles moving
        particle.vx += (Math.random() - 0.5) * 0.05;
        particle.vy += (Math.random() - 0.5) * 0.05;

        // Gentle center attraction to prevent edge clustering
        const toCenterX = centerX - particle.x;
        const toCenterY = centerY - particle.y;
        const distanceToCenter = Math.sqrt(
          toCenterX * toCenterX + toCenterY * toCenterY
        );
        if (distanceToCenter > 0) {
          const centerPullStrength =
            (distanceToCenter / maxDistanceFromCenter) * 0.015;
          particle.vx += (toCenterX / distanceToCenter) * centerPullStrength;
          particle.vy += (toCenterY / distanceToCenter) * centerPullStrength;
        }

        // Particle repulsion + connection drawing — single 3×3 neighbor walk.
        // Both operations need the same neighbor lookup; merging them halves
        // the cell scans and computes Math.sqrt at most once per pair.
        const col = Math.floor(particle.x / cellSize);
        const row = Math.floor(particle.y / cellSize);
        for (let dc = -1; dc <= 1; dc++) {
          for (let dr = -1; dr <= 1; dr++) {
            const cellList = grid.get(`${col + dc},${row + dr}`);
            if (!cellList) continue;
            const cellLen = cellList.length;
            for (let n = 0; n < cellLen; n++) {
              const otherParticle = cellList[n];
              if (particle === otherParticle) continue;
              const pdx = particle.x - otherParticle.x;
              const pdy = particle.y - otherParticle.y;
              const pDistanceSquared = pdx * pdx + pdy * pdy;

              // Outer gate: connection radius (120) is the larger of the two.
              if (pDistanceSquared >= maxDistanceSquared) continue;

              const pDistance = Math.sqrt(pDistanceSquared);

              // Repulsion only fires within the smaller radius (80).
              if (pDistance > 0 && pDistance < repulsionRadius) {
                const force =
                  ((repulsionRadius - pDistance) / repulsionRadius) * 0.02;
                particle.vx += (pdx / pDistance) * force;
                particle.vy += (pdy / pDistance) * force;
              }

              // Connection draw — same line was drawn by both A→B and B→A
              // in the original code; preserved here so opacity composites
              // identically.
              const opacity = (1 - pDistance / maxDistance) * 0.3;
              ctx.strokeStyle = `rgba(168, 150, 200, ${opacity})`;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        }

        // Mouse repulsion
        const mdx = mouseX - particle.x;
        const mdy = mouseY - particle.y;
        const mDistanceSquared = mdx * mdx + mdy * mdy;
        if (mDistanceSquared < minDistanceSquared) {
          const mDistance = Math.sqrt(mDistanceSquared);
          if (mDistance > 0) {
            const force = (minDistance - mDistance) / minDistance;
            particle.vx -= (mdx / mDistance) * force * 0.5;
            particle.vy -= (mdy / mDistance) * force * 0.5;
          }
        }

        // Gentle friction to prevent extreme speeds
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Draw particle
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, TWO_PI);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // IntersectionObserver: pause when canvas leaves the viewport, resume
    // when it re-enters. Threshold 0 = trigger on any pixel of overlap.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;
        // Hidden → visible transition: kick the loop back on. The flag
        // check inside `animate` will short-circuit if we're already
        // running, so this is safe to call without coordination.
        if (!wasVisible && entry.isIntersecting && animationRef.current === undefined) {
          animate();
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}
