# Conta de revisor e instruções de acesso

O revisor da loja precisa entrar no app. O login é por **CPF ou matrícula + senha** (e-mail também é aceito).

## O que o dono precisa fazer (nada disso foi criado)
1. No TMS, cadastrar um motorista **fictício** marcado como conta de revisão (nome "Revisor da Loja"; CPF válido de teste; **sem dado pessoal real**), com veículo de placa válida.
2. Liberar o acesso ao app pelo botão "Dar acesso ao app" (função `motorista-app-convite`) ou por convite no Auth.
3. Criar uma **rota de demonstração iniciada** com 2–3 paradas, para o revisor ver mapa, entrega e a notificação de rastreio.
4. Guardar identificador e senha **no gerenciador de segredos** e colar nos campos "Instruções de acesso" do Play Console e "Informações de login" do App Store Connect. **Nunca** commitar a senha.
5. Desativar a conta de revisão depois da aprovação, se quiser.

## Texto para o campo de instruções (preencher os colchetes no console)
> Entre com o identificador [IDENTIFICADOR] e a senha [SENHA]. O app é de uso exclusivo de motoristas cadastrados. Há uma rota de demonstração: toque nela em
> "Início" → "Iniciar navegação"; o app mostra a divulgação de localização e pede a permissão. Para ver a coleta em segundo plano, bloqueie a tela por alguns
> segundos com a rota ativa. A exclusão de conta fica em Perfil → Excluir Conta.
