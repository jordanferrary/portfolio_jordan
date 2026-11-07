# Alquimago + Gemini — Cloudflare Pages

## Status

Este pacote inclui:
- `functions/api/assistant.js`: endpoint de IA no mesmo domínio (`/api/assistant`), com verificação criptográfica da sessão Cloudflare Access.
- `public/alquimago/config.json`: ativa a opção **Gemini assistido** na interface já existente.
- O navegador **nunca** recebe a chave Google.
- O modo simbólico/local do Alquimago continua disponível quando o modelo remoto falhar.
- A aprovação de uma lição ainda depende da escolha explícita do usuário; o Gemini não treina os pesos do cérebro nem edita arquivos.

## Segurança obrigatória — não publicar antes de configurar

O backend **não atende** requisições de IA caso não exista uma sessão Cloudflare Access válida para a aplicação configurada. Apenas ter `GEMINI_API_KEY` não é suficiente.

1. No Cloudflare Zero Trust, configure uma aplicação **Access > Applications > Self-hosted** para restringir **somente** o caminho `/api/assistant` do domínio do portfólio ao seu e-mail. **Não proteja todo o domínio**, pois o site deve continuar público. Os controles para `*.pages.dev` variam conforme o tipo de aplicação; confirme o caminho permitido antes de salvar. Referência: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
2. Copie o **Application Audience (AUD) tag** da aplicação Access e o seu **Team domain** (exemplo: `https://sua-equipe.cloudflareaccess.com`).
3. Em **Workers & Pages > portfolio-jordan > Settings > Variables and Secrets > Production**, cadastre como **Secrets**:
   - `GEMINI_API_KEY`: chave Gemini (já configurada pelo proprietário).
   - `CF_ACCESS_TEAM_DOMAIN`: URL completa do Team domain, sem barra final.
   - `CF_ACCESS_AUD`: o Audience (AUD) tag da aplicação Access. Se houver múltiplas aplicações para domínios diferentes, separe os AUDs por vírgula.
4. Restrinja usuários autorizados no Access (por exemplo, apenas seu e-mail), mantenha autenticação obrigatória e considere regra de limite de requisições para `/api/assistant`.
5. Após a implantação, visite `https://portfolio-jordan.pages.dev/api/assistant`. Após autenticar, o corpo deve ser `{"ready":true,"authenticated":true}`. Sem autenticação, uma resposta `401` indica que o backend está bloqueado. Dependendo da política do Access, o navegador pode ser redirecionado para login antes de chegar à função.
6. No painel do Alquimago, marque o uso opcional do professor Gemini e envie uma pergunta. O usuário precisa consentir com o compartilhamento da mensagem. Nenhum arquivo de código bruto é enviado ao modelo; o contexto de arquivo é opcional e limitado a metadados previamente autorizados.

## Observações operacionais

- Cloudflare Pages lê os arquivos da pasta `functions/` na raiz do repositório e publica os endpoints no mesmo domínio.
- Os valores em **Variables and Secrets** entram em vigor em um **novo deployment**.
- Erros de autorização são tratados sem consumir a chave Gemini; o backend não é um proxy público.
- Uma aplicação Access em um domínio personalizado precisará de cobertura própria; a chave e os segredos continuam no Cloudflare.
- Proteja também os deployments de prévia ou não distribua os links de prévia. O endpoint continua exigindo JWT válido, mas a superfície deve ser minimizada.
- Não inclua chaves ou tokens no GitHub, React, Vite, `public/` ou capturas de tela.
- Os limites do plano Gemini dependem do Google AI Studio e podem mudar. A resposta é limitada a 650 tokens de saída e até 14 segundos de processamento.
- A integração não armazena perguntas no backend. A memória local permanece ligada ao navegador e à origem do site.
- Se um login pelo Cloudflare Access estiver ativo e a consulta não funcionar, confira se a aplicação cobre **exatamente o caminho** e se o JWT tem o AUD cadastrado.

Documentação:
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://ai.google.dev/api/generate-content
