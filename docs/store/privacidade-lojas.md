# Rascunho — Data Safety (Google) e rótulos de privacidade (Apple)

Baseado no que o app **realmente** coleta (inventário em `Ngs_transportes/src/features/paginas-legais/schemas/inventario-dados.ts`). Todos os dados são
**coletados e vinculados à identidade do motorista**, usados para a função do app (não para publicidade) e **criptografados em trânsito (HTTPS)**.
Não há SDK de anúncios nem de análise de terceiros. *Revisar com o jurídico antes de enviar.*

## Google Play — Data Safety
| Categoria | Tipo | Coletado | Compartilhado | Obrigatório | Finalidade |
|---|---|---|---|---|---|
| Localização | Localização precisa | Sim (inclusive em segundo plano) | Não* | Sim (função principal) | Funcionalidade do app |
| Informações pessoais | Nome, e-mail, telefone, endereço, IDs (CPF, matrícula, CNH) | Sim | Não | Sim | Funcionalidade, gestão de conta |
| Informações financeiras | Dados de conta bancária/PIX (somente leitura no app) | Sim | Não | Não | Funcionalidade |
| Fotos e vídeos | Fotos | Sim | Não | Não | Funcionalidade (comprovantes) |
| Arquivos e docs | Documentos pessoais/do veículo | Sim | Não | Não | Funcionalidade |
| Atividade do app | Registros de entrega/jornada | Sim | Não | Sim | Funcionalidade |
| Identificadores | ID do aparelho para push (token) | Sim | Não | Não | Funcionalidade |
| Informações do app | — (sem relatórios de falha de terceiros no app) | Não | — | — | — |

\* O embarcador da carga vê o andamento e o comprovante da própria entrega; isso é parte da função do serviço, não venda de dados. Confirmar a resposta com o jurídico.
**Exclusão de dados:** o usuário pode pedir dentro do app (Perfil → Excluir Conta) e pela web (`/exclusao-de-conta`). Dados que a lei manda guardar permanecem pelo prazo legal.

## Apple — App Privacy ("Nutrition labels")
Dados **vinculados ao usuário**, **não usados para rastreamento** (sem "Tracking"):
Localização precisa; Informações de contato (nome, e-mail, telefone, endereço); Identificadores (ID do usuário, ID do aparelho para push);
Conteúdo do usuário (fotos, assinatura); Informações financeiras (somente exibição de conta de recebimento); Dados de uso (registros de entrega/jornada).
Finalidade: **Funcionalidade do app**. Sem uso para publicidade, análise de terceiros nem rastreamento entre apps.
