# Alquimago + Gemini — integração Cloudflare Pages (plano gratuito)

## Arquitetura implementada

- `functions/api/assistant.js`: backend no mesmo domínio, em `/api/assistant`.
- `public/alquimago/config.json`: habilita o mentor Gemini opcional no painel atual.
- A chave `GEMINI_API_KEY` fica apenas nos **Secrets** da Cloudflare.
- O Alquimago continua funcionando sem IA, usando seu cérebro local.
- As lições sugeridas pelo Gemini só entram na memória após aprovação do usuário.
- Nenhum código ou arquivo privado é lido automaticamente. O serviço visual só recebe uma imagem selecionada e enviada voluntariamente pelo usuário.

## Para ativar

1. O projeto Cloudflare Pages `portfolio-jordan` já está publicado.
2. Em Settings > Variables and Secrets > Production, confirme `GEMINI_API_KEY` como tipo **Secret**.
3. Após qualquer atualização do núcleo ou do proxy, faça um novo build/deploy do portfólio. O build sincroniza o upstream `alquimago` e bloqueia a publicação caso os testes ou a versão falhem.
4. Após um deploy bem-sucedido, visite `https://portfolio-jordan.pages.dev/api/assistant` no navegador: deverá responder `{"ready":true,"mode":"public-free"}` caso o Secret esteja disponível.
5. No Alquimago, abra a área de conversas, marque o uso opcional do professor Gemini e envie uma pergunta. Sem consentimento, o familiar segue local.

## Limitações e riscos

**O endpoint é público e não possui login, CAPTCHA ou uma limitação rígida de chamadas por IP.**
O código verifica `Origin` e o cabeçalho da aplicação, mas esses valores podem ser forjados por clientes fora do navegador. Portanto, isso não impede terceiros de consumirem a cota Gemini. A escolha pelo acesso público foi feita para evitar assinatura/onboarding de Zero Trust.

- Controle do lado do servidor: limite de 14 KB por entrada, pergunta até 650 caracteres, histórico resumido, limite de tokens de resposta, tempo limite de 14 segundos.
- Esses controles limitam tamanho e duração **por requisição**, não quantidade total de requisições.
- Mantenha o Google AI Studio no nível gratuito sem ativar faturamento, e monitore o uso e os limites.
- Em caso de tráfego abusivo, considere um Turnstile gratuito com validação no servidor (não implementado) ou restrições da API/Cloudflare.
- A Cloudflare Pages Functions tem cota própria no plano gratuito.
- Não há garantia de que o modelo Gemini ou as cotas continuem iguais. O modelo `gemini-2.5-flash` pode mudar/disponibilidade pode variar.
- Nunca copie o Secret para React, Vite, Github ou JSON público.
- `/api/assistant` não edita arquivos nem salva conversas no servidor.
- A memória depende da origem e do armazenamento local: `pages.dev` e o futuro subdomínio têm memórias separadas.

## Referências

- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/turnstile/plans/
- https://ai.google.dev/gemini-api/docs/pricing

## Feedback de arte por imagem

A versão v0.11.3 adiciona ao grimório do **Local Studio** o campo **Feedback de arte por imagem**. Fluxo: ativar Gemini explicitamente; escolher um JPEG, PNG ou WebP até 8 MB; ver prévia local; clicar em **Analisar imagem com Gemini**. O navegador comprime em JPEG até 1024 px no maior lado e envia ao `/api/assistant` (POST, `mode: image-feedback`, `image: {mimeType, data}`). A Cloudflare Pages Function limita a entrada, verifica formato e assinatura da imagem e encaminha `inlineData` ao Gemini. O resultado é texto no chat. **A IA não roda offline**; somente a seleção e a compactação são locais. Imagens não são gravadas no GitHub, no aprendizado aprovado ou em backup. Textos de feedback podem permanecer na conversa enquanto a sessão estiver aberta.

O caminho de análise de texto continua sem imagens e mantém limite menor. A chave `GEMINI_API_KEY` fica exclusivamente no Secret de produção (ou no de preview, se esse ambiente for usado). Não incluir essa chave em README, commits ou frontend.

## Arquivos e privacidade

O núcleo compartilhável está em `jordanferrary/alquimago`. O portfólio guarda a configuração `public/alquimago/config.json`, suas falas por obra no `assistant.spotlights`, resumos dos projetos, integração e o proxy específico. **Os dois repositórios atuais são públicos:** manter um arquivo em `src/` ou em `public/` não o torna confidencial. Veja [Limites e separação](ALQUIMAGO_FILE_BOUNDARIES.md).

## Testes e cuidados

`npm run test:assistant` valida origem, formatos recusados e o corpo multimodal enviado ao Gemini (sem executar chamada real). Os testes completos do site e do bot rodam em ações do GitHub. A análise deve ser testada manualmente no domínio Cloudflare porque GitHub Pages pode distribuir o frontend mas não executa Pages Functions. Um `GET /api/assistant` pode indicar configuração da chave, mas não prova que o processamento visual está operacional.

**Risco pendente:** o endpoint permite solicitações públicas; validação de `Origin` não é rate limiting nem autenticação forte. Cotas gratuitas limitam consumo, mas não impedem abuso deliberado. Se necessário, implementar Turnstile ou limitação efetiva no servidor sem bloquear o uso legítimo do Studio.
