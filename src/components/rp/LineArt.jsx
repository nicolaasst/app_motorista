// Hand-drawn single-stroke line-art illustrations (ink) for brand moments:
// onboarding, celebration, and empty states. Uses currentColor.
const PATHS = {
  truck: (
    <>
      <path d="M8 22 h28 v18 h-28 z" />
      <path d="M36 28 h12 l8 8 v4 h-20 z" />
      <circle cx="20" cy="44" r="4" />
      <circle cx="48" cy="44" r="4" />
    </>
  ),
  package: (
    <>
      <path d="M14 20 L32 12 L50 20 L50 44 L32 52 L14 44 Z" />
      <path d="M14 20 L32 28 L50 20" />
      <path d="M32 28 L32 52" />
    </>
  ),
  pin: (
    <>
      <path d="M32 10 C22 10 16 18 16 28 C16 40 32 54 32 54 C32 54 48 40 48 28 C48 18 42 10 32 10 Z" />
      <circle cx="32" cy="28" r="6" />
    </>
  ),
  check: (
    <>
      <circle cx="32" cy="32" r="20" />
      <path d="M24 32 L30 38 L42 24" />
    </>
  ),
  bell: (
    <>
      <path d="M32 12 C24 12 20 18 20 26 L20 38 L14 46 L50 46 L44 38 L44 26 C44 18 40 12 32 12 Z" />
      <path d="M28 50 C28 54 30 56 32 56 C34 56 36 54 36 50" />
    </>
  ),
  signature: (
    <>
      <path d="M10 44 C16 40 18 36 22 36 C26 36 26 44 30 44 C34 44 38 32 44 28" />
      <path d="M44 20 L52 12 L56 16 L48 24" />
      <path d="M10 52 L54 52" />
    </>
  ),
};

export function LineArt({ name = "truck", className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.truck}
    </svg>
  );
}

export default LineArt;