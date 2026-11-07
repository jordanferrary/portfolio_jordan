# Gerenciamento de arquivos e exclusão de mídia

## Há dois locais diferentes para arquivos
1. **Local Studio / IndexedDB (navegador atual)**: arquivos `media://` de imagens e áudios importados, inclusive versões ainda não publicadas.
2. **GitHub Pages / repositório público**: arquivos dentro de `public/images/`, `public/audio/`, eventualmente `public/videos/`, `public/models/` e `public/assets/`. Após publicar, imagens/áudios importados usam `site://` e ficam principalmente em `public/images/studio/` e `public/audio/studio/`.

Excluir uma faixa da playlist remove seu cadastro, mas não exclui automaticamente os arquivos históricos — o gerenciador abaixo existe justamente para separá-los.

## Limpar arquivos locais
- Abra **Local Studio → Ferramentas → Gerenciar arquivos**.
- A categoria **Sem uso** mostra itens da biblioteca local que não aparecem referenciados no conteúdo atual.
- Selecione e confirme a exclusão. Os arquivos são excluídos do IndexedDB **deste navegador**; backups anteriores não são alterados.
- É recomendado fazer **Backup ZIP** antes, especialmente se houver rascunhos antigos.
- O Studio impede a seleção dos arquivos `media://` ainda referenciados na versão local atual.

## Limpar arquivos publicados
- Na mesma ferramenta, selecione **Abrir arquivos publicados**; ou abra **Local Studio → Publicar**.
- Digite o token temporário do GitHub no campo já existente. Não o salve nem compartilhe.
- Clique em **Analisar arquivos do GitHub** e escolha **Sem uso identificado** ou **Todos os arquivos**.
- Arquivos em uso no conteúdo atual e arquivos padrão essenciais não podem ser selecionados. Inspecione manualmente os demais.
- Marque os arquivos desnecessários, selecione a confirmação e clique em **Publicar no GitHub**.
- O GitHub receberá um **único commit** com as mudanças de conteúdo e as exclusões. O GitHub Pages refletirá as remoções após o deploy.

## Proteções e limites
- A detecção de referências procura URLs de mídia no rascunho atual e variantes de imagens com `imageVariants`; arquivos essenciais (arte inicial, avatar padrão, covers de música padrão e arte de exemplo codificada) ficam protegidos.
- Arquivos acessados **somente por CSS, uma URL antiga compartilhada, um link externo, documentação ou páginas estáticas não detectadas** podem aparecer como sem uso. Por isso a exclusão é sempre manual, com confirmação.
- A lista cobre arquivos com extensões conhecidas: imagens PNG/JPG/WEBP/AVIF/GIF/SVG, áudio MP3/WAV/OGG/M4A/FLAC, vídeo MP4/WEBM e modelos GLB/GLTF/FBX em pastas de mídia públicas. Arquivos diferentes dessas categorias devem ser revisados diretamente no repositório.
- O GitHub guarda histórico do repositório; exclusão em commit não elimina cópias de backups, versões anteriores ou cache de visitantes.
- Se o repositório mudar enquanto a publicação está aberta, o fluxo existente de revisão impede sobrescrever uma revisão de conteúdo mais recente.

## Arquivos relevantes
`src/components/sections/media-manager.tsx`: limpeza de IndexedDB.
`src/lib/media-store.ts`: exclusão de blobs/catálogo.
`src/lib/github-media.ts`: inventário e detecção de referências.
`src/components/sections/github-publish-editor.tsx`: seleção de arquivos publicados.
`src/lib/github-publish.ts`: deletar paths por Git tree com `sha: null` após validar as referências.
