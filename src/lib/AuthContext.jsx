import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { claimsDoToken, supabase, supabaseConfigurado } from "@/api/supabaseClient";
import { limparContexto, sair } from "@/api/app-motorista";
import { definirUsuarioFila } from "@/lib/offlineQueue";

// Autenticação pelo Supabase Auth (mesmo auth.users do TMS).
// Contrato mantido para App.jsx/ProtectedRoute: user, isAuthenticated,
// isLoadingAuth, authChecked, authError { type: 'auth_required' |
// 'user_not_registered' | 'config_missing' }, logout, navigateToLogin.
//
// "Motorista" = sessão cujo JWT traz portal 'app-motorista' (claims do hook do
// banco). Sessão válida sem essa claim (usuário do TMS, conta não vinculada ou
// motorista suspenso) → user_not_registered. A interface só usa isso para
// decidir a tela; quem garante o acesso é a RLS.

const AuthContext = createContext();

function motoristaDaSessao(session) {
  if (!session) return null;
  const claims = claimsDoToken(session.access_token);
  if (claims?.portal !== "app-motorista" || !claims?.app_motorista_tenant_id) return { naoMotorista: true };
  return { id: session.user.id, email: session.user.email, tenantId: claims.app_motorista_tenant_id };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const aplicar = useCallback((session) => {
    const m = motoristaDaSessao(session);
    if (!m) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      definirUsuarioFila(null);
      limparContexto();
    } else if (m.naoMotorista) {
      setUser({ id: session.user.id, email: session.user.email });
      setIsAuthenticated(true);
      setAuthError({ type: "user_not_registered", message: "Conta sem cadastro ativo de motorista" });
      definirUsuarioFila(null);
      limparContexto();
    } else {
      setUser(m);
      setIsAuthenticated(true);
      setAuthError(null);
      definirUsuarioFila(m.id);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  const checkUserAuth = useCallback(async () => {
    if (!supabaseConfigurado) {
      setAuthError({ type: "config_missing", message: "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes" });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    setIsLoadingAuth(true);
    const { data } = await supabase.auth.getSession();
    aplicar(data.session);
  }, [aplicar]);

  useEffect(() => {
    checkUserAuth();
    if (!supabaseConfigurado) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      // PASSWORD_RECOVERY / TOKEN_REFRESHED / SIGNED_IN / SIGNED_OUT: reavalia as claims.
      aplicar(session);
    });
    return () => data.subscription.unsubscribe();
  }, [aplicar, checkUserAuth]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await sair();
    if (shouldRedirect) window.location.assign("/login");
  }, []);

  const navigateToLogin = useCallback(() => {
    const destino = window.location.pathname + window.location.search;
    window.location.assign(`/login?returnTo=${encodeURIComponent(destino)}`);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
