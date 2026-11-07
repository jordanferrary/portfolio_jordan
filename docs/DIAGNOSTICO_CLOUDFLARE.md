# Diagnóstico de atualização — Cloudflare Pages e GitHub Pages

O código-fonte do Local Studio está em `jordanferrary/portfolio_jordan`. Há um portfólio antigo separado no repositório `Meu_Portifolio`. **Não são a mesma aplicação.**

## Por que Ctrl + F5 não mostrava o Alquimago novo

1. O Studio utilizava `VITE_BUILD_SHA || '0.4.1'` como chave de cache. Em compilações da Cloudflare Pages que não forneciam `VITE_BUILD_SHA`, o URL do script continuava com `?v=0.4.1`, mesmo com arquivos novos.
2. O workflow em `.github/workflows/deploy.yml` publica em **GitHub Pages**. Se a versão usada pelo público está em `portfolio-jordan.pages.dev`, ela é hospedada pela **Cloudflare Pages**, que tem seu próprio pipeline e configuração de deploy. Alterar o workflow do GitHub Pages não atualiza automaticamente a Cloudflare.
3. O navegador não consegue obter uma atualização que a hospedagem ainda não publicou. Limpar cache ou Ctrl + F5 não substitui um deploy bem-sucedido.

## Correções implementadas

- `src/app.tsx` agora consulta `/alquimago/release.json` sem cache e usa o SHA publicado como chave `?v=<sha>` para carregar o mascote. Sem manifesto, recorre ao SHA do build ou a uma chave não persistente.
- `public/_headers` define revalidação de `release.json`, `config.json` e `alquimago.js` no Cloudflare Pages.
- `public/alquimago/verificar.html` compara manifesto, script e SHA Git Blob. É público, não depende de login e não lê dados privados.

## URLs para conferir cada hospedagem

**Cloudflare Pages (quando for esse o endereço utilizado):**

- Portfólio: https://portfolio-jordan.pages.dev/
- Diagnóstico: https://portfolio-jordan.pages.dev/alquimago/verificar.html
- Manifesto: https://portfolio-jordan.pages.dev/alquimago/release.json

**GitHub Pages:**

- Portfólio: https://jordanferrary.github.io/portfolio_jordan/
- Diagnóstico: https://jordanferrary.github.io/portfolio_jordan/alquimago/verificar.html
- Manifesto: https://jordanferrary.github.io/portfolio_jordan/alquimago/release.json

Se os manifestos mostrarem versões diferentes, os dois provedores não estão sincronizados. Se o diagnóstico não existir, o provedor ainda não publicou a alteração que o adicionou.

## Cloudflare Pages — configuração esperada

No **Dashboard Cloudflare → Workers & Pages → portfolio-jordan → Settings / Builds & deployments**, confira:

- Repositório conectado: `jordanferrary/portfolio_jordan` (e não `Meu_Portifolio`).
- Branch de produção: `main`.
- Root directory: raiz do repositório, sem subpasta.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Variável `GITHUB_PAGES`: **não** deve estar definida como `true` no Cloudflare Pages, pois o Vite muda o caminho base para `/portfolio_jordan/`.

Em **Deployments**, veja a última compilação de produção. Se houver falha, abra seus logs. Se o projeto não estiver ligado ao GitHub ou o deploy estiver desabilitado, conecte-o novamente ou execute um novo deploy pelo painel Cloudflare. Uma atualização do código no GitHub não consegue publicar no provedor externo sem essa conexão.

Na Cloudflare, configure `Build System Version` compatível com Node 22 e execute `npm run build`; o próprio `package.json` já contém Vite e TypeScript.

## Critérios para declarar a v0.9 publicada

O diagnóstico deve encontrar:
- Manifesto `0.9.0`;
- Script com `ALQUIMAGO v0.9.0`;
- Hash Git Blob igual ao `bundleBlobSha` do manifesto.

**Não declare deploy bem-sucedido apenas porque os commits aparecem no GitHub.** Os logs de build e os arquivos públicos precisam ser verificados.
