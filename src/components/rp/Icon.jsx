// Material Symbols icon. `name` is the wireframe glyph name (e.g. "local_shipping").
export function Icon({ name, filled = false, size = 24, weight = 400, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export default Icon;