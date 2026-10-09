# Engine 2.0 — Especificação de integração para Claude

> Este arquivo deve ser entregue ao Claude junto com o repositório do site de criação de mapas que receberá a nova engine.

## Instrução principal para o Claude

Adapte os recursos descritos neste documento ao sistema de mapas já existente como uma **Engine 2.0**, mantendo a **Engine 1** disponível e funcional.

Não transforme a Engine 1 em Engine 2 por substituição direta. As duas versões devem coexistir, ser selecionáveis e possuir estados isolados. Projetos antigos devem continuar abrindo com a mesma engine e o mesmo comportamento que possuíam antes da implementação.

Antes de alterar código:

1. inspecione todo o repositório do site de destino;
2. identifique framework, roteamento, estado global, persistência, upload de arquivos, autenticação, componentes visuais, testes e processo de build;
3. localize a implementação atual da Engine 1 e registre seus contratos públicos;
4. identifique o modelo de projeto/mapa já salvo pelo site;
5. implemente a Engine 2 dentro dos padrões encontrados no projeto;
6. não introduza uma segunda stack, biblioteca de estado ou sistema visual sem necessidade comprovada;
7. não remova, renomeie ou altere silenciosamente contratos usados pela Engine 1.

Se algum nome técnico deste documento conflitar com a arquitetura real do site, preserve o comportamento especificado, mas adapte os nomes e a organização ao padrão do repositório.

## Resultado obrigatório

Ao final, o site deverá oferecer:

- Engine 1 preservada para projetos existentes;
- Engine 2.0 disponível para novos projetos e para migração opcional;
- escolha de engine na criação de um projeto;
- indicação visível da versão usada por cada projeto;
- carregamento da engine correta com base nos metadados do projeto;
- isolamento de dados, cache, mídia e estado de execução entre versões;
- migração explícita, validada e reversível por cópia;
- todos os recursos funcionais definidos neste documento para a Engine 2.0.

## Regras inegociáveis de coexistência

1. **Engine 1 não pode sofrer regressão.** Seus projetos, editor, visualizador, atalhos e dados salvos devem continuar funcionando.
2. **Nenhum projeto antigo pode ser migrado automaticamente.** Na ausência de metadado de versão, o projeto deve ser interpretado como Engine 1.
3. **A migração nunca deve sobrescrever o original.** Deve criar uma cópia em Engine 2.0, mantendo o projeto de origem intacto.
4. **A escolha da engine pertence ao projeto**, não a uma preferência global do navegador.
5. **Dados específicos da Engine 2 não devem ser gravados no namespace da Engine 1.**
6. **O runtime deve carregar apenas uma engine para cada instância de mapa.** Não devem existir listeners globais duplicados nem dois loops de renderização disputando o mesmo elemento.
7. **A interface deve informar a versão ativa** no editor e no modo de execução.
8. **Exportações devem declarar a versão do esquema.** Importações devem validar a versão antes de interpretar os dados.
9. **Uma falha na Engine 2 não pode impedir a abertura da lista de projetos nem de projetos da Engine 1.**
10. **Toda alteração de persistência deve possuir tratamento de erro e caminho de recuperação.**

## Descoberta obrigatória no repositório de destino

O Claude deve encontrar e documentar, antes da implementação:

- ponto de entrada da aplicação;
- rotas do criador, editor e visualizador de mapas;
- tipo usado para representar um projeto;
- tipo usado para representar uma cena ou mapa;
- mecanismo de salvamento automático;
- APIs de upload, remoção e resolução de mídia;
- autenticação e autorização do proprietário;
- componentes de modal, formulário, menu e notificação;
- sistema de atalhos de teclado;
- estratégia de histórico, desfazer e refazer, se existente;
- suíte de testes e comandos oficiais de validação;
- convenções para IDs, datas, erros e telemetria.

Não presuma que o site de destino usa HTML monolítico, `localStorage` ou `IndexedDB`. Esses mecanismos pertencem à implementação de referência. Quando o site já possuir banco de dados, armazenamento de objetos ou APIs próprias, eles devem ser usados.

## Modelo de versionamento

Todo projeto deve possuir metadados equivalentes a:

```ts
type EngineVersion = '1' | '2.0';

interface MapProject {
  id: string;
  name: string;
  engineVersion: EngineVersion;
  engineSchemaVersion: number;
  engineData: unknown;
  createdAt: string;
  updatedAt: string;
}
```

Regras de resolução:

```ts
function resolveEngineVersion(project: Partial<MapProject>): EngineVersion {
  // Compatibilidade: projetos anteriores à adoção deste campo pertencem à Engine 1.
  return project.engineVersion === '2.0' ? '2.0' : '1';
}
```

Versão da engine e versão do esquema são conceitos distintos:

- `engineVersion` escolhe a implementação de runtime;
- `engineSchemaVersion` permite evoluir o formato de dados dentro da mesma engine.

Nunca determine a engine analisando informalmente campos internos. Use o metadado e mantenha o fallback explícito para a Engine 1.

### Matriz de convivência

| Situação | Engine usada | Regra |
|---|---|---|
| Projeto antigo sem metadado | Engine 1 | fallback obrigatório |
| Projeto com `engineVersion: '1'` | Engine 1 | comportamento atual, sem adaptação implícita |
| Projeto com `engineVersion: '2.0'` | Engine 2.0 | habilita os recursos deste documento |
| Novo projeto | escolha do usuário | persistir a opção no momento da criação |
| Cópia migrada | Engine 2.0 | novo ID e origem preservada |
| Versão desconhecida | nenhuma | bloquear somente o projeto afetado e oferecer diagnóstico |

### Alteração de banco

A mudança deve ser aditiva. Conceitualmente:

```sql
ALTER TABLE map_projects ADD COLUMN engine_version VARCHAR(16);
ALTER TABLE map_projects ADD COLUMN engine_schema_version INTEGER;
```

Adapte o exemplo ao banco e ao ORM reais. Não execute SQL textual se o projeto utilizar migrações tipadas ou outro mecanismo.

Regras:

- registros antigos nulos devem resolver como Engine 1;
- novos registros devem sempre gravar uma versão explícita;
- o backend deve aceitar a Engine 1 durante toda a convivência;
- índices ou constraints devem ser adicionados apenas depois de verificar os dados existentes;
- o rollback da aplicação não pode tornar projetos Engine 1 ilegíveis;
- projetos Engine 2 não devem ser interpretados por código da Engine 1 em um rollback.

### Contratos de API

As respostas de listagem e detalhe devem expor, no mínimo:

```json
{
  "id": "project-id",
  "name": "Nome do projeto",
  "engineVersion": "2.0",
  "engineSchemaVersion": 1
}
```

Criação, duplicação, exportação, importação, publicação e migração devem preservar esses campos. O servidor deve rejeitar combinações desconhecidas com erro descritivo, sem aplicar fallback durante uma operação de escrita.

## Registro e adaptadores de engine

A integração deve possuir um ponto central de resolução. A forma exata deve seguir a stack do site, mas o contrato esperado é equivalente a:

```ts
interface EngineContext {
  projectId: string;
  mode: 'edit' | 'play' | 'preview';
  root: HTMLElement;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canUpload: boolean;
  };
  assets: AssetService;
  persistence: ProjectPersistence;
}

interface MapEngine<TData = unknown> {
  readonly version: EngineVersion;
  readonly schemaVersion: number;
  mount(context: EngineContext, data: TData): Promise<void> | void;
  unmount(): Promise<void> | void;
  validate(data: unknown): TData;
  serialize(): TData;
  save(): Promise<void>;
}

const engineRegistry = {
  '1': () => loadEngine1(),
  '2.0': () => loadEngine2()
};
```

Requisitos do ciclo de vida:

- `mount` não pode registrar listeners ou temporizadores duplicados;
- `unmount` deve remover listeners, cancelar timers, interromper áudio e vídeo, revogar URLs temporárias e liberar referências;
- a Engine 2 deve ser carregada sob demanda quando possível;
- componentes compartilhados podem ser reutilizados, mas estado mutável não pode vazar entre instâncias;
- trocar de projeto deve executar `unmount` antes de montar outra engine.

## Seleção de versão na interface

### Criação de projeto

O formulário de novo projeto deve apresentar duas opções claras:

- **Engine 1 — compatibilidade:** comportamento atual do site;
- **Engine 2.0 — recursos avançados:** recursos descritos neste documento.

A opção recomendada para novos projetos pode ser a Engine 2.0, mas a escolha precisa ser explícita e persistida no projeto.

### Lista e editor

- Mostrar um selo `Engine 1` ou `Engine 2.0` em cada projeto.
- Mostrar a versão ativa no cabeçalho do editor.
- Não exibir controles exclusivos da Engine 2 dentro de um projeto Engine 1.
- Não permitir trocar o campo de versão diretamente depois que o projeto tiver conteúdo.
- Para mudança de versão, oferecer exclusivamente o fluxo de migração por cópia.

### Rotas

Mantenha as rotas públicas já existentes. A versão deve ser resolvida depois que o projeto for carregado. Só crie rotas separadas se isso já for um padrão do site.

## Persistência e isolamento

A Engine 2 deve salvar um documento próprio, com formato equivalente a:

```ts
interface Engine2Document {
  schemaVersion: 1;
  settings: Engine2Settings;
  currentSceneId: string;
  navigationHistory: string[];
  scenes: Record<string, Scene2>;
  tokensByScene: Record<string, Token2[]>;
  transport: Transport2 | null;
  runtimeSnapshot?: RuntimeSnapshot2;
}
```

Se o site usar banco relacional, documentos podem ser normalizados em tabelas. Se usar documentos JSON, mantenha um agregado por projeto. Em ambos os casos:

- toda leitura deve ser filtrada por `projectId` e `engineVersion`;
- mídia deve pertencer ao projeto e possuir referência estável;
- remoções em cascata devem ocorrer em transação ou possuir compensação;
- salvamentos concorrentes devem evitar sobrescrever uma versão mais recente;
- alterações rápidas devem usar debounce ou a estratégia já existente no site;
- falhas de salvamento devem ficar visíveis ao usuário;
- a última versão confirmada não pode ser descartada em caso de erro.

Uma estratégia recomendada de concorrência é usar `revision`, `updatedAt` ou controle otimista equivalente.

## Serviço de arquivos

Não armazene Data URLs grandes diretamente no registro principal do projeto se o site possuir armazenamento de arquivos.

Contrato conceitual:

```ts
interface AssetReference {
  id: string;
  projectId: string;
  kind: 'image' | 'gif' | 'video' | 'audio';
  mimeType: string;
  size: number;
  url: string;
}

interface AssetService {
  upload(file: File, policy: AssetPolicy): Promise<AssetReference>;
  resolve(id: string): Promise<string>;
  remove(id: string): Promise<void>;
}
```

O serviço deve:

- validar MIME, extensão quando necessário e tamanho;
- gerar nomes seguros no servidor;
- impedir acesso entre projetos sem autorização;
- remover arquivos órfãos após exclusões confirmadas;
- não confiar apenas na validação do navegador;
- aceitar cancelamento de upload;
- expor progresso quando a infraestrutura existente permitir;
- interromper operações obsoletas quando o usuário substituir um arquivo.

## Migração da Engine 1 para a Engine 2.0

A migração é opcional e unilateral. Não é necessário converter um projeto Engine 2 de volta para Engine 1.

Fluxo obrigatório:

1. usuário escolhe **Criar cópia na Engine 2.0**;
2. sistema lê o projeto Engine 1 sem modificá-lo;
3. cria um rascunho de conversão em memória;
4. converte apenas os campos conhecidos;
5. apresenta resumo do que será preservado, adaptado ou ignorado;
6. valida integralmente o documento Engine 2 resultante;
7. cria um novo projeto com novo ID;
8. copia ou referencia arquivos conforme as regras de propriedade do armazenamento;
9. salva o projeto novo em uma operação atômica;
10. abre a cópia somente após a confirmação do salvamento.

O projeto original permanece intacto mesmo se qualquer etapa falhar.

Contrato recomendado:

```ts
interface MigrationReport {
  sourceProjectId: string;
  targetProjectId?: string;
  converted: string[];
  warnings: string[];
  ignored: string[];
  assetFailures: string[];
}

function migrateEngine1ToEngine2(
  source: Engine1Document
): Promise<{ document: Engine2Document; report: MigrationReport }>;
```

Se algum recurso da Engine 1 não possuir equivalente seguro, mantenha-o no original, registre-o em `ignored` e informe isso antes da confirmação.

## Separação entre editor e execução

A Engine 2 deve respeitar os modos do site:

### Modo de edição

- criar, conectar e remover cenas;
- posicionar marcadores e tokens;
- configurar eventos, entidades, áudio, mídia e efeitos;
- editar propriedades e limites;
- salvar alterações estruturais;
- acessar migração, exportação e configurações.

### Modo de execução

- navegar entre cenas;
- mover e selecionar tokens conforme permissões;
- acionar eventos;
- executar descoberta por proximidade;
- reproduzir mídia e áudio;
- aplicar efeitos ambientais;
- usar o sistema de turnos.

### Modo de prévia

- usar dados ainda não publicados sem alterar o projeto publicado;
- evitar ações destrutivas permanentes;
- restaurar o estado ao sair quando essa for a convenção do site.

Não use permissões apenas para esconder botões. Toda operação de escrita também deve ser autorizada no serviço ou backend correspondente.

## Estratégia de implementação

Implemente em etapas pequenas e verificáveis.

### Etapa 1 — inventário e contratos

- mapear arquitetura existente;
- registrar comportamento da Engine 1;
- adicionar testes de caracterização nos fluxos críticos da Engine 1;
- definir tipos compartilhados de versão e contexto.

### Etapa 2 — infraestrutura de versões

- adicionar `engineVersion` e `engineSchemaVersion`;
- implementar fallback de projetos antigos para Engine 1;
- criar registro/carregador de engines;
- adicionar seletor na criação e selo na listagem;
- garantir montagem e desmontagem isoladas.

### Etapa 3 — núcleo da Engine 2

- implementar modelo de cenas e coordenadas percentuais;
- implementar renderização, histórico e conexões;
- implementar tokens, seleção, arraste e atalhos;
- conectar persistência e arquivos do site.

### Etapa 4 — recursos avançados de mapa

- eventos com mídia e áudio;
- entidades com proximidade e áudio periódico;
- efeitos ambientais, grade e iluminação;
- transporte coletivo temporizado;
- criação em lote e remoção segura de cenas.

### Etapa 5 — sistema de turnos

- cadastro de equipes e entidades;
- ataques, itens, habilidade e fórmulas;
- fila, ações, automação e encerramento;
- mídia e áudio em tela cheia;
- importação e exportação versionadas.

### Etapa 6 — migração e endurecimento

- implementar migração por cópia;
- concluir validações de backend;
- adicionar testes de integração e ponta a ponta;
- verificar acessibilidade, responsividade e desempenho;
- documentar implantação e rollback.

Cada etapa deve manter o build utilizável. Não concentre toda a mudança em uma única substituição de arquivos.

## Testes mínimos obrigatórios

### Compatibilidade da Engine 1

- projeto antigo sem `engineVersion` abre na Engine 1;
- projeto marcado como Engine 1 continua editável e executável;
- criar uma Engine 2 não altera dados da Engine 1;
- falha ao carregar a Engine 2 não impede abrir Engine 1;
- listeners da Engine 1 não são duplicados ao alternar projetos.

### Versionamento

- novo projeto salva a versão escolhida;
- selo da lista corresponde ao metadado salvo;
- runtime correto é selecionado após recarregar a página;
- valor de versão desconhecido gera erro controlado e não grava dados;
- exportação e importação preservam versão e esquema.

### Migração

- migração cria um novo ID;
- original permanece byte a byte inalterado em seus dados de engine;
- falha de arquivo cancela ou sinaliza a conversão sem corromper o original;
- referências entre cenas continuam válidas;
- posições percentuais permanecem dentro de 0 a 100;
- relatório apresenta perdas e avisos.

### Ciclo de vida

- montar e desmontar repetidamente não aumenta o número de listeners;
- áudio e vídeo param ao trocar de projeto;
- timers são cancelados no `unmount`;
- URLs temporárias são revogadas;
- nenhum estado de uma instância aparece em outra.

### Funcionalidade da Engine 2

- criar, conectar, abrir e remover cenas;
- remover uma conexão sem remover o destino;
- criar múltiplos tokens em uma operação;
- selecionar e mover grupos;
- persistir posição, rotação, escala e orientação;
- acionar evento visual e sonoro com duração configurada;
- revelar entidade pela distância configurada;
- interromper áudio após descoberta;
- exigir nova tentativa do transporte após dois minutos de movimento;
- renderizar sua fonte de luz com metade do alcance padrão;
- executar turnos e validar fórmulas;
- abrir mídia de ação em tela cheia e fechá-la com `Esc`;
- interromper áudio no tempo configurado;
- exportar e importar dados válidos;
- rejeitar mídia, números e documentos fora dos limites.

## Critérios de aceite da integração

A implementação só estará concluída quando:

- todas as regras inegociáveis forem atendidas;
- projetos existentes abrirem sem migração ou alteração automática;
- as duas engines puderem ser usadas na mesma conta e na mesma implantação;
- a versão ativa for visível e persistente;
- o fluxo de criação permitir escolher a versão;
- a migração gerar uma cópia e um relatório;
- todos os recursos da Engine 2 descritos abaixo estiverem integrados ao site;
- dados e arquivos forem salvos pelos serviços oficiais do site;
- desmontagem não deixar mídia, timer ou listener ativo;
- testes existentes e novos passarem;
- build, lint e checagem de tipos passarem quando existirem no repositório;
- não houver erros no console nos fluxos principais;
- documentação de uso e manutenção estiver atualizada.

## Formato esperado da resposta do Claude

Ao trabalhar com este documento, o Claude deve:

1. apresentar um resumo curto da arquitetura encontrada;
2. listar os arquivos que serão alterados ou criados;
3. apontar riscos de compatibilidade antes de mudanças estruturais;
4. implementar o trabalho, não apenas sugerir código;
5. executar os comandos oficiais de validação do repositório;
6. informar testes realizados e seus resultados;
7. separar limitações reais de itens concluídos;
8. não declarar conclusão enquanto algum critério obrigatório estiver pendente.

## 1. Objetivo

A Engine 2.0 deve acrescentar ao site dois ambientes integrados:

1. um mapa visual navegável, com cenas conectadas, tokens, eventos, mídia e efeitos ambientais;
2. um sistema de combate por turnos, com cadastro de entidades, ataques, equipamentos, habilidades, automação e importação/exportação.

As seções seguintes definem o comportamento funcional de referência da Engine 2.0. Dados narrativos, nomes próprios, mapas, personagens e demais conteúdos de uma aplicação específica foram omitidos.

## 2. Características gerais

- Execução interativa no navegador, integrada à stack do site existente.
- Implementação orientada aos componentes, serviços e convenções já adotados pelo site.
- A implementação de referência em HTML, CSS e JavaScript puro deve ser tratada como fonte de comportamento, não como arquitetura obrigatória.
- Interface responsiva para desktop e telas menores.
- Persistência por meio da camada oficial do site; armazenamento local pode ser usado apenas como cache ou fallback quando já fizer parte da arquitetura.
- Suporte a imagens, GIFs, vídeos e áudios enviados pelo usuário.
- Interface principal com abas acessíveis por mouse e teclado.
- Isolamento de ciclo de vida e estado entre Engine 1 e Engine 2.0.
- Integração com autenticação, persistência e armazenamento de arquivos já existentes.

## 3. Arquitetura

```text
Site de criação de mapas
├── Registro de engines
│   ├── Engine 1 (preservada)
│   └── Engine 2.0 (nova)
└── Projeto Engine 2.0
    ├── Editor de mapa
    │   ├── grafo de cenas
    │   ├── tokens e seleção
    │   ├── eventos e mídia
    │   ├── entidades de oposição
    │   ├── efeitos ambientais
    │   ├── transporte coletivo
    │   └── persistência versionada
    └── Sistema de turnos
        ├── cadastro de entidades
        ├── fila de turnos
        ├── resolução de ações
        ├── mídia de ataques
        ├── automação de oponentes
        └── persistência e intercâmbio em JSON
```

Mapa e sistema de turnos podem compartilhar entidades por meio de um serviço de domínio do site, desde que o acoplamento seja explícito e versionado. Não use variáveis globais nem acesso direto entre componentes como mecanismo de sincronização.

## 4. Integração com a interface do site

A Engine 2 deve parecer parte nativa do site, usando o mesmo layout, componentes, tokens visuais, sistema de formulários e padrões de navegação.

### Comportamento

- Separar as áreas de mapa e sistema de turnos por abas, painéis ou rotas conforme o padrão existente.
- Carregar recursos pesados sob demanda.
- Preservar o estado de edição ao alternar painéis, desde que isso não conflite com o ciclo de vida da rota.
- Refletir o painel ativo na URL quando o roteamento do site oferecer esse recurso.
- Aceitar navegação por teclado e manter foco visível.
- Disponibilizar tela cheia para o modo de execução.
- Reutilizar os mecanismos existentes de permissão, notificação, confirmação e tratamento de erro.

## 5. Engine de mapa

### 5.1 Modelo espacial

O mapa é composto por cenas organizadas como um grafo. Cada cena pode apontar para qualquer outra cena por meio de marcadores interativos.

As posições são armazenadas em porcentagens, permitindo que tokens e marcadores acompanhem o redimensionamento da área visual.

Modelo conceitual de uma cena:

```json
{
  "id": "scene_id",
  "name": "Nome da cena",
  "imgBaseName": "referencia-da-imagem",
  "imgNightName": "referencia-opcional",
  "imgBlackoutName": "referencia-opcional",
  "customScenario": true,
  "hotspots": []
}
```

### 5.2 Navegação entre cenas

- Um marcador pode abrir outra cena.
- O histórico de navegação guarda até 50 entradas.
- É possível voltar à cena anterior.
- Cenas podem ser criadas durante o uso.
- Uma cena nova recebe imagem própria e um marcador na cena de origem.
- Também é possível criar apenas uma conexão com uma cena já existente.
- Uma conexão pode ser removida sem remover a cena de destino.
- A remoção de uma cena criada pelo usuário é recursiva para suas cenas filhas.
- Ao remover uma árvore de cenas, tokens, eventos, entidades e arquivos associados são removidos junto com ela.

### 5.3 Marcadores

Existem três níveis visuais de marcador:

| Estado | Comportamento visual |
|---|---|
| Visível | marcador destacado e animado |
| Semivisível | marcador discreto |
| Invisível | marcador sem indicação visual |

Os principais tipos são:

- navegação comum;
- conexão entre cenas;
- evento acionável;
- entidade de oposição.

### 5.4 Tokens controláveis

Cada token possui, no mínimo:

```json
{
  "id": 1,
  "name": "Entidade",
  "emoji": "símbolo",
  "gif": "referencia-opcional",
  "rx": 50,
  "ry": 50,
  "rot": 0,
  "scale": 1,
  "flipped": false,
  "lightOn": true
}
```

Recursos disponíveis:

- criação individual ou em lote;
- até 20 tokens por operação de criação em lote;
- nome, símbolo e GIF individuais;
- distribuição automática ao redor do ponto escolhido, evitando sobreposição direta;
- movimentação individual ou em grupo por arraste;
- seleção adicional com `Shift`;
- seleção em área por caixa de arraste;
- copiar e colar tokens com deslocamento de posição;
- renomear com duplo clique;
- rotacionar em passos de 15 graus com a roda do mouse;
- redimensionar com `Ctrl + roda do mouse`;
- espelhar horizontalmente com as setas laterais;
- excluir a seleção pelo teclado;
- ligar ou desligar a fonte de luz individual;
- persistência de posição, escala, rotação, orientação e iluminação.

### 5.5 Ferramentas sobre o mapa

- Ping visual temporário com `Shift + clique`.
- Régua com `Alt + arrastar`.
- Distância apresentada em metros e pés.
- Grade responsiva desenhada em `canvas`.
- Célula-alvo aproximada de 35 pixels.
- Escala da régua baseada em 1,5 metro por célula.

### 5.6 Efeitos ambientais

O ambiente suporta estados independentes e persistentes:

- alternância entre variantes clara e escura da imagem;
- blackout;
- neblina animada;
- sobreposição de monitoramento com relógio em tempo real;
- grade de referência.

O comando de restauração do ambiente desativa o blackout e retorna à variante clara.

### 5.7 Blackout e fontes de luz

O blackout é renderizado em um `canvas` sobre o mapa.

- A tela recebe uma camada preta quase opaca.
- Cada token com luz ativa recorta um cone dessa camada.
- O cone acompanha posição e rotação.
- A abertura do cone é de aproximadamente 60 graus.
- O alcance padrão de um token é 280 pixels.
- A entidade de transporte também produz luz quando está habilitada para movimento.
- O alcance dessa luz é 140 pixels, ou 50% do alcance padrão.
- Entidades de oposição fora dos cones de luz deixam de ser visíveis e interativas durante o blackout.

### 5.8 Eventos

Um evento pode conter:

- título;
- posição;
- nível de visibilidade do marcador;
- imagem, GIF ou vídeo opcional;
- áudio opcional;
- duração configurável do áudio.

Comportamento:

- o evento é acionado por interação explícita com seu marcador;
- a mídia é exibida em um visualizador próprio;
- vídeos tentam iniciar automaticamente e sem som;
- o áudio começa junto com o acionamento;
- o áudio é interrompido ao atingir a duração configurada;
- fechar o evento também encerra sua reprodução;
- o evento pode ser removido pelo operador.

Limites atuais:

- imagens estáticas: 8 MB;
- GIF, MP4 ou WebM: 20 MB;
- áudio MP3, WAV, OGG, M4A ou AAC: 20 MB;
- duração de áudio: entre 0,5 e 600 segundos.

### 5.9 Entidades de oposição

Uma entidade adicionada ao mapa pode conter:

- nome;
- imagem, GIF ou vídeo;
- posição e tamanho;
- rotação e espelhamento;
- áudio de presença;
- intervalo entre reproduções;
- distância individual de detecção;
- estado de descoberta;
- estado ativo ou removido.

O sistema de proximidade pode ser ativado ou desativado globalmente pelo operador.

Quando ativado:

1. a distância entre cada token e a entidade é calculada no espaço percentual do mapa;
2. a entidade permanece oculta até algum token entrar no raio configurado;
3. a descoberta é registrada permanentemente;
4. o áudio de presença é encerrado assim que ocorre a descoberta.

O áudio de presença:

- só é executado quando há tokens na cena atual;
- começa enquanto a entidade ainda não foi descoberta;
- toca uma vez e aguarda o intervalo configurado;
- repete esse ciclo enquanto as condições permanecerem válidas;
- para ao sair da cena, descobrir, desativar ou remover a entidade.

Limites atuais:

- distância de detecção: 1% a 100% do mapa;
- intervalo de áudio: 1 a 600 segundos;
- áudio: até 20 MB;
- GIF: até 8 MB;
- demais imagens e vídeos desse cadastro: até 3 MB.

### 5.10 Transporte coletivo

A engine contém uma entidade móvel capaz de agrupar todos os tokens da cena.

Fluxo:

1. os tokens são copiados para o estado interno do transporte;
2. os tokens individuais deixam temporariamente a cena;
3. uma tentativa aleatória habilita ou não o movimento;
4. a chance atual de sucesso é de 30%;
5. em caso de falha, é possível tentar novamente ou cancelar;
6. em caso de sucesso, a entidade pode ser arrastada pelo mapa;
7. após 2 minutos, uma nova tentativa é exigida para continuar o movimento;
8. ao remover ou cancelar o transporte, todos os tokens retornam à posição atual dele.

Durante o movimento, sua orientação de luz acompanha a direção do arraste.

### 5.11 Persistência do mapa

O estado estrutural deve ser serializado pela camada de persistência do site, sempre com `engineVersion` e `engineSchemaVersion`. A gravação em `localStorage` pertence apenas à implementação de referência e não deve substituir o banco oficial do site.

São persistidos:

- cena atual;
- histórico de navegação;
- tokens por cena;
- contador de IDs;
- cenas criadas pelo usuário;
- conexões entre cenas;
- eventos;
- entidades de oposição;
- estado do transporte;
- alternâncias ambientais;
- configuração global de proximidade.

Na implementação de referência, arquivos grandes ficam como `Blob` no `IndexedDB`, com referências no formato:

```text
idb-asset:<identificador>
```

No site de destino, use o serviço oficial de arquivos. URLs temporárias criadas no navegador devem ser revogadas ao substituir arquivos, remover dados ou desmontar a engine.

## 6. Engine de combate

### 6.1 Capacidade e equipes

- Até 12 entidades no total.
- Até 6 entidades por equipe.
- A edição fica bloqueada durante um combate ativo.
- Cada entidade recebe um UUID.

Modelo conceitual:

```json
{
  "id": "uuid",
  "name": "Entidade",
  "team": "allies",
  "maxHp": 100,
  "hp": 100,
  "atk": 20,
  "def": 5,
  "turnOrder": 1,
  "sanity": 10,
  "items": [],
  "ability": {},
  "image": "",
  "backImage": "",
  "attacks": [],
  "guard": false,
  "heals": 3,
  "remaining": {},
  "fled": false
}
```

### 6.2 Aparência

Cada entidade pode ter:

- mídia frontal;
- mídia alternativa usada por uma das equipes;
- imagem PNG, JPEG ou WebP;
- GIF animado;
- vídeo MP4 ou WebM.

Sem mídia personalizada, a interface usa uma representação vetorial padrão.

Limites:

- imagens e GIFs: 8 MB;
- vídeos: 20 MB.

### 6.3 Ataques

Cada entidade deve possuir entre 1 e 6 ataques.

Campos de um ataque:

```json
{
  "id": "uuid",
  "name": "Ação ofensiva",
  "type": "physical",
  "power": 100,
  "accuracy": 100,
  "uses": 0,
  "media": "",
  "mediaType": "",
  "mediaDuration": 2,
  "audio": "",
  "audioType": "",
  "audioDuration": 3
}
```

Regras de validação:

- nome com até 30 caracteres;
- potência entre 10% e 300%;
- precisão entre 1% e 100%;
- usos entre 0 e 99;
- zero usos representa quantidade ilimitada;
- duração de imagem entre 0,2 e 60 segundos;
- duração de áudio entre 0,2 e 600 segundos.

Tipos de ataque:

| Tipo | Defesa aplicada |
|---|---:|
| `physical` | 100% da defesa total |
| `arcane` | 50% da defesa total |
| `piercing` | ignora a defesa |

### 6.4 Fórmula de dano

```text
dano_base = ataque × potência / 100
variação = número aleatório entre 0,85 e 1,15
crítico = 1,5 quando ativado; caso contrário, 1

dano = arredondar(
  dano_base × variação × crítico
  + bônus_de_dano
  - defesa_aplicável
)

dano mínimo = 1
```

- A chance padrão de crítico é 10%.
- Defender reduz pela metade o próximo dano recebido, mantendo o mínimo de 1.
- A defesa é consumida no próximo acerto.
- O dano nunca reduz os pontos atuais abaixo de zero.

### 6.5 Turnos

A engine oferece dois modos:

1. ordem personalizada, crescente pelo campo `turnOrder`;
2. alternância entre as duas equipes, respeitando a ordem de cadastro.

O sistema:

- ignora entidades sem pontos ou que tenham saído do combate;
- seleciona automaticamente um alvo válido ao iniciar cada turno;
- incrementa a rodada ao retornar ao início da fila;
- termina quando uma equipe não possui participantes ativos;
- diferencia encerramento por derrota e por retirada;
- registra até 60 mensagens recentes no histórico.

### 6.6 Ações

#### Atacar

- Verifica usos restantes, alvo, equipe e precisão.
- Aplica dano conforme o tipo de ataque.
- Consome um uso quando o ataque é limitado.
- Executa mídia e áudio associados.

#### Defender

- Marca a entidade para reduzir pela metade o próximo dano recebido.

#### Recuperar

- Recupera 25% dos pontos máximos, arredondados para cima.
- Nunca ultrapassa o máximo.
- Cada entidade possui três usos por combate.

#### Sair

- Remove a entidade dos turnos seguintes sem zerar seus pontos.

### 6.7 Regras condicionais

- Atributo mental abaixo de 4: uma equipe controlada pelo usuário possui 50% de chance de falhar antes da resolução do ataque.
- Entidade automatizada abaixo de 50% dos pontos: realiza um ataque adicional garantido contra um alvo aleatório.
- Esse ataque adicional não recebe crítico.

### 6.8 Automação de oponentes

Quando habilitada, a automação age cerca de 900 ms após o início do turno.

- Escolhe alvos entre os maiores valores de ataque total ou defesa total.
- Em caso de empate, escolhe aleatoriamente entre os candidatos.
- Usa apenas ataques com usos disponíveis.
- Em condição especial, escolhe um ataque disponível aleatoriamente.
- Se não houver ataque disponível e houver recuperação, tenta recuperar.
- Caso contrário, defende.

A automação pode ser ligada ou desligada durante a execução.

### 6.9 Equipamentos e habilidade

Cada entidade aceita até 8 equipamentos.

Um equipamento possui:

- nome com até 40 caracteres;
- bônus de dano ou defesa;
- valor entre 0 e 999;
- estado equipado ou não equipado.

Há também uma habilidade descritiva única:

- texto com até 240 caracteres;
- bônus de dano ou defesa;
- valor entre 0 e 999.

Os bônus de equipamentos equipados e da habilidade são somados aos atributos correspondentes.

### 6.10 Mídia e áudio de ataques

Um ataque pode exibir uma imagem, GIF ou vídeo em tela cheia.

- Imagens usam a duração configurada.
- GIFs usam a duração estimada a partir dos quadros do arquivo.
- Vídeos usam a duração real informada pelos metadados.
- Há um temporizador de segurança quando os metadados não ficam disponíveis.
- A sobreposição pode ser fechada pelo botão ou pela tecla `Esc`.
- Fechar a mídia também pode interromper o áudio associado.

O áudio do ataque:

- aceita MP3, WAV, OGG, M4A e AAC;
- tem limite de 20 MB;
- toca em repetição durante a janela configurada;
- é interrompido ao atingir a duração ou ao fechar a apresentação.

### 6.11 Apresentação

- Campo visual separado por equipes.
- Indicador da entidade ativa e do alvo atual.
- Barra de pontos e estado de defesa.
- Pop-up animado de dano.
- Fila de turnos.
- Histórico das ações.
- Opção para ocultar os pontos da equipe automatizada.
- Modo imersivo e Fullscreen API.
- Opção de entrar em tela cheia ao iniciar.
- Layout adaptativo para diferentes larguras e alturas.
- Respeito a `prefers-reduced-motion`.

### 6.12 Persistência e intercâmbio

O cadastro da implementação de referência usa esquema de dados versão 6. Na integração, esse formato deve ser convertido para o esquema interno versionado da Engine 2 sem reutilizar o namespace da Engine 1.

Persistência no site de destino:

1. salvar pelo repositório ou API oficial do site;
2. confirmar a revisão persistida antes de informar sucesso;
3. usar cache local somente se esse comportamento já existir no produto;
4. informar falhas e preservar a última revisão confirmada.

O salvamento preserva o cadastro e as configurações, mas normaliza estados temporários:

- pontos retornam ao máximo;
- defesa temporária é removida;
- recuperações voltam a três;
- usos restantes são recalculados ao iniciar;
- estado de saída é removido.

Importação e exportação:

- formato JSON;
- arquivo exportado com indentação legível;
- validação completa antes de substituir o cadastro atual;
- limite de 150 MB para o arquivo importado;
- imagens, vídeos e áudios são transportados como Data URLs;
- IDs são regenerados durante a importação;
- configurações compatíveis também são restauradas.

## 7. Validação e segurança

A engine aplica:

- validação de tipo MIME;
- validação alternativa por extensão em formatos de áudio selecionados;
- limites de tamanho antes da leitura;
- limites numéricos e de quantidade;
- escape de texto ao gerar cartões por HTML;
- validação integral do JSON antes da troca do estado atual;
- cancelamento lógico de leituras assíncronas antigas por contadores de versão;
- limpeza de temporizadores, elementos de áudio e URLs temporárias.

As mesmas validações devem ser repetidas no backend quando houver upload ou persistência remota. O cliente não deve enviar arquivos antes de uma ação explícita do usuário.

## 8. Controles principais

### Mapa

| Entrada | Resultado |
|---|---|
| Clique e arraste no fundo | seleção em área |
| `Shift + clique` | ping temporário |
| `Alt + arrastar` | régua |
| Arrastar token selecionado | move toda a seleção |
| Roda sobre token | gira em 15 graus |
| `Ctrl + roda` | altera o tamanho |
| Duplo clique no token | renomeia |
| Setas laterais | espelha a seleção |
| `Ctrl+C` / `Ctrl+V` | copia e cola tokens |
| `Delete` ou `Backspace` | remove a seleção ativa |
| `T` | alterna a variante de iluminação |
| `H` | alterna a grade |
| `R` | restaura a variante clara |
| `Esc` | fecha menus e modais |

### Combate

| Entrada | Resultado |
|---|---|
| Clique em oponente | seleciona o alvo |
| Clique em uma ação | executa a ação no turno atual |
| `Esc` com mídia aberta | fecha a mídia e encerra o áudio |
| `Esc` no modo imersivo | sai da visualização em tela cheia |
| Setas, `Home` e `End` nas abas | navegação acessível entre painéis |

## 9. Restrições e decisões pendentes

O Claude deve resolver estes itens conforme a infraestrutura encontrada, sem inventar capacidades que o site não possui:

- suporte ou não a colaboração em tempo real;
- estratégia de bloqueio ou fusão de edições concorrentes;
- limite de armazenamento por conta e por projeto;
- retenção e remoção de arquivos órfãos;
- restauração do estado de execução após recarregar a página;
- sincronização opcional de entidades entre mapa e turnos;
- política de publicação entre rascunho e versão acessível aos participantes;
- telemetria e registro de erros;
- limites impostos pelo provedor de arquivos.

Reprodução automática de áudio continuará dependente de uma interação aceita pelo navegador. O desempenho também variará conforme dispositivo, quantidade de entidades e mídias carregadas.

## 10. Requisitos de execução

- Suportar os mesmos navegadores oficialmente atendidos pelo site.
- Preservar a política atual de compatibilidade JavaScript e CSS.
- Usar Canvas 2D ou a camada gráfica já adotada para grade e iluminação.
- Usar Fullscreen API quando disponível, com alternativa visual quando indisponível.
- Validar disponibilidade de codecs para as mídias aceitas.
- Respeitar CSP, CORS, URLs assinadas e demais regras de segurança do site.
- Não depender do protocolo `file://` nem de caminhos locais do protótipo.
- Não embutir segredos, chaves ou URLs privadas no cliente.

## 11. Escopo funcional da Engine 2.0

A Engine 2.0 estará funcionalmente completa quando entregar este fluxo:

1. abrir ou criar cenas;
2. conectar cenas e navegar entre elas;
3. posicionar e controlar múltiplos tokens;
4. configurar eventos, entidades, mídia e áudio;
5. aplicar efeitos ambientais e descoberta por proximidade;
6. montar duas equipes com atributos, ataques, itens e habilidades;
7. executar turnos manualmente ou com automação parcial;
8. salvar pela camada oficial do site e transportar o cadastro por JSON versionado.

Esse fluxo deve ser entregue sem remover a Engine 1 e usando a infraestrutura real do site de criação de mapas.
