import { useEffect, useState } from "react";

// Landscape is decided by *small usable height* (phone laid flat ≈ 370–500px),
// NOT by aspect ratio — a tablet on its side has plenty of height and stays
// in portrait/normal mode. Single hook consumed by every component that
// sizes itself "by eye" (map controls, header, sheet, turn banner) so the
// whole UI shrinks consistently instead of half of it.
export const ALTURA_PAISAGEM_MAX = 500;

export function usarPaisagem() {
  if (typeof window === "undefined") return false;
  return (
    window.innerHeight <= ALTURA_PAISAGEM_MAX &&
    window.innerWidth > window.innerHeight
  );
}

export function useModoPaisagem() {
  const [paisagem, setPaisagem] = useState(usarPaisagem);
  useEffect(() => {
    const reavaliar = () => setPaisagem(usarPaisagem());
    window.addEventListener("resize", reavaliar);
    window.addEventListener("orientationchange", reavaliar);
    return () => {
      window.removeEventListener("resize", reavaliar);
      window.removeEventListener("orientationchange", reavaliar);
    };
  }, []);
  return paisagem;
}

export default useModoPaisagem;