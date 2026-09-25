import { getQueue, enqueue, removeItem } from "@/lib/offlineQueue";
import { syncNow } from "@/lib/syncEngine";

// Toda prova (entrega, insucesso, emergência) passa pela fila, online ou não:
// um caminho só, idempotente, e a foto/assinatura nunca se perdem se a rede
// cair no meio. Com rede, sincroniza na hora e diz o que aconteceu.
//   enviado   → gravado no servidor
//   offline   → guardado no aparelho; sobe quando a conexão voltar
//   rejeitado → o servidor recusou por regra de negócio (mensagem para o motorista)
export async function enviarProva(item) {
  const id = enqueue(item);
  if (!id) return { estado: "rejeitado", mensagem: "Sessão encerrada. Entre novamente." };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { estado: "offline" };
  await syncNow();
  const atual = getQueue().find((i) => i.id === id);
  if (!atual) return { estado: "enviado" };
  if (atual.status === "rejeitado") {
    removeItem(atual.id);
    return { estado: "rejeitado", mensagem: atual.last_error || "Registro recusado pelo servidor." };
  }
  return { estado: "offline" };
}
