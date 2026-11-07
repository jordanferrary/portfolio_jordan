# Local Studio — auditoria e critérios de teste

Este documento evita confundir **compilação**, **testes automatizados de integração/SSR** e **testes interativos no navegador**. Não declare que toda a experiência visual está aprovada apenas porque o GitHub Actions ficou verde.

## Automação adicionada

`npm run typecheck` — TypeScript de todo o projeto.

`npm run test:studio` — suíte de cenários Node/React SSR (sem instalar um novo framework). Exercita:
- Limites e aplicação de `coverFocus` (Home e galeria), posição da imagem e zoom;
- Normalização de HEX, preservação de paletas customizadas, contraste WCAG e atualização dos quatro tokens CSS;
- Etiquetas configuráveis do rodapé Contact: adicionar/remover, ordem, deduplicação e lista vazia;
- Renderização pública de Contact, incluindo ausência de etiquetas antigas removidas;
- Editor de Contact e controles básicos;
- Renderização de cartões destacados com enquadramento efetivo;
- Dados de páginas personalizadas, botão opcional e configurações do carrossel;
- Validação de links externos de vídeo e GLB/glTF;
- Renderização dos novos templates de galeria detalhada e carrossel dos projetos;
- Interface da paleta e controles de contraste;
- Curtidas: texto acessível e informação correta sobre contagem local.
 
`npm run build` — build Vite e nova checagem de tipos.

O pipeline de GitHub Pages roda os testes antes do deploy: falhas impedem publicar arquivos potencialmente quebrados.

## Checklist manual recomendado (Chrome desktop e Android)

| Ferramenta | Cenário e resultado esperado |
|---|---|
| Home | Alterar título, disponibilidade, especialidades, Focus e imagens; sair e voltar; confirmar rascunho persistente |
| Enquadramento de projeto | Ajustar capa, Home e banner; comparar os três previews com galeria, destaque da Home e página do projeto; mover e ampliar; confirmar hover preservando o ajuste |
| Projetos | Criar, renomear, duplicar se disponível, editar, reordenar e excluir com confirmação; testar imagem de capa obrigatória |
| Composição | Inserir cada template antes/depois; arrastar, usar setas e remover; testar textos ricos, imagens, antes/depois, vídeo e modelo 3D |
| Galeria com detalhes | Alternar grade simples/galeria interativa; cadastrar imagem, crédito, descrição e link; o painel deve começar fechado |
| Carrossel | Importar 2–5 slides; ajustar altura, intervalos, efeito e autoplay; testar zoom, pausa opcional e responsividade |
| Filtros | Criar filtro, escolher ícone/upload, atribuir ao projeto, filtrar galeria; remoção bloqueada quando houver projeto vinculado |
| Mídias locais | Adicionar imagem/áudio; conferir que itens em uso não podem ser excluídos; remover somente órfãos |
| Mídias publicadas | Consultar pastas sem token; selecionar arquivo sem uso, passar à publicação, conferir confirmação; **não realizar exclusão de teste com arquivos reais** |
| Conversor WebP | Testar JPG/PNG, tamanhos e qualidade; baixar e abrir resultado |
| Feedbacks | Adicionar apenas depoimento real; editar, remover e navegar no carrossel da Home |
| Curtidas | Curtir/descurtir, atualizar página e verificar persistência; sem backend, contagem é **somente local**, nunca total público |
| Músicas | Importar MP3 próprio, editar título/artista/capa, reproduzir/pausar, rearranjar e remover; alternar faixa |
| Redes sociais | Editar URL, rótulo e ícone; testar link em nova aba e ausência de links inválidos |
| Contato | Editar apresentação, redes e chips de especialidades no rodapé; remover um chip, adicionar outro, deixar lista vazia |
| Sobre | Editar texto, skills e imagens; conferir responsividade |
| Páginas personalizadas | Criar rota, mostrar/ocultar navbar, editar banner e blocos; testar botão copiar e link mesma/nova aba |
| Paleta | Selecionar presets e editar HEX/RGB pelo círculo; testar Home, Galeria, Projetos, Contact e páginas extras; conferir contraste e cancelamento sem salvar |
| Identidade | Trocar logo/hover, favicon, SEO e prévia social; conferir tamanho e retorno ao padrão |
| Backup ZIP | Exportar e importar em **ambiente de teste**, incluindo imagens de carrossel e galeria; verificar restauração |
| Publicação GitHub | Testar primeiro em rascunho controlado, conferir arquivos, conflito de revisão, limites de tamanho e deploy; token não deve persistir |

## Regressões já identificadas e corrigidas

1. `coverFocus` usado na galeria, mas **não** nos projetos destacados da Home; corrigido. CSS do tema sobrescrevia o zoom configurado com transformações de hover; corrigido.
2. Rodapé Contact `3D ART / CHARACTERS / ...` não era editável. Agora é `contact.footerTags`, com ordenação, edição, remoção e suporte a lista vazia.
3. As páginas extras e seus botões não acompanhavam totalmente os novos tons da paleta. Regras públicas de cores foram atualizadas para variáveis `--jf-*`.
4. A paleta agora calcula a razão de contraste de texto claro contra fundo e superfícies; alerta abaixo de 4,5:1.
5. Blocos de galeria detalhada e carrossel estavam previstos no tipo de projeto, mas não eram editáveis/publicáveis; foram conectados ao editor, renderizador e pipeline de mídia.
6. O botão Like tinha somente transição de estilo; agora há feedback de confirmação breve e modo `prefers-reduced-motion`.
7. O backup local omitia mídias dos slides de páginas personalizadas e das novas galerias/carrosséis de projetos; referências incluídas.

## Limites reais da auditoria

- O teste Node/SSR não simula ponteiros, arraste, pinça, canvas, autenticação GitHub, IndexedDB nem todas as proporções visuais. Testes manuais ou e2e com navegador continuam necessários para afirmar cobertura total.
- A paleta possui **quatro controles globais**; elementos da interface administrativa permanecem visualmente estáveis intencionalmente. A cor personalizada pode gerar contraste insuficiente e o usuário precisa avaliar o alerta.
- Links externos podem deixar de funcionar, bloquear carregamento ou mudar ao longo do tempo.
- Não publique nem exclua mídias reais apenas para testar; utilize dados artificiais e backup num ambiente separado.
