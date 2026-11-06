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
