import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setTabTop, tabForPath } from "@/lib/tabStack";

// Registra o topo da pilha da aba que possui o caminho atual,
// mantendo as pilhas das abas independentes entre trocas.
export default function TabStackSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const tab = tabForPath(pathname);
    if (tab) setTabTop(tab, pathname);
  }, [pathname]);
  return null;
}