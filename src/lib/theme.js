// Applies the .dark class to <html> according to the user preference
// ("light" | "dark" | "system"), falling back to the OS theme.
export function applyTheme(theme = "system") {
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const dark = theme === "dark" || (theme !== "light" && !!prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}