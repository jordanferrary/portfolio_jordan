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
O PIN local não substitui credenciais. Quem obtiver um PAT válido com permissão de escrita pode utilizá-lo, mesmo sem a interface do portfólio. Não coloque o token em código, prints, mensagens, README ou arquivos publicados. Por padrão, o editor conserva o token apenas em memória durante a publicação. Opcionalmente, o proprietário pode clicar em **Guardar token criptografado**, salvando um ciphertext AES-256-GCM no IndexedDB com chave WebCrypto não exportável. O valor não é salvo no localStorage ou nos backups do portfólio. O token descriptografado só é usado durante a sessão de publicação, mas scripts da mesma origem podem acessar a autorização. A GitHub App com Worker é a alternativa de maior isolamento.

Leia a [documentação oficial do GitHub](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) para detalhes atualizados da interface.

## Guardar a autorização apenas uma vez

Em **Publicar → Cofre do Alquimago**, insira a credencial no campo protegido e clique **Guardar token criptografado**. O Studio só salva após verificar a conta e as permissões de escrita. Nas próximas publicações, carrega e verifica a credencial automaticamente. O comando **“vai comprar pão”** abre a revisão e consulta apenas seu status, sem ler nem divulgar o valor no chat.

Se o GitHub rejeitar a credencial por expiração ou revogação, o Alquimago avisa que “o pão mofou” e pergunta se pode descartá-la. Use **Descartar token** com confirmação e informe outra. Falhas temporárias de rede não apagam a credencial automaticamente. Descartar no navegador **não revoga** a autorização no GitHub, que deve ser revogada separadamente caso necessário.
