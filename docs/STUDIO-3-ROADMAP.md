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
- Compositor de páginas nativas por blocos, componentes vinculados e biblioteca de templates; migração sem perda de conteúdo.
- Override por página e componente, editor visual contextual, mais opções globais de ícones e materiais, sincronização da biblioteca de temas.
- SEO por rota, redirects e URLs canônicas; avaliar migração das rotas hash antes de prometer indexação individual.
- Auditoria de links externos, teste de responsividade real, métricas de desempenho e acessibilidade, telemetria consentida.
- Homologação de build, navegador desktop/mobile e publicação em ambiente de teste. Não confundir checagens de fonte com testes end-to-end.

O objetivo é autonomia sem editar código para operações comuns, mantendo o repositório como fonte de versão e recuperação. Nenhum dado privado deve ser colocado no manifesto público.
