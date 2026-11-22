# Auditoria de integridade do Local Studio

Escopo: revisão estática do código da versão de 22/11/2026, a partir da branch main. As mudanças foram projetadas para preservar a composição visual, os arquivos de mídia, os projetos e o conteúdo publicado. Esta auditoria não equivale a uma homologação de interface em navegador ou a um teste de penetração.

## Matriz de controles

| Área | Controle existente | Observação |
| --- | --- | --- |
| Home | Conteúdo, imagens, enquadramento, disponibilidade, especialidades, destaques | Nome do cartão ligado ao nome configurado em Sobre. |
| Portfólio | Projetos, blocos, categorias, capas, filtros, enquadramento, ordenação | Distribuição responsiva é código, não um editor de CSS arbitrário. |
| Sobre | Nome, biografia, fotografias, especialidades e títulos | Nome compartilhado com a Home. |
| Contato | Textos, redes, faixa de especialidades | Segunda linha e apresentação agora são opcionais. |
| Páginas personalizadas | Estrutura, banner, ícones, blocos, colunas, galeria, documentos | Visualizador direto quando não existe descrição ou ação válida. |
| Identidade | Sete cores, paleta independente da transição, símbolo, logo, favicon, SEO | Tipografia pública agora possui fontes e escalas globais. |
| Mídia | Importação, biblioteca, conversão, arquivos publicados, reprodução, modelos | Cores das obras e parâmetros próprios de materiais não são substituídos pelo tema. |
| Gestão | Rascunho local, exportação, importação, recuperação, publicação explícita | Importação agora acessível no menu geral; backup incompleto não é tratado como sucesso. |

## Correções

- Parâmetros tipográficos normalizados, aplicados ao vivo, restaurados ao cancelar e incluídos no manifesto publicado.
- Paleta aplicada a componentes antes omitidos: visualizador de imagens/PDF, biblioteca de ativos, mensagens do modelo 3D, botões de galeria e controles auxiliares do Studio.
- Captura do rascunho antes da publicação para não descartar alterações posteriores ao confirmar a nova implantação.
- Encerramento de edição fecha os editores; atalho não encerra durante o diálogo de publicação.
- Setters leem o estado local mais recente; callbacks da Home conservam os campos atualizados.
- Importação/exportação informa falha de mídia ausente.
- Testes de regressão adicionais em scripts/studio-integrity.test.mjs, incluídos em npm run test:studio.

## Limites e itens para homologação

- PIN local é uma conveniência de interface, não autenticação de servidor. A autorização GitHub continua necessária para publicar. Não confundir conteúdo não listado com conteúdo privado.
- Cores de estados (erro, sucesso, disponibilidade), PDF, imagens, texturas e materiais preservam significado ou aparência própria.
- Sete cores controlam as superfícies e textos principais, mas ainda há regras legadas e estados específicos; não há garantia de cobertura de todos os pixels. Testar paletas em cada rota e console/modal.
- Tipografia sem editor arbitrário de CSS. Textos de interface, nomes das rotas nativas, layout estrutural, traduções de sistema e comportamento de animações ainda são definidos em código. O editor de glitch controla sua paleta, não toda a sua lógica.
- Rascunhos de outra aba, importações concorrentes e versões antigas precisam de testes adicionais de conflito. Não exportar credenciais em backups.
- Validar a compilação TypeScript, npm run test:studio e as suites do package.json num checkout completo. Fazer uma rodada de desktop e mobile sem publicar dados de teste. Conferir a implantação Cloudflare e substituir o PIN local por autenticação real caso o Studio passe a proteger dados privados.

## Checklist visual

1. Editar cada página e conferir que o público não recebe os rascunhos.
2. Trocar a paleta por um preset não roxo, abrir os visualizadores, controles de mídia, menus, diálogos, editor de projetos e páginas personalizadas.
3. Alterar escalas e fontes, cancelar, salvar, recarregar, exportar e importar em ambiente de teste.
4. Abrir uma imagem, PDF e modelo 3D em desktop e celular, inspecionar zoom e mensagens de erro.
5. Validar publicação em ambiente autorizado, conflito de revisão, backup, URLs, foco por teclado e ausência de erros no console.
