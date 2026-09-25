import { useRef, useEffect, useState } from "react";
import { Eraser } from "lucide-react";

export default function SignaturePad({ onChange, label = "Assine com o dedo" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f3d3a";
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) {
      setHasInk(true);
      onChange?.(canvasRef.current.toDataURL("image/png"));
    }
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        className="h-36 w-full rounded-xl border-2 border-dashed border-border bg-slate-50 touch-none"
      />
      {!hasInk && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={clear}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
      >
        <Eraser className="h-3.5 w-3.5" /> Limpar
      </button>
    </div>
  );
}