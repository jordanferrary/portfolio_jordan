# Abrir o Jordan Ferrary Portfolio em um preview React Web

Este projeto usa React + Vite + React Router. A configuração do StackBlitz já está incluída para iniciar o servidor automaticamente.

## Opção 1 — Preview no navegador com StackBlitz

1. Abra https://stackblitz.com/ e crie um projeto novo usando o modelo **Vite + React**.
2. Extraia este ZIP no seu dispositivo.
3. No projeto aberto do StackBlitz, importe/arraste os arquivos e pastas extraídos para o explorador de arquivos, mantendo a estrutura original (`src`, `public`, `index.html`, `package.json`, `vite.config.js` e `.stackblitzrc`).
4. Confirme a substituição dos arquivos do projeto inicial.
5. Aguarde a instalação das dependências. O comando de desenvolvimento é `npm run dev -- --host 0.0.0.0`; o painel Preview deverá abrir o site.

Documentação oficial de importação: https://developer.stackblitz.com/guides/user-guide/importing-projects

## Opção 2 — Executar localmente

Requer Node.js 18.18 ou superior.

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Rotas incluídas

- `/` — Home
- `/portfolio` — Galeria com filtros e pesquisa
- `/project/:slug` — Página dinâmica de cada projeto
- `/about` — Sobre

## Observações

- As imagens e textos de projetos são placeholders e devem ser substituídos pelos trabalhos finais.
- Os links sociais ainda precisam dos endereços reais.
- Para ativar o player, adicione uma faixa licenciada em `public/audio/portfolio-atmosphere.mp3`.
