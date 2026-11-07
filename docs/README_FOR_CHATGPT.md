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
- Existe uma ferramenta de **Gerenciar arquivos** no Local Studio: `src/components/sections/media-manager.tsx` remove imagens e áudios órfãos do IndexedDB.
- Na interface de publicação, `src/lib/github-media.ts` fornece inventário dos arquivos em `public/images/`, `public/audio/`, `public/models/`, `public/videos/` ou `public/assets/`. A exclusão é selecionada manualmente, validada pelo publicador e enviada via Git tree com `sha:null` no mesmo commit de conteúdo.
- A detecção de uso não varre todo CSS ou links externos. Nunca recomende exclusão automática indiscriminada. Consulte [README_MEDIA_CLEANUP.md](README_MEDIA_CLEANUP.md).
- Bloco `model`: URL direta de `.glb` ou `.gltf` com miniatura opcional; `ProjectModel` busca o web component `model-viewer` somente ao clicar. `.fbx` não é suportado de modo nativo: usar Blender para convertê-lo para GLB.
- Bloco `video`: recebeu representação visual mais distinta no seletor de blocos e no card.
- Biblioteca de músicas: título e artista continuam editáveis; nomes no padrão `Artista - Música` geram sugestões; é possível usar thumbnail público do YouTube. Não há downloader/extrator de áudio do YouTube.
