import { useEffect } from "react";
import { contexto } from "@/api/app-motorista";
import { applyTheme } from "@/lib/theme";

// Reads the driver's saved theme preference and keeps <html> in sync,
// including live changes of the OS theme when preference is "system".
export default function ThemeSync() {
  useEffect(() => {
    let alive = true;
    let theme = "system";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (theme === "system") applyTheme(theme);
    };
    (async () => {
      applyTheme(theme);
      try {
        const { preferencias } = await contexto();
        if (alive && preferencias?.theme) {
          theme = preferencias.theme;
          applyTheme(theme);
        }
      } catch {
        /* no preference saved — system default stays */
      }
    })();
    media.addEventListener("change", onSystemChange);
    return () => {
      alive = false;
      media.removeEventListener("change", onSystemChange);
    };
  }, []);
  return null;
}