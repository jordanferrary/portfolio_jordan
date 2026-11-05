# Jordan Ferrary — 3D Artist Portfolio

Portfólio React responsivo construído com React 19, TypeScript strict, Vite e Tailwind CSS v4.

## Requisitos

- Node.js 22 ou superior
- npm 10 ou superior

## Desenvolvimento

```bash
npm install
npm run dev
```

O Vite escuta em `0.0.0.0:5173`, adequado ao encaminhamento de portas do GitHub Codespaces.

## Verificações e build

```bash
npm run typecheck
npm run build
npm run preview
```

## GitHub Pages

O `vite.config.ts` lê `GITHUB_REPOSITORY` durante o build e calcula automaticamente o `base`:

- Repositório comum: `/<nome-do-repositorio>/`
- Repositório `usuario.github.io`: `/`

O workflow `.github/workflows/deploy.yml` publica a pasta `dist` quando há push para `main`. No repositório, abra **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação. Se a branch principal tiver outro nome, atualize o gatilho do workflow.

## Assets

As imagens em `public/images/` foram recortadas das quatro referências fornecidas e convertidas para WebP. Os caminhos de imagem passam por `import.meta.env.BASE_URL` para funcionar também em subdiretórios do GitHub Pages.

## Interações

- Navegação por âncoras e indicação da seção ativa.
- Filtros de categoria e pesquisa na galeria.
- Modal acessível de detalhes do projeto (Base UI Dialog).
- Navegação entre depoimentos.
- Controle visual de play/pause no mini player.
- Formulário que copia a mensagem formatada; não envia dados para servidor.
