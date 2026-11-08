# Alquimago — separação de arquivos e dados

## Dois produtos, duas responsabilidades

**Bot público: `jordanferrary/alquimago`**

Inclui `src/`, `tests/`, `scripts/build.mjs`, skin Orb 2D, interface do grimório, memória local, ferramentas de análise de cor, preparação de imagens e cliente opcional Gemini. A demonstração `dist/index.html` é genérica; `Alquimago_Demo_Offline.html` é uma cópia histórica v0.1.

**Site do proprietário: `jordanferrary/portfolio_jordan`**

Inclui a UI em React, Local Studio, obras e mídia, tema, páginas, conteúdo, publicação, auth-worker, funções da Cloudflare e as personalizações do bot. Os recursos públicos da integração são:

| Caminho | Responsabilidade | Exposição |
| --- | --- | --- |
| `public/alquimago/config.json` | Nome/tema, endpoint e falas por obra em `assistant.spotlights` | Pública |
| `public/alquimago/knowledge.json` | Títulos e contexto de obras publicadas | Pública |
| `public/alquimago/project-context.json` | Resumo público do portfólio | Pública |
| `public/alquimago/project-memory.json` | Estado numérico público do familiar | Pública |
| `public/alquimago/alquimago.js` | Bundle gerado do núcleo, sem edição manual | Pública |
| `functions/api/assistant.js` | Proxy Gemini com validação e leitura de Secret | Fonte pública; segredo só no ambiente de execução |
| `src/lib/alquimago-3d.ts`, `src/components/sections/alquimago-3d-editor.tsx` | Adaptação 3D para este site e Local Studio | Código de frontend distribuído, não sigiloso |
| `scripts/sync-alquimago.mjs` | Atualiza o bundle no build | Código público |

As falas exclusivas da obra *Frankie*, antes misturadas no código genérico, agora residem na configuração do site.

## Privado significa fora de repositórios públicos

**Ambos os repositórios atualmente são públicos.** A separação lógica por pastas não protege arquivos. Não colocar tokens, e-mails confidenciais, chats reservados, originais inéditos, senhas ou chaves em commits ou em `public/`. As credenciais ficam em Cloudflare Secrets; o token de publicação deve existir somente durante o fluxo autenticado; o aprendizado pessoal aprovado pode ficar em armazenamento local.

O PIN do Local Studio controla a interface, mas não é autenticação forte. `private/`, `secrets/` e arquivos `.env` devem ser ignorados no Git; `gitignore` não elimina arquivos já versionados ou divulgados. Se dados sigilosos tiverem sido publicados, removê-los do arquivo atual não invalida cópias anteriores: as credenciais precisam ser revogadas/rotacionadas.

## Feedback por imagem

O usuário habilita Gemini, seleciona a imagem, examina sua prévia e escolhe enviar. O browser compacta localmente; o endpoint Cloudflare encaminha temporariamente a imagem ao Gemini. Não há acesso automático aos arquivos do portfólio nem aprendizado automático da imagem. Essa etapa não é processamento local de IA.

## Fluxo de manutenção

Alterar núcleo → validar testes no bot → executar build do portfólio → sincronizar e conferir `public/alquimago/release.json` → testar no domínio real. A sincronização já busca o branch `main` do bot e falha fechada quando testes ou consistência não passam. Não copiar bundles antigos de volta para contornar o erro. Em GitHub Pages, `/api/assistant` não executa a Function Cloudflare; a análise com Gemini exige hospedagem compatível.


## Cofre criptografado ALQ-V1 (Alquimago v0.11.4)

A memória local do familiar — incluindo lições, exemplos de treinamento, diálogo, preferências e estados neurais que não são publicados — passa por um cofre AES-256-GCM dentro do IndexedDB, com chave WebCrypto não exportável por namespace. Na primeira abertura, o bot migra dados antigos do `localStorage` e só apaga texto legível depois de confirmar a gravação criptografada. Falhas de inicialização não fazem fallback inseguro. O código e a especificação desse cofre pertencem **exclusivamente ao repositório do bot**, não devem ser duplicados no portfólio.

**Não confundir**: `public/alquimago/project-memory.json` e outros snapshots públicos continuam legíveis por qualquer visitante. O Local Studio publica esse estado numérico por escolha do proprietário, não usando o cofre. A versão atual do recurso foi desenhada para impedir leitura casual no armazenamento local, não para prometer acesso exclusivo ou eliminar riscos de scripts comprometidos na mesma origem. O backup JSON exportado manualmente também continua sem criptografia.

Como o cofre depende do domínio de origem, uma instalação em Cloudflare Pages e outra em GitHub Pages não compartilham chaves ou memória. Antes de testar, publicar uma compilação atualizada do upstream no site integrador.
