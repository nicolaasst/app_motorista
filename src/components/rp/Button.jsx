const variants = {
  primary: "bg-primary text-primary-foreground active:bg-primary-pressed shadow-cta",
  onyx: "bg-onyx text-white active:bg-onyx-pressed",
  outline: "border-2 border-ink text-foreground bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/30",
  ghost: "bg-accent text-accent-foreground",
  danger: "bg-destructive text-white active:bg-destructive-pressed",
};

export function Button({ variant = "primary", loading = false, disabled, className = "", children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={`rp-tap inline-flex items-center justify-center gap-2 rounded-full min-h-[52px] px-6 text-label-lg active:scale-[0.98] transition disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

export default Button;