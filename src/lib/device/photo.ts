export interface ResizedDimensions {
  width: number;
  height: number;
}

// Pura — testável sem canvas/DOM. Mantém a proporção, nunca amplia.
export function calculateResizedDimensions(
  width: number,
  height: number,
  maxDimension: number,
): ResizedDimensions {
  if (width <= maxDimension && height <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export interface CompressedPhoto {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

// Compressão real no cliente via canvas — sem isso, uma foto de câmera
// moderna (4000x3000+, vários MB) seria enviada inteira. Só roda em
// browser real (testado via Playwright, não em unidade — jsdom não
// implementa canvas/Image de forma utilizável aqui).
export async function compressImageFile(
  file: File,
  { maxDimension = 1600, quality = 0.8 }: CompressImageOptions = {},
): Promise<CompressedPhoto> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = calculateResizedDimensions(bitmap.width, bitmap.height, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar o canvas para compressão de imagem.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const sizeBytes = Math.ceil((dataUrl.length * 3) / 4);
  return { dataUrl, width, height, sizeBytes };
}
