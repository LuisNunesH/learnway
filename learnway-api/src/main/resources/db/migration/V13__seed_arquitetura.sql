-- =====================================================================
-- LearnWay — seed "Arquitetura & Microservices"
--   * 3 subtopics encadeados: Fundamentos de Microservices ->
--     Resiliência & Observabilidade -> Dados Distribuídos
--   * 6 lessons com teoria completa
--   * 12 questões: MULTIPLE_CHOICE e DESCRIPTIVE
-- Convenção de UUIDs (mesma do V5/V9/V10): sufixo determinístico
--   subtopic  a2…0000000005SS      lesson    a3…000000 05 SS LL
--   question  a4…0000 05 SS LL QQ  option    a5…00 05 SS LL QQ OO
--   descr.    a7…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000501', 'a1000000-0000-0000-0000-000000000005', 'fundamentos-microservices', 'Monólito & Microservices',      'Trade-offs, comunicação entre serviços e API Gateway.',            1, NULL),
 ('a2000000-0000-0000-0000-000000000502', 'a1000000-0000-0000-0000-000000000005', 'resiliencia-observabilidade','Resiliência & Observabilidade', 'Circuit breaker, retry, timeout, logs, métricas e tracing.',       2, 'a2000000-0000-0000-0000-000000000501'),
 ('a2000000-0000-0000-0000-000000000503', 'a1000000-0000-0000-0000-000000000005', 'dados-distribuidos',        'Dados Distribuídos',            'Saga, consistência eventual, CQRS e Event Sourcing.',              3, 'a2000000-0000-0000-0000-000000000502');

-- ─── LESSONS: Fundamentos ────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000050101', 'a2000000-0000-0000-0000-000000000501', 'Monólito vs Microservices',
$theory$
## Monólito vs Microservices

Um **monólito** é uma aplicação implantada como uma unidade: um deploy, um banco, um processo. **Microservices** quebram o sistema em serviços pequenos, independentes, cada um com **seu próprio banco** e seu próprio deploy.

### O que microservices realmente compram
- **Deploy independente** — o time de pagamentos publica sem esperar o de catálogo.
- **Escala seletiva** — só o serviço de busca precisa de 20 réplicas.
- **Isolamento de falha** — o serviço de recomendação caindo não derruba o checkout.
- **Autonomia de times** — cada serviço tem dono, stack e ciclo próprios.

### O preço (que a palestra motivacional esquece)
- Chamadas de método viram **chamadas de rede**: latência, falha parcial, timeout.
- Transações ACID viram **consistência eventual** (adeus `@Transactional` entre serviços).
- Observabilidade, versionamento de contratos, infraestrutura — tudo multiplica.
- Um "monólito distribuído" (serviços separados mas acoplados) tem **todos os custos e nenhum benefício**.

### O antipadrão nº 1: banco compartilhado
Se dois "microservices" leem e escrevem **nas mesmas tabelas**, eles não são independentes: qualquer mudança de schema quebra o vizinho, e o acoplamento só mudou de lugar. Regra de ouro: **cada serviço é dono exclusivo dos seus dados**; quem quiser algo, pede via API ou eventos.

### O caminho sensato
> **Comece pelo monólito** — modular, com fronteiras claras entre pacotes/módulos (`pedido`, `pagamento`, `catalogo`). Extraia um serviço quando houver uma razão concreta: escala desigual, time dedicado, ciclo de deploy conflitante. Migrar módulo bem separado é fácil; separar um novelo é reescrita.

Um **monólito modular** bem feito entrega 80% dos benefícios com 20% da complexidade — e deixa a porta aberta para extrair serviços depois.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000050102', 'a2000000-0000-0000-0000-000000000501', 'Comunicação entre serviços e API Gateway',
$theory$
## Comunicação entre serviços e API Gateway

### Síncrona: REST e gRPC
Na comunicação **síncrona**, o chamador espera a resposta:

- **REST/HTTP + JSON** — universal, legível, fácil de depurar. O padrão para APIs públicas.
- **gRPC** — binário (Protobuf), contratos tipados, mais rápido; comum **entre** serviços internos.

O problema estrutural: **acoplamento temporal**. Se o serviço B está fora do ar, a chamada de A falha junto — e uma cadeia A→B→C→D tem a disponibilidade do elo mais fraco (99% × 99% × 99% ≈ 97%).

### Assíncrona: mensagens e eventos
Na **assíncrona**, o serviço publica uma mensagem num broker (RabbitMQ, Kafka) e segue a vida. O consumidor processa quando puder:

```text
Pedido criado ──► [ broker ] ──► Estoque reserva
                             ──► Email de confirmação
                             ──► Programa de pontos
```

- **Desacopla no tempo**: o consumidor pode estar fora do ar e processar depois.
- **Um evento, N reações** sem o produtor conhecer ninguém.
- Custo: consistência eventual, duplicatas possíveis, fluxo mais difícil de seguir.

> Regra prática: consulta que precisa de resposta **agora** (buscar preço) = síncrona. Fato que aconteceu e outros devem reagir (pedido criado) = **evento assíncrono**.

### API Gateway: a porta da frente
Com dezenas de serviços, o cliente não pode conhecer o endereço de cada um. O **API Gateway** é o ponto único de entrada:

- **Roteamento** — `/api/pedidos/**` → serviço de pedidos.
- **Preocupações transversais num só lugar**: autenticação/JWT, rate limiting, CORS, TLS, logging.
- **Agregação** — uma chamada do app mobile vira 3 chamadas internas.

Exemplos: Spring Cloud Gateway, Kong, NGINX, AWS API Gateway.

### Service discovery
Instâncias sobem e descem com IPs dinâmicos. O **service discovery** (Eureka, Consul, ou o DNS nativo do Kubernetes) mantém o catálogo "serviço → instâncias vivas", permitindo que gateway e serviços se encontrem pelo **nome lógico** (`http://pedidos/...`) em vez de IP fixo.

> No Kubernetes, discovery e balanceamento vêm de graça via `Service` + DNS — mais um motivo pelo qual microservices e K8s andam juntos.
$theory$, 15, 4, 2, 16);

-- ─── LESSONS: Resiliência & Observabilidade ──────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000050201', 'a2000000-0000-0000-0000-000000000502', 'Resiliência: timeout, retry e circuit breaker',
$theory$
## Resiliência: timeout, retry e circuit breaker

Em sistemas distribuídos, **falha não é exceção — é rotina**. Rede oscila, serviços reiniciam, dependências ficam lentas. Resiliência é desenhar para que a falha de um pedaço não vire a falha do todo.

### Timeout: a defesa mais barata
Toda chamada remota precisa de **limite de espera**. Sem timeout, uma dependência lenta prende suas threads uma a uma até esgotar o pool — e a lentidão **se propaga** para quem chama você.

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2))
    .build();
// e timeout de leitura na requisição: nunca espere para sempre
```

### Retry: repetir com cabeça
Falhas transitórias (blip de rede, 503 momentâneo) merecem nova tentativa — mas retry ingênuo é perigoso:

- **Backoff exponencial**: espere 1s, 2s, 4s… em vez de metralhar o serviço que já está sofrendo.
- **Jitter** (aleatoriedade): evita que mil clientes re-tentem todos no mesmo instante.
- **Só re-tente o que é seguro**: repetir um `POST /pagamento` pode **cobrar duas vezes**. Retry exige operação **idempotente** (ou chave de idempotência).
- Limite de tentativas: 2–3, não infinito.

### Circuit breaker: pare de insistir
Se a dependência está **fora**, continuar chamando só piora: suas threads travam esperando timeouts em série. O **circuit breaker** monitora as falhas e "desarma" como o disjuntor da sua casa:

```text
FECHADO ──taxa de falha estoura──► ABERTO ──após N segundos──► MEIO-ABERTO
   ▲                                 │                             │
   │                          falha rápido,                deixa passar
   └────── teste passou ◄──── sem nem tentar ◄────────── umas poucas
```

- **Fechado** (normal): chamadas passam, falhas são contadas.
- **Aberto**: chamadas **falham imediatamente** (ou usam fallback) sem tocar a rede — protege os dois lados.
- **Meio-aberto**: após a pausa, deixa passar chamadas de teste; sucesso fecha o circuito.

Em Java, a biblioteca padrão é o **Resilience4j** (`@CircuitBreaker`, `@Retry`, `@TimeLimiter` — integra com Spring Boot).

### Bulkhead e fallback
- **Bulkhead**: pools separados por dependência — o serviço de email lento não pode consumir as threads do checkout.
- **Fallback**: resposta degradada melhor que erro — sem recomendações personalizadas? Mostre os mais vendidos.

> A pergunta de design não é "e se falhar?" — é "**quando** falhar, o que o usuário vê?".
$theory$, 20, 4, 1, 17),

 ('a3000000-0000-0000-0000-000000050202', 'a2000000-0000-0000-0000-000000000502', 'Observabilidade: logs, métricas e tracing',
$theory$
## Observabilidade: logs, métricas e tracing

Quando uma requisição atravessa 6 serviços e falha, "olhar o log" deixa de ser trivial. **Observabilidade** é conseguir responder *o que está acontecendo lá dentro* a partir do que o sistema emite. São **três pilares**, cada um respondendo uma pergunta:

| Pilar | Pergunta que responde | Ferramentas típicas |
|---|---|---|
| **Logs** | "O que aconteceu neste evento específico?" | ELK, Loki, CloudWatch |
| **Métricas** | "Como o sistema está AGORA / em tendência?" | Prometheus + Grafana, Micrometer |
| **Tracing** | "Por onde ESTA requisição passou e onde gastou tempo?" | Zipkin, Jaeger, OpenTelemetry |

### Logs que ajudam (e logs que atrapalham)
- **Estruturados** (JSON) — máquina consegue filtrar `nivel=ERROR AND servico=pagamentos`.
- **Com contexto**: id da requisição, do usuário, do pedido. `"Erro ao processar"` sozinho é inútil.
- Nível certo: `ERROR` = ação necessária; `WARN` = estranho mas seguiu; `INFO` = marcos de negócio; `DEBUG` = investigação.
- **Nunca logue segredo** (senha, token, cartão) — log vaza.

### O truque que muda tudo: correlation ID
Gere um **id único por requisição** na entrada (no gateway), propague-o em um header (`X-Correlation-Id` ou o `traceparent` do W3C) por **todas** as chamadas subsequentes, e inclua-o em **todo log**. Agora `grep correlationId=abc123` conta a história completa da requisição através dos 6 serviços — a diferença entre 5 minutos e 5 horas de investigação.

### Métricas: os quatro sinais de ouro
Para cada serviço, monitore:
1. **Latência** — não só a média: **p95/p99** (a média esconde os 5% que sofrem).
2. **Tráfego** — requisições/segundo.
3. **Erros** — taxa de 5xx.
4. **Saturação** — CPU, memória, pool de conexões, fila.

No Spring Boot, o **Micrometer** + Actuator expõem isso quase de graça (`/actuator/prometheus`); alertas disparam quando um sinal foge do normal — de preferência **antes** do usuário perceber.

### Distributed tracing
Cada requisição ganha um **trace** (a jornada) composto de **spans** (cada parada: serviço, duração). O resultado visual é uma cascata:

```text
GET /checkout ────────────────────────────── 820ms
  ├─ pedidos: validar carrinho ──── 45ms
  ├─ pagamentos: cobrar ─────────── 690ms  ◄── o vilão está aqui
  │    └─ gateway externo ───────── 650ms
  └─ estoque: reservar ──────────── 60ms
```

Com **OpenTelemetry** (o padrão da indústria), a instrumentação é em grande parte automática para HTTP, JDBC e mensageria.

> Observabilidade se constrói **antes** do incidente. Durante o incidente às 3h da manhã, é tarde para adicionar logs.
$theory$, 20, 4, 2, 17);

-- ─── LESSONS: Dados Distribuídos ─────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000050301', 'a2000000-0000-0000-0000-000000000503', 'Saga: transações distribuídas',
$theory$
## Saga: transações distribuídas

### O problema
No monólito, "criar pedido + cobrar + reservar estoque" era **um** `@Transactional`: tudo ou nada, o banco garantia. Em microservices, cada passo vive em um serviço com **seu próprio banco** — não existe transação ACID atravessando os três.

A solução clássica de bancos distribuídos (two-phase commit) **não escala** nesse mundo: exige travar recursos em todos os participantes enquanto um coordenador decide, e um participante lento/fora do ar trava todos os outros. Na prática, brokers e bancos modernos nem o suportam bem.

### A ideia da Saga
Uma **saga** quebra a transação grande em uma **sequência de transações locais** — cada uma commitada no seu serviço — e define, para cada passo, uma **compensação**: a ação que desfaz o efeito se algo falhar depois.

```text
T1: criar pedido          C1: cancelar pedido
T2: cobrar pagamento      C2: estornar pagamento
T3: reservar estoque      C3: (última — sem compensação)

Fluxo feliz:  T1 ─► T2 ─► T3 ✓
T3 falhou:    T1 ─► T2 ─► T3 ✗ ─► C2 ─► C1   (desfaz na ordem inversa)
```

Compensação **não é rollback**: o commit de T2 aconteceu e é visível. C2 é uma **nova transação de negócio** (estorno) que reverte o efeito. Por isso nem tudo é compensável do mesmo jeito — email enviado não "desenvia"; a compensação pode ser outro email.

### Coreografia vs Orquestração
**Coreografia** — sem maestro: cada serviço reage a eventos e publica os seus.
```text
PedidoCriado ─► Pagamentos cobra ─► PagamentoAprovado ─► Estoque reserva ─► ...
```
Simples para fluxos curtos; com 6+ passos vira "quem reage a quê?" — o fluxo não está escrito em lugar nenhum.

**Orquestração** — um **orquestrador** central comanda cada passo e trata as falhas:
```text
Orquestrador: chama T1 → ok → chama T2 → falhou → dispara C1 → encerra
```
O fluxo fica explícito e testável num só lugar; o custo é um componente a mais (e evitar que ele vire um "deus").

> Regra de bolso: 2–3 passos e poucos participantes → coreografia; fluxos longos, com ramificações e compensações complexas → orquestração.

### O detalhe que ninguém pode esquecer
Entre "commitar no meu banco" e "publicar o evento" existe uma janela de falha. O padrão **Transactional Outbox** resolve: o evento é gravado numa tabela `outbox` **na mesma transação local**, e um processo separado o publica no broker. Assim, estado e evento nunca divergem.
$theory$, 20, 5, 1, 17),

 ('a3000000-0000-0000-0000-000000050302', 'a2000000-0000-0000-0000-000000000503', 'CQRS e Event Sourcing',
$theory$
## CQRS e Event Sourcing

### CQRS: separar escrita de leitura
**CQRS** (Command Query Responsibility Segregation) parte de uma observação: o modelo bom para **alterar** dados raramente é o modelo bom para **consultar**.

- **Comandos** (escrita): "criar pedido", "cancelar item" — passam por validação e regras de negócio, tocam o modelo de domínio normalizado.
- **Queries** (leitura): "dashboard de vendas por região" — querem dados prontos, desnormalizados, rápidos.

Com CQRS, cada lado tem seu **modelo** — e, na forma completa, até seu **banco**:

```text
Comando ─► modelo de escrita (PostgreSQL normalizado)
                 │  eventos (PedidoCriado, ItemCancelado...)
                 ▼
           projeções ─► modelo de leitura (view desnormalizada,
                        Elasticsearch, Redis, réplica...)
Query   ─◄────────────┘
```

O custo inevitável: a leitura fica **eventualmente consistente** — o dashboard pode estar alguns segundos atrás da escrita. Para a maioria dos relatórios, irrelevante; para "saldo antes de sacar", inaceitável. **Saber onde cada consistência é aceitável é o próprio design.**

> CQRS não exige dois bancos: começa como duas camadas/modelos no mesmo banco (entidades para escrever, DTOs/views para ler) — algo que você provavelmente já faz sem chamar pelo nome.

### Event Sourcing: o estado É a história
No modelo tradicional, o banco guarda o **estado atual** (`saldo = 70`) e o passado se perde a cada UPDATE. Com **Event Sourcing**, você guarda a **sequência de eventos imutáveis**, e o estado atual é derivado ao reproduzi-los:

```text
ContaAberta   { saldo inicial: 0 }
Depositado    { valor: 100 }
Sacado        { valor: 30 }
─────────────────────────────
estado atual = replay = saldo 70
```

O que isso compra:
- **Auditoria perfeita e gratuita** — o histórico é a fonte da verdade, não um anexo.
- **Depuração de outro nível** — reproduza os eventos até o momento do bug e veja o estado exato.
- **Projeções novas retroativas** — quer um relatório novo? Reprocesse os eventos desde o início.

O que isso custa:
- Consultar "estado atual" exige replay ou **snapshots** periódicos.
- Eventos são **imutáveis e eternos**: versionar o schema de um evento antigo é um problema real.
- Curva de aprendizado alta para o time inteiro.

### Como as peças se encaixam
Event Sourcing casa naturalmente com CQRS: os eventos alimentam as projeções de leitura. E os eventos da saga podem ser os mesmos do event store. Mas cada peça é **opt-in e local**: um único serviço (ex.: pagamentos, que precisa de auditoria total) pode usar ES+CQRS enquanto o resto do sistema segue CRUD tradicional.

> São ferramentas de precisão, não estilo de vida. **CRUD + um bom log de auditoria resolve a maioria dos sistemas.** Adote ES/CQRS onde o requisito (auditoria, replay, leitura massiva) pagar o custo.
$theory$, 20, 5, 2, 17);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: Monólito vs Micro -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005010101', 'a3000000-0000-0000-0000-000000050101', 'MULTIPLE_CHOICE',
  'Dois "microservices" leem e escrevem nas mesmas tabelas de um banco compartilhado. Qual o problema?', 'Quem é o dono dos dados?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000005010102', 'a3000000-0000-0000-0000-000000050101', 'MULTIPLE_CHOICE',
  'Para um produto novo com um time pequeno e requisitos ainda instáveis, qual arquitetura inicial é a mais recomendada?', 'Fronteiras claras primeiro; extração depois.', 2, 5, 3);

-- L2: Comunicação/Gateway -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005010201', 'a3000000-0000-0000-0000-000000050102', 'MULTIPLE_CHOICE',
  'Quais responsabilidades tipicamente se centralizam num API Gateway?', 'Pense nas preocupações transversais repetidas em todo serviço.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000005010202', 'a3000000-0000-0000-0000-000000050102', 'DESCRIPTIVE',
  'Um serviço de pedidos precisa que o estoque seja reservado após cada compra. Compare implementar isso com chamada REST síncrona vs publicando um evento assíncrono — cite um benefício e um custo de cada abordagem.', 'Acoplamento temporal vs consistência eventual.', 2, 10, 4);

-- L3: Resiliência -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005020101', 'a3000000-0000-0000-0000-000000050201', 'MULTIPLE_CHOICE',
  'O que um circuit breaker no estado ABERTO faz com as chamadas?', 'Pense no disjuntor da sua casa.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000005020102', 'a3000000-0000-0000-0000-000000050201', 'MULTIPLE_CHOICE',
  'Por que aplicar retry automático num `POST /pagamentos` sem cuidado extra é perigoso?', 'O timeout pode ter estourado DEPOIS de o servidor processar.', 2, 5, 4);

-- L4: Observabilidade -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005020201', 'a3000000-0000-0000-0000-000000050202', 'MULTIPLE_CHOICE',
  'Para que serve o correlation ID propagado entre os serviços?', 'Como reconstruir a história de UMA requisição em 6 serviços?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000005020202', 'a3000000-0000-0000-0000-000000050202', 'DESCRIPTIVE',
  'O dashboard mostra latência MÉDIA de 80ms, mas usuários reclamam de lentidão. Explique por que a média engana e qual métrica olhar no lugar.', 'O que os percentis p95/p99 revelam que a média esconde?', 2, 10, 4);

-- L5: Saga -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005030101', 'a3000000-0000-0000-0000-000000050301', 'MULTIPLE_CHOICE',
  'Numa saga, o passo 3 falhou após os passos 1 e 2 terem commitado. O que acontece?', 'Compensação não é rollback.', 1, 5, 5),
 ('a4000000-0000-0000-0000-000005030102', 'a3000000-0000-0000-0000-000000050301', 'DESCRIPTIVE',
  'Compare coreografia e orquestração de sagas: como cada uma coordena os passos, e quando você escolheria cada abordagem?', 'Eventos em cadeia vs maestro central.', 2, 10, 5);

-- L6: CQRS/ES -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000005030201', 'a3000000-0000-0000-0000-000000050302', 'MULTIPLE_CHOICE',
  'O que o CQRS separa, fundamentalmente?', 'Command Query Responsibility Segregation.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000005030202', 'a3000000-0000-0000-0000-000000050302', 'MULTIPLE_CHOICE',
  'No Event Sourcing, como o estado atual de uma conta é obtido?', 'O banco guarda eventos, não o saldo.', 2, 5, 5);

-- ─── OPTIONS ─────────────────────────────────────────────────────────
-- L1 Q1: banco compartilhado
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000501010101', 'a4000000-0000-0000-0000-000005010101', 'O acoplamento continua: qualquer mudança de schema quebra o vizinho — perderam a independência sem ganhar nada.', TRUE,  'Correto: é o antipadrão do banco compartilhado; cada serviço deve ser dono exclusivo dos seus dados.', 1),
 ('a5000000-0000-0000-0000-000501010102', 'a4000000-0000-0000-0000-000005010101', 'Nenhum — compartilhar o banco é a forma recomendada de integrar serviços.', FALSE, 'É exatamente o antipadrão clássico: integração deve ser via API ou eventos.', 2),
 ('a5000000-0000-0000-0000-000501010103', 'a4000000-0000-0000-0000-000005010101', 'Apenas performance: dois serviços deixam o banco lento.', FALSE, 'O problema central é acoplamento de schema/dono dos dados, não desempenho.', 3),
 ('a5000000-0000-0000-0000-000501010104', 'a4000000-0000-0000-0000-000005010101', 'O banco não aceita conexões de duas aplicações diferentes.', FALSE, 'Bancos aceitam múltiplos clientes normalmente — a restrição é de design, não técnica.', 4);

-- L1 Q2: começar pelo monólito
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000501010201', 'a4000000-0000-0000-0000-000005010102', 'Monólito modular com fronteiras claras, extraindo serviços quando houver razão concreta.', TRUE,  'Correto: entrega 80% dos benefícios com 20% da complexidade, e módulos bem separados são fáceis de extrair depois.', 1),
 ('a5000000-0000-0000-0000-000501010202', 'a4000000-0000-0000-0000-000005010102', 'Microservices desde o dia 1 — migrar depois é impossível.', FALSE, 'Migrar módulo bem separado é viável; pagar o custo distribuído sem necessidade é que atrasa o produto.', 2),
 ('a5000000-0000-0000-0000-000501010203', 'a4000000-0000-0000-0000-000005010102', 'Um serviço por desenvolvedor, para maximizar a autonomia.', FALSE, 'Serviços seguem fronteiras de DOMÍNIO, não o organograma individual.', 3),
 ('a5000000-0000-0000-0000-000501010204', 'a4000000-0000-0000-0000-000005010102', 'Monólito sem separação interna — módulos só atrasam.', FALSE, 'Sem fronteiras internas nasce o novelo: qualquer evolução futura (inclusive extração) fica cara.', 4);

-- L2 Q1: gateway
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000501020101', 'a4000000-0000-0000-0000-000005010201', 'Roteamento para os serviços, autenticação, rate limiting e outras preocupações transversais.', TRUE,  'Correto: ponto único de entrada que concentra o que seria repetido em cada serviço.', 1),
 ('a5000000-0000-0000-0000-000501020102', 'a4000000-0000-0000-0000-000005010201', 'Executar a lógica de negócio de todos os serviços.', FALSE, 'Gateway com regra de negócio vira um novo monólito — ele apenas roteia e trata transversais.', 2),
 ('a5000000-0000-0000-0000-000501020103', 'a4000000-0000-0000-0000-000005010201', 'Substituir o banco de dados dos serviços.', FALSE, 'Gateway atua na camada HTTP, não na persistência.', 3),
 ('a5000000-0000-0000-0000-000501020104', 'a4000000-0000-0000-0000-000005010201', 'Garantir transações ACID entre os serviços.', FALSE, 'Transação distribuída não é papel de gateway (nem de ninguém — veja Sagas).', 4);

-- L3 Q1: circuito aberto
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000502010101', 'a4000000-0000-0000-0000-000005020101', 'Falha imediatamente (ou aciona o fallback) sem tentar a chamada de rede.', TRUE,  'Correto: protege o chamador (sem threads presas em timeout) e dá fôlego ao serviço que sofre.', 1),
 ('a5000000-0000-0000-0000-000502010102', 'a4000000-0000-0000-0000-000005020101', 'Enfileira as chamadas para reexecutar quando o serviço voltar.', FALSE, 'Circuit breaker não é fila — chamadas falham rápido; enfileirar é papel de mensageria.', 2),
 ('a5000000-0000-0000-0000-000502010103', 'a4000000-0000-0000-0000-000005020101', 'Tenta a chamada com timeout dobrado.', FALSE, 'Aberto = nem tenta; aumentar timeout seria o oposto da proteção.', 3),
 ('a5000000-0000-0000-0000-000502010104', 'a4000000-0000-0000-0000-000005020101', 'Redireciona o tráfego para outra instância do mesmo serviço.', FALSE, 'Balanceamento entre instâncias é outra camada; o breaker responde à falha da dependência como um todo.', 4);

-- L3 Q2: retry POST
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000502010201', 'a4000000-0000-0000-0000-000005020102', 'A primeira tentativa pode ter sido processada (timeout na resposta) — repetir pode cobrar em dobro; retry exige idempotência.', TRUE,  'Correto: timeout não significa "não aconteceu". Operações não idempotentes precisam de chave de idempotência antes de re-tentar.', 1),
 ('a5000000-0000-0000-0000-000502010202', 'a4000000-0000-0000-0000-000005020102', 'Retries são sempre proibidos em qualquer POST.', FALSE, 'São válidos COM idempotência garantida (chave de idempotência, deduplicação).', 2),
 ('a5000000-0000-0000-0000-000502010203', 'a4000000-0000-0000-0000-000005020102', 'O problema é apenas o custo de rede das tentativas extras.', FALSE, 'O risco real é efeito duplicado (cobrança dupla), muito pior que bytes extras.', 3),
 ('a5000000-0000-0000-0000-000502010204', 'a4000000-0000-0000-0000-000005020102', 'HTTP bloqueia automaticamente a repetição de POSTs.', FALSE, 'Nada no protocolo impede — a proteção é responsabilidade da aplicação.', 4);

-- L4 Q1: correlation id
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000502020101', 'a4000000-0000-0000-0000-000005020201', 'Ligar todos os logs/spans de uma MESMA requisição através dos serviços, permitindo reconstruir a jornada completa.', TRUE,  'Correto: um id gerado na entrada e propagado em header + presente em todo log = a história inteira num grep.', 1),
 ('a5000000-0000-0000-0000-000502020102', 'a4000000-0000-0000-0000-000005020201', 'Autenticar o usuário entre os serviços.', FALSE, 'Autenticação é papel do token (JWT); o correlation id é rastreabilidade.', 2),
 ('a5000000-0000-0000-0000-000502020103', 'a4000000-0000-0000-0000-000005020201', 'Balancear a carga entre instâncias.', FALSE, 'Balanceamento não usa correlation id.', 3),
 ('a5000000-0000-0000-0000-000502020104', 'a4000000-0000-0000-0000-000005020201', 'Deduplicar mensagens repetidas no broker.', FALSE, 'Deduplicação usa chave de idempotência da MENSAGEM; o correlation id identifica a requisição para rastreio.', 4);

-- L5 Q1: compensação
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000503010101', 'a4000000-0000-0000-0000-000005030101', 'Executam-se as COMPENSAÇÕES dos passos 2 e 1 (na ordem inversa) — novas transações que desfazem o efeito de negócio.', TRUE,  'Correto: os commits locais já aconteceram; a saga desfaz com ações compensatórias (estorno, cancelamento).', 1),
 ('a5000000-0000-0000-0000-000503010102', 'a4000000-0000-0000-0000-000005030101', 'O banco faz rollback automático dos três passos.', FALSE, 'Não há transação global: os passos 1 e 2 commitaram em bancos independentes — rollback é impossível.', 2),
 ('a5000000-0000-0000-0000-000503010103', 'a4000000-0000-0000-0000-000005030101', 'O passo 3 é re-tentado para sempre até dar certo.', FALSE, 'Retry pode ser parte da estratégia, mas falha definitiva exige o caminho de compensação.', 3),
 ('a5000000-0000-0000-0000-000503010104', 'a4000000-0000-0000-0000-000005030101', 'Nada — os dois primeiros passos permanecem e o sistema fica inconsistente por design.', FALSE, 'Ficar inconsistente é justamente o que a saga existe para evitar.', 4);

-- L6 Q1: CQRS
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000503020101', 'a4000000-0000-0000-0000-000005030201', 'O modelo de ESCRITA (comandos com regras de negócio) do modelo de LEITURA (consultas desnormalizadas).', TRUE,  'Correto: cada lado evolui e escala separado; a leitura vira projeções otimizadas para consulta.', 1),
 ('a5000000-0000-0000-0000-000503020102', 'a4000000-0000-0000-0000-000005030201', 'O frontend do backend.', FALSE, 'Isso é a separação cliente/servidor comum — CQRS atua dentro do backend.', 2),
 ('a5000000-0000-0000-0000-000503020103', 'a4000000-0000-0000-0000-000005030201', 'Os testes unitários dos de integração.', FALSE, 'Nada a ver com estratégia de testes.', 3),
 ('a5000000-0000-0000-0000-000503020104', 'a4000000-0000-0000-0000-000005030201', 'O banco SQL do banco NoSQL, obrigatoriamente.', FALSE, 'CQRS PODE usar bancos distintos, mas começa com dois modelos no mesmo banco.', 4);

-- L6 Q2: event sourcing
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000503020201', 'a4000000-0000-0000-0000-000005030202', 'Reproduzindo (replay) a sequência de eventos imutáveis desde o início — ou a partir de um snapshot.', TRUE,  'Correto: o estado é derivado da história; snapshots servem de atalho de performance.', 1),
 ('a5000000-0000-0000-0000-000503020202', 'a4000000-0000-0000-0000-000005030202', 'Lendo a coluna saldo_atual, atualizada a cada UPDATE.', FALSE, 'Esse é o modelo tradicional de estado — justamente o que o Event Sourcing substitui.', 2),
 ('a5000000-0000-0000-0000-000503020203', 'a4000000-0000-0000-0000-000005030202', 'Somando os valores em cache no Redis.', FALSE, 'Cache pode existir como projeção, mas a FONTE é o log de eventos.', 3),
 ('a5000000-0000-0000-0000-000503020204', 'a4000000-0000-0000-0000-000005030202', 'Consultando o último evento, que contém o estado inteiro.', FALSE, 'Eventos registram O QUE MUDOU (Depositado {100}), não o estado completo.', 4);

-- ─── DESCRIPTIVE ANSWERS ─────────────────────────────────────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000005010202', 'a4000000-0000-0000-0000-000005010202',
  'REST síncrono: benefício — resposta imediata e fluxo simples de entender/depurar (o pedido já sabe se a reserva deu certo); custo — acoplamento temporal: estoque fora do ar ou lento derruba/atrasa a criação de pedidos, e a disponibilidade composta cai. Evento assíncrono: benefício — desacoplamento no tempo (estoque pode processar depois, pedidos continua funcionando) e vários consumidores reagem ao mesmo evento; custo — consistência eventual (janela em que o pedido existe sem reserva), necessidade de broker, tratamento de duplicatas e fluxo mais difícil de rastrear.',
  'Deve apresentar pelo menos um benefício E um custo de cada abordagem, tocando em acoplamento temporal/disponibilidade (síncrono) e consistência eventual/complexidade operacional (assíncrono). Bônus por citar idempotência do consumidor, DLQ ou saga para o caso de falha.'),
 ('a7000000-0000-0000-0000-000005020202', 'a4000000-0000-0000-0000-000005020202',
  'A média dilui os extremos: se 95% das requisições levam 50ms e 5% levam 2s, a média fica baixa enquanto uma fração real de usuários sofre. Latência tem distribuição de cauda longa, e a média esconde a cauda. O correto é olhar percentis: p95/p99 mostram a experiência dos piores casos — p99 = 2s significa que 1% das requisições demora 2s ou mais. Alertas e SLOs devem ser definidos sobre percentis, não sobre a média.',
  'Deve explicar que a média mascara a cauda da distribuição e que uma minoria pode sofrer muito sem mover a média; deve indicar percentis (p95/p99) como a métrica correta. Bônus por mencionar SLO/alertas baseados em percentil ou dar exemplo numérico coerente.'),
 ('a7000000-0000-0000-0000-000005030102', 'a4000000-0000-0000-0000-000005030102',
  'Coreografia: não há coordenador — cada serviço reage a eventos e publica os seus (PedidoCriado → pagamentos cobra → PagamentoAprovado → estoque reserva). Boa para fluxos curtos com poucos participantes; o fluxo fica implícito e difícil de enxergar quando cresce. Orquestração: um orquestrador central comanda cada passo, avalia respostas e dispara compensações; o fluxo fica explícito, testável e fácil de evoluir, ao custo de um componente central a mais (que não deve acumular regra de negócio dos passos). Escolha: 2-3 passos simples → coreografia; fluxos longos, ramificados, com compensações complexas → orquestração.',
  'Deve descrever corretamente os dois mecanismos (eventos em cadeia sem coordenador vs comandante central) e dar um critério de escolha coerente (complexidade/tamanho do fluxo, visibilidade, compensações). Penalizar se disser que orquestração dá transação ACID ou que coreografia não precisa de compensação.');
