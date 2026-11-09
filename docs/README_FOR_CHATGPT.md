# README para ChatGPT — visão técnica e continuidade

Este guia foi escrito para futuras sessões do ChatGPT que recebam acesso ao repositório. A fonte definitiva é o código atual, não uma resposta anterior da IA.

## O que é este projeto?
Portfólio de artista 3D, ilustrador e motion designer, com galeria Pinterest de quatro colunas em desktop, páginas individuais de projetos, contatos por redes sociais e editor local ("Local Studio"). O visitante consome o bundle público; ferramentas administrativas usam imports dinâmicos.

## Fluxo de dados / publicação
1. `src/hooks/use-portfolio.ts` lê `src/data/published-portfolio.json` para o visitante.
2. Quando o Studio é desbloqueado, edições se tornam rascunhos em `localStorage`, com blobs em IndexedDB (`src/lib/media-store.ts`).
3. Uploads de imagens são processados em WebP pelo navegador; `media://` identifica o arquivo local.
4. `src/lib/github-publish.ts` verifica a revisão publicada, usa PAT temporário exclusivamente na API GitHub, prepara os arquivos `site://` e publica novo `published-portfolio.json`.
5. Nesta etapa de publicação são geradas versões WebP de 480 e 960 px (limites do maior lado), além da versão de maior resolução. `imageVariants` guarda URIs e **largura real** para o `srcset`.
6. `AssetImage` seleciona a imagem adequada por `sizes`; `ArtLightbox` usa a imagem maior diretamente. Mídias legadas sem variantes continuam utilizáveis.
7. Vídeos em projetos são cartões com thumbnail: o iframe YouTube/Vimeo só é instanciado depois do clique.

## Interações importantes
- Local Studio: Ctrl + \\ abre a tela de PIN; o PIN apenas esconde a interface, não oferece segurança de servidor.
- Galeria: abrir projeto, reordenar no Studio, pesquisar, filtrar. Não converter clique simples da galeria em zoom, pois ele já é navegação.
- Projeto: blocos `heading`, `text`, `image`, `image-left`, `image-right`, `before-after`, `gallery`, `divider`, `video`; zoom na imagem e inspeção da comparação.
- Publicação: guia do token dentro do editor; nunca persistir credenciais.
- Contato: links sociais, não formulário de mensagens ativo.
- Backup: ZIP com `portfolio.json` e biblioteca de mídia local.

## Fontes principais e cuidados
Leia `src/data/projects.ts`, `src/data/studio.ts`, `src/lib/github-publish.ts` e `src/components/sections/admin-editor.tsx` antes de alterar modelos. Projetos antigos não possuem novas propriedades: toda inovação deve ter fallback. Repositório publicado no GitHub Pages pode ter base `/portfolio_jordan/`; `vite.config.ts` controla o valor no deploy. Evite URLs absolutas fixas para assets.

## Checklist de execução
- Validar imports, tipos e ordem de provider.
- Executar `npm run typecheck` e `npm run build` quando houver execução local; caso contrário declarar essa limitação.
- Testar pelo menos: Home, galeria, projeto com/sem vídeo, comparador, zoom por mouse/teclado/toque, conversão WebP e backup.
- Conferir publicação com imagens já existentes e novos uploads, e garantir que o PAT não apareça no console ou no arquivo publicado.
- Ao terminar, distinguir "commits realizados" de "build e deploy confirmados".

## Preferência de trabalho
Responder ao proprietário em português com objetividade. Não redesenhar os elementos sem solicitação. Entregar implementação concreta e feedback preciso; indicar riscos reais sem alarmismo.


## Atualização: biblioteca e modelos 3D
- **Gerenciar arquivos** no Local Studio (`src/components/sections/media-manager.tsx`) agora abre na aba **Arquivos do GitHub**, com miniaturas e filtros de **todas as subpastas públicas**, mesmo mídias fora dos projetos. `getPublicRepositoryMedia(store)` consulta a árvore publicamente **sem token**; `repositoryMediaPreviewUrl(path)` usa raw.githubusercontent.com para miniaturas. A aba **Arquivos locais** trata IndexedDB.
- Seleções da galeria pública são encaminhadas via estado do `src/app.tsx` para `GitHubPublishEditor` (`stagedDeletionPaths`). O token só é exigido para efetivar a publicação, que valida novamente os caminhos, o uso e as proteções e cria o commit com `sha:null` para apagar arquivos. O formulário exibe confirmação mesmo sem uma segunda consulta autenticada.
- As imagens dos **projetos de exemplo antigos** deixaram de ser protegidas por regra fixa; elas podem aparecer como órfãs, embora ainda possam constar em códigos de fallback. Mantenha proteção contra exclusão automática e avise sobre referências em CSS, código e URLs antigas.
- A detecção de uso não varre todo CSS ou links externos. Nunca recomende exclusão automática indiscriminada. Consulte [README_MEDIA_CLEANUP.md](README_MEDIA_CLEANUP.md).
- Bloco `model`: URL direta de `.glb` ou `.gltf` com miniatura opcional; `ProjectModel` busca o web component `model-viewer` somente ao clicar. `.fbx` não é suportado de modo nativo: usar Blender para convertê-lo para GLB.
- Bloco `video`: recebeu representação visual mais distinta no seletor de blocos e no card.
- Biblioteca de músicas: título e artista continuam editáveis; nomes no padrão `Artista - Música` geram sugestões; é possível usar thumbnail público do YouTube. Não há downloader/extrator de áudio do YouTube.


## Player de vídeo simplificado (2026-11)

`src/components/ui/project-video.tsx` mantém miniatura antes do clique e iframe oficial após a ativação. **Não** carregar a API JavaScript do YouTube, controles externos, barra de progresso ou painéis adicionais abaixo do vídeo. O único elemento inferior é um link discreto **Watch on YouTube/Vimeo**. Os módulos antigos `youtube-custom-player.tsx` e `youtube-player-api.ts` foram removidos. `Block.videoTitle?:string` permanece disponível como título acessível do iframe, com fallback para o nome do projeto. O YouTube e o Vimeo conservam seus controles nativos.

## Páginas adicionais editáveis (2026-11)

A partir de agora o portfólio não é somente uma galeria: **Local Studio → Páginas → Nova página / Minhas páginas** cria páginas arbitrárias (cursos, recursos, guias etc.) com navegação lateral, ordem e visibilidade ajustáveis. Os quatro links nativos permanecem fixos. O renderizador é `CustomPageView`; o editor é `CustomPageEditor`, e o modelo de dados é `CustomPage`/`PageBlock` em `src/data/custom-pages.ts`. Rota permanente `#/page/<id>`. Reaproveitar `StoryBlock` da página de projeto para mídias e composição; o tipo `action` é específico para botões copiar/abrir links.

O botão **copy** copia texto, prompts ou chave PIX com feedback, **não** processa pagamentos. Botões URL usam `safePageHref` e têm opções mesma aba/nova aba; sem esquema `javascript:` ou interpretação de código. O conteúdo do botão copiar vai para o manifesto público e não deve conter segredos. Imagens de páginas e blocos são tratadas no backup, asset picker, otimização, publicação e detecção de órfãos.

Ver [README_CUSTOM_PAGES.md](README_CUSTOM_PAGES.md). Verificar mobile com muitos links, rota direta, upload de capa, cópia, URLs internas, backup ZIP e deploy após testar a build.


## Carrossel enxuto com altura ajustável
- O editor permite ajustar apenas `slideHeight` de 180 a 640 px. A largura do bloco ocupa a coluna de conteúdo e não é configurável. O número de cartões visíveis é derivado da altura (1 a 4) e limitado pela largura medida em `ResizeObserver`.
- O renderizador `PageSlideshow` **não** mostra descrições, legendas, numeração, dots ou rodapé. O botão de pausa/reprodução existe apenas como controle flutuante dentro da área do slide se `slideShowPauseButton===true`; o padrão é falso. Preservar setas de navegação, zoom individual e as transições configuráveis.
- As opções antigas `slideWidth` e `slideVisible` foram retiradas da interface e não influenciam mais o desenho do site, mesmo que permaneçam em backups anteriores.


## Galeria interativa (uso geral) e enquadramento do zoom
- `showcase` em `src/data/custom-pages.ts` e `ArtistShowcase` em `src/components/sections/page-media-blocks.tsx`: funciona para certificados, prêmios, participantes, obras e coleções; **não** exibir numeração ou rótulos forçados de artista. O painel lateral começa fechado e aparece apenas após selecionar item. Clicar no mesmo item ou no X fecha o painel.
- `ShowcaseItem.linkLabel` e `showLink` são opções por item, editadas em `CustomPageEditor`; `showLink:false` desliga completamente o botão. Sem URL segura, não há botão/placeholder. Itens já existentes sem campo mantêm link quando válido; novos itens começam sem botão.
- `PageBlock.showcaseFit` permite escolher `contain` para mostrar certificados inteiros nas miniaturas, ou `cover` para artes. O painel de detalhes usa `contain`.
- `ArtLightbox` (compartilhado entre projetos, galerias e slides) usa viewport com dimensionamento `width:100%;height:100%;object-fit:contain`; a imagem original inteira deve aparecer a 100% e o pan deve resetar ao voltar a esse nível. Evite CSS de `grid` com trilhas dimensionadas pela imagem original, que pode causar recortes em imagens enormes.


## Direção de arte — paleta aplicada a todo o site

A versão atual expõe **sete cores independentes**: primária, secundária, fundo, superfícies, texto principal, texto secundário e bordas. `ThemePalette`/normalização e publicação ficam em `src/lib/theme-palette.ts` e `src/hooks/use-portfolio.ts`. O editor possui prévia imediata, cancelamento que reverte, e indicadores WCAG. Cores antigas de quatro tokens migram sem perder customizações.

`src/styles/theme-coverage.css` é a camada central de integração pública e **deve continuar sendo importada por último**, depois de `custom-pages.css`. Ela abrange Home, galerias, case studies, Sobre, Contact, páginas e player; respeite os sete tokens e evite valores roxos fixos em novas seções públicas. A cor das obras e os controles internos do Local Studio ficam intocados.

## Alquimago: compilação independente e upgrade cognitivo 2.0

- O código-fonte do familiar vive em `jordanferrary/alquimago`. A versão integrada não é escrita manualmente no `public/alquimago/alquimago.js` do repositório: o `npm run build` chama o `prebuild`, que executa `scripts/sync-alquimago.mjs` e busca o código atual do upstream.
- A sincronização executa os testes do familiar, produz o bundle, registra o SHA de origem em `public/alquimago/release.json` (no ambiente de build) e exige os recursos de cognição 2.0 através de `scripts/check-alquimago-release.mjs`.
- Tanto GitHub Pages quanto Cloudflare Pages devem executar `npm run build` com Git e rede disponíveis. Não assuma que mudar um arquivo no upstream atualiza o site sem um novo build do hospedeiro.
- O upgrade 0.11.0 aumenta limites locais para 128 lições, 160 exemplos e 64 protótipos; condiciona sinapses simuladas ativadas com até 512 pesos persistentes. Não instala LLM local nem altera autorização para Gemini, publicação ou arquivos privados.
- A versão do bundle publicado deve ser verificada no `/alquimago/release.json` servido pelo domínio. O marcador dentro do repositório pode ser antigo, pois a sincronização acontece durante o build e não reescreve automaticamente o commit de origem do portfólio.

## Alquimago v0.11.3 — regras de continuidade (2026-11-08)

O núcleo do robô é **outro repositório** (`jordanferrary/alquimago`), com sua skin Orb 2D e o aprendizado local. A configuração, conhecimento público, memória numérica de publicação, complementos 3D e API Gemini são exclusivos deste site. As falas específicas de Frankie estão agora em `public/alquimago/config.json` > `assistant.spotlights`, nunca diretamente no núcleo. Ver `docs/ALQUIMAGO_FILE_BOUNDARIES.md`.

O upload multimodal existe somente no Grimório do Studio com o Gemini ativado; até 8 MB de JPG/PNG/WebP, prévia e compactação locais, clique explícito para enviar; texto de feedback retornado pelo proxy Cloudflare. Imagens não entram em lições ou Git. O processamento semântico com Gemini não é offline. O serviço `/api/assistant` continua público, sem rate limit forte: monitore cotas.

Ao alterar o widget, teste o repositório do bot e **reconstrua o portfólio**: `scripts/sync-alquimago.mjs` sincroniza o upstream durante o build e `scripts/check-alquimago-release.mjs` compara versão interna, manifest e recursos esperados. Use `npm run test:assistant` para a Function. GitHub Pages não executa Cloudflare Pages Functions; verifique o endpoint no domínio Cloudflare.


## Publicação Studio e imagens (2026-11-09)

- O único atalho principal de publicação é **Publicar** na barra inferior de `StudioDock`; o painel de ferramentas não deve conter cópia do botão. O diálogo ainda exige confirmação explícita.
- O botão usa **somente o PAT validado do cofre próprio** `src/lib/github-token-vault.ts` (IndexedDB `jf-local-studio-publisher-v2`, chave AES-GCM não extraível). Não migrar automaticamente o token legado do Alquimago nem reutilizar sessão GitHub App para contornar o cofre. O usuário cola e valida uma vez por navegador; a credencial é reutilizada enquanto válida e presente. O Alquimago não recebe PAT em eventos e não pode abrir o fluxo de publicação via `alquimago:request-publish`.
- A separação de IndexedDB impede confusões acidentais com o cofre antigo, **não** é uma barreira de segurança contra JavaScript malicioso executado na mesma origem: ambos podem acessar APIs do navegador. O token nunca vai para chat, repositório ou logs.
- `showcase` em `CustomPageEditor` deve utilizar `PageMediaField`: upload, biblioteca/clip, edição rápida e URL opcional. Os caminhos `media://` de `showcaseItems[].image` são rastreados por `refsFor`, exibidos em `AssetPicker` e enviados por `github-publish.ts` antes de gerar o manifesto público.
- Todos os **uploads de imagem persistidos pelo Studio** chamam `saveUploadedMedia`, que converte no navegador para WebP, mantém somente o WebP processado (não grava a origem JPG/PNG/AVIF), calcula SHA-256 e serializa as gravações para reutilizar cópias existentes, inclusive quando uploads ocorrem simultaneamente. Imagens externas referenciadas por URL não são copiadas nem convertidas, pois podem não permitir acesso CORS.
- `github-publish.ts` também converte blobs locais legados que não sejam WebP quando são selecionados para publicação. Imagens JPG/PNG **já publicadas** e ainda referenciadas não são removidas automaticamente. A exclusão deve seguir a auditoria de referências, backup e confirmação explícita do gerenciador de mídia. O arquivo original no computador do visitante nunca é apagado pelo site.
- Testar `npm run test:studio-media`, `npm run test:github-vault`, `npm run test:studio` e o build em cada alteração dessas rotinas.
