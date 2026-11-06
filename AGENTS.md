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
