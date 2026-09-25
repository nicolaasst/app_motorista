// Imagens da marca. Arquivo local em src/assets/brand/ tem prioridade; enquanto
// ele não existir, vale a URL atual (mesmo visual de hoje). Para trocar, basta
// colocar o PNG com o nome indicado na pasta — nenhum código muda.
// Nomes esperados: src/assets/brand/README.md.
const locais = import.meta.glob("../assets/brand/*.{png,webp,svg}", { eager: true, import: "default" });

const local = (nome) => locais[`../assets/brand/${nome}`] || null;

// URLs atuais (CDN do Base44). Deixam de existir quando o app sair do Base44:
// substituir pelos arquivos locais antes disso.
const ATUAL = {
  icone: "https://media.base44.com/images/public/6ab6791e92caee6a12a15e7d/db884999f_icon48.png",
  trianglePointing: "https://media.base44.com/images/public/6ab661844ee5edf2246a0d61/a27793e5f_mascote-triangulo-apontando.png",
  circleThinking: "https://media.base44.com/images/public/6ab661844ee5edf2246a0d61/e7a51ec3f_mascote-circulo-pensando.png",
  squareCambalhota: "https://media.base44.com/images/public/6ab661844ee5edf2246a0d61/2cea17fc7_mascote-quadrado-cambalhota.png",
  roundedWaving: "https://media.base44.com/images/public/6ab661844ee5edf2246a0d61/5e624671d_mascote-arredondado-acenando.png",
};

export const BRAND = {
  /** Ícone quadrado (monograma NGS) — AppHeader, favicon. */
  icone: local("icone.png") || ATUAL.icone,
  /** Logotipo completo (com nome). Sem arquivo local, usa o ícone. */
  logoCompleto: local("logo-full.png") || local("icone.png") || ATUAL.icone,
};

export const MASCOTES = {
  trianglePointing: local("mascote-triangulo-apontando.png") || ATUAL.trianglePointing,
  circleThinking: local("mascote-circulo-pensando.png") || ATUAL.circleThinking,
  squareCambalhota: local("mascote-quadrado-cambalhota.png") || ATUAL.squareCambalhota,
  roundedWaving: local("mascote-arredondado-acenando.png") || ATUAL.roundedWaving,
};
