import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { hapticsSucesso, hapticsErro, hapticsDuplicado } from "@/lib/haptics";

// Beep via Web Audio API — no asset needed.
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch { /* noop */ }
}

/**
 * Camera barcode scanner using the native BarcodeDetector API.
 * Falls back to manual code entry when the API is unavailable.
 *
 * Props:
 *  - mode: "volume" | "nf"
 *  - onScan(code): called with the detected raw code string
 *  - lastResult: string|null — feedback message from parent (e.g. "Volume bipado")
 *  - resultKind: "success" | "invalid" | "duplicate" — how the parent classified the read
 *  - scannedCount: number — volumes scanned in this session
 *  - onClose()
 */
const RESULT_META = {
  success: { icon: "check_circle", cls: "bg-status-green-bg text-status-green-fg" },
  invalid: { icon: "cancel", cls: "bg-status-red-bg text-status-red-fg" },
  duplicate: { icon: "warning", cls: "bg-status-amber-bg text-status-amber-fg" },
};

export function BarcodeScanner({ mode = "volume", onScan, lastResult, resultKind = "success", scannedCount = 0, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastCodeRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [flash, setFlash] = useState(false);

  const fireFeedback = useCallback((kind) => {
    beep();
    if (kind === "invalid") hapticsErro();
    else if (kind === "duplicate") hapticsDuplicado();
    else hapticsSucesso();
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  }, []);

  // Send detected code to parent + feedback
  const handleCode = useCallback((raw) => {
    const code = (raw || "").trim();
    if (!code) return;
    const now = Date.now();
    // Debounce same code within 2.5s
    if (code === lastCodeRef.current && now - lastTimeRef.current < 2500) return;
    lastCodeRef.current = code;
    lastTimeRef.current = now;
    onScan?.(code);
  }, [onScan]);

  // React to parent feedback (duplicate or not)
  useEffect(() => {
    if (lastResult) fireFeedback(resultKind);
  }, [lastResult, resultKind, fireFeedback]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!("BarcodeDetector" in window)) {
        setSupported(false);
        return;
      }
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        const fmts = formats?.length ? formats : undefined;
        detectorRef.current = new window.BarcodeDetector({ formats: fmts });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        detectLoop();
      } catch (e) {
        if (!cancelled) setError(e?.message || "Não foi possível acessar a câmera");
      }
    };

    const detectLoop = async () => {
      if (cancelled || !detectorRef.current || !videoRef.current) return;
      try {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          handleCode(codes[0].rawValue);
        }
      } catch { /* frame not ready */ }
      rafRef.current = requestAnimationFrame(detectLoop);
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitManual = (e) => {
    e?.preventDefault();
    if (manualCode.trim()) handleCode(manualCode.trim());
    setManualCode("");
  };

  const modeLabel = mode === "nf" ? "Bipagem de NF (Lote)" : "Bipagem de Volume";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-onyx text-white">
      {/* Flash overlay */}
      <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? "opacity-40" : "opacity-0"}`} />

      {/* Header */}
      <div className="safe-top relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="chip bg-brand-yellow text-ink">{modeLabel}</span>
          {scannedCount > 0 && (
            <span className="chip bg-white/10 text-white">{scannedCount} lidas</span>
          )}
        </div>
        <button onClick={onClose} aria-label="Fechar scanner" className="rp-tap flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <Icon name="close" size={24} />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="relative flex-1 overflow-hidden">
        {supported && !error && (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-48 w-72 rounded-3xl border-2 border-white/30 landscape:h-32 landscape:w-52">
                <span className="absolute -top-px -left-px h-8 w-8 rounded-tl-3xl border-t-4 border-l-4 border-brand-yellow" />
                <span className="absolute -top-px -right-px h-8 w-8 rounded-tr-3xl border-t-4 border-r-4 border-brand-yellow" />
                <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-brand-yellow" />
                <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-3xl border-b-4 border-r-4 border-brand-yellow" />
                <div className="absolute left-3 right-3 top-1/2 h-0.5 rounded-full bg-brand-yellow shadow-[0_0_12px_2px_rgba(255,216,15,0.6)]" />
              </div>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-label-md text-white/70">
              Aponte para o {mode === "nf" ? "código de barras da NF" : "código do volume"}
            </p>
          </>
        )}

        {(!supported || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Icon name="qr_code_scanner" size={36} className="text-white/60" />
            </span>
            <p className="mt-4 text-body-lg font-bold">{error ? "Erro de câmera" : "Scanner não suportado"}</p>
            <p className="mt-1 text-body-sm text-white/60">
              {error || "Seu navegador não suporta leitura por câmera. Digite o código manualmente abaixo."}
            </p>
          </div>
        )}
      </div>

      {/* Feedback + manual entry */}
      <div className="safe-bottom relative z-10 rounded-t-3xl bg-card px-5 pb-6 pt-4 text-foreground landscape:px-4 landscape:pb-3 landscape:pt-2">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />

        {lastResult && (
          <div className={`mb-3 flex items-center gap-2 rounded-2xl p-3 text-body-md font-bold ${(RESULT_META[resultKind] || RESULT_META.success).cls}`}>
            <Icon name={(RESULT_META[resultKind] || RESULT_META.success).icon} size={20} />
            {lastResult}
          </div>
        )}

        <form onSubmit={submitManual} className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-input bg-card px-3">
            <Icon name="keyboard" size={20} className="text-muted-foreground" />
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={mode === "nf" ? "Digitar NF..." : "Digitar código..."}
              className="flex-1 bg-transparent py-3 text-body-md outline-none landscape:py-2"
              inputMode="numeric"
            />
          </div>
          <button type="submit" disabled={!manualCode.trim()} className="rp-tap flex items-center justify-center rounded-2xl bg-primary px-5 text-label-lg font-bold text-primary-foreground disabled:opacity-40">
            <Icon name="send" size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default BarcodeScanner;