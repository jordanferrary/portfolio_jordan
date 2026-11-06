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
A aba **Enquadramento** determina como cada capa aparece na galeria e no banner; ela não altera a imagem original. Na página do projeto, clique na imagem para abrir o visualizador: roda do mouse ou pinça para ampliar, arraste para examinar, botões +/−, reset e Esc para fechar.

Na comparação antes/depois, utilize os botões **Inspect Before/After** para examinar cada imagem individualmente.

## 5. Miniaturas e desempenho
A publicação prepara versões WebP menores para imagens novas e, quando viável, imagens já publicadas. O navegador usa automaticamente `srcset` para exibir a resolução apropriada. As imagens antigas que não possuam miniaturas continuam abrindo normalmente. Quando o zoom abre, carrega a imagem de maior resolução disponível.

## 6. Backup e publicação
Antes de alterações importantes, use **Ferramentas → Backup ZIP**. Para publicar, clique em **Publicar**, abra o guia **Como gerar o token?** se necessário, cole o PAT temporário no campo apropriado, revise e confirme. A publicação gera um commit na branch `main`; acompanhe a implantação pela aba Actions do GitHub.

Veja os detalhes em [README_GITHUB_TOKEN.md](README_GITHUB_TOKEN.md).

## 7. Limites
Rascunhos em Local Studio pertencem ao navegador até a publicação. Não limpe dados do navegador antes de exportar um backup. GitHub Pages hospeda conteúdo estático; não é um banco de dados de mensagens privadas.
