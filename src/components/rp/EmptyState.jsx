// Vitrine empty/celebration state with a mascot illustration on the light surface.
// Props: illustration (img url), title, subtitle, action (node).
export function EmptyState({ illustration, title, subtitle, action, fullScreen = false }) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-5 bg-background px-8 text-center safe-top"
          : "flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center"
      }
    >
      {illustration && (
        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className="h-40 w-40 object-contain"
        />
      )}
      <h2 className="text-headline-md text-foreground">{title}</h2>
      {subtitle && (
        <p className="max-w-xs text-body-md text-muted-foreground">{subtitle}</p>
      )}
      {action}
    </div>
  );
}

export default EmptyState;