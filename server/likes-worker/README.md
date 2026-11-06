# Curtidas compartilhadas — servidor opcional

Esta pasta é um **modelo de backend** Cloudflare Workers + D1. Não está implantada nem ativada; sem ele, o frontend só registra curtidas locais. A contagem pública não pode ser global de forma confiável no GitHub Pages sem um serviço externo.

O frontend já suporta a API por variável de ambiente `VITE_LIKES_API_URL`. Rotas:
- `GET /projects/:id/likes` → `{"count":5,"liked":false}`
- `POST /projects/:id/likes` com `{"liked":true|false}` → mesmo formato atualizado

## Configuração futura

1. Crie uma conta Cloudflare e um banco D1 chamado `jf-portfolio-likes`, usando `npx wrangler d1 create jf-portfolio-likes`.
2. Copie `wrangler.toml.example` para `wrangler.toml`; informe o ID D1 retornado e o domínio **exato** do frontend na variável `ALLOWED_ORIGIN`. Não comite IDs ou informações privadas desnecessárias.
3. Aplique `schema.sql` ao banco remoto: `npx wrangler d1 execute jf-portfolio-likes --remote --file=schema.sql`.
4. Configure um segredo aleatório de no mínimo 32 caracteres com `npx wrangler secret put COOKIE_SECRET` (nunca adicione esse valor ao GitHub).
5. Execute `npm install`, `npm run typecheck` e `npm run deploy` **nesta pasta**.
6. Configure `VITE_LIKES_API_URL=https://SEU_WORKER` no build do React e publique novamente. Não coloque barras extras no final.
7. Preferencialmente sirva a API no mesmo domínio principal do site ou por um proxy `/api`. Cookies de terceiros podem ser bloqueados entre GitHub Pages e workers.dev.

## Limitações e segurança

O trabalhador usa cookies anônimos assinados (HttpOnly, Secure) e impede que um mesmo cookie vote repetidamente no mesmo projeto. **Isso não garante uma curtida por pessoa:** alguém pode apagar os cookies, utilizar outro navegador ou criar novas sessões. Para uma contagem confiável contra abuso, habilite autenticação, limitação de requisições e proteções adicionais no servidor. Cookies de terceiros podem ser bloqueados, então recomendamos configurar a API em domínio próprio.

Apenas o domínio listado em `ALLOWED_ORIGIN` é aceito. Não há chaves nem senhas de banco no código do React. Os dados em D1 são específicos dessa instalação externa.


## Formulário de contato e inbox privada
O mesmo Worker agora aceita `POST /contact` para envio de mensagens públicas e protege `GET /admin/summary`, `GET /admin/messages`, `PATCH /admin/messages/:id` e `DELETE /admin/messages/:id` com um token exclusivo do servidor. O formulário não envia nada se a URL do backend não tiver sido configurada.

**Configuração adicional:** atualize o banco com o novo `schema.sql` e crie outro segredo longo com `npx wrangler secret put ADMIN_TOKEN` (mínimo de 32 caracteres). Esse valor nunca deve ser colocado no React ou no código-fonte. Informe a URL pública do Worker no build com `VITE_CONTACT_API_URL=https://SEU-WORKER`. O proprietário digita o segredo na caixa de entrada do Local Studio a cada nova sessão; a chave é mantida apenas em memória.

O sininho consulta o total de mensagens não lidas somente depois de autenticar e atualiza a cada minuto. As mensagens ficam no D1 e não no GitHub. O servidor valida e limita envios por origem/IP hash e não armazena o IP puro. Recomenda-se acrescentar CAPTCHA/Turnstile, retenção e políticas de privacidade antes de aceitar grande volume de envios.

**Atenção:** este repositório não inclui segredo do administrador e não implanta o backend automaticamente. A execução de CI valida o código, mas não significa que o formulário está ativo.


## Avatares opcionais para identificação de contatos

O formulário aceita foto **enviada voluntariamente pelo próprio visitante** (PNG/JPEG/WEBP). O navegador prepara um avatar 96×96 em WEBP, sem dados EXIF; o Worker valida o tamanho e armazena a imagem privada em D1 junto da mensagem. Se nenhuma foto for enviada, o Studio mostra iniciais em uma cor consistente por e-mail. Não tentamos buscar automaticamente a foto da conta Google/Outlook, pois isso não é disponibilizado livremente pelo endereço de e-mail.

- Instalação nova: o `schema.sql` já contém a coluna `avatar`.
- Banco existente, criado com a versão anterior: execute uma única vez `npx wrangler d1 execute jf-portfolio-likes --remote --file=migrations/001_contact_avatar.sql` antes do deploy atualizado.
- A visualização/exclusão continua protegida por `ADMIN_TOKEN`. É possível excluir mensagens individualmente ou limpar apenas as mensagens já lidas.
- Recomendado configurar uma política de retenção (prazo de exclusão) para e-mails e fotos de clientes, além de CAPTCHA/Turnstile e uma declaração de privacidade adequada.


## Teste pelo GitHub Pages, serviços editáveis e anexos de orçamento

O GitHub Pages continua sendo estático. **No modo Local Studio**, o formulário cria mensagens e anexos de teste em IndexedDB, acessíveis pelo sininho **no mesmo navegador e perfil**, sem exigir token adicional. Esses testes não chegam a outras máquinas ou ao proprietário por e-mail. Não use essa prévia como caixa de entrada de clientes reais.

No editor `Editar Contato` é possível adicionar, renomear, reordenar ou excluir interesses/serviços e alterar o convite ao cliente. A ordenação manual da galeria também é local e fica no backup ZIP.

Para produção, o frontend envia `multipart/form-data` com JSON no campo `payload` e até **3 anexos** (JPG/PNG/WEBP/PDF), **4 MB cada** e **8 MB no total**. O Worker armazena os arquivos **privadamente em Cloudflare R2**, guarda apenas os metadados no D1 e oferece download protegido por `ADMIN_TOKEN`.

1. Crie o bucket `npx wrangler r2 bucket create jf-contact-files` e configure o binding `ATTACHMENTS` no seu `wrangler.toml`.
2. Em instalação nova, aplique `schema.sql`. Em banco existente, aplique **apenas uma vez** a migração `migrations/002_contact_attachments.sql`.
3. Implante o Worker com `COOKIE_SECRET` e `ADMIN_TOKEN` definidos como segredos, e informe `VITE_CONTACT_API_URL` ao build do site.
4. O login do Local Studio **não autentica a API pública**. O token adicional é necessário para ler anexos e e-mails reais. Sem isso, qualquer pessoa poderia ler e excluir mensagens de clientes porque o PIN está no JavaScript.

A exclusão de mensagens no servidor também apaga os anexos vinculados em R2. Não compartilhe URLs diretas do bucket.
