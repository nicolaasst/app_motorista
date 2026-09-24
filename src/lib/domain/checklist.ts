export interface ChecklistItemDefinition {
  key: string;
  label: string;
  critico: boolean;
}

export interface ChecklistEvaluation {
  complete: boolean;
  approved: boolean;
  failedCriticalKeys: string[];
  failedNonCriticalKeys: string[];
}

// Regra de negócio (não só de tela): reprovar um item crítico bloqueia o
// início/fechamento do turno — Fase 5, item 10 do prompt mestre. `answers`
// é o mapa { [key]: boolean } vindo do estado real de cada botão Sim/Não
// da tela (não mais um objeto vazio como antes da Fase 3).
export function evaluateChecklist(
  definitions: ChecklistItemDefinition[],
  answers: Record<string, boolean>,
): ChecklistEvaluation {
  const failedCriticalKeys = definitions
    .filter((item) => item.critico && answers[item.key] === false)
    .map((item) => item.key);
  const failedNonCriticalKeys = definitions
    .filter((item) => !item.critico && answers[item.key] === false)
    .map((item) => item.key);
  const complete = definitions.every((item) => typeof answers[item.key] === 'boolean');

  return {
    complete,
    approved: complete && failedCriticalKeys.length === 0,
    failedCriticalKeys,
    failedNonCriticalKeys,
  };
}
