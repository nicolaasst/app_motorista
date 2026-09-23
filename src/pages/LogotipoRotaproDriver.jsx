import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';

export default function LogotipoRotaproDriver() {
  useEffect(() => { document.title = 'logotipo rotapro driver'; }, []);
  return (
    <ScreenFrame screenId="logotipo_rotapro_driver">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="none">
  <rect width="40" height="40" y="4" rx="10" fill="#00B000" />
  <path d="M12 28L20 16L28 28H12Z" fill="#131313" />
  <circle cx="20" cy="23" r="3.5" fill="#88EF1B" />
  <path d="M16 32H24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  <text x="48" y="27" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="18" fill="#131313" letterSpacing="-0.5">ROTA<tspan fill="#00B000">PRO</tspan></text>
  <text x="48" y="38" fontFamily="'Space Mono', monospace" fontWeight="700" fontSize="9" fill="#777777" letterSpacing="1.5">LOGÍSTICA</text>
</svg>
    </ScreenFrame>
  );
}
