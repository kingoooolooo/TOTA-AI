import { useEffect, useRef } from "react";

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  driftAngle: number;
  opacity: number;
  blur: number;
}

const NUM_FLAKES = 60;

const createFlake = (width: number, randomY = false): Snowflake => ({
  x: Math.random() * width,
  y: randomY ? Math.random() * 2000 : -10 - Math.random() * 100,
  radius: 0.8 + Math.random() * 2.4,
  speed: 0.4 + Math.random() * 1.1,
  drift: (Math.random() - 0.5) * 0.4,
  driftAngle: Math.random() * Math.PI * 2,
  opacity: 0.25 + Math.random() * 0.65,
  blur: Math.random() * 1.2
});

export const SidebarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Snowflake[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Seed flakes spread across the full height on first load
    flakesRef.current = Array.from({ length: NUM_FLAKES }, () =>
      createFlake(canvas.width, true)
    );

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      flakesRef.current.forEach((flake) => {
        // Slow sinusoidal horizontal drift
        flake.driftAngle += 0.008;
        flake.x += Math.sin(flake.driftAngle) * flake.drift + 0.08;
        flake.y += flake.speed;

        // Reset when off-screen
        if (flake.y > h + 10) {
          Object.assign(flake, createFlake(w, false));
        }
        if (flake.x < -10) flake.x = w + 5;
        if (flake.x > w + 10) flake.x = -5;

        // Draw snowflake — glowing cyan-white circle
        if (flake.blur > 0) {
          ctx.shadowBlur = flake.blur * 4;
          ctx.shadowColor = "rgba(34, 211, 238, 0.6)";
        }

        const grad = ctx.createRadialGradient(
          flake.x, flake.y, 0,
          flake.x, flake.y, flake.radius
        );
        grad.addColorStop(0, `rgba(220, 250, 255, ${flake.opacity})`);
        grad.addColorStop(0.6, `rgba(34, 211, 238, ${flake.opacity * 0.5})`);
        grad.addColorStop(1, `rgba(34, 211, 238, 0)`);

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <video
        src="/sidebar-video.mp4"
        className="sidebar-bg-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="sidebar-bg-canvas"
        aria-hidden="true"
      />
    </>
  );
};
