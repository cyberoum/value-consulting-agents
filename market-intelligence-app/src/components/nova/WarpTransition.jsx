/**
 * WarpTransition — Full-screen hyperspace warp effect.
 * Stars streak toward a vanishing point, creating a "traveling through space" feel.
 * Plays for ~1.5s then fades out to reveal the destination page.
 */
import { useRef, useEffect, useState } from 'react';

export default function WarpTransition({ active, onComplete, destinationName }) {
  const canvasRef = useRef(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;

    // Create warp stars
    const stars = Array.from({ length: 300 }, () => ({
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: Math.random() * 1000 + 100,
      speed: 0,
    }));

    let frame = 0;
    const totalFrames = 90; // ~1.5s at 60fps
    let animId;

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;

      // Accelerating speed curve
      const speed = Math.pow(progress, 2) * 80;

      // Background — darkens then brightens to white
      if (progress < 0.8) {
        ctx.fillStyle = '#050410';
        ctx.fillRect(0, 0, w, h);
      } else {
        // Flash to white at the end
        const flash = (progress - 0.8) / 0.2;
        const r = Math.round(5 + flash * 250);
        const g = Math.round(4 + flash * 250);
        const b = Math.round(16 + flash * 240);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw streaking stars
      stars.forEach(star => {
        star.z -= speed;
        if (star.z <= 0) star.z = 1000;

        const sx = (star.x / star.z) * 400 + cx;
        const sy = (star.y / star.z) * 400 + cy;

        // Previous position (for streak)
        const pz = star.z + speed * 1.5;
        const px = (star.x / pz) * 400 + cx;
        const py = (star.y / pz) * 400 + cy;

        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) return;

        // Streak length increases with speed
        const streakAlpha = Math.min(1, speed / 30) * (1 - star.z / 1000);
        const thickness = Math.max(0.5, (1 - star.z / 1000) * 2.5);

        // Color — blue-white core, warm amber edges
        const warmth = Math.random() > 0.7;
        const color = warmth
          ? `rgba(200, 180, 140, ${streakAlpha * 0.8})`
          : `rgba(200, 215, 255, ${streakAlpha})`;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.stroke();

        // Bright point at the leading edge
        if (streakAlpha > 0.3) {
          ctx.beginPath();
          ctx.arc(sx, sy, thickness * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${streakAlpha})`;
          ctx.fill();
        }
      });

      // Radial speed lines from center
      if (progress > 0.3) {
        const lineAlpha = (progress - 0.3) * 0.15;
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2 + frame * 0.01;
          const innerR = 30 + progress * 50;
          const outerR = 200 + progress * 600;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
          ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
          ctx.strokeStyle = `rgba(180, 200, 255, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Center glow intensifies
      const glowR = 20 + progress * 100;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(255, 255, 255, ${progress * 0.3})`);
      glow.addColorStop(0.5, `rgba(180, 200, 255, ${progress * 0.1})`);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Destination name appears mid-warp
      if (progress > 0.4 && progress < 0.9) {
        const textAlpha = Math.sin((progress - 0.4) / 0.5 * Math.PI) * 0.6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `italic 300 ${Math.min(w * 0.04, 32)}px 'Instrument Serif', Georgia, serif`;
        ctx.fillStyle = `rgba(220, 230, 255, ${textAlpha})`;
        ctx.fillText(destinationName || '', cx, cy);
      }

      if (frame < totalFrames) {
        animId = requestAnimationFrame(animate);
      } else {
        // Start fade out
        setFading(true);
        setTimeout(() => onComplete?.(), 500);
      }
    };

    animate();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [active, onComplete, destinationName]);

  if (!active && !fading) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
