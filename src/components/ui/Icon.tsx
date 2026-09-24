interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

// Fino wrapper sobre a fonte Material Symbols Outlined já usada em todo o
// app (carregada via <link> em index.html). Não troca a fonte de ícone —
// só padroniza como ela é referenciada, para preservar paridade visual.
export default function Icon({ name, className = '', filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`.trim()}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  );
}
