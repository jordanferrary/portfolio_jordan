# Construtor de páginas dinâmicas — Jordan Ferrary Portfolio

## Objetivo
O Local Studio agora permite criar páginas adicionais, sem alterar os quatro links fixos **Home / Portfolio / About / Contact**, mantendo a direção de arte roxo-neon/grafite. Exemplos: cursos, áreas de recursos, catálogo, materiais gratuitos, guias, coleções e projetos especiais.

## Como criar uma página

1. Abra o **Local Studio** com o atalho padrão e escolha **Ferramentas → Páginas → Nova página**. Alternativamente, clique no `+` da barra lateral, visível apenas no modo de edição.
2. Na aba **Identidade**, informe o título grande, o texto curto do menu, ícone, subtítulo e linha de destaque (eyebrow).
3. Escolha o tamanho da área de conteúdo (**Editorial** ou **Expandida**). Se adicionar uma imagem de banner, ajuste **posição horizontal e vertical**.
4. Na aba **Composição**, insira os blocos desejados e reordene-os com setas ou arrastando a alça.
5. Clique em **Salvar página**. O rascunho passa a ser exibido no site **somente enquanto estiver no Local Studio**, podendo ser conferido e editado.
6. Clique em **Publicar no GitHub** para enviar as páginas e suas imagens ao manifesto público `src/data/published-portfolio.json`. O deploy automático do GitHub Pages colocará o conteúdo no ar para os visitantes.

A criação de páginas não precisa de novo código ou de deploy manual para cada conteúdo: o construtor salva dados no mesmo portfólio publicado.

## Como organizar o menu

Em **Ferramentas → Páginas → Minhas páginas**, você pode:
- Abrir e editar uma página.
- Mudar sua posição entre as páginas adicionais (setas).
- Ocultar ou exibir a página na barra lateral. **Ocultar não torna privada:** o link direto continua acessível.
- Duplicar uma página (a cópia começa oculta para evitar links repetidos).
- Excluir uma página, após confirmação. Links existentes para uma página excluída deixam de funcionar depois de publicar.

Os quatro links nativos não são removidos. As páginas extras aparecem entre **Portfolio** e **About**, na ordem escolhida. Em celular, a navegação horizontal pode ser rolada para não amontoar os itens.

### Endereços permanentes
Cada página nova recebe um identificador único e link de hash:

`https://jordanferrary.github.io/portfolio_jordan/#/page/page-<uuid>`

O endereço não muda quando o título ou o nome do menu é editado. A navegação direta por URL também funciona, sem configuração de servidor de rotas.

## Blocos disponíveis

- **Título**, **Texto rico** (negrito, itálico, destaque roxo e pré-visualização)
- **Imagem**, **Imagem + texto**, **Texto + imagem**, **Galeria**, **Antes/depois**
- **Vídeo** YouTube/Vimeo com miniatura e carregamento após clique
- **Modelo 3D** com URL pública direta GLB/glTF, carregamento sob demanda
- **Divisor** com ícone e estilos de linha
- **Botão de ação** (detalhes abaixo)

Os blocos visuais reaproveitam o renderizador `StoryBlock` da página de projeto, preservando a mesma identidade visual, o zoom e os componentes de mídia.

## Botões e ações

Ao adicionar **Botão de ação**, configure:
1. **Texto do botão** — por exemplo, "Copy PIX key", "Copy prompt" ou "Explore course".
2. **Ação**:
   - **Copiar texto**: guarda uma chave PIX, um prompt, um código ou qualquer texto extenso e copia para a área de transferência quando o visitante clica, com aviso de sucesso/erro. Não cobra nem processa pagamentos.
   - **Abrir link nesta aba**: navegação normal.
   - **Abrir link em nova aba**: abre outra aba com `rel="noopener noreferrer"`.
3. Conteúdo para copiar **ou** URL de destino.
4. Descrição opcional, estilo **Destaque neon / Contorno**, alinhamento **Esquerda / Centro / Direita** e largura **Automática / Total**.

URLs permitidas: `https://`, `http://`, `mailto:` e rotas internas válidas do portfólio, como `#/portfolio` e `#/page/page-...`. Protocolos executáveis como `javascript:` são rejeitados, e o botão fica desabilitado se o link for inválido. A segurança de links externos e dos destinatários é responsabilidade de quem publica.

**Importante:** o texto do botão de copiar fica no conteúdo público do site, mesmo que não seja exibido até clicar. **Nunca** coloque senhas, credenciais, dados bancários privados ou informações secretas em blocos para copiar.

## Publicação, imagens, backup e exclusão

- `PortfolioStore.customPages` é migrado como lista vazia para dados antigos.
- `src/hooks/use-portfolio.ts` salva páginas junto com os projetos e inclui imagens locais no backup ZIP e restauração.
- `src/lib/github-publish.ts` publica páginas e prepara imagens do banner e dos blocos via pipeline normal `site://images/studio/` e variantes responsivas.
- `src/components/ui/asset-library-context.tsx` e `asset-picker.tsx` permitem reutilizar imagens já inseridas em páginas.
- `src/lib/github-media.ts` analisa as referências em páginas personalizadas antes de sugerir exclusão de mídias. Ainda é possível que links de fora do manifesto não sejam detectados.

## Arquitetura e arquivos

| Arquivo | Função |
| --- | --- |
| `src/data/custom-pages.ts` | Dados, identidade, tipos de bloco, ações e validação de URLs |
| `src/components/sections/custom-page-editor.tsx` | Construtor e administrador de páginas no Local Studio |
| `src/components/sections/custom-page.tsx` | Renderização pública, botão copiar/abrir links, reutilização de blocos |
| `src/components/layout/sidebar.tsx` | Links dinâmicos, ícones, ordem e visibilidade |
| `src/styles/custom-pages.css` | Aparência e navegação responsiva |
| `src/app.tsx` | Rotas `#/page/:id`, edição e integração com o Studio |
| `src/hooks/use-portfolio.ts` | Rascunhos, migração, exportação e importação |
| `src/lib/github-publish.ts` | Publicação de páginas, blocos e imagens |

## Verificações recomendadas

1. Criar página com dois blocos de texto, imagem e botão de copiar, salvar e conferir o rascunho.
2. Testar links externos na mesma aba, em nova aba e links internos `#/portfolio`.
3. Reordenar, ocultar, duplicar e editar páginas; verificar menu no desktop e celular.
4. Testar backup ZIP e restauração com imagens locais em páginas novas.
5. Publicar, acompanhar o build e abrir o endereço direto em navegador sem rascunhos locais.
6. Conferir a biblioteca de mídias antes de excluir imagens utilizadas em páginas personalizadas.

**Limites:** estas páginas são conteúdo estático editável, não uma plataforma LMS ou sistema de pagamentos. Recursos como acesso restrito, checkout, matrículas, vídeos privados, certificados ou contas de alunos exigem infraestrutura adicional e nunca devem ser implementados apenas escondendo conteúdo em React.


## Galeria interativa de itens (obras, certificados e coleções)
O bloco `showcase` pode ser usado para apresentar certificados **já obtidos**, participantes e portfólios, bem como obras ou premiações; isso **não** cria, emite ou valida certificados de cursos.
No Studio, cada item possui título, imagem remota, descrição e link opcional. A opção **Mostrar botão no painel de detalhes** ativa/desativa o botão por item; **Texto do botão** é livre (ex.: `Ver certificado`, `Abrir portfólio`). Novos itens não têm botão por padrão. Os nomes não são numerados automaticamente.
O painel de detalhes fica fechado até alguém clicar num item, e pode ser fechado pelo botão X ou selecionando novamente o card ativo. O enquadramento das miniaturas pode ser `contain` (certificados completos) ou `cover` (artes). O zoom abre o original com toda a imagem visível a 100%.
