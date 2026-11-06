# GitHub Studio — publicação diretamente pelo navegador

O portfólio React/Vite pode ser atualizado sem instalar nada no PC e sem Cloudflare R2. O Local Studio guarda os rascunhos no navegador até o proprietário clicar em **Publicar no GitHub**.

## Primeira publicação

1. Abra https://jordanferrary.github.io/portfolio_jordan/ e ative o Local Studio.
2. Revise projetos, textos, capas, imagens, músicas, configurações e ordem dos trabalhos.
3. Antes de publicar pela primeira vez, faça um **Backup ZIP**.
4. Abra **Publicar no GitHub** na barra inferior do Local Studio.
5. No próprio GitHub, crie um **fine-grained personal access token** em https://github.com/settings/personal-access-tokens/new .
   - Resource owner: **jordanferrary**
   - Repository access: **Only select repositories** → **portfolio_jordan**
   - Repository permissions: **Contents → Read and write**. Não precisa de Administration, Secrets nem Workflows.
   - Expiration: configure um prazo curto.
6. Cole o token somente no campo do seu site. Nunca envie essa credencial a alguém, por chat ou para os arquivos do repositório.
7. Marque a autorização e clique **Publicar no GitHub**.
8. Acompanhe https://github.com/jordanferrary/portfolio_jordan/actions . Quando o deploy for concluído, atualize o site.

## Arquitetura

- src/data/published-portfolio.json: versão pública do conteúdo, importada pelo Vite durante a compilação.
- public/images/studio/: imagens de projetos, banners, capas e ícones.
- public/audio/studio/: músicas enviadas pelo Studio.
- src/lib/github-publish.ts: usa a GitHub REST API para criar blobs, árvore e um único commit, depois atualiza a branch sem sobrescrever o histórico à força.
- src/hooks/use-portfolio.ts: lê a versão pública incorporada ao build, respeitando os rascunhos locais quando existem.
- src/lib/published-assets.ts: resolve referências portáveis com prefixo site://, que funcionam em diferentes domínios quando o Vite usa o caminho base correto.

Os arquivos de mídia são identificados por SHA-256. O sistema reutiliza os arquivos que já estiverem no repositório. Não remove automaticamente mídias antigas para evitar exclusões involuntárias.

## Rascunhos, dispositivos e restauração

- Salvar no editor cria rascunhos somente neste navegador; não atualiza o site público.
- Publicar no GitHub grava uma nova versão no repositório; o GitHub Actions a transforma na versão pública.
- Em outro navegador sem rascunhos próprios, a versão publicada é carregada.
- Um navegador que já tinha rascunhos antigos continuará priorizando seus próprios dados até serem publicados ou restaurados.
- A opção Restaurar versão publicada apaga os rascunhos locais e recupera o conteúdo incluído na versão do site carregada. Faça backup antes.
- Depois da publicação, o Studio mantém os arquivos locais visíveis enquanto a publicação termina. Ao atualizar para a nova versão, remove o rascunho correspondente apenas se o conteúdo não tiver sido alterado novamente.
- Se outra versão já foi publicada e o site atual está desatualizado, a publicação é bloqueada para evitar sobrescrever alterações sem revisão.

## Segurança e limites

- O PIN do Local Studio é apenas uma barreira visual. A proteção real da publicação exige autorização no GitHub.
- O token GitHub fica apenas na memória do navegador durante a publicação, é enviado apenas para api.github.com e é removido do formulário ao terminar.
- Um token pessoal é uma credencial sensível; a implementação atual é prática, mas não é equivalente a um login OAuth com servidor seguro. Use dispositivo confiável, poucas permissões e expiração curta. Revogue o token quando não for mais necessário.
- Limite atual de novas mídias: 80 MB por publicação. Áudios muito grandes e vídeos devem usar outra infraestrutura.
- Mensagens privadas de clientes, autenticação de visitantes e curtidas públicas sincronizadas exigem um serviço externo.
- Todo conteúdo publicado vai para um repositório público. Não publique informações privadas ou materiais sem autorização.

## Problemas comuns

- 401: token expirado ou incorreto.
- 403: token sem permissão de escrita ou acesso limitado.
- 404: token sem acesso ao repositório ou recurso alterado.
- 409/422: conflitos ou regras de proteção na branch. Não force o histórico.
- Imagem local ausente: importe novamente nesse navegador ou restaure um backup ZIP.
- Página antiga após o envio: confira o workflow Deploy React to GitHub Pages.

## Referências oficiais

- https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-your-git-database
- https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
- https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests
