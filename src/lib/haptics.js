// Padrões de vibração do app — compartilhados para que toda leitura e toda
// confirmação tenham sempre o mesmo significado físico (scanner, swipe, etc.).
const vibrate = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch { /* dispositivo sem suporte */ }
};

// Vibração curta única — leitura válida / ação confirmada.
export const hapticsSucesso = () => vibrate(60);

// Duplo "buzz-buzz" — leitura inválida (código/NF não pertence à parada).
export const hapticsErro = () => vibrate([90, 70, 90]);

// Padrão intermediário — leitura duplicada (item já bipado antes).
export const hapticsDuplicado = () => vibrate([50, 80, 50]);