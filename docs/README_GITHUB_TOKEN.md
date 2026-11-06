# Como gerar o token do GitHub para publicar o portfólio

Este documento é para o proprietário. A interface do Studio também oferece estas instruções, com links, em **Publicar → Como gerar o token? Ver passo a passo**.

## Gerar token novo
1. Abra [Criar fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) e faça login na conta **jordanferrary**.
2. Em **Token name**, escolha algo como `Portfolio Studio`; defina **Expiration** para uma data próxima.
3. Em **Resource owner**, selecione sua própria conta.
4. Em **Repository access**, escolha **Only select repositories** e selecione `portfolio_jordan`.
5. Em **Repository permissions**, altere **Contents** para **Read and write**. Não é necessário permitir acesso a todos os repositórios.
6. Clique em **Generate token** e copie imediatamente o valor mostrado: o GitHub não o exibe novamente.
7. Volte ao portfólio, desbloqueie o Local Studio, clique em **Publicar**, cole o token **somente no campo de publicação**, confira a caixa de confirmação e conclua.
8. Acompanhe o resultado em [Actions do repositório](https://github.com/jordanferrary/portfolio_jordan/actions).

## Se perdeu o token
Não é possível recuperar um token já criado. Acesse [Gerenciar tokens fine-grained](https://github.com/settings/personal-access-tokens), avalie quais ainda são necessários, revogue os que não utiliza mais e gere um novo seguindo os passos acima.

## Cuidados essenciais
O PIN local não substitui credenciais. Quem obtiver um PAT válido com permissão de escrita pode utilizá-lo, mesmo sem a interface do portfólio. Não coloque o token em código, prints, mensagens, README ou arquivos publicados. O editor guarda o valor apenas em memória enquanto realiza a publicação e o envia para `api.github.com`; não o salva em localStorage ou no backup ZIP.

Leia a [documentação oficial do GitHub](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) para detalhes atualizados da interface.
