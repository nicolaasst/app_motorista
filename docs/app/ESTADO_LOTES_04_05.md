# Estado dos Lotes 04 e 05 (app nativo e lojas) — 2026-10-08

## Lote 04 — Capacitor e funções nativas
| Item | Estado |
|---|---|
| Capacitor 8, `android/`, `ios/`, `appId` por `NGS_APP_ID`, ADR-001 | ✅ feito (appId **a confirmar** antes de criar o app nas lojas) |
| Rastreio em 2º plano (serviço em 1º plano Android, `location` no iOS), frequência adaptativa, fila local, envio em lote | ✅ código + testes de unidade; **❌ NÃO validado em aparelho** — não declarar pronto |
| Push (FCM/APNs): permissão, registro e cadastro do token | ✅ código; envio real depende da Edge Function + credenciais (Firebase/APNs) |
| Leitor de código nativo (ML Kit) | ✅ código; **não testado em aparelho** |
| Biometria como atalho (bloqueio ao voltar do 2º plano, ligar/desligar no Perfil) | ✅ código; não testado em aparelho |
| Sessão no Keychain/Keystore | ✅ código + teste |
| Offline: assets locais no pacote nativo, **fontes e ícones empacotados** (antes vinham do Google CDN) | ✅ |
| Service worker só para o modo web | ⏸ não feito (baixa prioridade; PWA segue sem cache offline) |
| Roteiro de teste em aparelho + consultas SQL de medição | ✅ `TESTE_EM_APARELHO.md`; **o teste é do dono** |

## Lote 05 — Lojas e pipeline
| Item | Estado |
|---|---|
| Páginas públicas `/privacidade`, `/termos`, `/exclusao-de-conta` (TMS) | ✅ no ar após o merge do PR do TMS; identificação da empresa **A PREENCHER** (`VITE_EMPRESA_*`, `VITE_ENCARREGADO_*`); "revisão jurídica pendente" visível |
| Exclusão de conta no app + link web | ✅ (já existia no app: Perfil → Excluir Conta) + página web |
| Divulgação destacada da localização (antes da permissão) e links legais no Perfil | ✅ (links só aparecem com `VITE_LEGAL_BASE_URL`) |
| Justificativas, permissões Android/`Info.plist`, Data Safety e rótulos Apple (rascunho) | ✅ `docs/store/` — **revisão jurídica pendente** |
| Ficha (textos, palavras-chave) | ✅ rascunho; categoria/idade e links a confirmar |
| Ícone 1024, ícones adaptativos, splash, gráfico 1024×500 | ✅ gerados do logo de 500 px (**pedir logo vetorial/alta resolução** para ficar nítido) |
| Capturas de tela reais | 🟡 só telas públicas (entrar, recuperar senha). As logadas precisam da **conta de revisor** (`scripts/store/capturar.mjs` com `CAPTURA_*`) |
| Vídeo de demonstração | 🟡 roteiro pronto; **gravar em aparelho** |
| Conta de revisor | ❌ a criar no TMS (instruções em `docs/store/revisor.md`) |
| Pipeline GitHub Actions (aab/ipa, versionamento, envio) | ✅ escrito; **não executado** (sem runner macOS/Secrets aqui) |
| Exigências vigentes (API 36, Xcode 26, declarações do Play) | ✅ conferidas em fontes públicas; **confirmar nos consoles** |

## Achados no caminho (para o dono decidir)
- A tela de login mostra um **telefone fixo (0800…) e a versão "v2.4.12-PRO • Terminal Embarcado" escritos no código**. Confirmar se o telefone é o oficial e trocar a versão por `VITE_*`/versão real antes de publicar (as capturas de loja já mostram esses textos).
- O logo de origem tem 500 px.
