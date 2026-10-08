import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ativarPush } from "@/lib/pushNativo";

/** Ligações do app nativo que dependem da sessão: cadastro do aparelho para push e abertura pela notificação. */
export default function SincronizacaoNativa() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const id = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !id) return undefined;
    let desfazer = () => {};
    let vivo = true;
    ativarPush({ aoAbrir: () => navigate("/notifications") }).then((d) => {
      if (vivo) desfazer = d;
      else d();
    });
    return () => {
      vivo = false;
      desfazer();
    };
  }, [isAuthenticated, id, navigate]);

  return null;
}
