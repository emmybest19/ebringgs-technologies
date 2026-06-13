import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pen, Highlighter, ArrowRight, Trash2, X, Undo2, Crosshair,
} from 'lucide-react';

type Tool = 'laser' | 'pen' | 'highlighter' | 'arrow';
type ColorKey = 'red' | 'yellow' | 'green' | 'blue' | 'white';

const COLORS: Record<ColorKey, string> = {
  red: '#ef4444',
  yellow: '#fbbf24',
  green: '#22c55e',
  blue: '#3b82f6',
  white: '#ffffff',
};

interface Point { x: number; y: number }

interface Stroke {
  id: string;
  tool: Tool;
  color: ColorKey;
  points: Point[];
  end?: Point;          // for arrow
}

interface Props {
  enabled: boolean;
  onClose: () => void;
}

const LASER_FADE_MS = 1500;

export default function AnnotationOverlay({ enabled, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laserTimerRef = useRef<number | null>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<ColorKey>('red');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [laser, setLaser] = useState<Point | null>(null);

  /* ─── Sizing & DPI ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!enabled) return;
    const sync = () => {
      const cv = canvasRef.current;
      const cont = containerRef.current;
      if (!cv || !cont) return;
      const rect = cont.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.max(1, Math.floor(rect.width * dpr));
      cv.height = Math.max(1, Math.floor(rect.height * dpr));
      cv.style.width = `${rect.width}px`;
      cv.style.height = `${rect.height}px`;
      const ctx = cv.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [enabled]);

  /* ─── Drawing primitives ────────────────────────────────────────────── */
  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length === 0) return;
    ctx.strokeStyle = COLORS[s.color];
    ctx.fillStyle = COLORS[s.color];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'pen') {
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
    } else if (s.tool === 'highlighter') {
      ctx.lineWidth = 18;
      ctx.globalAlpha = 0.35;
    } else if (s.tool === 'arrow') {
      ctx.lineWidth = 4;
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 1;
    }

    if (s.tool === 'arrow' && s.end) {
      const from = s.points[0];
      const to = s.end;
      const headLen = 14;
      const ang = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - headLen * Math.cos(ang - Math.PI / 6), to.y - headLen * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(to.x - headLen * Math.cos(ang + Math.PI / 6), to.y - headLen * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const redraw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    strokes.forEach((s) => drawStroke(ctx, s));
    if (draft) drawStroke(ctx, draft);
  }, [strokes, draft]);

  useEffect(() => { redraw(); }, [redraw]);

  /* ─── Pointer handlers ─────────────────────────────────────────────── */
  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getPoint(e);
    if (tool === 'laser') {
      setLaser(pt);
      return;
    }
    setDraft({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool, color,
      points: [pt],
      ...(tool === 'arrow' ? { end: pt } : {}),
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const pt = getPoint(e);
    if (tool === 'laser') {
      setLaser(pt);
      if (laserTimerRef.current) window.clearTimeout(laserTimerRef.current);
      laserTimerRef.current = window.setTimeout(() => setLaser(null), LASER_FADE_MS);
      return;
    }
    if (!draft) return;
    if (draft.tool === 'arrow') {
      setDraft({ ...draft, end: pt });
    } else {
      setDraft({ ...draft, points: [...draft.points, pt] });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!enabled) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!draft) return;
    setStrokes((prev) => [...prev, draft]);
    setDraft(null);
  };

  const undo = () => setStrokes((prev) => prev.slice(0, -1));
  const clearAll = () => setStrokes([]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          cursor: tool === 'laser' ? 'none' : 'crosshair',
          touchAction: 'none',
        }}
        className="absolute inset-0 w-full h-full"
      />

      {/* Laser dot */}
      {tool === 'laser' && laser && (
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: laser.x,
            top: laser.y,
            width: 14,
            height: 14,
            backgroundColor: COLORS[color],
            boxShadow: `0 0 14px 4px ${COLORS[color]}99`,
          }}
        />
      )}

      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-slate-700">
        <ToolBtn active={tool === 'laser'} onClick={() => setTool('laser')} title="Laser pointer">
          <Crosshair size={15} />
        </ToolBtn>
        <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen">
          <Pen size={15} />
        </ToolBtn>
        <ToolBtn active={tool === 'highlighter'} onClick={() => setTool('highlighter')} title="Highlighter">
          <Highlighter size={15} />
        </ToolBtn>
        <ToolBtn active={tool === 'arrow'} onClick={() => setTool('arrow')} title="Arrow">
          <ArrowRight size={15} />
        </ToolBtn>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {(Object.keys(COLORS) as ColorKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setColor(k)}
            aria-label={`Color ${k}`}
            title={k}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === k ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: COLORS[k] }}
          />
        ))}

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <ToolBtn onClick={undo} title="Undo last stroke" disabled={strokes.length === 0}>
          <Undo2 size={15} />
        </ToolBtn>
        <ToolBtn onClick={clearAll} title="Clear all" danger disabled={strokes.length === 0}>
          <Trash2 size={15} />
        </ToolBtn>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Stop annotating"
          title="Stop annotating"
          className="p-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function ToolBtn({
  active, onClick, title, danger, disabled, children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-teal-600 text-white'
          : disabled
          ? 'text-slate-600 cursor-not-allowed'
          : danger
          ? 'text-slate-300 hover:bg-red-600 hover:text-white'
          : 'text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
