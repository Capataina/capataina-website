"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Grid {
  [key: string]: Particle[];
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);

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
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles (reduced from 80 to 40 for performance)
    const particleCount = 240;
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

    // Grid-based spatial partitioning for O(n) complexity
    const cellSize = 120; // Match maxDistance for connection drawing
    const getGridKey = (x: number, y: number) => {
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      return `${col},${row}`;
    };

    const getNeighborCells = (x: number, y: number): string[] => {
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      const neighbors: string[] = [];

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          neighbors.push(`${col + i},${row + j}`);
        }
      }
      return neighbors;
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Build spatial grid for this frame
      const grid: Grid = {};
      particles.forEach((particle) => {
        const key = getGridKey(particle.x, particle.y);
        if (!grid[key]) grid[key] = [];
        grid[key].push(particle);
      });

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen edges like asteroids
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Add random drift to keep particles moving
        particle.vx += (Math.random() - 0.5) * 0.05;
        particle.vy += (Math.random() - 0.5) * 0.05;

        // Gentle center attraction to prevent clustering at edges
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const toCenterX = centerX - particle.x;
        const toCenterY = centerY - particle.y;
        const distanceToCenter = Math.sqrt(
          toCenterX * toCenterX + toCenterY * toCenterY
        );
        const maxDistanceFromCenter = Math.sqrt(
          centerX * centerX + centerY * centerY
        );

        // Stronger pull the further from center
        const centerPullStrength =
          (distanceToCenter / maxDistanceFromCenter) * 0.015;
        if (distanceToCenter > 0) {
          particle.vx += (toCenterX / distanceToCenter) * centerPullStrength;
          particle.vy += (toCenterY / distanceToCenter) * centerPullStrength;
        }

        // Gentle particle repulsion - large radius, low strength
        const repulsionNeighbors = getNeighborCells(particle.x, particle.y);
        const repulsionRadius = 80;
        const repulsionRadiusSquared = repulsionRadius * repulsionRadius;

        repulsionNeighbors.forEach((key) => {
          const neighbors = grid[key];
          if (!neighbors) return;

          neighbors.forEach((otherParticle) => {
            if (particle === otherParticle) return;

            const pdx = particle.x - otherParticle.x;
            const pdy = particle.y - otherParticle.y;
            const pDistanceSquared = pdx * pdx + pdy * pdy;

            if (
              pDistanceSquared < repulsionRadiusSquared &&
              pDistanceSquared > 0
            ) {
              const pDistance = Math.sqrt(pDistanceSquared);
              const force =
                ((repulsionRadius - pDistance) / repulsionRadius) * 0.02; // Low strength
              particle.vx += (pdx / pDistance) * force;
              particle.vy += (pdy / pDistance) * force;
            }
          });
        });

        // Mouse repulsion - bigger radius, lower strength
        const mdx = mouseRef.current.x - particle.x;
        const mdy = mouseRef.current.y - particle.y;
        const mDistanceSquared = mdx * mdx + mdy * mdy;
        const minDistance = 450; // Increased from 150
        const minDistanceSquared = minDistance * minDistance;

        if (mDistanceSquared < minDistanceSquared) {
          const mDistance = Math.sqrt(mDistanceSquared);
          const force = (minDistance - mDistance) / minDistance;
          particle.vx -= (mdx / mDistance) * force * 0.5; // Reduced from 0.5
          particle.vy -= (mdy / mDistance) * force * 0.5;
        }

        // Gentle friction to prevent extreme speeds
        particle.vx *= 0.99; // Less friction
        particle.vy *= 0.99;

        // Draw connections only to nearby particles using grid
        const neighborKeys = getNeighborCells(particle.x, particle.y);
        const maxDistance = 120;
        const maxDistanceSquared = maxDistance * maxDistance;

        neighborKeys.forEach((key) => {
          const neighbors = grid[key];
          if (!neighbors) return;

          neighbors.forEach((otherParticle) => {
            if (particle === otherParticle) return;

            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < maxDistanceSquared) {
              const distance = Math.sqrt(distanceSquared);
              const opacity = (1 - distance / maxDistance) * 0.3;
              ctx.strokeStyle = `rgba(168, 150, 200, ${opacity})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          });
        });

        // Draw particle
        ctx.fillStyle = "rgba(168, 150, 200, 0.6)";
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
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
