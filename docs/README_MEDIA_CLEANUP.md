# Gerenciamento de arquivos — Local Studio

O menu **Local Studio → Conteúdo → Gerenciar arquivos** agora funciona como uma biblioteca visual unificada, com duas abas:

## Arquivos do GitHub (aba inicial)

- Lê a árvore pública do repositório em `main` **sem exigir token** (somente leitura).
- Mostra **todas as mídias compatíveis nas subpastas** `public/images/`, `public/audio/`, `public/models/`, `public/videos/` e `public/assets/`, mesmo que não estejam vinculadas a nenhum projeto.
- Exibe miniaturas das imagens, prévia reproduzível de áudios, nome, pasta de origem, tamanho e indicação de uso.
- Oferece filtros **Todos / Sem uso**, seleção de pasta e pesquisa por caminho.
- Clicar na miniatura abre o original em nova aba (do repositório público).
- Arquivos referenciados pelo rascunho atual ou marcados como essenciais não podem ser selecionados.
- Para apagar, marque os candidatos e clique em **Excluir no GitHub (N)**. O Studio abre a tela de publicação com esses arquivos já selecionados.
- Na publicação, confira os caminhos, insira seu **token fine-grained restrito** e marque a confirmação explícita. Os arquivos são excluídos com o conteúdo atualizado em um único commit, **somente ao publicar**.
- Se o GitHub limitar temporariamente as consultas públicas, use **Atualizar** mais tarde ou consulte a lista autenticada na publicação.

### Imagens antigas dos projetos de exemplo

Imagens legadas em `public/images/projects/` que não aparecem no conteúdo atual podem ser selecionadas como **Sem uso**. Elas não são mais indiscriminadamente bloqueadas. Antes de apagar, confira se não são necessárias para testar projetos de exemplo ou restaurar dados padrão. Os caminhos padrão realmente essenciais em `public/images/hero/`, `public/images/profile/` e capa musical padrão continuam protegidos.

## Arquivos locais (segunda aba)

- Lista os arquivos `media://` salvos no **IndexedDB deste navegador**.
- Use **Todos / Sem uso** e pesquisa para identificar imagens e áudio órfãos.
- A exclusão local não modifica o GitHub nem outros dispositivos.
- Faça **Backup ZIP** antes de limpar arquivos que talvez queira recuperar.

## Regras e limites de segurança

- **Nenhuma exclusão é automática.** A interface sempre exige seleção e confirmação; excluir algo publicado exige credencial e um commit.
- A detecção de uso verifica referências do **conteúdo atual do Studio** e as variantes responsivas ainda utilizadas. O publicador revalida arquivos antes de criar o commit.
- Referências contidas **apenas em CSS, código-fonte, documentação, imagens de fallback, links de páginas antigas ou compartilhamentos externos** podem não ser identificadas. Revise cuidadosamente cada arquivo. Em particular, arquivos dos projetos demonstrativos antigos podem continuar referenciados no código de fallback.
- As extensões reconhecidas são PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, MP3, WAV, OGG, M4A, FLAC, MP4, WEBM, GLB, glTF e FBX nas pastas públicas de mídia. Arquivos de configuração ou demais arquivos fora dessas pastas não aparecem.
- Apagar o arquivo no repositório não remove instantaneamente caches, histórico de Git ou versões antigas do site. Os arquivos deixam de ser publicados no deploy seguinte.
- O token é mantido somente temporariamente na memória da tela de publicação, nunca salvo no armazenamento ou nas páginas públicas.

## Arquitetura

- `src/components/sections/media-manager.tsx`: interface visual das pastas públicas e armazenamento local.
- `src/lib/github-media.ts`: leitura pública da árvore, URL de prévia, classificação, detecção de referências e proteção.
- `src/app.tsx`: leva as seleções do gerenciador para a publicação.
- `src/components/sections/github-publish-editor.tsx`: mostra as seleções pendentes e obtém confirmação/token.
- `src/lib/github-publish.ts`: valida e aplica exclusões atômicas na Git tree (`sha: null`).
- `src/lib/media-store.ts`: lista e remove blobs locais de IndexedDB.
