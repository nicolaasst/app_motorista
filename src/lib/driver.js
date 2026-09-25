import { motoristaAtual } from "@/api/app-motorista";

// Motorista logado: { driver, driverId }. Vem da sessão (RPC app_motorista_contexto);
// antes era o primeiro perfil da lista, com fallback fixo "seed-driver-lucas" (bug B-06).
export const getDriver = motoristaAtual;
