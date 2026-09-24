import { useRef, useState } from 'react';
import { compressImageFile, type CompressedPhoto } from '../../lib/device/photo.js';
import Icon from './Icon.jsx';

interface PhotoCaptureProps {
  onCapture: (photo: CompressedPhoto | null) => void;
  label?: string;
  hint?: string;
}

// Captura real de foto via <input type="file" accept="image/*"
// capture="environment"> (abre a câmera traseira em celulares, ou a
// galeria/arquivo em desktop) com compressão no cliente. Substitui os
// placeholders estáticos (/screens/logotipo_rotapro_driver.png) usados em
// B4/B5 antes da Fase 5 — ver MIGRATION_PROGRESS.md.
export default function PhotoCapture({
  onCapture,
  label = 'Adicionar foto',
  hint,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'compressing' | 'error'>('idle');

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus('compressing');
    try {
      const compressed = await compressImageFile(file);
      setPreview(compressed.dataUrl);
      setStatus('idle');
      onCapture(compressed);
    } catch {
      setStatus('error');
      onCapture(null);
    } finally {
      event.target.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setStatus('idle');
    onCapture(null);
  };

  if (preview) {
    return (
      <div className="relative w-full h-52 rounded-[20px] overflow-hidden shadow-sm mb-3">
        <img alt="Foto capturada" className="w-full h-full object-cover" src={preview} />
        <button
          aria-label="Remover foto"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
          onClick={handleRemove}
          type="button"
        >
          <Icon className="text-[18px]" name="close" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="w-full h-32 rounded-DEFAULT bg-surface-container-low flex flex-col items-center justify-center gap-1 text-on-surface active:scale-[0.99] transition-transform"
        disabled={status === 'compressing'}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Icon
          className="text-[26px] text-primary"
          name={status === 'compressing' ? 'hourglass_top' : 'photo_camera'}
        />
        <span className="font-label-md text-label-md">
          {status === 'compressing' ? 'Processando foto…' : label}
        </span>
        {hint && <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>}
        {status === 'error' && (
          <span className="font-body-sm text-body-sm text-error">
            Não foi possível processar a foto. Tente novamente.
          </span>
        )}
      </button>
      <input
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
