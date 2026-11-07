# Alquimago + Gemini — integração Cloudflare Pages (plano gratuito)

## Implementado na branch de teste

- `functions/api/assistant.js`: backend no mesmo domínio, em `/api/assistant`.
- `public/alquimago/config.json`: habilita o mentor Gemini opcional no painel atual.
- A chave `GEMINI_API_KEY` fica apenas nos **Secrets** da Cloudflare.
- O Alquimago continua funcionando sem IA, usando seu cérebro local.
- As lições sugeridas pelo Gemini só entram na memória após aprovação do usuário.
- Nenhum código ou arquivo privado é lido automaticamente.

## Para ativar

1. O projeto Cloudflare Pages `portfolio-jordan` já está publicado.
2. Em Settings > Variables and Secrets > Production, confirme `GEMINI_API_KEY` como tipo **Secret**.
3. Abra o pull request, verifique os testes/build e faça a mesclagem em `main` quando desejar publicar. Cloudflare Pages gerará um novo deploy.
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
