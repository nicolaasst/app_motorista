import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useAuth } from "@/lib/AuthContext";
import { autenticar, deveBloquearAoVoltar, estadoInicial, gravarPreferencia, lerEstadoBiometria, lerPreferencia } from "@/lib/biometria";
import { ehNativo } from "@/lib/nativo";

// Estado da biometria no app: se está disponível no aparelho, se o motorista ativou, se o app está bloqueado
// e as ações (ativar, desativar, desbloquear, usar senha). A sessão em si segue no AuthContext/cofre seguro.

const BiometriaContext = createContext(null);

const ESTADO_VAZIO = { disponivel: false, tipo: "biometria", forte: false, mensagem: "" };

export function BiometriaProvider({ children }) {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const userId = user?.id ?? null;
  const [pronto, setPronto] = useState(false);
  const [aparelho, setAparelho] = useState(ESTADO_VAZIO);
  const [ativa, setAtiva] = useState(false);
  const [decidido, setDecidido] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const iniciou = useRef(false);
  const saiuEm = useRef(null);

  // Abertura do app: lê aparelho + preferência uma vez, quando a sessão já foi avaliada. Bloqueia de saída se estiver ativa.
  useEffect(() => {
    if (iniciou.current || isLoadingAuth) return undefined;
    iniciou.current = true;
    let vivo = true;
    (async () => {
      const nativo = ehNativo();
      const [estadoAparelho, preferencia] = nativo && isAuthenticated ? await Promise.all([lerEstadoBiometria(), lerPreferencia()]) : [ESTADO_VAZIO, null];
      if (!vivo) return;
      const e = estadoInicial({ nativo, autenticado: isAuthenticated, userId, preferencia });
      setAparelho(estadoAparelho);
      setAtiva(e.ativa);
      setDecidido(e.decidido);
      setBloqueado(e.bloqueado);
      setPronto(true);
    })();
    return () => {
      vivo = false;
    };
  }, [isLoadingAuth, isAuthenticated, userId]);

  // Login feito com a app já aberta (primeiro login ou outro usuário): carrega estado sem bloquear.
  useEffect(() => {
    if (!iniciou.current || !pronto || !isAuthenticated || !userId || !ehNativo()) return undefined;
    let vivo = true;
    (async () => {
      const [estadoAparelho, preferencia] = await Promise.all([lerEstadoBiometria(), lerPreferencia()]);
      if (!vivo) return;
      const e = estadoInicial({ nativo: true, autenticado: true, userId, preferencia });
      setAparelho(estadoAparelho);
      setAtiva(e.ativa);
      setDecidido(e.decidido);
    })();
    return () => {
      vivo = false;
    };
    // só quando o usuário da sessão muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sessão encerrada: nada de biometria nem bloqueio.
  useEffect(() => {
    if (pronto && !isAuthenticated) {
      setAtiva(false);
      setDecidido(false);
      setBloqueado(false);
      setErro("");
    }
  }, [pronto, isAuthenticated]);

  // Volta do segundo plano.
  useEffect(() => {
    if (!ehNativo() || !isAuthenticated) return undefined;
    let remover = null;
    let vivo = true;
    CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        saiuEm.current = Date.now();
        return;
      }
      const foraMs = saiuEm.current ? Date.now() - saiuEm.current : 0;
      saiuEm.current = null;
      setAtiva((a) => {
        if (deveBloquearAoVoltar({ ativa: a, foraMs })) setBloqueado(true);
        return a;
      });
    }).then((h) => {
      if (vivo) remover = h;
      else h.remove();
    });
    return () => {
      vivo = false;
      remover?.remove();
    };
  }, [isAuthenticated]);

  const desbloquear = useCallback(async () => {
    setOcupado(true);
    setErro("");
    const r = await autenticar({ motivo: "Desbloquear o NGS Driver", forte: aparelho.forte });
    setOcupado(false);
    if (r.ok) {
      setBloqueado(false);
      return true;
    }
    setErro(r.mensagem);
    if (r.indisponivel) setAparelho((a) => ({ ...a, disponivel: false, mensagem: r.mensagem }));
    return false;
  }, [aparelho.forte]);

  const ativar = useCallback(async () => {
    if (!userId) return { ok: false, mensagem: "Entre na conta antes." };
    const estado = await lerEstadoBiometria();
    setAparelho(estado);
    if (!estado.disponivel) return { ok: false, mensagem: estado.mensagem };
    // Só ativa depois de o sistema confirmar a biometria agora: garante que funciona antes de depender dela.
    const r = await autenticar({ motivo: "Ativar o acesso por biometria", forte: estado.forte });
    if (!r.ok) return r;
    await gravarPreferencia({ userId, ativa: true, decidido: true });
    setAtiva(true);
    setDecidido(true);
    return { ok: true };
  }, [userId]);

  const desativar = useCallback(async () => {
    if (userId) await gravarPreferencia({ userId, ativa: false, decidido: true });
    setAtiva(false);
    setDecidido(true);
    setBloqueado(false);
    setErro("");
  }, [userId]);

  const usarSenha = useCallback(async () => {
    await logout(); // encerra a sessão por completo (token, push, biometria) e volta ao login
  }, [logout]);

  const valor = useMemo(
    () => ({ pronto, aparelho, ativa, decidido, bloqueado, erro, ocupado, desbloquear, ativar, desativar, usarSenha }),
    [pronto, aparelho, ativa, decidido, bloqueado, erro, ocupado, desbloquear, ativar, desativar, usarSenha],
  );
  return <BiometriaContext.Provider value={valor}>{children}</BiometriaContext.Provider>;
}

export function useBiometria() {
  const c = useContext(BiometriaContext);
  if (!c) throw new Error("useBiometria precisa estar dentro de <BiometriaProvider>");
  return c;
}
