// Reduz fotos antes de guardar/enviar (4G de campo): lado maior ≤ 1600 px, JPEG 0,82.
// Se o navegador não conseguir decodificar, devolve o arquivo original.
export async function comprimirImagem(arquivo, { ladoMax = 1600, qualidade = 0.82 } = {}) {
  if (!arquivo?.type?.startsWith("image/") || typeof createImageBitmap === "undefined") return arquivo;
  try {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
    if (escala === 1 && arquivo.size < 1.5 * 1024 * 1024) return arquivo;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", qualidade));
    return blob || arquivo;
  } catch {
    return arquivo;
  }
}
