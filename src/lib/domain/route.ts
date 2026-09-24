export interface RouteStopLike {
  id: string;
  status: string;
}

export interface RouteLike {
  status: string;
  stops: RouteStopLike[];
}

export interface FinishRouteCheck {
  canFinish: boolean;
  reason?: 'ja-encerrada' | 'paradas-pendentes';
  pendingStopIds: string[];
}

const PROCESSED_STATUSES = new Set(['delivered', 'failed']);

// finishRoute só pode ser executado uma vez por rota, e só quando todas as
// paradas foram processadas (entregues ou com ocorrência registrada) —
// Fase 5, item 12 do prompt mestre.
export function checkCanFinishRoute(route: RouteLike): FinishRouteCheck {
  if (route.status === 'Concluída') {
    return { canFinish: false, reason: 'ja-encerrada', pendingStopIds: [] };
  }
  const pendingStopIds = route.stops
    .filter((stop) => !PROCESSED_STATUSES.has(stop.status))
    .map((stop) => stop.id);
  if (pendingStopIds.length > 0) {
    return { canFinish: false, reason: 'paradas-pendentes', pendingStopIds };
  }
  return { canFinish: true, pendingStopIds: [] };
}
