# Guia do proprietário — Local Studio

## 1. Entrar
Abra o portfólio e pressione **Ctrl + \\** no computador. Digite seu PIN na tela de acesso. O PIN é uma trava visual; a autorização para publicar depende separadamente do token do GitHub.

## 2. Gerenciar projetos
**Ferramentas → Projetos → Novo projeto** ou abra um projeto e escolha **Editar projeto**. Preencha informações, capa, ferramentas e escolha os blocos de **Composição**. Entre as opções estão imagem única, imagens com texto, galeria, comparador antes/depois, divisória e **Vídeo incorporado**.

Para o vídeo, cole um URL do YouTube/Shorts ou Vimeo. Pode adicionar uma miniatura própria. O vídeo só é carregado na página pública depois que alguém clica para reproduzir.

## 3. Importar imagens e usar conversor
As imagens importadas pelo Studio são convertidas **automaticamente** para WebP com o maior lado limitado a 2048 px e qualidade de 82%. Os arquivos originais do seu computador não são substituídos. A importação aceita PNG, JPEG, WebP e AVIF, até o limite de entrada configurado.

**Ferramentas → Conteúdo → Conversor WebP** oferece exportação manual em 1024, 1600, 2048 ou 4096 px com qualidade regulável. Ele gera um arquivo WebP para baixar, sem serviço externo.

## 4. Ajustar e inspecionar imagens
A aba **Enquadramento** tem apenas **dois conjuntos de controles independentes**: **Capa** (usado na galeria e na Home) e **Banner** (usado na página interna). A Home aparece como **prévia somente visual** dentro da configuração da capa, sem um terceiro conjunto de controles ou arraste próprio. A imagem original não é alterada. Na página do projeto, clique na imagem para ampliar no visualizador.

Na comparação antes/depois, utilize os botões **Inspect Before/After** para examinar cada imagem individualmente.

## 5. Miniaturas e desempenho
A publicação prepara versões WebP menores para imagens novas e, quando viável, imagens já publicadas. O navegador usa automaticamente `srcset` para exibir a resolução apropriada. As imagens antigas que não possuam miniaturas continuam abrindo normalmente. Quando o zoom abre, carrega a imagem de maior resolução disponível.

## 6. Backup e publicação
Antes de alterações importantes, use **Ferramentas → Backup ZIP**. Para publicar, clique em **Publicar**, abra o guia **Como gerar o token?** se necessário, cole o PAT temporário no campo apropriado, revise e confirme. A publicação gera um commit na branch `main`; acompanhe a implantação pela aba Actions do GitHub.

Veja os detalhes em [README_GITHUB_TOKEN.md](README_GITHUB_TOKEN.md).

## 7. Limites
Rascunhos em Local Studio pertencem ao navegador até a publicação. Não limpe dados do navegador antes de exportar um backup. GitHub Pages hospeda conteúdo estático; não é um banco de dados de mensagens privadas.


## 8. Excluir arquivos antigos
**Ferramentas → Gerenciar arquivos** abre por padrão **Arquivos do GitHub**, mostrando miniaturas de todas as imagens das subpastas `public/images/` (e demais mídias) mesmo que não apareçam em projetos. A visualização é pública e **não exige token**. Filtre por pasta, pesquise, selecione imagens sem uso e clique em **Excluir no GitHub**; a publicação abre com os caminhos selecionados. Confira a confirmação, informe o token e publique para realizar a exclusão. A aba **Arquivos locais** mostra mídias guardadas no navegador, que podem ser excluídas separadamente. Imagens em uso e recursos essenciais são protegidos; arquivos antigos de projetos de exemplo podem ser selecionados quando não utilizados. Faça um backup antes.

O inventário suporta imagens, áudio e também outros formatos de mídia quando presentes no repositório (vídeos MP4/WebM e modelos GLB/glTF/FBX). Consulte [Limpeza de mídias](README_MEDIA_CLEANUP.md).

## 9. Músicas com capa de referência
Em **Home → Músicas**, importe MP3, WAV, OGG ou M4A que você tenha direito de publicar. Se o nome estiver como `Artista - Música.mp3`, os campos são sugeridos e **continuam editáveis**. A capa pode ser: **imagem importada**, **imagem da biblioteca**, **URL HTTPS direta de qualquer imagem pública** ou **miniatura extraída apenas como referência de um link do YouTube**. **Atenção:** a URL de um vídeo do YouTube não é um arquivo MP3 e não deve ser colada no campo de áudio. O Studio agora identifica esse caso e sugere usar o link somente para obter a miniatura. Para reproduzir, importe seu arquivo MP3/WAV/OGG/M4A ou informe uma URL direta de arquivo de áudio autorizada. Não há downloader de áudio do YouTube integrado. O campo de URL tem prévia no próprio Studio e independe completamente do YouTube. Links de páginas de sites não funcionam como URL direta de imagem; alguns servidores bloqueiam exibição externa. Os links externos são mantidos remotos no player público. Não há conversor de vídeo do YouTube para MP3 dentro do Studio.

## 10. Modelo 3D e vídeo
Em **Projeto → Composição**, escolha **Vídeo incorporado** ou **Modelo 3D interativo**. Ambos têm miniatura e só carregam o conteúdo pesado após clique. Para o modelo, use URL HTTPS direta `.glb` ou `.gltf`. FBX deve ser convertido para GLB, de preferência no Blender com as texturas embutidas. O link deve permitir CORS.


## 11. Personalizar a apresentação dos vídeos

Em **Projeto → Composição → Vídeo incorporado**, preencha o link YouTube ou Vimeo, a capa opcional e o título do iframe. Na página pública, uma miniatura aparece até o clique. Depois, a reprodução acontece com os controles próprios da plataforma; abaixo aparece somente o link **Watch on YouTube/Vimeo**, sem uma segunda barra ou painel.

## 12. Criar e manipular novas páginas da navegação

Na central de ferramentas escolha **Páginas → Nova página** ou **Minhas páginas**. O botão `+` na barra lateral também abre o gerenciamento enquanto a edição está ativa. Na aba **Identidade**, defina título, nome e ícone do menu, visibilidade, descrição, banner e posição de imagem. Na aba **Composição**, adicione/reordene textos, imagens, antes/depois, galeria, vídeo, 3D, divisórias e botões personalizados. Salve e confira a página em modo de edição; publique no GitHub para disponibilizá-la aos visitantes.

O bloco **Botão de ação** aceita três funções: **copiar** texto, chave PIX ou prompt; **abrir link na mesma aba**; ou **abrir link em nova aba**. É possível ajustar aparência, alinhamento e largura do botão. Copiar PIX não processa pagamentos. O conteúdo de copiar é público; não use para armazenar senhas ou credenciais.

Em **Minhas páginas**, reordene, duplique, oculte do menu ou exclua páginas. Ocultar não impede acesso por link direto. O endereço `#/page/page-<uuid>` permanece quando renomear a página. Saiba mais em [README_CUSTOM_PAGES.md](README_CUSTOM_PAGES.md).


## Galeria interativa e slides (páginas personalizadas)

No Local Studio, abra **Minhas páginas → Editar → Composição**.

- **Galeria interativa**: serve para certificados, premiações, participantes, obras e coleções. Cada item tem título próprio, descrição e URL direta da imagem. **O painel lateral começa fechado** e só abre ao clicar num item, com opção de fechar; não há numeração automática nem o rótulo fixo “artista”. Cada item tem **Mostrar botão**, texto do botão e link configuráveis. Se desativado, nenhum botão é exibido. Configure **Enquadramento das miniaturas** para mostrar certificados inteiros ou preencher os cards com arte. As imagens externas não são copiadas ao GitHub; utilize URLs estáveis e tenha autorização para exibi-las.
- **Slides**: adicione e reordene imagens, escolha reprodução manual ou automática, transição *fade*, *slide* ou *zoom*, e intervalo de 1,5 a 30 segundos. O visitante pode avançar, voltar e ampliar a imagem. O botão flutuante de pausa/reprodução é opcional e fica sobre a imagem. Não há barra inferior, legendas ou numeração visível.
- Imagens de slides adicionadas pela biblioteca local seguem o fluxo normal de publicação; imagens externas continuam referenciadas pela URL.
- **Salvar página** grava o rascunho local. **Publicar no GitHub** é necessário para disponibilizar ao público.



## Carrossel responsivo: controle apenas de altura

Em **Local Studio → Minhas páginas → Editar → Composição → Slides**, o bloco oferece:

- **Altura:** de 180 a 640 px. A largura é sempre **100% da área de conteúdo**, respeitando o layout do site. Não existe configuração horizontal.
- **Quantidade automática de imagens:** até 4 quando a altura é de 180–240 px, até 3 em 241–320 px, até 2 em 321–430 px e uma acima disso. A quantidade também considera a largura real do dispositivo e o total de imagens.
- **Enquadramento:** imagem completa ou preenchimento do quadro (que pode recortar a imagem).
- **Botão flutuante de pausa/reprodução:** ativável ou desativável com uma caixa de seleção no Studio, **desativado por padrão**. Quando ativado, surge no canto inferior direito **sobre o carrossel**.
- **Sem rodapé:** os visitantes não veem título, legenda, descrição, numeração nem dots de paginação sob as imagens. As setas laterais e o zoom individual permanecem.
- **Prévia no editor:** ilustra as proporções e o número aproximado de imagens lado a lado.
- **Transições e autoplay:** continuam disponíveis com seus controles de intervalo.

Slides antigos são migrados para largura natural de 100% e altura anterior de 520 px quando não houver configuração de altura. As propriedades antigas de largura personalizada e contagem manual não são mais usadas no layout. Todas as alterações precisam ser salvas e publicadas no GitHub para chegarem ao público.

## Zoom sem corte em slides e certificados

O zoom dos slides e o dos demais projetos compartilham `ArtLightbox`. O visualizador foi ajustado para dimensionar a imagem original dentro da área da tela com `object-fit: contain` mesmo para imagens muito grandes ou verticais. **Ao abrir, a imagem inteira deve ficar visível**; só deve ser cortada visualmente se o visitante ampliá-la e mover o enquadramento. Redefinir o zoom para 100% também limpa o deslocamento anterior. Miniaturas configuradas como `cover` podem aparecer recortadas no card, mas não no zoom.


## Paleta de cores global — 7 variáveis

Em **Local Studio → Identidade → Paleta de cores**, o proprietário agora pode ajustar **cor principal**, **cor secundária**, **fundo**, **superfícies**, **texto principal**, **texto secundário** e **bordas e divisórias**. Os controles aplicam uma prévia em tempo real às seções públicas: Home, galeria, projetos, Sobre, Contact, páginas extras, galeria interativa, slides e player. Títulos, cards, indicadores, textos, botões, fundos e bordas acompanham as alterações. **As imagens das obras e a interface administrativa não são recoloridas**.

A prévia interna mostra as sete amostras e verifica o contraste entre texto principal e fundos/cards e entre texto secundário e fundo. Para desfazer uma experiência sem salvá-la, feche a janela; **Salvar paleta** registra no navegador; **Publicar no GitHub** envia a paleta ao site público. Presets foram atualizados para combinar também o texto secundário e as bordas com cada direção de arte. As paletas antigas de quatro cores são migradas com os novos campos preenchidos por defaults; cores previamente customizadas permanecem inalteradas.

Implementação: `src/lib/theme-palette.ts` valida valores, `src/components/sections/theme-palette-editor.tsx` manipula e aplica a prévia, `src/styles/theme-coverage.css` contém as regras do site visitante e precisa continuar sendo a última folha importada em `src/main.tsx`. Não adicionar novas cores roxas fixas nas páginas públicas; utilizar tokens `--jf-*`.


## Alquimago — mascote experimental do Local Studio

Ao desbloquear o Local Studio com **Ctrl + \\**, o Alquimago aparece na tela. Ele não é carregado para visitantes enquanto estiver em testes.

Os arquivos de integração ficam em `public/alquimago/`: `alquimago.js` (widget local), `config.json` (regras), `project-context.json` (resumo público do projeto) e `project-memory.json` (snapshot numérico público opcional do familiar do editor). Não é necessário executar um novo processo de instalação nem adicionar etapas para publicar o portfólio.

Desde a v0.5, o Alquimago do Studio utiliza **memória de rascunho em execução**, não persistência automática local. O XP, os atributos e os pesos aprendidos só se tornam permanentes quando o proprietário publica no GitHub. Recarregar recupera o snapshot público mais recente. A opção Exportar memória também permite backup manual.

Ao usar **Publicar no GitHub** com o token temporário já empregado pelo Studio, o publicador também inclui no mesmo commit um contexto público atualizado do projeto e, quando o familiar está carregado e pronto, o seu snapshot **numérico ao vivo**, com atributos e pesos neurais, sem textos privados. Rascunhos salvos localmente **não** fazem commits automaticamente. Dados de interação de visitantes não são compartilhados no repositório.

O recurso **Arquivos** lê apenas arquivos de texto públicos que forem explicitamente indicados em `config.json`. Não lê o código privado de outros repositórios nem acessa o disco do computador pelo navegador. A integração atual não é um agente de IA autônomo.

Ao atualizar o widget da sua própria instalação, verifique a versão de `public/alquimago/alquimago.js` e não substitua os arquivos de memória por conteúdo de exemplo.


### Alquimago 0.3 — interações e sugestões
- O familiar tem novo visual arcano, animações e gesto de carinho: toque rápido ou deslize curto sobre o personagem. Para mover, arraste por uma distância maior.
- A aba **Insights** reconhece a seção atual e aponta problemas estruturais públicos (como imagens sem alt e links quebrados observáveis). Não monitora valores digitados, formulários ou conversas privadas.
- O Studio envia ao mascote apenas o tipo de seção e as contagens de projetos e páginas, sem conteúdo de rascunhos.
- Ações repetidas não rendem XP ilimitado. Carinho não rende XP; cada rota rende uma vez ao dia ao escolher explorá-la; uma publicação GitHub confirmada concede XP uma vez por revisão.
- **IA** abre ChatGPT ou Gemini a pedido e prepara um prompt para colar. Não controla conversas, sessões ou abas externas.
- Histórico v0.3: a memória era local. Na v0.5 do Studio, ela é temporária até publicar; instalações independentes podem continuar no modo `local`.


### Alquimago 0.4 — verificação de atualização e interações reais

O mascote é carregado **somente** depois que o Local Studio é desbloqueado. Ao pressionar **Ctrl + R**, o React inicia novamente em modo público por segurança. Pressione **Ctrl + \\** e desbloqueie o Studio para ver o mascote. Abra o grimório e procure `v0.4` no título: se não aparecer, a página ainda pode estar servindo um deploy antigo.

**Carinho sem clique:** movimente o mouse algumas vezes para a esquerda e para a direita sobre o chapéu. A animação de coração confirma que o gesto foi reconhecido. Um deslize curto com o botão pressionado funciona em telas sensíveis ao toque; um arraste longo move o personagem. Clique no personagem para abrir **Conversar**; clique com o botão direito para abrir as ações. A rodinha do mouse gira o familiar.

**Diálogo:** a aba **Conversar** contém um campo de texto, classificação neural de intenção e respostas locais, botões rápidos e histórico temporário no Studio. Tente "oi", "como faço carinho?", "quanto XP tenho?", "tem sugestões pro site?" e "abre a galeria". O Alquimago não é uma IA generativa e não consegue ler conversas em outras abas.

**Atualização:** o identificador de cache passa a ser o SHA do build do GitHub, e não uma versão fixa. Histórico: a v0.4 utilizava `?v=0.4.0`. O identificador de versão reduz a chance de o navegador manter o JavaScript antigo em cache; para aparecer no site, o workflow **Deploy React to GitHub Pages** precisa concluir a compilação e o deploy. O histórico de diálogo fica em armazenamento local, separado das snapshots públicas de XP.


### Atualização de versão, cache e dados locais — Alquimago 0.4.1

- **Ctrl + F5** atualiza arquivos sem limpar `localStorage` do navegador. Porém, no modo `publish` da v0.5, o Alquimago descarta o rascunho de XP, conversa e aprendizado da sessão e recupera o último snapshot publicado.
- Em **Alquimago → Cuidado → Zerar rascunho do mago**, o usuário pode zerar XP, humor, posição, conversa e aprendizado **temporariamente**, após confirmação. Deve publicar para manter o zero. O portfólio, outros usuários e o GitHub não são alterados. O reset grava uma memória-base vazia para que o snapshot antigo do repositório não volte a preenchê-la.
- Em **Local Studio → Ferramentas → Gerenciamento → Voltar à versão publicada**, o editor oferece uma ação separada, com confirmação, para descartar **rascunhos do portfólio** guardados neste navegador. Antes disso, use **Backup ZIP** se precisar preservar algum rascunho.
- A central de ferramentas mostra o **Build** (SHA curto do GitHub Actions) e a **revisão do conteúdo publicado**. Eles permitem distinguir deploy novo de dados locais antigos.
- O script do Alquimago recebe `?v=<SHA do build>` a cada publicação; assim, uma versão JavaScript antiga não deve ser reutilizada só porque ficou no cache.
- O teste do repositório proíbe seletores de overlays do Studio no CSS público da paleta. Uma regra indevida anterior foi removida para liberar o pipeline de publicação.

### Correções da interface pública

A Home usa `focus-entry` no painel *Project Focus*, isolando ícones/textos das antigas regras de fundo aplicadas a `focus-item`. A página Contato utiliza uma composição compacta em desktop, com rolagem apenas caso o conteúdo não caiba; o layout móvel continua responsivo. Nenhuma alteração remove redes sociais ou configurações publicadas.

## Alquimago v0.5 — modelo neural e publicação deliberada

- Visual: o grimório é um painel opaco, com tamanho limitado pela janela e **rolagem interna**; telas pequenas continuam mostrando o cabeçalho e o botão de fechar.
- Diálogo: o classificador de intenções usa uma rede neural local **96 → 24 → 12**, treinada previamente com expressões comuns. Agora reconhece **OIE**, além de saudações e perguntas sobre o site.
- Aprendizado: na aba **Conversar**, a pessoa pode indicar o sentido correto da última mensagem e selecionar **Ensinar**. Os pesos se ajustam localmente. O modelo não gera textos como um LLM: responde a assuntos definidos e encaminha perguntas complexas.
- **Publicar alterações:** abre o mesmo editor de publicação autenticado que já existe no Local Studio. Após confirmação e commit bem-sucedido, o snapshot publicado passa a conter XP, atributos, proteção de recompensa repetida e pesos numéricos, nunca transcrição dos diálogos.
- **Recarregar sem publicar:** volta ao estado confirmado no repositório. Não mexe no rascunho do portfólio nem exige novas etapas para salvar o site.
- O publicador só captura o mascote quando ele está montado e com a configuração carregada. Se ele estiver indisponível, a memória pública anterior é preservada.
- Por privacidade, não ensine senhas, tokens nem dados de outras pessoas: a rede é um protótipo que permanece separado de serviços externos.


## Alquimago v0.6 — observação de projetos e personalização

- Ao permanecer sobre uma obra na Home, na Galeria ou na página de projeto, o familiar reconhece apenas os metadados **públicos** da obra (título, categoria, ano e ferramentas). Ele pode medir luz, variação tonal e cores da capa quando a imagem pertence à mesma origem. Não faz reconhecimento de objetos nem análise generativa.
- Há um intervalo para evitar falas repetitivas e um limite por sessão. Clique no balão de comentário para abrir a opinião completa em **Observar**.
- Na análise do projeto, **Dica útil** e **Não priorizar** ensinam que tipo de observação é mais relevante. Somente pesos numéricos por categoria de arte são persistidos no snapshot após **Publicar no GitHub**.
- **Ensinar uma frase** agora aplica uma correção explícita imediatamente e informa a nova confiança; o aprendizado persiste após publicar e recarregar. Conversas completas continuam fora do repositório.
- O grimório possui apenas três abas principais: **Conversar**, **Observar** e **Interagir**. Ferramentas de rotas, arquivos, backup e IA estão recolhidas em **Interagir → Ajustes e ferramentas**. Os scrollbars combinam com a identidade visual.
- Idioma padrão **português brasileiro**; para outro idioma é necessário adicionar um JSON público com traduções, exemplos e respostas e apontá-lo na configuração.
- **Skins** são listadas dentro de **Interagir → Ajustes e ferramentas → Aparência**. A skin padrão SVG não exige dependências. Skins 2D usam imagens hospedadas e skins GLB/Morph Targets precisam do adaptador Three.js opcional no React, conforme a documentação do repositório Alquimago.
- A seleção de uma skin previamente registrada pode ser salva no mesmo commit autenticado. **Não** existe importação de arquivos GLB diretamente do mascote: primeiro disponibilize o arquivo na pasta de mídias autorizadas do site.
- Recarregar a página **sem publicar** continua descartando a memória experimental do Alquimago no Studio; a memória local de visitantes de outras instalações não é modificada.
- A paridade com o Pestinha desktop é **parcial**. O navegador não tem acesso automático a programas do sistema operacional e o Alquimago ainda não reproduz a física, a rede neural LIF e todos os brinquedos do projeto original.


## Alquimago v0.7 — decisões autônomas, condicionamento e orbe físico

- O familiar agora possui um **córtex LIF independente de 512 neurônios pulsados, 16.384 conexões, 32 canais sensoriais e 16 canais motores**, além da rede de linguagem.
- O novo cérebro analisa apenas eventos e metadados públicos já disponíveis: estrutura da rota, problemas gerais de acessibilidade, obras autorizadas e interações **diretas** com o familiar. Não lê o conteúdo de formulários, senhas ou outras abas.
- Em **Interagir → Cérebro e autonomia**, é possível ativar ou pausar iniciativas, escolher `silencioso`, `equilibrado` ou `brincalhao`, e avaliar a última iniciativa com **Gostei** ou **Menos disso**. O feedback altera valores contextuais, reforço e até 32 episódios numéricos.
- Existe uma espera inicial e limites de frequência e de iniciativas por dia. Aba oculta, digitação e abertura do grimório impedem interrupções. O usuário continua decidindo toda navegação, publicação e alteração de arquivos.
- Em **Interagir → Orbe arcano**, uma brincadeira opcional abre um campo limitado com gravidade, quique e arremesso. Ele não interfere nos cartões nem no editor do site.
- No **Local Studio**, a memória do córtex acompanha o botão **Publicar** já existente: o snapshot numérico entra no mesmo commit autenticado, sem texto de conversa. Recarregar sem publicar recupera a última memória confirmada.
- Instalações independentes usam `behavior` no JSON de configuração. O domínio, o namespace e as permissões são definidos pelo próprio desenvolvedor.
- O Pestinha original ainda possui vantagens em leitura autorizada de janelas do SO e rotinas físicas desktop, portanto a versão 0.7 não declara equivalência total. Consulte `docs/CEREBRO_COMPORTAMENTAL.md` no repositório Alquimago.


## Alquimago v0.9 — respostas fundamentadas e IA opcional

**Modo local, sem serviço pago:** o familiar consulta \`public/alquimago/knowledge.json\`, que contém somente informações já aprovadas para publicação (título, categoria, ano, ferramentas, descrição e destaque). Ele responde perguntas sobre obras e mantém o contexto da obra citada na conversa seguinte. Não inventa ferramenta ausente.

**Publicar:** o fluxo autenticado do Studio agora gera \`knowledge.json\` no mesmo commit de \`published-portfolio.json\`, para que as informações públicas continuem sincronizadas. Recarregar sem publicar continua descartando as alterações experimentais do mascote.

**Treinamento:** o modelo neural chega pré-treinado no JavaScript distribuído; ele não precisa treinar todo o corpus novamente a cada acesso. O controle **Ensinar a reconhecer uma frase** corrige a classificação da mensagem e não adiciona conhecimentos factuais nem treina um LLM remoto.

**IA generativa opcional:** o código já suporta \`llm.enabled=true\` e um endpoint seguro \`/api/assistant\` no backend do proprietário. A conversa com IA só ocorre após consentimento explícito no grimório e requer autenticação, serviço implantado e configuração de custo/limites. Não há chaves ou tokens de IA no frontend; se não estiver configurado, o mascote usa apenas o modo local.

**Interface:** o painel Conversar ganhou mais espaço, maior contraste, fontes legíveis, barra de rolagem estilizada e configurações técnicas recolhidas.

**Segurança:** o comando “vai comprar pão” continua servindo exclusivamente para solicitar a revisão do publicador, não para autenticar ou fazer commits sozinho. Não confie em conteúdo de páginas públicas para autorizar ações administrativas.

## Reutilização de token para publicar (Alquimago v0.11.5)

Em **Local Studio → Publicar → Cofre do Alquimago**, use o campo protegido para informar a credencial restrita de GitHub e clique explicitamente em **Guardar token criptografado**. O sistema verifica a identidade e a permissão de escrita, então guarda ciphertext AES-256-GCM no IndexedDB do navegador. **Não envie tokens no chat.** A opção **Verificar validade** consulta o GitHub novamente; em caso de expiração, use **Descartar token** (requer confirmação) e informe outro. Uma falha de conexão não provoca exclusão automática.

Quando o senhor escrever **“vai comprar pão”**, o bot abrirá a revisão de publicação e receberá apenas o estado da autorização: sem token, “faltou o dinheiro”; válido, “já tenho dinheiro guardado”; expirado, “o pão mofou, posso jogar fora?”. O comando não cria commits sozinho; cada publicação exige a caixa de autorização. O PIN do Studio segue sendo só proteção visual, portanto a GitHub App com sessão protegida em servidor é mais segura que persistir um token no navegador.
