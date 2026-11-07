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
