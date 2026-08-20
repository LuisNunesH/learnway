-- =====================================================================
-- LearnWay — Flashcards das trilhas "Arquitetura", "Mensageria & Dados",
-- "Cloud & DevOps" e "DSA"
-- 5 cartas por lição × 24 lições = 120 cartas.
-- UUID (mesma convenção do V6/V12): f1000000-0000-0000-0000-0000<lição:6><carta:2>
-- =====================================================================

-- ─── Arquitetura · Monólito vs Microservices (050101) ────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005010101', 'a3000000-0000-0000-0000-000000050101',
  'O que microservices compram em relação ao monólito?',
  'Deploy independente, escala seletiva, isolamento de falha e autonomia de times — ao custo de rede, consistência eventual e mais infraestrutura.', 1),
 ('f1000000-0000-0000-0000-000005010102', 'a3000000-0000-0000-0000-000000050101',
  'Qual o antipadrão nº 1 em microservices?',
  '**Banco compartilhado**: dois serviços nas mesmas tabelas continuam acoplados (schema quebra o vizinho). Cada serviço deve ser dono exclusivo dos seus dados.', 2),
 ('f1000000-0000-0000-0000-000005010103', 'a3000000-0000-0000-0000-000000050101',
  'O que é um "monólito distribuído"?',
  'Serviços separados mas acoplados (deploy conjunto, banco compartilhado, chamadas em teia) — **todos os custos** dos microservices, **nenhum benefício**.', 3),
 ('f1000000-0000-0000-0000-000005010104', 'a3000000-0000-0000-0000-000000050101',
  'Qual a estratégia recomendada para um produto novo?',
  '**Monólito modular** com fronteiras claras entre módulos; extrair serviços quando houver razão concreta (escala desigual, time dedicado, deploy conflitante).', 4),
 ('f1000000-0000-0000-0000-000005010105', 'a3000000-0000-0000-0000-000000050101',
  'O que uma transação ACID entre serviços vira no mundo distribuído?',
  '**Consistência eventual** — não há `@Transactional` entre bancos independentes; o padrão Saga coordena com compensações.', 5);

-- ─── Arquitetura · Comunicação e Gateway (050102) ────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005010201', 'a3000000-0000-0000-0000-000000050102',
  'Comunicação síncrona vs assíncrona entre serviços?',
  '**Síncrona** (REST/gRPC): resposta imediata, mas acoplamento temporal — B fora do ar derruba A. **Assíncrona** (broker): desacopla no tempo, custo de consistência eventual.', 1),
 ('f1000000-0000-0000-0000-000005010202', 'a3000000-0000-0000-0000-000000050102',
  'Quando usar evento assíncrono em vez de chamada REST?',
  'Quando é um **fato que aconteceu** e outros devem reagir (PedidoCriado). Consulta que precisa de resposta agora (buscar preço) fica síncrona.', 2),
 ('f1000000-0000-0000-0000-000005010203', 'a3000000-0000-0000-0000-000000050102',
  'O que um API Gateway centraliza?',
  'Ponto único de entrada: **roteamento** para os serviços + transversais (autenticação, rate limiting, CORS, TLS). Sem regra de negócio — senão vira monólito novo.', 3),
 ('f1000000-0000-0000-0000-000005010204', 'a3000000-0000-0000-0000-000000050102',
  'O que é service discovery?',
  'Catálogo dinâmico "serviço → instâncias vivas" (Eureka, Consul, DNS do K8s): permite chamar pelo **nome lógico** em vez de IP fixo.', 4),
 ('f1000000-0000-0000-0000-000005010205', 'a3000000-0000-0000-0000-000000050102',
  'Por que uma cadeia síncrona A→B→C→D é frágil?',
  'A disponibilidade **multiplica**: 99% × 99% × 99% ≈ 97% — o elo mais fraco limita o todo, e a latência soma.', 5);

-- ─── Arquitetura · Resiliência (050201) ──────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005020101', 'a3000000-0000-0000-0000-000000050201',
  'Por que TODA chamada remota precisa de timeout?',
  'Sem limite, uma dependência lenta prende suas threads até esgotar o pool — a lentidão **se propaga** para quem chama você.', 1),
 ('f1000000-0000-0000-0000-000005020102', 'a3000000-0000-0000-0000-000000050201',
  'Como fazer retry sem piorar o incêndio?',
  '**Backoff exponencial + jitter**, 2-3 tentativas no máximo, e apenas em operações **idempotentes** (ou com chave de idempotência).', 2),
 ('f1000000-0000-0000-0000-000005020103', 'a3000000-0000-0000-0000-000000050201',
  'Quais os 3 estados do circuit breaker?',
  '**Fechado** (normal, contando falhas) → **Aberto** (falha rápido, sem tocar a rede) → **Meio-aberto** (deixa passar testes; sucesso fecha de novo).', 3),
 ('f1000000-0000-0000-0000-000005020104', 'a3000000-0000-0000-0000-000000050201',
  'O que são bulkhead e fallback?',
  '**Bulkhead**: pools isolados por dependência (email lento não consome as threads do checkout). **Fallback**: resposta degradada em vez de erro.', 4),
 ('f1000000-0000-0000-0000-000005020105', 'a3000000-0000-0000-0000-000000050201',
  'Por que repetir um POST de pagamento é perigoso?',
  'Timeout na RESPOSTA não significa que não processou — a repetição pode **cobrar duas vezes**. Solução: Idempotency-Key/deduplicação.', 5);

-- ─── Arquitetura · Observabilidade (050202) ──────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005020201', 'a3000000-0000-0000-0000-000000050202',
  'Quais os três pilares da observabilidade?',
  '**Logs** (o que aconteceu neste evento), **métricas** (como o sistema está/tendências), **tracing** (por onde esta requisição passou e onde gastou tempo).', 1),
 ('f1000000-0000-0000-0000-000005020202', 'a3000000-0000-0000-0000-000000050202',
  'O que é o correlation ID?',
  'Id único gerado na entrada e **propagado em header por todos os serviços** + incluído em todo log — um grep reconstrói a jornada completa da requisição.', 2),
 ('f1000000-0000-0000-0000-000005020203', 'a3000000-0000-0000-0000-000000050202',
  'Por que olhar p95/p99 em vez da latência média?',
  'A média **esconde a cauda**: 5% dos usuários podem sofrer 2s sem mover a média. Percentis mostram a experiência dos piores casos — SLOs se definem neles.', 3),
 ('f1000000-0000-0000-0000-000005020204', 'a3000000-0000-0000-0000-000000050202',
  'Quais os 4 sinais de ouro do monitoramento?',
  '**Latência** (percentis), **tráfego** (req/s), **erros** (taxa 5xx) e **saturação** (CPU/memória/pools/filas).', 4),
 ('f1000000-0000-0000-0000-000005020205', 'a3000000-0000-0000-0000-000000050202',
  'O que são trace e span no distributed tracing?',
  '**Trace** = a jornada completa da requisição; **span** = cada parada (serviço/operação com duração). A cascata revela onde o tempo foi gasto. Padrão: OpenTelemetry.', 5);

-- ─── Arquitetura · Saga (050301) ─────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005030101', 'a3000000-0000-0000-0000-000000050301',
  'O que é uma Saga?',
  'Sequência de **transações locais** (cada uma commitada no seu serviço) com uma **compensação** definida por passo, para desfazer o efeito em caso de falha posterior.', 1),
 ('f1000000-0000-0000-0000-000005030102', 'a3000000-0000-0000-0000-000000050301',
  'Compensação é rollback?',
  '**Não**: o commit local já aconteceu e foi visível. Compensação é uma **nova transação de negócio** que reverte o efeito (estorno, cancelamento).', 2),
 ('f1000000-0000-0000-0000-000005030103', 'a3000000-0000-0000-0000-000000050301',
  'Coreografia vs orquestração?',
  '**Coreografia**: sem maestro, cada serviço reage a eventos — boa para fluxos curtos. **Orquestração**: coordenador central explícito — melhor para fluxos longos/complexos.', 3),
 ('f1000000-0000-0000-0000-000005030104', 'a3000000-0000-0000-0000-000000050301',
  'Por que 2PC (two-phase commit) não é usado entre microservices?',
  'Trava recursos em todos os participantes enquanto o coordenador decide — participante lento trava todos. Não escala e o ecossistema moderno mal o suporta.', 4),
 ('f1000000-0000-0000-0000-000005030105', 'a3000000-0000-0000-0000-000000050301',
  'O que o padrão Transactional Outbox garante?',
  'Evento gravado numa tabela `outbox` **na mesma transação local** do estado; um processo separado publica no broker — estado e evento nunca divergem.', 5);

-- ─── Arquitetura · CQRS/ES (050302) ──────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000005030201', 'a3000000-0000-0000-0000-000000050302',
  'O que o CQRS separa?',
  'O modelo de **escrita** (comandos, regras de negócio) do de **leitura** (projeções desnormalizadas, rápidas). Pode começar como dois modelos no MESMO banco.', 1),
 ('f1000000-0000-0000-0000-000005030202', 'a3000000-0000-0000-0000-000000050302',
  'Qual o custo inevitável do CQRS com projeções?',
  '**Consistência eventual** na leitura — o dashboard fica segundos atrás da escrita. Saber onde isso é aceitável é o próprio design.', 2),
 ('f1000000-0000-0000-0000-000005030203', 'a3000000-0000-0000-0000-000000050302',
  'O que o Event Sourcing armazena?',
  'A **sequência de eventos imutáveis** (Depositado {100}), não o estado atual. O estado é derivado por **replay** — com snapshots como atalho.', 3),
 ('f1000000-0000-0000-0000-000005030204', 'a3000000-0000-0000-0000-000000050302',
  'O que o Event Sourcing compra?',
  '**Auditoria perfeita** (o histórico É a fonte da verdade), depuração por replay e projeções novas retroativas (reprocessar eventos antigos).', 4),
 ('f1000000-0000-0000-0000-000005030205', 'a3000000-0000-0000-0000-000000050302',
  'Quando NÃO usar CQRS/Event Sourcing?',
  'Na maioria dos sistemas: **CRUD + log de auditoria resolve**. São ferramentas de precisão para requisitos específicos (auditoria total, replay, leitura massiva) — opt-in por serviço.', 5);

-- ─── Mensageria · RabbitMQ (060101) ──────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006010101', 'a3000000-0000-0000-0000-000000060101',
  'Quais os 3 tipos principais de exchange do RabbitMQ?',
  '**direct** (routing key exata), **topic** (padrão `pedido.*.criado`), **fanout** (broadcast para todas as filas ligadas).', 1),
 ('f1000000-0000-0000-0000-000006010102', 'a3000000-0000-0000-0000-000000060101',
  'O que acontece se o consumidor cai ANTES do ack?',
  'O broker **reentrega** a mensagem a outro consumidor (at-least-once). Por isso duplicatas são possíveis e o consumo deve ser **idempotente**.', 2),
 ('f1000000-0000-0000-0000-000006010103', 'a3000000-0000-0000-0000-000000060101',
  'At-least-once vs at-most-once?',
  '**At-least-once** (ack manual pós-processamento): nada se perde, duplicatas possíveis. **At-most-once** (auto-ack): sem duplicatas, mas mensagem morre se o consumidor cair.', 3),
 ('f1000000-0000-0000-0000-000006010104', 'a3000000-0000-0000-0000-000000060101',
  'Para que serve a Dead Letter Queue (DLQ)?',
  'Destino das mensagens que falharam N vezes (ou expiraram) — evita o loop eterno da mensagem "venenosa" e permite inspecionar/reprocessar com calma.', 4),
 ('f1000000-0000-0000-0000-000006010105', 'a3000000-0000-0000-0000-000000060101',
  'Qual métrica de fila é o alerta clássico?',
  '**Profundidade da fila crescendo** = consumidores não dão conta da produção — escale workers ou investigue lentidão no processamento.', 5);

-- ─── Mensageria · Kafka (060102) ─────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006010201', 'a3000000-0000-0000-0000-000000060102',
  'Qual a diferença de modelo entre Kafka e uma fila tradicional?',
  'Kafka é um **log imutável**: consumir NÃO apaga — cada consumidor só avança seu **offset**. Fila tradicional remove a mensagem no ack.', 1),
 ('f1000000-0000-0000-0000-000006010202', 'a3000000-0000-0000-0000-000000060102',
  'O que são partições e o que elas definem?',
  'Subdivisões do tópico (logs independentes). Definem o **paralelismo máximo** do consumer group e são a unidade de **garantia de ordem**.', 2),
 ('f1000000-0000-0000-0000-000006010203', 'a3000000-0000-0000-0000-000000060102',
  'Como garantir ordem para os eventos de um mesmo pedido?',
  'Use o `pedidoId` como **chave da mensagem**: mesma chave → mesma partição → ordem garantida, sem sacrificar o paralelismo geral.', 3),
 ('f1000000-0000-0000-0000-000006010204', 'a3000000-0000-0000-0000-000000060102',
  'Como consumer groups dão fila e broadcast ao mesmo tempo?',
  '**Dentro do grupo**: partições divididas entre membros (trabalho repartido). **Entre grupos**: offsets independentes — cada grupo recebe tudo.', 4),
 ('f1000000-0000-0000-0000-000006010205', 'a3000000-0000-0000-0000-000000060102',
  'Quando Kafka em vez de RabbitMQ?',
  '**Eventos/streaming**, alto volume, múltiplos leitores e necessidade de **replay** (voltar offset). Tarefas/comandos com roteamento rico → RabbitMQ.', 5);

-- ─── Mensageria · Índices (060201) ───────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006020101', 'a3000000-0000-0000-0000-000000060201',
  'O que é um índice e o que ele custa?',
  'Estrutura auxiliar (**B-tree**) que localiza linhas em O(log n) em vez de varrer a tabela. Custo: **toda escrita** atualiza todos os índices + espaço.', 1),
 ('f1000000-0000-0000-0000-000006020102', 'a3000000-0000-0000-0000-000000060201',
  'Regra do índice composto (a, b)?',
  'Atende `WHERE a = ?` e `WHERE a = ? AND b > ?`, mas **não** `WHERE b > ?` sozinho. Igualdades primeiro, faixas/ordenação depois — como lista telefônica (sobrenome, nome).', 2),
 ('f1000000-0000-0000-0000-000006020103', 'a3000000-0000-0000-0000-000000060201',
  'O que procurar num EXPLAIN ANALYZE?',
  '**Seq Scan** em tabela grande com filtro seletivo (falta índice), Index Scan/Index Only Scan (bom), e estimativas de rows muito fora do real (rode ANALYZE).', 3),
 ('f1000000-0000-0000-0000-000006020104', 'a3000000-0000-0000-0000-000000060201',
  'Por que `WHERE LOWER(email) = ?` ignora o índice de email?',
  'A função transforma a coluna — a B-tree ordenada por `email` não serve. Solução: **índice funcional** `ON usuarios (LOWER(email))`.', 4),
 ('f1000000-0000-0000-0000-000006020105', 'a3000000-0000-0000-0000-000000060201',
  'Quando o banco decide NÃO usar um índice existente?',
  'Baixa seletividade (95% das linhas passam no filtro), LIKE com % à esquerda, cast/tipo incompatível — ler a tabela direto sai mais barato e o otimizador sabe.', 5);

-- ─── Mensageria · Transações (060202) ────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006020201', 'a3000000-0000-0000-0000-000000060202',
  'O que significa ACID?',
  '**A**tomicidade (tudo ou nada), **C**onsistência (invariantes respeitadas), **I**solamento (concorrência controlada), **D**urabilidade (commit sobrevive a falhas).', 1),
 ('f1000000-0000-0000-0000-000006020202', 'a3000000-0000-0000-0000-000000060202',
  'Dirty read, non-repeatable read e phantom read?',
  '**Dirty**: ler dado não commitado. **Non-repeatable**: mesma linha muda entre duas leituras. **Phantom**: linhas NOVAS aparecem ao repetir um SELECT de faixa.', 2),
 ('f1000000-0000-0000-0000-000006020203', 'a3000000-0000-0000-0000-000000060202',
  'Qual o nível de isolamento padrão do PostgreSQL?',
  '**READ COMMITTED**: nunca lê dado sujo, mas non-repeatable/phantom reads são possíveis. SERIALIZABLE elimina tudo, pagando em concorrência.', 3),
 ('f1000000-0000-0000-0000-000006020204', 'a3000000-0000-0000-0000-000000060202',
  'Como evitar o lost update num contador/saldo?',
  '**UPDATE atômico** (`SET saldo = saldo + 10`), `SELECT ... FOR UPDATE` (pessimista) ou coluna `@Version` (otimista, re-tenta no conflito).', 4),
 ('f1000000-0000-0000-0000-000006020205', 'a3000000-0000-0000-0000-000000060202',
  'Como o banco reage a um deadlock e como prevenir?',
  'Detecta o ciclo e **mata uma das transações** (re-tente na aplicação). Prevenção: transações **curtas** e locks adquiridos **sempre na mesma ordem**.', 5);

-- ─── Mensageria · Redis (060301) ─────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006030101', 'a3000000-0000-0000-0000-000000060301',
  'Descreva o padrão cache-aside.',
  'GET no cache → **hit**: devolve. **Miss**: busca no banco, grava no cache (com TTL) e devolve. A aplicação orquestra; o Redis não conhece o banco.', 1),
 ('f1000000-0000-0000-0000-000006030102', 'a3000000-0000-0000-0000-000000060301',
  'Como invalidar o cache quando o dado muda no banco?',
  '**DELETE da chave** na atualização (mais seguro que sobrescrever o valor) + **TTL sempre** como rede de segurança — a mentira dura no máximo N minutos.', 2),
 ('f1000000-0000-0000-0000-000006030103', 'a3000000-0000-0000-0000-000000060301',
  'O que é cache stampede?',
  'Chave quente expira e mil requisições caem no banco ao mesmo tempo. Mitigações: lock de reconstrução, TTL com jitter, refresh antecipado.', 3),
 ('f1000000-0000-0000-0000-000006030104', 'a3000000-0000-0000-0000-000000060301',
  'Que estrutura do Redis alimenta um ranking em tempo real?',
  '**Sorted Set** (ZADD/ZRANGE): score + membro, consultas por posição/faixa em O(log n). É o leaderboard pronto.', 4),
 ('f1000000-0000-0000-0000-000006030105', 'a3000000-0000-0000-0000-000000060301',
  'O que NÃO deve ir para o cache?',
  'Dados de **decisão crítica** (saldo antes do saque) e tudo que exige consistência forte. Cache é otimização com prazo de validade, nunca fonte de verdade.', 5);

-- ─── Mensageria · MongoDB (060302) ───────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000006030201', 'a3000000-0000-0000-0000-000000060302',
  'O que o MongoDB armazena, e onde?',
  '**Documentos** (BSON, JSON binário) em **coleções**. O agregado inteiro (pedido + itens) pode viver num documento — uma leitura, sem join.', 1),
 ('f1000000-0000-0000-0000-000006030202', 'a3000000-0000-0000-0000-000000060302',
  'Embutir vs referenciar: qual a regra?',
  '**O que é lido junto, mora junto** (embutir: itens do pedido). Dado compartilhado, de crescimento ilimitado ou vida própria → **referenciar** pelo id.', 2),
 ('f1000000-0000-0000-0000-000006030203', 'a3000000-0000-0000-0000-000000060302',
  '"Schema flexível" significa o quê, de verdade?',
  'O banco **não impõe** schema — mas ele continua existindo, implícito no código. Sem validação e migrações disciplinadas, a coleção vira pântano de versões.', 3),
 ('f1000000-0000-0000-0000-000006030204', 'a3000000-0000-0000-0000-000000060302',
  'Onde o modelo de documentos sofre?',
  'Dados **altamente relacionais** consultados por muitos caminhos, joins pesados ad-hoc e transações multi-documento complexas — território do SQL.', 4),
 ('f1000000-0000-0000-0000-000006030205', 'a3000000-0000-0000-0000-000000060302',
  'O que é persistência poliglota?',
  'Cada dado no armazenamento cujo modelo casa com o uso: PostgreSQL no núcleo transacional, Redis para cache/ranking, Mongo para agregados/eventos.', 5);

-- ─── DevOps · Docker imagens (070101) ────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007010101', 'a3000000-0000-0000-0000-000000070101',
  'Imagem, container e registry — analogia Java?',
  '**Imagem** = .jar (pacote imutável) · **container** = processo da JVM (instância em execução) · **registry** = Maven Central (repositório).', 1),
 ('f1000000-0000-0000-0000-000007010102', 'a3000000-0000-0000-0000-000000070101',
  'Por que containers não são VMs?',
  'Compartilham o **kernel do host** (isolados por namespaces/cgroups): sobem em milissegundos e pesam MB — a VM emula hardware e carrega SO inteiro.', 2),
 ('f1000000-0000-0000-0000-000007010103', 'a3000000-0000-0000-0000-000000070101',
  'O que é multi-stage build e o que ele economiza?',
  'Estágio 1 compila (JDK+Maven, pesado, descartado); estágio 2 só JRE + jar. Imagem final de ~200 MB em vez de ~800 MB, sem toolchain em produção.', 3),
 ('f1000000-0000-0000-0000-000007010104', 'a3000000-0000-0000-0000-000000070101',
  'Por que copiar pom.xml antes do src no Dockerfile?',
  '**Cache de camadas**: dependências mudam raramente e ficam cacheadas; editar código só reconstrói da camada do src em diante — rebuild em segundos.', 4),
 ('f1000000-0000-0000-0000-000007010105', 'a3000000-0000-0000-0000-000000070101',
  'Onde entram segredos num container?',
  '**Em runtime** (env vars, secrets do orquestrador) — nunca na imagem: imagem vai para registry, e registry vaza.', 5);

-- ─── DevOps · compose (070102) ───────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007010201', 'a3000000-0000-0000-0000-000000070102',
  'Como a API alcança o Postgres no docker-compose?',
  'Pelo **nome do serviço** (`db:5432`) — a rede interna resolve por DNS. `localhost` dentro do container é o **próprio container**.', 1),
 ('f1000000-0000-0000-0000-000007010202', 'a3000000-0000-0000-0000-000000070102',
  'Para que serve o mapeamento "8080:8080"?',
  'Expor a porta do container para o **host** (navegador, curl). Entre containers da mesma rede, a porta interna basta — o `ports` nem é necessário.', 2),
 ('f1000000-0000-0000-0000-000007010203', 'a3000000-0000-0000-0000-000000070102',
  'O que acontece com o banco sem volume no `compose down`?',
  '**Os dados somem** — o filesystem morre com o container. Volume nomeado (`pgdata:`) é o que persiste entre execuções.', 3),
 ('f1000000-0000-0000-0000-000007010204', 'a3000000-0000-0000-0000-000000070102',
  'Volume nomeado vs bind mount?',
  '**Nomeado**: gerenciado pelo Docker, padrão para dados de banco. **Bind mount** (`./src:/app`): pasta do host no container — útil em dev/hot reload.', 4),
 ('f1000000-0000-0000-0000-000007010205', 'a3000000-0000-0000-0000-000000070102',
  'Por que `depends_on` sozinho não basta para esperar o banco?',
  'Ele espera o container **iniciar**, não ficar pronto. Use `condition: service_healthy` + healthcheck (`pg_isready`) para eliminar o Connection refused.', 5);

-- ─── DevOps · K8s básico (070201) ────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007020101', 'a3000000-0000-0000-0000-000000070201',
  'Qual a ideia central do Kubernetes?',
  '**Estado desejado + reconciliação**: você declara (replicas: 3) e os controladores trabalham para a realidade convergir — pods mortos são repostos sozinhos.', 1),
 ('f1000000-0000-0000-0000-000007020102', 'a3000000-0000-0000-0000-000000070201',
  'O que é um Pod?',
  'A menor unidade: um ou mais containers que vivem/morrem juntos, com IP próprio. São **descartáveis** — quem os gerencia é o Deployment.', 2),
 ('f1000000-0000-0000-0000-000007020103', 'a3000000-0000-0000-0000-000000070201',
  'O que o Deployment faz?',
  'Mantém N réplicas da imagem declarada: repõe pods mortos, faz **rolling update** sem downtime e permite `rollout undo` (rollback).', 3),
 ('f1000000-0000-0000-0000-000007020104', 'a3000000-0000-0000-0000-000000070201',
  'O que o Service resolve?',
  'Pods têm IPs efêmeros; o Service dá **endereço/DNS estável** e balanceia entre os pods saudáveis, selecionados por **labels**.', 4),
 ('f1000000-0000-0000-0000-000007020105', 'a3000000-0000-0000-0000-000000070201',
  'Como o tráfego externo entra no cluster?',
  'Via **Ingress**: regras HTTP (host/caminho → Service) num ponto de entrada. ClusterIP (padrão) só existe dentro do cluster.', 5);

-- ─── DevOps · Config/probes (070202) ─────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007020201', 'a3000000-0000-0000-0000-000000070202',
  'ConfigMap vs Secret?',
  '**ConfigMap**: configuração não sensível (URLs, flags). **Secret**: credenciais/chaves, com RBAC — e Base64 **não é criptografia**; YAML de secret commitado = senha vazada.', 1),
 ('f1000000-0000-0000-0000-000007020202', 'a3000000-0000-0000-0000-000000070202',
  'Liveness vs readiness probe?',
  '**Liveness** falhou → container **reiniciado**. **Readiness** falhou → pod **sai do tráfego** (sem restart). App esperando dependência = not ready, não not alive.', 2),
 ('f1000000-0000-0000-0000-000007020203', 'a3000000-0000-0000-0000-000000070202',
  'Qual o bug clássico de liveness mal configurada?',
  'App saudável esperando o banco reiniciado **em loop** — reiniciar não resolve dependência externa; isso era caso de readiness.', 3),
 ('f1000000-0000-0000-0000-000007020204', 'a3000000-0000-0000-0000-000000070202',
  'O que são requests e limits?',
  '**requests**: reserva usada no agendamento do pod; **limits**: teto de CPU/memória (estourar memória = OOMKill). Sem eles, o orquestrador voa às cegas.', 4),
 ('f1000000-0000-0000-0000-000007020205', 'a3000000-0000-0000-0000-000000070202',
  'O que o HPA faz?',
  '**Horizontal Pod Autoscaler**: ajusta o número de réplicas pela carga (ex.: CPU > 70% → escala de 2 até 10 pods).', 5);

-- ─── DevOps · CI (070301) ────────────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007030101', 'a3000000-0000-0000-0000-000000070301',
  'Qual o objetivo central da integração contínua?',
  'Encurtar o tempo entre **introduzir** um problema e **descobri-lo**: verificação automática (build+testes+lint) a cada push, feedback em minutos.', 1),
 ('f1000000-0000-0000-0000-000007030102', 'a3000000-0000-0000-0000-000000070301',
  'Por que etapas baratas vêm primeiro no pipeline?',
  '**Fail fast**: a maioria dos erros cai na compilação/unitários — não gaste 30 min de E2E num código que nem compila.', 2),
 ('f1000000-0000-0000-0000-000007030103', 'a3000000-0000-0000-0000-000000070301',
  'Por que "verde é sagrado"?',
  'Pipeline vermelho tolerado ensina o time a **ignorá-lo** — e aí ele não protege mais nada. Quebrou = prioridade de consertar.', 3),
 ('f1000000-0000-0000-0000-000007030104', 'a3000000-0000-0000-0000-000000070301',
  'Como versionar a imagem gerada pelo CI?',
  'Com o **SHA do commit** (`api:9f3ab12`): produção sempre aponta para o código exato que a gerou. `latest` em produção = "que versão está no ar?".', 4),
 ('f1000000-0000-0000-0000-000007030105', 'a3000000-0000-0000-0000-000000070301',
  'O que é branch protection no fluxo de CI?',
  'O merge do PR é **bloqueado** até os checks passarem — código quebrado não entra na main por decreto, não por disciplina.', 5);

-- ─── DevOps · CD (070302) ────────────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000007030201', 'a3000000-0000-0000-0000-000000070302',
  'Continuous delivery vs continuous deployment?',
  '**Delivery**: todo commit verde gera artefato pronto para produção (deploy a um clique). **Deployment**: o clique também é automático.', 1),
 ('f1000000-0000-0000-0000-000007030202', 'a3000000-0000-0000-0000-000000070302',
  'Rolling update: vantagem e cuidado?',
  'Troca réplicas gradualmente, **sem downtime nem infra extra** — mas as duas versões convivem: banco e contratos precisam ser retrocompatíveis.', 2),
 ('f1000000-0000-0000-0000-000007030203', 'a3000000-0000-0000-0000-000000070302',
  'Blue-green vs canary?',
  '**Blue-green**: dois ambientes, vira a chave de uma vez (rollback = voltar a chave). **Canary**: fatia pequena de tráfego + métricas antes de expandir.', 3),
 ('f1000000-0000-0000-0000-000007030204', 'a3000000-0000-0000-0000-000000070302',
  'Como feature flags separam deploy de release?',
  'Código entra em produção **desligado**; liga-se gradualmente (1% → 100%) e desliga-se em segundos **sem deploy**. Custo: flags velhas são dívida — remova após consolidar.', 4),
 ('f1000000-0000-0000-0000-000007030205', 'a3000000-0000-0000-0000-000000070302',
  'O que é o padrão expand/contract para banco?',
  'Adicione o novo (expand) → migre o código → remova o velho (contract) só quando ninguém mais usa. Migração destrutiva imediata **impede rollback**.', 5);

-- ─── DSA · Big O (080101) ────────────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008010101', 'a3000000-0000-0000-0000-000000080101',
  'O que o Big O mede?',
  'Como o custo **cresce** com a entrada — a forma da curva, não segundos. O(n²) pode vencer O(n) para 10 itens; para milhões, a curva sempre ganha.', 1),
 ('f1000000-0000-0000-0000-000008010102', 'a3000000-0000-0000-0000-000000080101',
  'O(log n) sobre 1 milhão de elementos ≈ quantos passos?',
  '**~20** (2^20 ≈ 1M) — é o poder de cortar pela metade a cada passo (busca binária, árvores balanceadas).', 2),
 ('f1000000-0000-0000-0000-000008010103', 'a3000000-0000-0000-0000-000000080101',
  'Quais as regras de simplificação do Big O?',
  'Constantes caem (O(2n) = O(n)); só o termo dominante fica (O(n² + n) = O(n²)); entradas independentes usam letras diferentes (O(a·b)).', 3),
 ('f1000000-0000-0000-0000-000008010104', 'a3000000-0000-0000-0000-000000080101',
  'Qual o padrão de otimização mais comum na prática?',
  'Trocar busca repetida por **estrutura de apoio**: um HashSet/HashMap converte O(n²) (loop com contains) em O(n) — tempo comprado com memória.', 4),
 ('f1000000-0000-0000-0000-000008010105', 'a3000000-0000-0000-0000-000000080101',
  'Big O fala de qual caso, por padrão?',
  'Do **pior caso** — a garantia que você pode prometer. E não esqueça a complexidade de **espaço**: memória extra também conta.', 5);

-- ─── DSA · Coleções (080102) ─────────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008010201', 'a3000000-0000-0000-0000-000000080102',
  'ArrayList vs LinkedList — quem vence na prática?',
  '**ArrayList** quase sempre: get(i) O(1) e cache-friendly. O "insere no meio O(1)" da LinkedList ignora o O(n) para CHEGAR ao meio.', 1),
 ('f1000000-0000-0000-0000-000008010202', 'a3000000-0000-0000-0000-000000080102',
  'Por que add() do ArrayList é O(1) "amortizado"?',
  'Quando o array enche, aloca-se um maior e copia-se tudo (O(n)) — mas raramente; diluído entre as inserções, o custo médio é O(1).', 2),
 ('f1000000-0000-0000-0000-000008010203', 'a3000000-0000-0000-0000-000000080102',
  'Do que depende o O(1) do HashMap?',
  'De um **hashCode bem distribuído**. Todas as chaves no mesmo balde = busca linear (Java moderno converte baldes grandes em árvore, O(log n)).', 3),
 ('f1000000-0000-0000-0000-000008010204', 'a3000000-0000-0000-0000-000000080102',
  'O que TreeMap oferece que HashMap não tem?',
  '**Ordem** (iteração ordenada) e consultas de faixa: firstKey, floorKey, subMap — tudo em O(log n) via árvore rubro-negra.', 4),
 ('f1000000-0000-0000-0000-000008010205', 'a3000000-0000-0000-0000-000000080102',
  'Qual o erro de performance mais comum em código Java?',
  '`list.contains(x)` dentro de um loop: O(n²) disfarçado. Converta para **HashSet** antes do loop e vira O(n).', 5);

-- ─── DSA · Pilhas e filas (080201) ───────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008020101', 'a3000000-0000-0000-0000-000000080201',
  'LIFO vs FIFO?',
  '**Pilha** (LIFO): último a entrar, primeiro a sair — pratos empilhados. **Fila** (FIFO): primeiro a entrar, primeiro a sair — fila do banco.', 1),
 ('f1000000-0000-0000-0000-000008020102', 'a3000000-0000-0000-0000-000000080201',
  'Qual classe Java usar para pilha E para fila?',
  '**ArrayDeque**: push/pop/peek como pilha, offer/poll como fila — O(1) nas pontas. `java.util.Stack` é legada; evite.', 2),
 ('f1000000-0000-0000-0000-000008020103', 'a3000000-0000-0000-0000-000000080201',
  'Onde a pilha aparece na própria JVM?',
  'Na **call stack**: cada chamada de método empilha um frame; retornar desempilha. Recursão sem fim = StackOverflowError.', 3),
 ('f1000000-0000-0000-0000-000008020104', 'a3000000-0000-0000-0000-000000080201',
  'Esboce o algoritmo de parênteses balanceados.',
  'Abertura → **empilha**. Fechamento → pilha vazia OU topo não casa? inválido; senão desempilha. Fim: válido se a pilha estiver **vazia**. O(n).', 4),
 ('f1000000-0000-0000-0000-000008020105', 'a3000000-0000-0000-0000-000000080201',
  'Cite usos clássicos de fila.',
  'Mensageria (RabbitMQ), fila de tarefas do ExecutorService, **BFS** em grafos, buffer produtor-consumidor.', 5);

-- ─── DSA · Árvores e heaps (080202) ──────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008020201', 'a3000000-0000-0000-0000-000000080202',
  'Qual a propriedade da BST?',
  'Para cada nó: **menores à esquerda, maiores à direita**. Cada comparação descarta metade → busca O(log n) SE balanceada.', 1),
 ('f1000000-0000-0000-0000-000008020202', 'a3000000-0000-0000-0000-000000080202',
  'O que acontece ao inserir 1,2,3,4,5 em ordem numa BST ingênua?',
  'Degenera em **lista** (só filhos à direita): altura n, busca O(n). Árvores auto-balanceadas (AVL, rubro-negra) existem para impedir isso.', 2),
 ('f1000000-0000-0000-0000-000008020203', 'a3000000-0000-0000-0000-000000080202',
  'Que percurso visita uma BST em ordem crescente?',
  '**Em ordem** (esquerda → nó → direita) — é assim que TreeSet/TreeMap iteram ordenados.', 3),
 ('f1000000-0000-0000-0000-000008020204', 'a3000000-0000-0000-0000-000000080202',
  'O que um min-heap garante (e o que não)?',
  'Apenas **pai ≤ filhos**: o mínimo está na raiz (peek O(1)); o resto fica frouxo. Não serve para consultas de faixa — isso é BST.', 4),
 ('f1000000-0000-0000-0000-000008020205', 'a3000000-0000-0000-0000-000000080202',
  'Qual classe Java implementa o heap?',
  '**PriorityQueue**: offer/poll O(log n), peek O(1) — "processe sempre o mais prioritário" sem reordenar a coleção a cada inserção.', 5);

-- ─── DSA · Busca e ordenação (080301) ────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008030101', 'a3000000-0000-0000-0000-000000080301',
  'Qual o pré-requisito e o custo da busca binária?',
  'Array **ordenado** (inegociável — desordenado devolve lixo silencioso); custo O(log n): 1 milhão de itens ≈ 20 comparações.', 1),
 ('f1000000-0000-0000-0000-000008030102', 'a3000000-0000-0000-0000-000000080301',
  'Quais os 3 bugs clássicos ao implementar busca binária?',
  '`<` em vez de `<=` no loop (perde o último candidato), `(ini+fim)/2` (overflow — use ini + (fim-ini)/2) e esquecer o +1/-1 (loop infinito).', 2),
 ('f1000000-0000-0000-0000-000008030103', 'a3000000-0000-0000-0000-000000080301',
  'O que é um sort ESTÁVEL e por que importa?',
  'Preserva a ordem relativa dos **empates**: ordenar por data e depois por cliente mantém as datas ordenadas dentro de cada cliente — encadeamento depende disso.', 3),
 ('f1000000-0000-0000-0000-000008030104', 'a3000000-0000-0000-0000-000000080301',
  'O que o Java usa no sort?',
  'Primitivos: **dual-pivot quicksort**. Objetos/listas: **Timsort** (merge adaptativo, estável, explora trechos já ordenados). Ambos O(n log n).', 4),
 ('f1000000-0000-0000-0000-000008030105', 'a3000000-0000-0000-0000-000000080301',
  'Merge sort vs quick sort em uma linha?',
  '**Merge**: sempre O(n log n), estável, usa O(n) extra. **Quick**: mais rápido na prática, in-place, pior caso O(n²) (mitigado com pivô aleatório).', 5);

-- ─── DSA · Recursão e memo (080302) ──────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000008030201', 'a3000000-0000-0000-0000-000000080302',
  'Quais as duas partes obrigatórias de uma recursão correta?',
  '**Caso base** (resposta direta, o fundo do poço) e **passo recursivo** que reduz a entrada em direção a ele. Sem isso: StackOverflowError.', 1),
 ('f1000000-0000-0000-0000-000008030202', 'a3000000-0000-0000-0000-000000080302',
  'Por que fib recursivo ingênuo é O(2^n)?',
  'A árvore de chamadas **dobra a cada nível** e recomputa os mesmos subproblemas bilhões de vezes — fib(50) leva minutos.', 2),
 ('f1000000-0000-0000-0000-000008030203', 'a3000000-0000-0000-0000-000000080302',
  'O que é memoização?',
  'Guardar o resultado de cada subproblema na 1ª vez (Map) e consultar nas seguintes — cada subproblema resolvido UMA vez: fib cai de O(2^n) para **O(n)**.', 3),
 ('f1000000-0000-0000-0000-000008030204', 'a3000000-0000-0000-0000-000000080302',
  'Quando memoizar dá resultado?',
  'Quando há **subproblemas sobrepostos** (fibonacci sim; fatorial não) e a função é **pura** (mesmo argumento → mesma resposta, sem efeitos colaterais).', 4),
 ('f1000000-0000-0000-0000-000008030205', 'a3000000-0000-0000-0000-000000080302',
  'Como memoização vira programação dinâmica bottom-up?',
  'Em vez de recursão + cache (top-down), preenche-se a tabela **iterativamente** do caso base para cima — mesma ideia, sem risco de estourar a pilha.', 5);
