const sizes = { lg: "text-code-lg", md: "text-code-md", sm: "text-code-sm" };

export function MonoText({ size = "md", className = "", children }) {
  return <span className={`tabular-nums ${sizes[size] || sizes.md} ${className}`}>{children}</span>;
}

export default MonoText;