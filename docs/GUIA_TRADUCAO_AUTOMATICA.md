# Idiomas e tradução automática — portfólio

## Comportamento

- O idioma base do portfólio é **inglês** (o conteúdo original continua intacto em `published-portfolio.json`).
- A primeira visita usa `navigator.languages` como escolha rápida, depois consulta **país aproximado do IP** em `https://ipwho.is/?fields=success,country_code`. Não há necessidade de cadastrar conta ou configurar Cloudflare.
- Brasil, Portugal e países de língua portuguesa usam **PT**; países hispanófonos usam **ES**; demais regiões usam **EN**. Este é o escopo inicial, não uma identificação infalível de língua materna.
- Escolher outro idioma no seletor **EN / PT / ES** ao lado das redes sociais grava uma preferência local. A preferência do visitante prevalece sobre a consulta por IP e continua valendo em visitas futuras.
- Sem API, sem rede ou com limite gratuito atingido: idioma do navegador e textos originais continuam funcionando; nenhuma página fica bloqueada.

## Arquitetura

- `src/lib/visitor-language.ts`: mapeamento país → idioma, fallback do navegador, cache do **código do país** por 7 dias, seleção manual persistente. **Não grava o IP**.
- `src/lib/visitor-phrases.ts`: traduções humanas, instaladas no bundle (sem requisição).
- `src/lib/public-page-translation.ts`: tradução dos nós de texto **públicos** da página, atualização em rotas React, cache de tradução. Não modifica os dados publicados nem a fonte original; atualiza apenas a visualização.
- `src/components/layout/language-switcher.tsx`: seletor compacto ao lado dos links sociais.
- `src/styles/visitor-language.css`: aparência baseada nas variáveis da paleta do Local Studio.
- `npm run test:visitor-language`: testes no GitHub Actions.

## Limites gratuitos

- **ipwho.is**: até **1.000 consultas/dia por domínio** na API gratuita; HTTPS e CORS permitem a chamada no navegador. Guardar o código do país por sete dias diminui o número de consultas. Se o limite acabar, o site usa a preferência do navegador.
- **MyMemory**: uso anônimo gratuito de até **5.000 caracteres por dia**, limite de **500 bytes por requisição**. Para não abusar, o projeto limita a tradução online a até **3.900 caracteres e 35 chamadas por dia por navegador**, aplica cache de 30 dias e divide textos maiores em pequenos segmentos. A franquia do provedor pode se esgotar antes desses limites; por isso **nem toda tradução dinâmica está garantida**. O código do site não contém chaves nem e-mails de API.
- O site não requer assinatura para tradução e continua hospedado no GitHub Pages.

## Privacidade, qualidade e direção de arte

A consulta `ipwho.is` recebe o IP de origem pela conexão de rede, como qualquer serviço externo. Do lado do portfólio só é persistido o **país**, não IP, cidade ou endereço. A consulta de tradução de conteúdo público é enviada ao serviço MyMemory; o código exclui `input`, `textarea`, ferramentas administrativas, campos editáveis, elementos de código, Alquimago e nomes próprios/artísticos. Nenhum token, memória privada, mensagem escrita em formulário ou rascunho do Studio deve passar por tradução.

Não é tradução jurídica/profissional e respostas automáticas podem ser imprecisas. Obras e nomes artísticos permanecem no idioma original para proteger sua identidade. Os textos estáticos de interface são revisados, e os novos textos do portfólio podem ser cadastrados no dicionário para não depender de serviços externos. A paleta, as interações, os dados e o conteúdo do portfólio não são modificados.

## Fontes oficiais

- https://ipwhois.io/documentation
- https://mymemory.translated.net/doc/usagelimits.php
- https://mymemory.translated.net/doc/spec.php
