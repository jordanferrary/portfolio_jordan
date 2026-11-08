# Instruções para agentes de IA — portfolio_jordan

Este arquivo se aplica a todo o repositório. Leia também [docs/README_FOR_CHATGPT.md](docs/README_FOR_CHATGPT.md) antes de alterações complexas.

## Objetivo
Portfólio comercial e artístico de Jordan Ferrary, desenvolvido em React 19, TypeScript, Vite e hospedado no GitHub Pages. Conteúdo público prioritariamente em inglês; interface administrativa em português. Identidade roxo neon + grafite. Preserve a direção de arte e os fluxos em funcionamento.

## Como trabalhar
1. Inspecione os arquivos reais no branch principal antes de editar; não suponha código baseado em conversas anteriores.
2. Faça mudanças cirúrgicas, sem alterar identidade visual, estruturas de projeto ou conteúdo do proprietário desnecessariamente.
3. Preserve compatibilidade com dados antigos em `src/data/published-portfolio.json` e rascunhos locais.
4. Para editar o GitHub por API, leia SHA atual do arquivo e nunca grave credenciais em código, commits, logs ou texto de resposta.
5. Sempre que possível execute `npm ci`, `npm run typecheck` e `npm run build`. Se o ambiente impedir, informe claramente que o build não foi verificado. Use `GITHUB_PAGES=true npm run build` para conferir base path.
6. Para novas funcionalidades públicas, evite bibliotecas grandes e dependências remotas; prefira imports dinâmicos para editores.
7. Documente mudanças relevantes no README e nos guias de `docs/`, especialmente quando a estrutura de dados mudar.

## Arquitetura essencial
- `src/app.tsx`: navegação hash, Studio e modais com carregamento sob demanda.
- `src/components/sections/admin-editor.tsx`: edição e composição dos blocos de projetos.
- `src/components/sections/project-page.tsx`: renderização dos projetos.
- `src/components/ui/asset-image.tsx`: resolução de mídia e seleção `srcset` via `ImageVariantProvider`.
- `src/components/ui/zoomable-art.tsx` e `art-lightbox.tsx`: zoom de obras, carregado no clique.
- `src/lib/media-store.ts`: arquivos importados em IndexedDB.
- `src/lib/image-optimize.ts`: conversão local para WebP (lado maior até 2048 px por padrão).
- `src/lib/image-variants.ts`: metadados das versões 480/960/alta resolução.
- `src/hooks/use-portfolio.ts`: estado local, backup e versão publicada.
- `src/lib/github-publish.ts`: publicação via GitHub API, geração de variantes durante o envio.
- `src/data/published-portfolio.json`: estado público versionado.

## Regras sobre mídia
`media://` é temporário/local (IndexedDB); `site://` aponta para `public/images/studio` ou `public/audio/studio` após publicação. Imagens existentes sem variantes devem continuar funcionando. Não presuma que arquivos remotos externos aceitem CORS. A propriedade `imageVariants` do portfólio liga originais a miniaturas com larguras efetivas. Não substitua a fonte original pelo thumbnail quando abrir o zoom.

## Segurança operacional
O PIN do Local Studio é apenas UX; não o descreva como autenticação segura. O token pessoal do GitHub só deve existir em memória durante a publicação, enviado exclusivamente à API do GitHub. Não solicite o token no chat, não armazene o token, não o coloque em README e não exiba valores em prints.

## Documentos
- [README.md](README.md): resumo atual.
- [docs/README_LOCAL_STUDIO.md](docs/README_LOCAL_STUDIO.md): operação para o proprietário.
- [docs/README_GITHUB_TOKEN.md](docs/README_GITHUB_TOKEN.md): geração/uso do token.
- [docs/README_MEDIA_PIPELINE.md](docs/README_MEDIA_PIPELINE.md): publicação de imagens, zoom e vídeos.
- [docs/README_HISTORY.md](docs/README_HISTORY.md): documentação histórica, não a fonte de verdade atual.


## Novos fluxos de mídia e 3D
- `src/lib/github-media.ts`: analisa a árvore **pública** do GitHub sem token e gera URLs de miniaturas para imagens e áudios em todas as subpastas `public/images/`, `public/audio/`, etc. Detecta referências do rascunho, protege essenciais e permite selecionar antigos projetos de exemplo sem uso. Não confundir recursos que ainda aparecem em código de fallback com arquivos totalmente seguros para excluir.
- `src/components/sections/media-manager.tsx`: aba inicial **Arquivos do GitHub**, miniaturas, filtro por pasta, busca, status de uso e seleção para **publicação com exclusão**; aba secundária **Arquivos locais**, para remover órfãos do IndexedDB.
- `src/app.tsx` carrega caminhos selecionados para `GitHubPublishEditor`, mas a exclusão só ocorre na publicação com token e confirmação explícita.
- `src/components/sections/github-publish-editor.tsx`: seleção opcional de paths para exclusão no mesmo commit; `src/lib/github-publish.ts` revalida caminhos, referências e permissões e usa Git tree com `sha:null`.
- `src/components/ui/project-model.tsx` e `src/lib/model-embed.ts`: cartão 3D com carregamento por clique. Suporte GLB e glTF, URL pública com CORS. FBX deve ser convertido externamente para GLB, não prometa suporte perfeito a FBX.
- `src/components/ui/project-video.tsx`: miniatura de vídeo cinematográfico. O iframe só aparece após clique.
- `src/components/sections/music-library-editor.tsx`: cadastro de áudio importado, sugestão de metadados do nome do arquivo e capa por upload, biblioteca, **URL HTTPS direta de qualquer imagem pública** ou miniatura do YouTube. O campo da imagem deve ser independente do YouTube e refletir imediatamente na prévia e no player. **Não implementa extração de MP3 de vídeos do YouTube**. O editor verifica os links via \`src/lib/audio-source.ts\`: URLs de vídeo/streaming são bloqueadas para áudio e orientam o proprietário a importar mídia autorizada. O player diagnostica links antigos inválidos e mantém áudio local \`media://music/...mp3\` funcional.
- Leia [docs/README_MEDIA_CLEANUP.md](docs/README_MEDIA_CLEANUP.md) antes de alterar regras de exclusão. Não remova automaticamente mídia que só pareça órfã; fontes podem estar referenciadas por CSS, links antigos ou outros documentos.


## Player de vídeo — preferência de direção de arte

O projeto usa `src/components/ui/project-video.tsx` para miniatura clicável e iframe nativo de YouTube/Vimeo. **Não** inserir painéis com cronômetro, título ou timeline abaixo. Mantenha somente o link **Watch on YouTube/Vimeo** e preserve a identificação acessível `videoTitle?:string` no bloco. Os antigos módulos de controles externos do YouTube foram retirados por escolha do proprietário.

## Construtor de páginas na navegação

- O usuário pode criar páginas para cursos, recursos, guias ou outras iniciativas pelo Local Studio. **Não** hardcode novos itens por página no menu. Preserve os quatro itens fixos Home/Portfolio/About/Contact.
- `src/data/custom-pages.ts` define `CustomPage`, `PageBlock`, `normalizeCustomPages`, `newCustomPage` e `safePageHref`. IDs de página devem ser estáveis mesmo quando o título muda.
- `src/components/sections/custom-page-editor.tsx` é o construtor de páginas, com identidade, hero, ordenação e blocos e botões copy/link. `src/components/sections/custom-page.tsx` renderiza a página pública reaproveitando `StoryBlock` da página de projeto.
- O menu `Sidebar` acrescenta páginas extras entre Portfolio e About e permite scroll para muitos links. A rota é `#/page/:id`. Ocultar uma página do menu **não** restringe sua leitura por URL.
- Páginas devem entrar no `PortfolioStore.customPages` (rascunho, migração, ZIP e publicação) e ter imagens integradas ao publicador e biblioteca. Blocos de copiar ficam visíveis no manifesto público: **nunca** armazenar tokens, senhas ou chaves secretas.
- Para links de botões usar somente `safePageHref` e âncoras nativas para garantir `noopener noreferrer` quando abrir outra aba. Nada de JavaScript arbitrário, HTML injetável ou cobrança PIX automática.
- Leia `docs/README_CUSTOM_PAGES.md` antes de modificar o construtor.


## Direção de arte — carrossel de imagens
- O carrossel de páginas personalizadas em `src/components/sections/page-media-blocks.tsx` **deve sempre acompanhar 100% da largura do conteúdo**; não restaurar ajuste de largura horizontal ou contagem manual de itens. A altura (`slideHeight`) determina automaticamente a quantidade de imagens visíveis, limitada pela largura real via ResizeObserver.
- **Nunca** adicionar barra inferior, descrição, contador de imagens ou pontos de navegação abaixo do carrossel. As setas laterais e zoom individual permanecem.
- A propriedade `slideShowPauseButton?:boolean` controla apenas o botão pequeno de pausa/reprodução, flutuante no canto inferior direito da imagem. Padrão desativado, configurável em Local Studio → Composição → Slides.


## Galeria interativa genérica e zoom correto
- O bloco interno `showcase` é **galeria interativa**, não apenas galeria de artistas: atende obras, certificados, prêmios e coleções. **Não** usar rótulos `Artista 1`, `Artist 2` ou forçar nomes/numeração.
- No `ArtistShowcase` (`src/components/sections/page-media-blocks.tsx`), o painel de detalhes deve ficar **fechado inicialmente**, só abrir após clique num item e ter botão explícito de fechar. A galeria deve ocupar a largura disponível quando o painel estiver fechado.
- `ShowcaseItem.showLink` e `ShowcaseItem.linkLabel` controlam respectivamente a exibição e o texto do botão no painel, individualmente. Itens antigos sem `showLink` mantêm comportamento compatível; itens novos começam sem CTA. Se não há URL válida, não renderizar botão desativado.
- `PageBlock.showcaseFit` permite miniaturas `contain` para certificados ou `cover` para arte; **o painel de detalhes e o modal de zoom devem preservar a imagem completa**.
- O visualizador `ArtLightbox` deve usar dimensionamento proporcional na tela, sem depender do tamanho intrínseco do grid. Em 100%, mostrar toda a imagem e limpar qualquer deslocamento de pan. Não substituir original por thumbnail da biblioteca responsiva.


## Paleta global de sete cores — preservar abrangência

A paleta de `src/lib/theme-palette.ts` possui **sete** cores (`primary`, `secondary`, `background`, `surface`, `text`, `muted`, `border`). `normalizeThemePalette` deve aceitar os backups antigos com quatro campos, sem apagar personalizações. `ThemePaletteEditor` altera o site ao vivo e restaura o valor anterior ao cancelar. Contraste WCAG deve usar o texto efetivamente configurado.

A folha `src/styles/theme-coverage.css` **deve ser carregada por último em `src/main.tsx`**. Ela cobre o site público, incluindo Home, galeria, projetos, Sobre, Contact, páginas extras e player de música. Evite backgrounds, bordas e textos roxos hardcoded nesses elementos: use `--jf-primary`, `--jf-secondary`, `--jf-background`, `--jf-surface`, `--jf-text`, `--jf-muted`, `--jf-border` e derivados. Deixe a UI privada do Local Studio estável/legível. Não altere a cor de imagens do portfólio via filtros. `scripts/studio-smoke.mjs` protege os tokens e parte da cobertura CSS, não garante perfeição visual em todos os navegadores.

## Limites entre Alquimago e portfólio (2026-11)

Não replicar código genérico do Alquimago neste repositório: a fonte de verdade é `jordanferrary/alquimago/src`, sincronizada em cada build. Os adaptadores e estilos de integração específicos do Studio permanecem neste site. Textos e falas de obras devem estar em `public/alquimago/config.json` / `assistant.spotlights`, e não em `src/widget.js` do bot. Consulte `docs/ALQUIMAGO_FILE_BOUNDARIES.md`.

Os dois repositórios são públicos; `public/` e código incluído no frontend são inspecionáveis. Não incluir tokens, segredos ou conteúdo confidencial em código ou mídia pública. A entrada de imagens do Grimório é autorizada por clique explícito e transmitida somente ao backend Gemini da Cloudflare, onde a chave fica em Secret. Não informar ao usuário que a inferência Gemini funciona offline. Revisar `npm run test:assistant` e o build antes de publicar.
