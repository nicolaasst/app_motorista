import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  clear: () => void;
}

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  className?: string;
  height?: number;
  showOwnClearButton?: boolean;
}

// Captura de assinatura real via Pointer Events (funciona com dedo, mouse
// e caneta stylus) sobre um <canvas>, exportada como PNG data URL. Antes
// desta fase, "Assinatura Digital" na tela de entrega era só o nome do
// recebedor reaproveitado como string, nunca um traço real (ver
// MIGRATION_PROGRESS.md). `clear()` é exposto via ref para telas que já
// têm seu próprio botão "Limpar" posicionado no design original.
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onChange, className = '', height = 176, showOwnClearButton = true },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#131313';
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokeRef.current = true;
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (hasStrokeRef.current) {
      setIsEmpty(false);
      onChange(canvasRef.current?.toDataURL('image/png') ?? null);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    hasStrokeRef.current = false;
    setIsEmpty(true);
    onChange(null);
  };

  useImperativeHandle(ref, () => ({ clear }));

  return (
    <div className={className}>
      <canvas
        aria-label="Área para assinar com o dedo ou caneta stylus"
        className="w-full touch-none rounded-[20px] bg-surface-container-low shadow-inner"
        onPointerCancel={finishStroke}
        onPointerDown={handlePointerDown}
        onPointerLeave={finishStroke}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        ref={canvasRef}
        role="img"
        style={{ height }}
      />
      {showOwnClearButton && !isEmpty && (
        <button
          className="mt-2 text-label-sm font-label-sm text-secondary underline"
          onClick={clear}
          type="button"
        >
          Limpar assinatura
        </button>
      )}
    </div>
  );
});

export default SignaturePad;
