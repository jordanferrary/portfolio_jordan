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
- Na navegação normal, **todos veem a versão publicada**, mesmo quem já brincou com o Local Studio. Não é preciso excluir cookies ou dados do site a cada atualização.
- Ao desbloquear o Local Studio, o editor recupera os rascunhos locais daquele navegador. Ao bloquear o editor, a visualização volta para a versão pública.
- A opção **Restaurar versão publicada** dentro da tela de publicação descarta o rascunho do navegador; faça backup antes se quiser conservar o trabalho.
- O **logo lateral** pode ser trocado pelo botão de lápis no JF ou pela opção **Editar Logo** no Local Studio. Depois, use Publicar no GitHub para disponibilizá-lo aos visitantes.
- A opção Restaurar versão publicada apaga os rascunhos locais e recupera o conteúdo incluído na versão do site carregada. Faça backup antes.
- Depois da publicação, o Studio mantém os arquivos locais visíveis enquanto a publicação termina. Ao atualizar para a nova versão, remove o rascunho correspondente apenas se o conteúdo não tiver sido alterado novamente.
- Se outra versão já foi publicada e o site atual está desatualizado, a publicação é bloqueada para evitar sobrescrever alterações sem revisão.

## Por que um visitante parecia não receber atualizações?

Versões antigas priorizavam rascunhos guardados no localStorage. Quem editasse no modo dev poderia ver seus próprios projetos e músicas antigos em vez da versão pública. A partir desta atualização, o modo visitante ignora o rascunho e sempre lê o conteúdo incluído no build do GitHub Pages; não é um problema de cookies. Quem estiver com o Studio desbloqueado pode continuar vendo seu rascunho até bloqueá-lo.

## Local Studio 3.0 — área de trabalho organizada

O modo de edição apresenta uma única barra flutuante com ações organizadas:
- **Editar página:** ação contextual para Home, Galeria, Sobre, Contato ou o projeto aberto.
- **Novo projeto:** cria uma obra, independentemente da página atual.
- **Ferramentas:** central dividida em Páginas, Projetos, Conteúdo, Identidade e Gerenciamento.
- **Publicar:** utiliza a mesma autorização GitHub por token temporário.
- **Bloquear:** encerra a edição sem apagar seus rascunhos.

Quando o editor de projeto abre, a página pública é ocultada por um fundo sólido. O workspace ocupa a tela e separa Informações, Composição, Processo, Categorias e Arquivos. Salvar continua sendo local até o próximo envio pelo GitHub Studio.

## Prévia de link e favicon

Em **Ferramentas > Identidade > Favicon e link**, você pode:
- Editar o título e a descrição do cartão compartilhado, em inglês.
- Conferir uma simulação do cartão de compartilhamento.
- Trocar o favicon por uma imagem da biblioteca ou por upload quadrado.
- Abrir o editor da Home para substituir o banner usado na prévia do link.

Ao publicar pelo GitHub Studio, o mesmo GitHub Actions:
1. Lê a imagem de fundo da Home do conteúdo público.
2. Gera social-preview.jpg em **1200 x 630 pixels**, com enquadramento central.
3. Gera ícones PNG em **16, 32 e 180 pixels** quando há favicon personalizado; senão mantém o JF original.
4. Inclui no HTML inicial as tags estáticas **Open Graph** e **Twitter Card**, com links absolutos e versão que muda a cada publicação.

As plataformas de mensagem consultam o HTML antes de executar o React, por isso as tags são produzidas no build. **Alguns aplicativos guardam prévias em cache e podem demorar para atualizá-las**, mesmo após uma publicação bem-sucedida.

O script de imagens está em scripts/build_site_identity.py, utiliza Pillow no workflow do GitHub e não exige Cloudflare, R2 ou servidor adicional. O banner deve ser importado para a biblioteca do site ou estar hospedado nos arquivos públicos do próprio repositório. URLs de imagens de outros domínios não são baixadas automaticamente pelo workflow.

**Domínio personalizado:** ao trocar de domínio, configure PUBLIC_SITE_URL como URL HTTPS pública do site, com barra final, e ajuste o base do Vite se necessário. O valor padrão é https://jordanferrary.github.io/portfolio_jordan/.

## Direção de arte e paleta cromática

Em **Ferramentas > Identidade > Paleta de cores**, o Local Studio disponibiliza um seletor cromático de alta precisão:

- **Aro de matiz:** escolha a cor principal arrastando o marcador no círculo.
- **Triângulo:** ajuste saturação e brilho em duas dimensões, como em editores de arte digital.
- **Valores exatos:** digite códigos HEX ou valores RGB. Os controles H, S e V permitem ajustes numéricos.
- **Variáveis globais:** Cor principal, Cor secundária, Fundo do site e Superfícies.
- **Presets:** Neón, Aurora, Rosa, Solar e Lua, todos ajustáveis.
- **Prévia ao vivo:** veja o resultado enquanto edita. Cancelar desfaz a experiência; Salvar paleta mantém um rascunho local. Publicar envia o novo tema ao GitHub.

O tema é guardado na propriedade themePalette do conteúdo de portfólio. Valores HEX inválidos são descartados e substituídos pelos padrões. A versão pública usa a última paleta publicada; os rascunhos privados continuam isolados.

As variáveis CSS fundamentais são --jf-primary, --jf-secondary, --jf-background e --jf-surface, aplicadas na raiz do documento. Bordas, brilho, fundos elevados e outros detalhes são derivados automaticamente por color-mix(), sem precisar configurar cada item individualmente.

O arquivo src/styles/creative-direction.css controla os novos efeitos visuais das páginas públicas: superfícies em profundidade, gradientes cromáticos, microinterações, transições e animações leves. Para acessibilidade, a preferência do sistema por movimento reduzido desativa essas animações.

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
