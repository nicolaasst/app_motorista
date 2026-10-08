// Gera a arte das lojas a partir de public/logo.png (500 px, dourado sobre transparente).
// Saída: assets/ (entrada do @capacitor/assets) e docs/store/arte/ (ícone 1024 e gráfico de recursos do Google).
// Uso: node scripts/store/gerar-arte.mjs && npx capacitor-assets generate
// O logo de origem tem só 500 px: se houver arquivo vetorial/maior, troque a origem aqui para a arte ficar nítida.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const NAVY = { r: 15, g: 23, b: 42, alpha: 1 }; // theme_color do manifest (#0F172A)
const LOGO = "public/logo.png";

async function logoEm(tamanho) {
  return sharp(LOGO).resize(tamanho, tamanho, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function sobreFundo(largura, altura, lado, destino) {
  const logo = await logoEm(lado);
  await sharp({ create: { width: largura, height: altura, channels: 4, background: NAVY } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(destino);
}

await mkdir("assets", { recursive: true });
await mkdir("docs/store/arte", { recursive: true });

// Ícone iOS/Play 1024: logo em ~78% da área, fundo navy (sem transparência: a Apple recusa canal alfa).
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: NAVY } })
  .composite([{ input: await logoEm(800), gravity: "center" }])
  .flatten({ background: NAVY })
  .png()
  .toFile("assets/icon-only.png");
// Ícone adaptativo Android: primeiro plano com o logo na zona segura (~60%) e fundo sólido.
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await logoEm(620), gravity: "center" }])
  .png()
  .toFile("assets/icon-foreground.png");
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: NAVY } }).png().toFile("assets/icon-background.png");
// Splash (claro e escuro iguais: a marca é dourada sobre navy).
await sobreFundo(2732, 2732, 900, "assets/splash.png");
await sobreFundo(2732, 2732, 900, "assets/splash-dark.png");
// Cópias de entrega para as lojas.
await sharp("assets/icon-only.png").toFile("docs/store/arte/icone-1024.png");
// Gráfico de recursos do Google Play: 1024 x 500.
const logo500 = await logoEm(380);
await sharp({ create: { width: 1024, height: 500, channels: 4, background: NAVY } })
  .composite([
    { input: logo500, left: 60, top: 60 },
    {
      input: Buffer.from(
        `<svg width="520" height="380" xmlns="http://www.w3.org/2000/svg"><text x="0" y="150" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#FFD70F">NGS Driver</text><text x="0" y="215" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFF">Rota, entregas e comprovantes</text><text x="0" y="258" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFF">na palma da mão</text></svg>`,
      ),
      left: 460,
      top: 110,
    },
  ])
  .png()
  .toFile("docs/store/arte/grafico-de-recursos-1024x500.png");
console.log("arte gerada");
