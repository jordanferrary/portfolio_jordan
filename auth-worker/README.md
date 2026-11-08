# Alquimago — GitHub App sem copiar tokens

O Local Studio pode publicar no GitHub com uma sessão autorizada: você conecta sua conta uma vez, confirma cada publicação e não precisa colar um personal access token a cada atualização. **Esta opção depende de configurar e implantar o serviço; só criar os arquivos do repositório não ativa o login.**

## Arquitetura

- O portfólio continua sendo um React estático hospedado pelo GitHub Pages.
- O backend em `auth-worker/src/index.js` é um Cloudflare Worker separado, com sessão autenticada em KV e criptografia AES-GCM. **Nenhuma credencial é incluída em `dist/`, `public/` ou no JavaScript do React.**
- Um GitHub App com acesso **apenas ao repositório selecionado** fornece o login e os tokens de usuário de curta duração. O Worker faz refresh quando permitido, sem entregar tokens ao navegador.
- O Worker só aceita rotas necessárias ao publicador de conteúdo: blobs, árvores, commits, leitura dos arquivos de dados, consulta de identidade e atualização não forçada da branch `main`. Ele bloqueia rotas de edição arbitrária do código-fonte.
- A expressão **“vai comprar pão”** é apenas um atalho no chat do Alquimago para **abrir a revisão da publicação**. Ela não é senha e **nunca autoriza um commit sozinha**. O Studio precisa estar desbloqueado e o usuário deve confirmar a publicação.

## Ativação inicial (somente pelo proprietário)

1. Crie um **GitHub App** em <https://github.com/settings/apps/new>. Configure os direitos mínimos: **Contents: Read & write** no repositório `jordanferrary/portfolio_jordan`, **Metadata: Read** (normalmente implícito), sem webhooks ou permissões organizacionais adicionais. Instale-o **somente no repositório escolhido**.
2. Na configuração do GitHub App, escolha **Callback URL** `https://SEU-WORKER/auth/callback` e habilite a expiração de tokens de usuário. Guarde **Client ID** e **Client Secret** exclusivamente como *secrets* do Worker. O Client Secret não deve ser enviado ao chat, publicado em commits, nem usado como variável `VITE_*`.
3. Crie um Cloudflare Worker no seu ambiente. No diretório `auth-worker/`, execute `npm install`. Gere um namespace KV para sessões (por exemplo, `wrangler kv namespace create SESSIONS`) e copie `wrangler.example.toml` para `wrangler.toml`, substituindo a identificação do namespace e `FRONTEND_URL` pelo endereço **HTTPS real** do portfólio.
4. Configure secrets com `wrangler secret put GH_CLIENT_ID`, `wrangler secret put GH_CLIENT_SECRET` e `wrangler secret put SESSION_ENCRYPTION_KEY`. Esta última chave precisa conter **32 bytes aleatórios codificados em Base64**. Gere-a localmente com um gerador criptográfico confiável; nunca a salve no repositório.
5. Execute `npm test` e `npm run deploy` em `auth-worker/`. O Worker deverá publicar os endpoints `/auth/start`, `/auth/callback`, `/auth/session`, `/auth/logout` e `/api/github`.
6. Em **GitHub → portfolio_jordan → Settings → Secrets and variables → Actions → Variables**, crie `ALQUIMAGO_AUTH_ORIGIN` com a origem HTTPS do Worker (exemplo: `https://auth.seudominio.com`, sem caminho e sem barra final). Este valor é **público** e não é um token.
7. Execute novamente a publicação do GitHub Pages pelo workflow. No Local Studio desbloqueado, abra **Publicar** → **Conectar com GitHub** e autorize o aplicativo. Em publicações seguintes, o Worker reutiliza a sessão enquanto estiver válida. É possível desconectar/revogar a autorização.

### Domínios e cookies

Cookies com `HttpOnly`, `Secure` e `SameSite=None` podem ser bloqueados quando o site e o Worker usam **sites distintos**, como `github.io` e `workers.dev`. Para login persistente confiável, hospede o portfólio e o Worker em subdomínios sob **um mesmo domínio próprio** (por exemplo, `portfolio.exemplo.com` e `auth.exemplo.com`), configure `SESSION_SAMESITE = "Lax"` e mantenha HTTPS. Sem um domínio adequado, o botão pode exigir autenticação repetida ou não funcionar; o método manual com token temporário permanece disponível. Não desabilite a segurança do navegador para resolver isso.

### Teste

- Abra o Studio e tente usar **“vai comprar pão”** no chat do familiar. O resultado esperado é **abrir a tela de revisão**, e nunca publicar automaticamente.
- Antes de confirmar, confira o estado da sessão, a lista de alterações, as mídias selecionadas e os arquivos que seriam removidos.
- Confirme a publicação e acompanhe **GitHub Actions**. O GitHub pode solicitar nova autorização se a sessão expirar, for revogada ou se permissões mudarem.
- Teste as rotas proibidas em `npm test` do Worker; a API nunca deve permitir escrever `src/app.tsx` por esse mecanismo.

## Reversão e privacidade

O método de token temporário continua disponível sem Worker. O proprietário pode optar por guardar essa credencial criptografada localmente no IndexedDB do navegador, ou usá-la somente em memória. Nenhum token, Client Secret, cookie ou mensagem privada entra no snapshot público do Alquimago. O cofre local não oferece o isolamento de segurança do Worker: scripts da mesma origem podem pedir uso da chave. Se uma autorização for comprometida, revogue-a no GitHub e desconecte o Worker.

**Estado:** a integração cliente/servidor e os testes de rotas estão no código. O Worker e o GitHub App ainda precisam ser criados, configurados e autorizados pelo proprietário antes de o login sem token funcionar.


## Professor Gemini (conexão opcional)

**Provedor fixo: Google Gemini.** A Cloudflare é apenas o servidor intermediário que protege a credencial, autentica a sessão e limita o acesso. O Worker não usa Cloudflare Workers AI nem Gemma.

O endpoint autenticado \`POST /api/assistant\` consulta o Gemini pelo serviço oficial. A chave do provedor permanece **somente no ambiente de servidor**, nunca no JavaScript público, no GitHub ou nos arquivos publicados do site. A configuração lógica exige \`GEMINI_API_KEY\` como segredo do servidor e \`GEMINI_MODEL\` como identificação de um modelo disponível na conta autorizada. Não há chave de exemplo no repositório.

**Importante:** o Gemini é opcional e **ainda não está ativo em produção**; a screenshot compartilhada mostra que não há projetos Workers & Pages na conta exibida. Não existe conexão real sem um serviço implantado, uma conta habilitada e autorização compatível com os termos oficiais do Google.

### Fluxo do aprendizado

1. O Alquimago verifica respostas de sua própria base de lições aprovadas.
2. Para perguntas ainda não respondidas, o usuário pode autorizar uma consulta ao professor Gemini em uma sessão autenticada.
3. O Gemini retorna uma explicação em português. Se o usuário já autorizou inspecionar arquivos públicos, a solicitação pode incluir **somente metadados estruturais** (nomes de arquivos, imports e exports), nunca código bruto.
4. A explicação não vira conhecimento automaticamente. A interface exige que o responsável revise a resposta e clique **Aprovar e aprender**.
5. Somente lições aprovadas ficam no armazenamento local por namespace. O mascote poderá reutilizá-las mesmo após novas versões do site; elas não são incluídas no JSON público nem no commit do GitHub.

O sistema de aprendizado é uma **memória recuperável de perguntas e respostas**, não alteração automática dos pesos do Gemini nem capacidade geral equivalente a um modelo de linguagem.

### Privacidade e limites

- O endpoint exige sessão, origem autorizada e consentimento de envio.
- Até 25 consultas por sessão/dia na camada KV (limite aproximado), além dos limites do próprio Google.
- Conteúdo enviado à modalidade gratuita da API pode ser usado para melhorias do serviço, conforme os termos do Google. **Não enviar informações confidenciais, segredos ou dados pessoais.**
- Os dados públicos recebidos pelo professor são tratados como não confiáveis; ele não dispõe de ferramentas para editar arquivos, criar commits ou navegar no repositório.
- O modelo real e eventuais quotas gratuitas variam; configure os limites de gastos no provedor antes de ativar.
- O frontend permanece com \`llm.enabled=false\` até o serviço e a autorização estarem prontos.

Consulte as regras oficiais do Google para elegibilidade, disponibilidade regional e uso da API antes de ativar a conexão.
