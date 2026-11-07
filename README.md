# Jordan Ferrary — Creative Portfolio

Portfólio artístico e comercial, desenvolvido com **React 19 + TypeScript + Vite**, hospedado no **GitHub Pages**. Inclui galeria de obras 3D/ilustração, páginas de projeto, redes sociais e Local Studio para edição visual.

## Iniciar localmente

```bash
npm ci
npm run dev
npm run typecheck
npm run build
```

Para simular a base do GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
```

No Windows PowerShell, use `$env:GITHUB_PAGES="true"; npm run build`.

## O que o site oferece

- **Home:** apresentação, trabalhos em destaque, playlist e conteúdo editorial.
- **Portfólio:** galeria estilo Pinterest com quatro colunas em telas largas, pesquisa, filtros e ordem dos projetos configurável.
- **Projetos:** páginas completas com imagens e textos, antes/depois, blocos múltiplos, vídeos incorporados do YouTube ou Vimeo e zoom de obras.
- **Contato:** redes sociais diretas, sem formulário de e-mail.
- **Local Studio:** edição de páginas e projetos, biblioteca de assets, conversor manual WebP, miniaturas automáticas na publicação, backup e publicação pelo GitHub.

## Imagens e carregamento

Uploads feitos pelo Studio são convertidos localmente para **WebP** (até 2048 px no maior lado por padrão). Na publicação, imagens grandes recebem duas versões adicionais, com maior lado de **480 px** e **960 px**. O manifesto `imageVariants` associa cada imagem original aos seus tamanhos, e o componente `AssetImage` escolhe arquivos menores com `srcset`/`sizes` quando disponíveis. Projetos e imagens antigas sem variantes continuam funcionando.

O zoom abre a **maior versão disponível** da imagem e permite ampliar, arrastar, usar pinça no celular, redefinir e fechar com Esc. O componente pesado do visualizador só é importado quando o visitante abre uma obra. Vídeos externos só criam iframe após o clique no card com miniatura.

**Limite:** variantes não são geradas por serviço remoto em tempo real; surgem no fluxo de publicação. Imagens de terceiros ou muito antigas podem permanecer apenas com o arquivo maior.

## Local Studio e publicação

Pressione **Ctrl + \\** para abrir a tela de PIN e acessar a edição. Rascunhos são locais neste navegador; mídia fica em IndexedDB. Faça **Backup ZIP** antes de limpar dados do navegador.

Para publicar, use **Publicar no GitHub** no Studio, gere um **fine-grained personal access token** restrito ao repositório `jordanferrary/portfolio_jordan` com **Contents: Read and write**, cole na caixa do editor e confirme. Um guia passo a passo com links oficiais está disponível dentro da própria tela de publicação.

O PIN só esconde a interface; não autentica acessos no servidor. A autorização real para gravar no GitHub é feita pelo token, que não pode ser colocado no código nem compartilhado.

## Documentação

| Documento | Público / finalidade |
|---|---|
| [AGENTS.md](AGENTS.md) | Convenções para futuras sessões de IA e colaboradores |
| [docs/README_FOR_CHATGPT.md](docs/README_FOR_CHATGPT.md) | Arquitetura e continuidade técnica para o ChatGPT |
| [docs/README_LOCAL_STUDIO.md](docs/README_LOCAL_STUDIO.md) | Como operar o editor e as funcionalidades |
| [docs/README_GITHUB_TOKEN.md](docs/README_GITHUB_TOKEN.md) | Criar, usar e substituir token de publicação |
| [docs/README_MEDIA_PIPELINE.md](docs/README_MEDIA_PIPELINE.md) | Pipeline de WebP, versões responsivas, zoom e vídeos |
| [docs/README_HISTORY.md](docs/README_HISTORY.md) | Registro histórico das versões anteriores |

## Publicação

O conteúdo do Studio é publicado com a API do GitHub no branch `main`, em uma única atualização atômica de dados e mídia. O GitHub Actions realiza o deploy do site. Acesse [Actions](https://github.com/jordanferrary/portfolio_jordan/actions) para conferir a compilação e o status da publicação.

**Aviso:** alterações no código e documentação não garantem por si só a conclusão do build; verifique os status e execute `npm run typecheck` e `npm run build` antes de considerar a release validada.


## Gerenciamento de mídia, vídeos e modelos 3D

- **Ferramentas → Gerenciar arquivos:** examine mídias salvas no navegador (imagens e áudios), liste as não utilizadas e exclua com confirmação. A exclusão local não afeta o GitHub.
- **Publicar → Gerenciar arquivos publicados:** após informar um token válido, consulte o inventário de `public/images/`, `public/audio/` e demais pastas públicas de mídia. Arquivos referenciados pelo conteúdo atual e arquivos padrão são protegidos; os demais podem ser selecionados para exclusão no mesmo commit de publicação. Faça backup e confira as referências antes.
- A análise inclui **imagens, áudios e, quando existirem, vídeos MP4/WebM ou modelos GLB/glTF/FBX**. Arquivos estáticos referenciados apenas por CSS ou links antigos podem exigir revisão manual.
- **Músicas:** continuam como arquivos MP3/WAV/OGG/M4A do proprietário, sem player incorporado de plataforma de streaming. Ao importar áudio com nome no formato `Artista - Música.mp3`, o cadastro sugere título e artista editáveis. Há opção de aproveitar a miniatura pública de um vídeo do YouTube como capa. **O site não extrai nem baixa áudio de vídeos do YouTube.**
- **Composição → Vídeo incorporado:** o layout possui miniatura cinematográfica, claramente identificada como vídeo, e player sob demanda.
- **Composição → Modelo 3D interativo:** use URL direta de um **GLB** (recomendado) ou **glTF**, com capa opcional. O visualizador carrega apenas após clique, suporta rotação, zoom e arraste. **FBX não é carregado diretamente; converta para GLB no Blender**. Links externos exigem suporte a CORS e acesso público.

Consulte [Limpeza de mídias](docs/README_MEDIA_CLEANUP.md), [Pipeline de mídia](docs/README_MEDIA_PIPELINE.md) e [Local Studio](docs/README_LOCAL_STUDIO.md).
