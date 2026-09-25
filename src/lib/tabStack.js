// Navegação estilo iOS: cada aba possui uma pilha independente (caminho do
// topo lembrado em memória, sobrevive a remontagens de rota) + classificação
// de transição (push/pop/tab) que direciona a animação de troca de telas.

export const TABS = [
  { id: "rota", to: "/", label: "Rota", icon: "local_shipping", prefixes: ["/checklist", "/navigation", "/stop", "/route-complete", "/turn-closing"] },
  { id: "history", to: "/history", label: "Histórico", icon: "history", prefixes: ["/history"] },
  { id: "analysis", to: "/analysis", label: "Análise", icon: "analytics", prefixes: ["/analysis"] },
  { id: "receipts", to: "/receipts", label: "Recibos", icon: "receipt_long", prefixes: ["/receipts"] },
  { id: "profile", to: "/profile", label: "Perfil", icon: "account_circle", prefixes: ["/profile", "/support", "/notifications"] },
];

export function getTab(id) {
  return TABS.find((t) => t.id === id);
}

// Aba que "possui" o caminho ("/" exato é a raiz da aba Rota).
export function tabForPath(pathname) {
  if (!pathname) return null;
  if (pathname === "/") return "rota";
  const tab = TABS.find((t) =>
    t.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
  return tab ? tab.id : null;
}

// Pilha por aba: lembramos apenas o topo (último caminho visitado da aba).
const tabTops = {};

export function setTabTop(id, path) {
  tabTops[id] = path;
}

// Retornar para onde a aba parou (ou a raiz, se nunca visitada).
export function tabTopPath(id) {
  return tabTops[id] || getTab(id)?.to || "/";
}

// Resetar a pilha da aba de volta à raiz.
export function resetTabStack(id) {
  const root = getTab(id)?.to;
  if (root) tabTops[id] = root;
}

// Direção da transição entre dois caminhos: "push" (empilha, entra da direita),
// "pop" (desempilha, sai para a direita), "tab" (troca de aba, fade) ou "none".
export function getNavDirection(prev, next) {
  if (!prev || prev === next) return "none";
  const prevTab = tabForPath(prev);
  const nextTab = tabForPath(next);
  if (prevTab !== nextTab) return "tab";
  if (next.startsWith(prev) && next.length > prev.length) return "push";
  if (prev.startsWith(next)) return "pop";
  return "push";
}