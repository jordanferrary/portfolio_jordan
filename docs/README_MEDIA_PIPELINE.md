# Pipeline de mídia — imagens, zoom e vídeo

## Upload de imagens
`saveUploadedMedia` (`src/lib/media-store.ts`) recebe PNG/JPEG/WEBP/AVIF, limita arquivos de entrada a 35 MB, converte no navegador usando `src/lib/image-optimize.ts` para WEBP (2048 px no maior lado; qualidade 82%) e salva o resultado em IndexedDB com identificador `media://`. O arquivo do computador não é modificado. Arquivos acima de 12 MB depois da conversão são rejeitados.

## Publicação
`src/lib/github-publish.ts` transforma `media://` em `site://`, envia os blobs para `public/images/studio` e grava `src/data/published-portfolio.json`. Para imagens grandes, produz variantes com maior lado de 480 e 960 px (WebP com compressão mais intensa). Também tenta gerar variantes para mídias `site://` antigas e assets próprios do site; falhas recuperáveis mantêm a imagem original.

`imageVariants` é um mapa de `originalRef` para `small`, `smallWidth`, `medium`, `mediumWidth`, `largeWidth`. **As larguras são reais em pixels** (uma imagem vertical pode ter largura muito inferior ao maior lado). Não hardcode valores `480w` ou `960w` em retratos; use as larguras do manifesto.

## Exibição
`ImageVariantProvider` fornece o mapa. `AssetImage` resolve o `site://` e monta `srcSet` e `sizes` quando houver variantes. Sem elas, usa o arquivo principal. Galeria e Home passam `sizes` condizentes com seus cards; projeto usa tamanhos de apresentação maiores. `ZoomableArt` oferece disparo acessível por clique ou Enter e importa `ArtLightbox` somente na primeira abertura. O modal renderiza a fonte maior diretamente; não use a miniatura no zoom.

## Vídeos
O modelo `BlockType='video'` suporta links HTTPS reconhecidos de YouTube e Vimeo, com miniatura opcional. `ProjectVideo` não cria iframe até o visitante clicar. O conteúdo do vídeo continua hospedado na plataforma externa. Links de outras plataformas sem URL de embed compatível não são aceitos automaticamente.

## Compatibilidade
O modelo de dados possui fallbacks e não deve exigir `imageVariants` em arquivos antigos. URLs externas sem permissão CORS não são recodificadas automaticamente. Não remova `media://` antes de publicação/backup. O histórico da documentação está em `README_HISTORY.md`.

## Testes recomendados
- Importar JPG/PNG com mais de 2K, conferir WebP e dimensões.
- Publicar, conferir três arquivos de imagem e referências de `imageVariants`.
- Abrir galeria em celular e desktop, observar `currentSrc` para confirmar escolha do navegador.
- Abrir imagem em zoom e verificar original maior, Esc, reset, pinça e arraste.
- Testar imagem legada sem miniaturas e modal de vídeo YouTube/Vimeo.
- Validar `npm run typecheck` e `npm run build` antes de concluir implantação.


## Gerenciamento e exclusões
A ferramenta **Gerenciar arquivos** apresenta a aba GitHub pública por padrão, consultando recursivamente as subpastas de mídia com `getPublicRepositoryMedia(store)`, sem token. A prévia de arquivos usa URL raw do repositório. Filtros por pasta, uso e pesquisa permitem localizar arquivos mesmo fora do conteúdo do site. A seleção é levada para a publicação via `stagedDeletionPaths`. **Somente na publicação, autorizada com token e confirmação,** `publishPortfolioToGitHub(..., deletePaths)` verifica o caminho, a existência, a proteção e o uso e cria o Git tree com `sha:null` para remoção. A aba local usa `deleteStoredMedia(ref)` para limpar órfãos `media://` do IndexedDB. Imagens dos projetos de exemplo antigos não são rigidamente protegidas; porém referências apenas em código, CSS ou URLs antigas podem escapar à detecção. Consulte [README_MEDIA_CLEANUP.md](README_MEDIA_CLEANUP.md).

## Música e referência de thumbnail
`MusicLibraryEditor` utiliza arquivos de áudio enviados pelo proprietário. Ao importar, preenche título e artista a partir do nome quando possível, mas deixa os campos editáveis. A URL de um vídeo do YouTube serve opcionalmente para sua miniatura pública, não extrai o áudio nem incorpora anúncios.

## Bloco de modelo 3D
`ProjectModel` exibe um card estático com capa opcional. Após o clique, adiciona o web component `model-viewer` via CDN, com versão fixada, que renderiza `.glb` / `.gltf` e habilita câmera de órbita e zoom. O componente de renderização externo é carregado apenas nessa interação. A origem deve permitir requisições CORS. **FBX não é suportado diretamente**, devendo ser convertido para GLB com as texturas apropriadas.


## Player com identidade visual discreta

O tipo `video` aceita `videoTitle?:string` e capa opcional. `ProjectVideo` mostra a miniatura até o clique e depois um iframe oficial YouTube/Vimeo. Os controles nativos permanecem ativos e o único elemento abaixo é o link **Watch on YouTube/Vimeo**. A barra personalizada antiga, o módulo `YouTubeCustomPlayer` e a API JS do YouTube foram removidos para reduzir peso e evitar redundâncias.
