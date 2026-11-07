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
