import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
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
        const { driverId } = await getDriver();
        const prefs = await base44.entities.DriverPreferences.filter({ driver_id: driverId }, "created_date", 1);
        if (alive && prefs[0]?.theme) {
          theme = prefs[0].theme;
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