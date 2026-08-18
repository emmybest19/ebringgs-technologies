import { useEffect, useRef } from 'react';

/**
 * Animated hero visual: a slowly rotating node network wrapped on a sphere.
 *
 * The form is chosen to mean something rather than to decorate — nodes joined
 * to their nearest neighbours read as a cohort/network, which is the business.
 * A handful of nodes pulse to suggest activity across it.
 *
 * Drawn on a 2D canvas with hand-rolled projection rather than three.js: the
 * bundle is already ~970KB and a 3D engine would add a six-figure byte count
 * to render one object. Motion is skipped under prefers-reduced-motion, where
 * a single static frame is drawn instead.
 */

const NODES = 88;
const NEIGHBOURS = 3;   // edges per node before de-duplication
const RADIUS = 1;       // unit sphere in model space
const SCALE = 152;      // world → px before perspective
const PULSING = [4, 19, 33, 48, 61, 77]; // indices that breathe

type Vec3 = [number, number, number];

/** Fibonacci sphere — even point distribution without clustering at the poles. */
function sphereNodes(n: number): Vec3[] {
  const pts: Vec3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pts.push([Math.cos(theta) * r * RADIUS, y * RADIUS, Math.sin(theta) * r * RADIUS]);
  }
  return pts;
}

/** Each node links to its k nearest neighbours; pairs de-duplicated. */
function buildEdges(pts: Vec3[], k: number): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const d = pts
      .map((p, j) => ({ j, d: (p[0] - pts[i][0]) ** 2 + (p[1] - pts[i][1]) ** 2 + (p[2] - pts[i][2]) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    for (const { j } of d) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
    }
  }
  return edges;
}

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = sphereNodes(NODES);
    const edges = buildEdges(nodes, NEIGHBOURS);
    const pulseSet = new Set(PULSING);

    let raf = 0;
    let t = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      const cosA = Math.cos(t);
      const sinA = Math.sin(t);
      const tilt = 0.42;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Project every node once per frame: spin about Y, tilt about X.
      const proj = nodes.map(([x, y, z]) => {
        const rx = x * cosA + z * sinA;
        const rz = -x * sinA + z * cosA;
        const ry = y * cosT - rz * sinT;
        const rz2 = y * sinT + rz * cosT;
        const depth = 3.4 / (3.4 + rz2);
        return { x: cx + rx * SCALE * depth, y: cy + ry * SCALE * depth, z: rz2, depth };
      });

      // Edges. Split into far/near passes so the sphere reads as a volume
      // instead of a flat web — two stroke calls rather than one per line.
      for (const near of [false, true]) {
        ctx.beginPath();
        for (const [i, j] of edges) {
          const a = proj[i];
          const b = proj[j];
          if ((a.z + b.z) / 2 > 0 !== near) continue;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.strokeStyle = near ? 'rgba(34,211,238,0.58)' : 'rgba(34,211,238,0.16)';
        ctx.lineWidth = near ? 1.1 : 0.7;
        ctx.stroke();
      }

      // Nodes, drawn after the edges so they sit on top of the mesh.
      proj.forEach((p, i) => {
        const near = p.z > 0;
        const pulse = pulseSet.has(i) ? 0.5 + 0.5 * Math.sin(t * 3 + i) : 0;
        const r = (near ? 1.9 : 1.2) + pulse * 1.6;

        if (pulse > 0.15 && near) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 3.5 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34,211,238,${0.16 * pulse})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = near
          ? `rgba(103,232,249,${0.75 + pulse * 0.25})`
          : 'rgba(34,211,238,0.28)';
        ctx.fill();
      });

      if (!reduced) {
        t += 0.0032;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    const onResize = () => { resize(); if (reduced) draw(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1017]">
        {/* Soft glow seated behind the sphere, so it sits in the panel rather
            than floating on a flat rectangle. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(34,211,238,0.09),transparent_70%)]" />

        {/* Fine grid, fading out toward the edges. Gives the panel a sense of
            plane without competing with the network. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(70% 70% at 50% 50%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, #000 40%, transparent 100%)',
          }}
        />

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* Status label */}
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live
          </span>
        </div>

        {/* Corner readout — a real fact about the programmes, not invented
            system telemetry. */}
        <div className="absolute bottom-5 right-5 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">Tracks</p>
          <p className="text-2xl font-extrabold leading-none text-white">05</p>
        </div>
      </div>

      {/* Floating card, overlapping the panel's lower-left corner */}
      <div className="absolute -bottom-5 left-4 rounded-xl border border-slate-800 bg-[#0e141c]/95 px-4 py-3 backdrop-blur sm:left-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Now enrolling</p>
        <p className="mt-0.5 text-sm font-bold text-white">Frontend Development</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Live cohort · 12 weeks
        </p>
      </div>
    </div>
  );
}
