import { useEffect, useRef } from 'react';

/**
 * Animated hero visual: a rotating wireframe torus knot inside a dark panel.
 *
 * Drawn on a 2D canvas with hand-rolled projection rather than three.js — the
 * bundle is already ~970KB and a 3D engine would add a six-figure byte count
 * to render one mesh. The whole thing is ~150 lines and takes the brand cyan
 * as a parameter, which is the point: unlike a stock photo, the accent colour
 * is ours by construction.
 *
 * Motion is skipped entirely under prefers-reduced-motion — a single static
 * frame is drawn instead, so the composition still reads.
 */

// Torus knot (p,q). Standard parametric curve; p=2,q=3 gives the familiar
// trefoil-ish shape.
const P = 2;
const Q = 3;
const SEGMENTS = 170; // steps along the curve
const RING = 10;      // points around the tube
const TUBE = 0.42;    // tube radius
const SCALE = 62;     // world → px before perspective; leaves margin in the panel

function curvePoint(u: number): [number, number, number] {
  const r = Math.cos(Q * u) + 2;
  return [r * Math.cos(P * u), r * Math.sin(P * u), -Math.sin(Q * u)];
}

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Precompute the tube as a grid of points in model space. Frenet-ish
    // frame: tangent from a finite difference, normal from the curve position,
    // binormal from their cross product.
    const grid: [number, number, number][][] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const u = (i / SEGMENTS) * Math.PI * 2;
      const cur = curvePoint(u);
      const nxt = curvePoint(u + 0.01);

      const t: [number, number, number] = [nxt[0] - cur[0], nxt[1] - cur[1], nxt[2] - cur[2]];
      const tl = Math.hypot(t[0], t[1], t[2]) || 1;
      t[0] /= tl; t[1] /= tl; t[2] /= tl;

      const nl = Math.hypot(cur[0], cur[1], cur[2]) || 1;
      const n: [number, number, number] = [cur[0] / nl, cur[1] / nl, cur[2] / nl];

      const b: [number, number, number] = [
        t[1] * n[2] - t[2] * n[1],
        t[2] * n[0] - t[0] * n[2],
        t[0] * n[1] - t[1] * n[0],
      ];
      const bl = Math.hypot(b[0], b[1], b[2]) || 1;
      b[0] /= bl; b[1] /= bl; b[2] /= bl;

      const ring: [number, number, number][] = [];
      for (let j = 0; j < RING; j++) {
        const v = (j / RING) * Math.PI * 2;
        const cv = Math.cos(v) * TUBE;
        const sv = Math.sin(v) * TUBE;
        ring.push([
          cur[0] + cv * n[0] + sv * b[0],
          cur[1] + cv * n[1] + sv * b[1],
          cur[2] + cv * n[2] + sv * b[2],
        ]);
      }
      grid.push(ring);
    }

    let raf = 0;
    let angle = 0;
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

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const tilt = 0.55;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Project every point once per frame.
      const proj: [number, number, number][][] = grid.map((ring) =>
        ring.map(([x, y, z]) => {
          // rotate around Y, then tilt around X
          const rx = x * cosA + z * sinA;
          const rz = -x * sinA + z * cosA;
          const ry = y * cosT - rz * sinT;
          const rz2 = y * sinT + rz * cosT;
          const depth = 7 / (7 + rz2); // perspective divide
          return [cx + rx * SCALE * depth, cy + ry * SCALE * depth, rz2];
        }),
      );

      // Two passes so the far side reads dimmer than the near side — cheap
      // depth cueing without per-line state changes.
      for (const pass of [0, 1] as const) {
        ctx.beginPath();
        for (let i = 0; i < SEGMENTS; i++) {
          const a = proj[i];
          const bRing = proj[(i + 1) % SEGMENTS];
          for (let j = 0; j < RING; j++) {
            const isNear = a[j][2] > 0;
            if ((pass === 1) !== isNear) continue;
            const j2 = (j + 1) % RING;
            // along the tube
            ctx.moveTo(a[j][0], a[j][1]);
            ctx.lineTo(bRing[j][0], bRing[j][1]);
            // around the tube
            ctx.moveTo(a[j][0], a[j][1]);
            ctx.lineTo(a[j2][0], a[j2][1]);
          }
        }
        ctx.strokeStyle = pass === 1 ? 'rgba(34,211,238,0.85)' : 'rgba(34,211,238,0.22)';
        ctx.lineWidth = pass === 1 ? 1 : 0.7;
        ctx.stroke();
      }

      if (!reduced) {
        angle += 0.0035;
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1119]">
        {/* Starfield. Static, low-opacity, generated once from a fixed set so
            it never reflows or flickers between renders. */}
        <div className="pointer-events-none absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-slate-400"
              style={{ left: `${s[0]}%`, top: `${s[1]}%`, width: s[2], height: s[2], opacity: s[3] }}
            />
          ))}
        </div>

        {/* Orbit ring behind the knot */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <ellipse
            cx="50%" cy="50%" rx="36%" ry="13%"
            fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1"
          />
        </svg>

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* Status label */}
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live · Q3 Cohort
          </span>
        </div>

        {/* Corner readout. Deliberately a real fact about the programmes
            rather than invented system telemetry. */}
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

// [leftPct, topPct, sizePx, opacity]
const STARS: [number, number, number, number][] = [
  [8, 18, 2, 0.5], [17, 62, 1, 0.35], [24, 31, 1, 0.4], [31, 78, 2, 0.3],
  [39, 12, 1, 0.45], [46, 88, 1, 0.3], [54, 22, 2, 0.35], [61, 55, 1, 0.4],
  [68, 15, 1, 0.3], [73, 71, 2, 0.45], [81, 38, 1, 0.35], [88, 82, 1, 0.3],
  [93, 27, 2, 0.4], [12, 44, 1, 0.3], [35, 52, 1, 0.25], [58, 68, 1, 0.3],
  [77, 9, 1, 0.35], [96, 60, 1, 0.3], [4, 74, 1, 0.3], [50, 40, 1, 0.22],
];
