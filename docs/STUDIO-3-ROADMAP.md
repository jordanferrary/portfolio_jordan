# Local Studio 3.0

## Primeira entrega
- Configuração versionável no manifesto público, com migração de configurações anteriores.
- Layout e materiais relativos ao design original, com parâmetros separados para desktop e telas menores.
- Transição de páginas glitch, fade e desativada, duração limitada e recuperação caso o evento CSS não seja disparado.
- Navegação nativa: ordem, rótulos, ícones e visibilidade; as páginas personalizadas continuam com seu próprio sistema de ordenação.
- Ativação de módulos da Home, player musical e rodapé das páginas personalizadas.
- Traduções manuais de frases em português e espanhol. O original é o conteúdo em inglês; o rascunho não usa tradução remota.
- Prévia do visitante usando o rascunho local, com saída explícita.
- Biblioteca local de até 30 temas; exportação e importação JSON de design, sem dados de conteúdo ou credenciais.
- Histórico de 30 alterações na sessão, com atalhos Ctrl/Cmd+Z, Ctrl/Cmd+Y e Ctrl/Cmd+Shift+Z fora de editores, sem prometer recuperação após recarregar, nem restauração de mídias apagadas.
- Diagnóstico de dados e referências locais e bloqueio de publicação em caso de erros detectados.

## Pendências de infraestrutura e arquitetura
- Autenticação de servidor e autorização por função com sessões verificadas; configurar provedor de identidade e proteger APIs. O PIN local não é autenticação real.
- Armazenamento privado, sincronização e checkpoints duráveis, ambientes de revisão e rollback, agendamento.
- Evoluir o compositor de páginas nativas para incluir todos os módulos nativos como blocos arrastáveis; modelos e vínculos básicos entregues.
- Expandir overrides e edição contextual para projetos e módulos fixos, mais opções globais de ícones e materiais, sincronização da biblioteca de temas.
- SEO por rota, redirects e URLs canônicas; avaliar migração das rotas hash antes de prometer indexação individual.
- Auditoria de links externos, teste de responsividade real, métricas de desempenho e acessibilidade, telemetria consentida.
- Homologação de build, navegador desktop/mobile e publicação em ambiente de teste. Não confundir checagens de fonte com testes end-to-end.

O objetivo é autonomia sem editar código para operações comuns, mantendo o repositório como fonte de versão e recuperação. Nenhum dado privado deve ser colocado no manifesto público.

## Segunda entrega
- Composições nativas opcionais baseadas nas páginas personalizadas, sem apagar os layouts anteriores.
- Propriedades de bloco e edição contextual, vínculos de um nível com fallback, biblioteca local de modelos.
- Checkpoints IndexedDB com mídia local referenciada, até cinco cópias de 100 MB; antes da publicação, importação e restauração da versão publicada. Se falhar, a operação exige confirmação explícita antes de continuar sem checkpoint.
- Entrada via sessão GitHub verificada quando VITE_ALQUIMAGO_AUTH_ORIGIN está configurado; PIN continua somente no modo local sem serviço. Publicação continua exigindo autorização explícita, sem reuso de tokens locais.
- Ainda exige configurar/verificar o Worker e suas variáveis no ambiente real. A interface local não é uma proteção para dados privados.

## Terceira entrega
- Reordenação dos módulos reais da Home por alças e setas, dentro dos grupos atuais.
- Propriedades individuais e edição contextual também nos blocos dos projetos.
- Sincronização manual de ZIP privado por R2 através do Worker de sessão existente. O bucket deve permanecer privado; o binding STUDIO_DRAFTS é opcional. Até 32 MB, controle de concorrência por revisão, confirmação de transferência, sem publicação automática.
- Para habilitar de verdade: configurar o Worker GitHub App conforme auth-worker/README.md, associar o bucket privado ao binding STUDIO_DRAFTS, implantar o Worker e definir VITE_ALQUIMAGO_AUTH_ORIGIN no build. Não colocar segredos no frontend.
- Múltiplos usuários, agendamento autônomo de publicação, estatísticas e sincronização automática continuam pendentes de infraestrutura, política de autorização e testes. Não confundir o painel de transferência com armazenamento já provisionado.

## Quarta entrega: fluxo de edição
- Favoritos e recentes locais na central, busca sem acentos, Ctrl/Cmd+K e Enter para abrir o primeiro resultado; acesso rápido ao histórico no desktop.
- Inspetor visual inicial para blocos de projetos e páginas personalizadas, inclusive composições nativas substituídas. Hierarquia, seleção no site, localização, duplicação, ordenação, propriedades e acesso ao editor de conteúdo.
- Propriedades compartilhadas: cantos, preenchimento, opacidade, borda, superfície Liquid Glass e controles existentes. Mantém a herança quando não há override. Salvar altera o rascunho; publicar continua explícito.
- O inspetor não controla ainda cada elemento interno dos módulos nativos, e não substitui a edição de mídia nem a publicação. Integração de backend e homologação completas continuam pendentes.
- Prévia temporária de propriedades no próprio bloco, sem gravar a cada ajuste; Ao fechar, a prévia é retirada. A prévia do visitante esconde também a barra do Studio. Novas instâncias vinculadas herdam a aparência da origem até receber um override explícito.

- Histórico recente também persistido em IndexedDB com limite de 30 registros e orçamento de 8 MB para os snapshots; recuperado somente quando o manifesto local e a revisão publicada coincidem. Caso o armazenamento falhe, o histórico permanece disponível apenas durante a sessão. Não substitui checkpoints de mídia nem sincroniza entre dispositivos.
- Diagnóstico: IDs duplicados em blocos e visibilidade desativada em ambos os dispositivos.

## Revisão de interface do Studio
- Central compacta, navegação única, favoritos e recentes separados, seleção de busca por setas, atalhos de inspeção e prévia na barra. Sem repetir cartões de categorias.
- Controles globais divididos entre geometria e Liquid Glass, com prévia ao lado em telas largas. Sobre e Contato divididos por seções sem descartar o rascunho ao alternar.
- Cabeçalhos e rodapés administrativos mais compactos, barra móvel de duas linhas; estilos restritos ao Studio. Homologação visual ainda necessária.
