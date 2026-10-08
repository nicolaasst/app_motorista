# Roteiro de teste em aparelho — rastreio em segundo plano (Lote 04)

**O rastreio só é "pronto" depois deste teste aprovado.** Não dá para testar sem aparelho físico (emulador não reproduz bloqueio de tela, economia de bateria nem reinício).

## Antes de começar
- Um Android (versão 13 ou mais nova de preferência; anote marca/modelo — Xiaomi, Samsung e Motorola têm economia de bateria agressiva) e um iPhone.
- Build de depuração: `npm run build && npx cap sync && npx cap open android` (ou `ios`) e rode no aparelho.
- Uma rota **iniciada** no TMS com veículo de placa válida (sem placa o ponto não aparece na Torre GPS), atribuída ao motorista de teste.
- Permissões: aceite localização "Durante o uso do app" (ou "Sempre" no iOS quando pedir) e notificações.
- Anote o horário de início de cada cenário.

## Cenários (marque ✅/❌ e anote a observação)
| # | Cenário | Como fazer | Esperado |
|---|---|---|---|
| 1 | Caminhada, app aberto | 10 min a pé, tela ligada | pontos a cada ~10 s/25 m, linha contínua na Torre GPS |
| 2 | Caminhada, tela bloqueada | 15 min a pé, bloqueie a tela e guarde no bolso | sem buracos > 1 min; notificação "NGS Driver: rota em andamento" visível |
| 3 | Direção, tela bloqueada | 30 min dirigindo (passageiro opera) | pontos contínuos; velocidade coerente |
| 4 | Economia de bateria | Ligue o modo economia e repita o cenário 2 por 15 min | anote se parou; se parar, registre o fabricante |
| 5 | Sem sinal | Modo avião por 5 min andando; volte à rede | os pontos do período aparecem **depois**, em lote, sem duplicar |
| 6 | Reinício do aparelho | Reinicie com a rota ativa, abra o app | retoma o rastreio ao abrir; o que faltou fica como lacuna visível |
| 7 | App fechado à força | Deslize o app para fechar | Android: deve continuar; **iOS: para (restrição do sistema)** — o motorista precisa ser avisado no treinamento |
| 8 | Parado | Fique parado 5 min | perfil "parado": 1 ponto a cada ~2 min |
| 9 | Push | Cadastre o aparelho (entre no app) e confira a linha em `app_motorista_dispositivos` | token presente; (envio real só após a Edge Function com credencial) |
| 10 | Leitor de código | Bipe 5 volumes e uma NF | leitura nativa, sem travar; manual funciona |
| 11 | Biometria | Ative no Perfil, deixe o app 2 min em segundo plano | pede biometria; "Sair e entrar com senha" funciona |

## Como medir pelo TMS (posições recebidas × esperadas, lacunas)
Substitua `:rota` pelo id da rota e rode no SQL Editor (somente leitura):

```sql
-- pontos recebidos e maiores lacunas da rota
with p as (
  select registrado_em,
         registrado_em - lag(registrado_em) over (order by registrado_em) as intervalo
  from public.app_motorista_gps_pontos
  where rota_id = :rota
)
select count(*)                                   as pontos,
       min(registrado_em)                         as primeiro,
       max(registrado_em)                         as ultimo,
       round(extract(epoch from (max(registrado_em) - min(registrado_em))) / 60) as minutos,
       max(intervalo)                             as maior_lacuna,
       count(*) filter (where intervalo > interval '2 minutes') as lacunas_acima_de_2min
from p;

-- as lacunas (onde e quanto)
select registrado_em - intervalo as de, registrado_em as ate, intervalo
from (select registrado_em, registrado_em - lag(registrado_em) over (order by registrado_em) as intervalo
      from public.app_motorista_gps_pontos where rota_id = :rota) x
where intervalo > interval '2 minutes' order by intervalo desc limit 20;
```

**Critério de aprovação sugerido** (o dono pode ajustar): em movimento, ≥ 90% dos minutos com ao menos um ponto; nenhuma lacuna > 5 min
fora do cenário 5/6; nenhum ponto duplicado; Android sobrevive aos cenários 2, 3 e 7 em pelo menos um modelo de cada fabricante de uso da frota.

## Resultado
Preencha uma tabela por aparelho (modelo, versão do sistema, cenários, % cobertura, lacunas) e envie. Se reprovar, siga o **Plano B** do ADR-001.
