# Guia de desempenho e limites — portfólio Jordan Ferrary

> Diagnóstico realizado em 8 de novembro de 2026, antes das otimizações deste documento. Os valores variam conforme novas publicações.

## 1. O que está pesado?

A árvore atual do repositório tinha **210 arquivos e aproximadamente 49,2 MiB de conteúdo versionado na revisão analisada**. Destes, cerca de **40,7 MiB eram somente três arquivos de áudio** (um M4A e dois MP3), e cerca de **7,2 MiB eram imagens**. O repositório no GitHub informa aproximadamente 50 MB de armazenamento, mas o número da API não equivale necessariamente ao tamanho total da pasta `.git` no computador.

A compilação anterior registrou um pacote JavaScript inicial de cerca de 424 kB (130 kB gzip) e CSS global de 305 kB (60 kB gzip). O pacote independente do visualizador 3D/Three de ~705 kB já era separado e não é download obrigatório da Home. O Alquimago é carregado separadamente e tem um bundle próprio. Isso ajuda a distinguir *tamanho total do site* de *bytes carregados por uma visita*.

**Melhorias aplicadas**:
- O player agora só atribui uma URL ao elemento `<audio>` quando alguém solicita reprodução. Nenhum dos arquivos musicais de ~19 MiB é solicitado apenas por abrir o site.
- A galeria e as páginas de projeto saíram do JavaScript inicial e passam a ser importadas sob demanda por rota.
- Imagens secundárias passam a carregar com `loading="lazy"` e `decoding="async"` por padrão. Capa principal da Home, banner da galeria, logotipo e retrato em destaque continuam com prioridade apropriada.
- Os vídeos já exigem clique no poster antes de criar um iframe, e os modelos 3D exigem ativação antes de importar o visualizador. Esses comportamentos foram preservados.
- `npm run audit:size` agora inspeciona o conteúdo compilado de `dist/` e é executado automaticamente no workflow antes do deploy.

## 2. Limites oficiais (consultados em novembro de 2026)

- **GitHub Pages**: o repositório-fonte tem recomendação de **1 GB**; o site efetivamente publicado não deve ultrapassar **1 GB**; o tráfego do Pages tem limite *flexível* de **100 GB/mês**; um deploy expira se durar mais de **10 minutos**.
- **Repositórios Git**: GitHub recomenda, idealmente, **menos de 1 GB** e recomenda fortemente **menos de 5 GB** para saúde e desempenho. A documentação sobre limites estruturais também menciona um máximo recomendado de **10 GB para a pasta `.git`**; esses limites não significam que seja adequado usar o Pages até esse tamanho.
- **Arquivos no Git normal**: o GitHub avisa ao superar **50 MiB** e bloqueia objetos acima de **100 MiB**.
- **Git LFS não é compatível com a publicação GitHub Pages de forma direta**. Não adote LFS esperando que o Pages sirva os objetos como imagens e músicas automaticamente.
- **Git histórico**: substituir e excluir arquivos grandes na revisão atual não remove seus bytes das revisões antigas do repositório.

Referências oficiais:
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage

## 3. Minha política recomendada de mídia

| Elemento | Importação local é indicada? | Recomendação prática |
| --- | --- | --- |
| Capa de projeto / galeria | **Sim** | WebP ou AVIF; 1200–2000 px no maior lado, quando suficiente, com versões menores para cartões |
| Render de portfólio em alta qualidade | Sim, com variações | Preserve original no arquivo de trabalho e publique uma cópia WebP/AVIF sem perda perceptível; carregue a imagem maior apenas no detalhe |
| Miniaturas e ícones | Sim | WebP/SVG confiável; preferir dezenas de KiB |
| Vídeo demonstrativo | **Melhor hospedagem externa** | YouTube/Vimeo incorporado **após clique**; sem enviar MP4 grande para o repositório |
| Modelo 3D interativo | Depende do peso | GLB com texturas comprimidas; visualizador carregado após clique; considere hospedagem apropriada se muito grande |
| Música | Com cautela | Áudio próprio/autorizado compactado (MP3/AAC/Opus); preferir arquivo pequeno ou URL direta confiável em serviço apropriado para mídia |
| Links externos de imagens | Só fontes estáveis | Preferir imagens próprias, URL HTTPS direta e hospedagem com hotlink/CORS/termos compatíveis; não dependa de links provisórios de Pinterest ou arquivos privados |

### Áudio: principal oportunidade de redução

Os três áudios existentes são usados pela playlist publicada e por isso **não foram apagados**. Se o senhor tiver os originais e o direito de usá-los, gere versões comprimidas direcionadas à reprodução web. Dependendo da duração, um áudio em MP3/AAC a ~96–160 kbps pode ser muito menor que um arquivo original de alta taxa de bits. Teste ouvindo antes de publicar: qualidade sonora importa.

O player não baixa o áudio até o visitante tocar em **Play**. Isso reduz bastante o tráfego inicial, mas **não reduz os ~40,7 MiB armazenados no Pages**. Para reduzir o tamanho total do site, será preciso substituir as faixas por versões menores ou usar hospedagem de áudio com URLs diretas e licença adequada.

O Local Studio já permite **importar** arquivo de áudio ou informar **URL direta**. URLs de páginas de YouTube/Spotify não são arquivos de áudio; não use ferramentas para extrair áudio de serviços de streaming.

### Imagens: arquivos ou links?

Para seu trabalho autoral, prefira **importar versões otimizadas no Studio**: os links ficam sob seu controle, têm disponibilidade previsível e a pipeline já gera WebP e variações responsivas. Um link externo **não necessariamente é mais rápido**: o usuário ainda precisa baixar a imagem, só que de outro servidor. Serviços de imagem especializados com CDN podem ajudar, mas podem impor limites ou depender de custos.

Guarde arquivos enormes para entrega, backup ou impressão fora do Pages. Na página pública, exiba imagens adequadas à tela e envie versões maiores somente quando solicitadas pelo usuário.

### 3D

Não faça o navegador baixar uma cena inteira e o motor Three.js na página inicial. Mantenha *poster + botão de ativação*, como já está no portfólio. Reduza polígonos, use KTX2/Basis quando o visualizador suportar e considere Draco/Meshopt para malhas. Verifique compatibilidade antes de ativar compressão.

## 4. Monitoramento gratuito incorporado ao GitHub Actions

Execute após compilar:

```bash
npm run build
npm run audit:size
```

O comando mede todos os arquivos de `dist/` e a quantidade aproximada de JavaScript/CSS referenciada pelo HTML de entrada. Não exige servidor, assinatura ou plugin.

**Avisos**: site acima de 200 MiB; arquivo de áudio/vídeo/modelo acima de 8 MiB; imagem acima de 2 MiB; entrada HTML vinculada a mais de 750 KiB de JS+CSS não comprimidos.

**Barreiras de proteção**: publicação acima de 850 MiB; mídia individual acima de 65 MiB; imagem individual acima de 12 MiB; entrada HTML acima de 1,5 MiB de JS+CSS não comprimidos.

Os limites são **políticas do projeto**, não regras exatas do GitHub. Mesmo abaixo deles, teste desempenho real em um celular com rede lenta. **Um aviso não bloqueia o deploy; um erro bloqueia.**

## 5. Checklist rápido ao publicar uma nova obra

1. Exporte uma versão web da arte no Blender/ZBrush/Photoshop, mantendo o original em seu armazenamento próprio.
2. Converta para WebP/AVIF, escolha dimensão adequada; valide cores, nitidez e enquadramento.
3. Importe no Local Studio; deixe o gerador responsivo criar tamanhos menores.
4. Para vídeos, use incorporação com miniatura que exige clique.
5. Para 3D, tenha poster estático e não ative carregamento automático.
6. Para música, verifique direitos e arquivo compactado; observe o tamanho final.
7. Confira `npm run audit:size` no GitHub Actions.
8. Use **Gerenciar arquivos** para revisar mídias não referenciadas antes de excluí-las; confira cuidadosamente. Não reescreva o histórico Git sem planejamento e backup.

## 6. Quando trocar de hospedagem?

Um portfólio criativo **de apresentação de projetos** está alinhado ao propósito do GitHub Pages. O GitHub não permite usar o Pages como hospedagem gratuita de um negócio de comércio eletrônico ou serviço cujo foco principal seja realizar transações comerciais. Para uma plataforma com uploads de clientes, backend, vídeo em escala ou transações, projete uma hospedagem adequada.

Separar o código em dois repositórios facilita a manutenção, mas **não elimina** os limites de tamanho e tráfego do site publicado. Evite criar repositórios adicionais só para tentar contornar os limites.
