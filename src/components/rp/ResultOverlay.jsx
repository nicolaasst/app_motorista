import React, { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import { Icon } from "./Icon";
import { successAnimation, occurrenceAnimation } from "@/lib/lottieAnimations";

// Barreira local: se a animação Lottie falhar em runtime, degradamos para
// fundo amarelo + mensagem em vez de derrubar a árvore React (tela branca).
class AnimationBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Full-screen result overlay with Lottie animation on yellow background.
 *
 * Props:
 *  - type: "success" | "occurrence"
 *  - message: string — short reinforcement text
 *  - detail: string — optional secondary line (e.g. receiver type)
 *  - onClose(): dismiss handler — fired once, by the 5s timer OR a tap,
 *    whichever comes first (no double navigation).
 */
export function ResultOverlay({ type = "success", message, detail, onClose }) {
  const isSuccess = type === "success";
  const animation = isSuccess ? successAnimation : occurrenceAnimation;
  const closedRef = useRef(false);
  const timerRef = useRef(null);

  const dismiss = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    clearTimeout(timerRef.current);
    onClose?.();
  };

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, 5000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={dismiss}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") dismiss(); }}
      className="fixed inset-0 z-[70] flex touch-manipulation flex-col items-center justify-center bg-brand-yellow px-8 text-center text-ink"
    >
      <AnimationBoundary>
        <div className="h-52 w-52 max-w-[80vw]">
          <Lottie
            animationData={animation}
            loop={!isSuccess}
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </AnimationBoundary>

      <h1 className="mt-2 text-display-lg font-extrabold">
        {message || (isSuccess ? "Entrega confirmada!" : "Ocorrência registrada")}
      </h1>

      {detail && (
        <p className="mt-1 text-body-lg font-semibold text-ink/70">{detail}</p>
      )}

      <p className="mt-6 text-label-md text-ink/50">Toque para continuar</p>

      <button
        onClick={dismiss}
        className="rp-tap mt-3 inline-flex items-center gap-2 rounded-full bg-onyx px-8 py-4 text-label-lg font-bold text-white active:scale-[0.98]"
      >
        <Icon name="arrow_forward" size={20} /> Continuar
      </button>
    </div>
  );
}

export default ResultOverlay;