import { BRAND } from "@/lib/brandAssets";

// Single source of truth for the NGS brand mark.
// `full`  — complete logo with wordmark (used in Login hero / receipts).
// `mark`  — compact monogram, legible at 24–48px (used in AppHeader, favicon).
//
// The company supplied a raster PNG of the full logo only; the isolated SVG
// mark was not provided, so `mark` renders the prescribed NGS monogram
// (white NGS on onyx inside an amber rounded square) which reads cleanly at
// small sizes. Swap to an SVG mark here once one is supplied — every screen
// already imports through this component.
export function Logo({ variant = "full", size = 40, className = "" }) {
  if (variant === "mark") {
    // Ícone oficial enviado pela empresa (losango dourado NGS sobre preto).
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${className}`}
        style={{ width: size, height: size }}
        aria-label="NGS"
        role="img"
      >
        <img
          src={BRAND.icone}
          alt="NGS Transportes"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <img
      src={BRAND.logoCompleto}
      alt="NGS Transportes"
      className={className}
      style={{ height: size, width: "auto" }}
      draggable={false}
    />
  );
}

export default Logo;