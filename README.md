# Jordan Ferrary — Portfólio React

Aplicação React 19 + TypeScript strict + Vite + Tailwind CSS v4 + Lucide + Base UI.

## Executar

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Layout

Páginas independentes em hash routes: Início, Portfólio, Sobre, Contato e estudos individuais dos projetos. Galeria com colunas Pinterest de proporções diferentes. Clicar na imagem seleciona um painel **ao lado**, sem modal nem desfoque; clicar em View Project abre o projeto inteiro.

## Local Studio

Pressione **Ctrl + \\**. PIN de demonstração definido no front-end; **não é autenticação segura**. Qualquer visitante com ferramentas de desenvolvimento consegue inspecionar ou contornar essa barreira. Não o utilize para dados privados ou publicação online.

O editor local permite:
- Criar, editar e excluir projetos e destaques.
- Adicionar blocos de título, texto, imagem, imagem à esquerda, imagem à direita, antes/depois interativo e galeria de imagens.
- Reordenar blocos por arrastar e soltar ou por botões; arrastar miniaturas de assets para outros blocos.
- Separar ferramentas por vírgula, Enter ou Tab.
- Criar categorias com ícones Lucide ou arquivos personalizados; filtrar projetos por categoria e palavra-chave.
- Importar imagens para IndexedDB e editar sem modificar o repositório.

O arquivo ZIP do backup do Studio contém `portfolio.json` e imagens organizadas em `public/images/projects/<id>/` e `public/images/filter-icons/`, quando adicionadas no editor.

**Importante:** arquivos importados pelo editor ficam neste navegador, não são gravados no GitHub. A publicação automática, sincronização entre dispositivos e um acesso administrativo realmente protegido exigem backend, armazenamento e autenticação pelo servidor. Nunca coloque tokens GitHub ou senhas reais no JavaScript do visitante.

## Organização dos assets de exemplo

```
public/images/
  hero/hero-character.webp
  profile/avatar.webp
  music/album-cover.webp
  filter-icons/.gitkeep
  projects/
    void-wanderer/void-wanderer.webp
    moonlit-cottage/moonlit-cottage.webp
    deepwalker/deepwalker.webp
    astral-guardian/astral-guardian.webp
    neon-armor/neon-armor.webp
    ancient-ruins/ancient-ruins.webp
```

## GitHub Pages / outros provedores

GitHub Actions gera o build com `GITHUB_PAGES=true`; o Vite usa a base `/reactteste/` e publica `dist/`. Em hospedagem externa comum, `npm run build` usa base `/`. Configure o servidor para servir `dist/`. Navegação com hash routes funciona sem regras de SPA.

O conteúdo foi reconstruído a partir do screenshot e referências Figma compartilhados. Medições exatas das camadas não foram exportadas, portanto não foi possível validar fidelidade pixel a pixel.


## Revisão da Home e do Studio

- Home desktop (largura >= 1100px e altura >= 570px) se adapta à altura da viewport sem rolagem interna. Para telas menores, a rolagem permanece por acessibilidade.
- Mini About, Focus e depoimentos em carrossel. O editor “Editar Home, feedbacks e músicas” aparece após Ctrl + \\ e o PIN de demonstração. Depoimentos não são inventados; cadastre apenas relatos reais.
- Player usa áudio HTML nativo com loop; clique na capa para escolher entre faixas. Os controles Play/Pause nunca fazem download. Sem músicas cadastradas, o Play é desabilitado. A reprodução automática pode ser bloqueada pelo navegador até haver interação.
- O Studio aceita Markdown simples com botões Negrito, Itálico, Subtítulos H2/H3 e visualização; o texto é renderizado de maneira segura (sem HTML livre).
- “Adicionar bloco” abre a biblioteca de layouts exatamente no ponto de inserção. As etapas da prévia de projetos são cadastradas individualmente na aba “Processo”.
- O backup ZIP agora inclui as imagens do processo e as faixas e imagens configuradas localmente.

### Pendência visual
O frame de Home foi reproduzido a partir do screenshot anexado. A arte original de fundo da referência não está entre os assets fornecidos e o Figma não pôde ser inspecionado por completo nesta sessão. O editor da Home permite trocar essa imagem pela exportação correta.

## Biblioteca de imagens e player (revisão seguinte)

**Biblioteca por clipe:** cada campo de imagem oferece “Biblioteca”. Por padrão, “Neste projeto” mostra imagens daquele projeto, inclusive as reaproveitadas. “Todas as imagens” remove o filtro, e a busca encontra arquivos por nome/pasta. A biblioteca também mostra mídias locais anteriormente enviadas e as capas e imagens já cadastradas nos projetos, Home e filtros.

**Deduplicação:** novas importações são comparadas pelo hash SHA-256 do conteúdo. Reimportar o mesmo arquivo retorna sua referência existente em vez de salvar outro blob. Arquivos legados idênticos são agrupados na lista, mas não apagados, evitando quebrar referências antigas. Um asset compartilhado pode pertencer a múltiplas pastas lógicas.

**Backup:** `jordan-portfolio-backup.zip` inclui `portfolio.json`, `media-library.json` e todos os blobs locais do catálogo, mesmo que ainda não estejam vinculados a um projeto. Use esse arquivo para restaurar biblioteca e conteúdo no mesmo navegador ou em outro.

**Cadastro de músicas:** Local Studio → “Editar Home, feedbacks e músicas” → “Músicas” → “Adicionar nova música”. Informe título, artista, imagem da capa e áudio MP3/WAV/OGG ou URL direta. A capa pode ser importada ou reutilizada pelo clipe. A playlist aceita editar, excluir e ordenar as faixas.

**Player:** clicar na capa abre a playlist; Play/Pause controlam apenas áudio, sem download; ∞ aceso repete continuamente a mesma faixa; ∞ apagado avança à próxima ao terminar (com mais de uma faixa). A reprodução automática pode ser bloqueada pelo navegador até uma interação do usuário.

**Observação:** Local Studio e o PIN atual são apenas uma interface de testes; os dados ficam no IndexedDB/localStorage deste navegador. Nem música nem imagem nova são publicadas no GitHub por esses controles, e não há autenticação segura de servidor implementada.

## Revisão: M4A, glass player e redes editáveis

- `.m4a` aceito em uploads da playlist, com tipos MIME `audio/mp4`, `audio/x-m4a`, `audio/m4a`. Reprodução depende do suporte do navegador ao codec interno (por exemplo, AAC). O player usa o elemento `<audio>`; não há transcodificação nem download pelo botão Pause.
- Aparência do player ajustada apenas nas cores, reflexos e transparências de vidro roxo/grafite, mantendo suas medidas.
- Redes sociais no canto superior direito agora vêm do Local Studio: **Ctrl+\\** (PIN local de demonstração) → **Editar Home, redes e músicas** → **Redes sociais**. É possível criar, editar, reordenar e remover botões, selecionar ícones da lista ou subir/reutilizar imagens próprias, além de configurar URLs individuais.
- O Behance vem com URL vazia, como placeholder **não clicável**, até o usuário informar o endereço do próprio perfil. Não foi inventado link de perfil.
- URLs externas são validadas (HTTP/HTTPS), ou `mailto:` válido para a opção de e-mail. O editor continua **local**; publicar as mudanças para todos os visitantes precisa de backend/autenticação segura. O backup ZIP inclui ícones personalizados locais.

## Volume, títulos ricos, divisores e curtidas (2026-11)

- No player, use o ícone de alto-falante ao lado do progresso para abrir o slider de **volume 0–100%** e o botão silenciar. O valor fica salvo neste navegador.
- Nos layouts de **Título** e **Texto**, selecione palavras e use a paleta para aplicar `==destaque roxo==`; os controles de negrito `**texto**`, itálico `*texto*` e subtítulos H2/H3 também estão disponíveis. A renderização é segura e mantém a tipografia do site.
- Novo layout **Linha divisória** com ícone central opcional (brilho, estrela, diamante ou círculo) e estilos de linha; não requer texto.
- As páginas dos projetos não exibem mais o bloco fixo “PROJECT BREAKDOWN / Every detail tells a story.” A coluna inteira foi removida para ampliar a área de arte.
- Curtidas: cada projeto tem botão de coração na página completa e prévia. No Local Studio, o botão **Curtidas** controla se a contagem aparece. Por padrão ela está oculta. Sem backend, apenas o voto deste navegador é registrado e o contador visível traz o rótulo `local`.
- Para votos realmente compartilhados, implemente a API descrita em `server/likes-worker/`. A interface já consulta um endpoint opcional definido por `VITE_LIKES_API_URL`; **nenhum backend foi implantado** neste repositório. O exemplo de Worker requer configuração externa e não garante uma pessoa única sem autenticação adicional.


## Studio: contato, Sobre e edição de imagens
- **Player:** ao clicar no alto-falante, o controle de volume aparece dentro do próprio card, com cores e efeitos iguais à identidade roxo/grafite. Ele não deve ultrapassar a lateral.
- **Sobre editável:** no Local Studio, escolha `Editar Sobre` para alterar título, subtítulo, biografia (rich text), profissão/especialidades e duas imagens opcionais. A biblioteca de imagens também classifica assets de `about/`.
- **Edição rápida de imagens:** os campos de imagens e a biblioteca de assets exibem um lápis com **Editar imagem**. O editor oferece recorte central (original, 1:1, 4:5, 16:9), rotação, espelhamento, brilho e contraste; `Salvar nova versão` armazena um WEBP novo no catálogo local (preserva o original). Imagens em URLs externas podem bloquear edição por CORS; importe-as antes. As imagens locais precisam ser exportadas no ZIP para mover entre navegadores.
- **Comparador:** cada bloco `Antes / depois` agora permite renomear os dois lados — por exemplo, `Wireframe` e `Versão final`.
- **Contato:** página de conversa/formulário com nome opcional, e-mail, interesses e mensagem. O modo dev mostra o sininho inferior direito, que exige uma **chave secreta separada** para ler mensagens, marcar como lidas ou excluí-las. Contagem de não lidas atualiza periodicamente após autenticar.
- **Servidor necessário:** o GitHub Pages não armazena mensagens nem autentica o proprietário. O Worker de exemplo em `server/likes-worker` inclui rotas `/contact` e `/admin/messages` com Cloudflare D1. Configure o Worker, as tabelas do `schema.sql`, `COOKIE_SECRET`, `ADMIN_TOKEN` e `VITE_CONTACT_API_URL` antes de receber contatos reais. **O backend não foi implantado automaticamente.** Se não estiver configurado, o formulário fica desabilitado e apresenta links alternativos; nenhuma mensagem é descartada silenciosamente.


## Correção de sliders e contatos
- A barra de progresso do volume e seu marcador receberam estilos explícitos para Chromium/Opera e Firefox, sem aparência padrão branca/cinza.
- A rolagem da página, editores e caixas de mensagens usa o mesmo roxo/grafite da interface.
- O formulário permite foto de perfil **opcional, fornecida pelo remetente**, guardada na caixa de entrada. Se não houver foto, o sistema exibe iniciais em um avatar de cor própria. Não é possível obter automaticamente uma foto privada da conta de e-mail de alguém apenas pelo endereço.
- No painel de mensagens, as exclusões individuais já existiam. Agora há o botão **Limpar lidas** com confirmação para gerir vários contatos.
- Para envios reais entre navegadores, continue com a ativação do Worker/D1 documentada em `server/likes-worker/README.md`. A interface não afirma sucesso antes de o servidor responder.


### Envio alternativo enquanto o backend não é ativado
É possível adicionar a rede social **E-mail** com um endereço `mailto:seu-email@dominio.com` em **Local Studio → Redes sociais**. Se a API de mensagens ainda não estiver configurada, o formulário poderá abrir o aplicativo de e-mail do visitante com nome, e-mail, interesses e texto preenchidos. O visitante ainda deve confirmar o envio no próprio aplicativo; fotos opcionais não são anexadas nesse modo e não aparecem no sininho. A caixa de entrada do site exige a API/D1 para trabalhar entre dispositivos.


## Fluxo de aprovação no GitHub Pages (modo de teste)

O GitHub Pages está acessível publicamente pelo link de testes, mesmo que o portfólio comercial ainda não tenha sido lançado. As mudanças feitas em **Local Studio** são salvas apenas no navegador atual; não publicam arquivos nem alteram o GitHub automaticamente.

- **Testar mensagens sem backend:** abra `/#/contato`, desbloqueie o Local Studio, preencha o formulário e clique em **Enviar mensagem**. Aparecerá a confirmação **Teste registrado**. Abra o sininho no canto inferior direito para ver a mensagem, foto de perfil opcional e anexos. Não é necessário digitar token adicional nesse modo de teste. As mensagens ficam no IndexedDB da origem `jordanferrary.github.io` e podem ser excluídas na caixa de entrada; não são transmitidas a outros navegadores.
- **Testar anexos:** até 3 arquivos JPG/PNG/WEBP/PDF, no máximo 4 MB cada e 8 MB no total. Os arquivos podem ser baixados pelo painel de mensagens. Não ficam no ZIP do portfólio, pois representam testes de contato e não assets públicos.
- **Personalizar o contato:** Local Studio → **Editar Contato**. Permite adicionar, editar, remover e reordenar opções de serviço; personalizar o texto inicial e ativar ou desativar fotos de perfil e anexos.
- **Priorizar a galeria:** entre no Local Studio e arraste os cards da página Portfólio ou use as setas que surgem nos projetos. A ordem é persistida no armazenamento local e exportada com os dados do portfólio. Os primeiros projetos da lista são mantidos no topo do layout Pinterest; o restante continua balanceado em colunas de alturas variadas.
- **Visitantes fora do modo de edição:** enquanto não houver backend, não há confirmação falsa de envio. Se um endereço `mailto:` estiver configurado nas redes, o formulário pode abrir o aplicativo de e-mail do visitante; caso contrário, o contato é direcionado aos links sociais.

**Contato real:** o Worker em `server/likes-worker` já possui a API de mensagens, metadados em D1 e armazenamento privado de anexos em R2. Para ativar envios entre dispositivos, precisa ser implantado com banco, bucket, segredos e `VITE_CONTACT_API_URL`. O PIN do Studio é adequado à prévia local, mas não é autenticação segura para ler mensagens de outras pessoas em um servidor.
