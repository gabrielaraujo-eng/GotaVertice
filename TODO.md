# Próximo estágio — aplicação web full-stack

## [ ] Servidor e persistência real
- O projeto deve iniciar com `npm run dev` e servir frontend e API no mesmo processo.
- O servidor deve criar o banco SQLite e o schema necessários sem apagar dados existentes.
- Usuários, residência e leituras devem sobreviver ao reinício do servidor.

## [ ] Autenticação persistente
- Um login válido deve criar uma sessão no servidor.
- A sessão deve ser mantida em cookie HttpOnly e não em `localStorage`.
- Usuários não autenticados devem ser redirecionados para o login.
- Logout deve invalidar a sessão no servidor.
- A conta de demonstração deve continuar disponível para apresentação local.

## [ ] Dashboard conectado à API
- O dashboard deve carregar residência e leituras da API.
- Criar e editar residência deve persistir no servidor.
- Registrar leituras deve persistir no servidor e respeitar as validações atuais.
- Exportar e limpar dados deve operar sobre os dados do usuário autenticado.
- Falhas de rede devem apresentar feedback compreensível.

## [ ] Qualidade e documentação
- `npm test` deve continuar cobrindo as regras de consumo.
- O servidor deve ter verificações de saúde e respostas JSON consistentes.
- O README deve explicar instalação, execução, credenciais de demonstração e limites do armazenamento local.
- A rota `/manus-routes.json` deve declarar as páginas navegáveis da aplicação.
