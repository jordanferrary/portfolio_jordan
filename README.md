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

