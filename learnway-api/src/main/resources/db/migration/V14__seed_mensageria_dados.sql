-- =====================================================================
-- LearnWay — seed "Mensageria & Dados"
--   * 3 subtopics encadeados: Mensageria -> SQL Avançado -> Redis & NoSQL
--   * 6 lessons com teoria completa
--   * 12 questões: MULTIPLE_CHOICE, DESCRIPTIVE e CODE_CHALLENGE
-- Convenção de UUIDs: sufixo determinístico (topic 06)
--   subtopic  a2…0000000006SS      lesson    a3…000000 06 SS LL
--   question  a4…0000 06 SS LL QQ  option    a5…00 06 SS LL QQ OO
--   descr.    a7…= question        code ch.  a6…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000601', 'a1000000-0000-0000-0000-000000000006', 'mensageria',   'Mensageria: RabbitMQ & Kafka', 'Filas, exchanges, tópicos, partições e garantias de entrega.', 1, NULL),
 ('a2000000-0000-0000-0000-000000000602', 'a1000000-0000-0000-0000-000000000006', 'sql-avancado', 'SQL Avançado',                 'Índices, planos de execução, transações e isolamento.',       2, 'a2000000-0000-0000-0000-000000000601'),
 ('a2000000-0000-0000-0000-000000000603', 'a1000000-0000-0000-0000-000000000006', 'redis-nosql',  'Redis & NoSQL',                'Cache, TTL, invalidação e o mundo dos documentos.',            3, 'a2000000-0000-0000-0000-000000000602');

-- ─── LESSONS: Mensageria ─────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000060101', 'a2000000-0000-0000-0000-000000000601', 'Filas e RabbitMQ',
$theory$
## Filas e RabbitMQ

Uma **fila de mensagens** desacopla quem produz trabalho de quem o executa: o produtor deposita a mensagem no **broker** e segue a vida; o consumidor processa no seu ritmo. Ganhos imediatos: absorver picos (a fila é o amortecedor), tolerar consumidor fora do ar e distribuir trabalho entre vários workers.

### O modelo do RabbitMQ
No RabbitMQ (protocolo AMQP), o produtor **nunca publica direto na fila** — publica numa **exchange**, que roteia para as filas conforme o tipo:

| Exchange | Roteia para… | Uso típico |
|---|---|---|
| **direct** | filas cuja *binding key* é igual à *routing key* | tarefa para um worker específico |
| **topic** | filas com padrão compatível (`pedido.*.criado`) | roteamento por assunto |
| **fanout** | **todas** as filas ligadas, ignorando a key | broadcast: um evento, N interessados |

```text
Produtor ─► exchange (topic: "pedido.br.criado")
                ├─► fila estoque      (binding: pedido.*.criado)
                └─► fila notificacoes (binding: pedido.#)
```

### Acknowledgement: a garantia central
O broker só remove a mensagem da fila quando o consumidor **confirma** (ack):

```text
consumidor recebe ─► processa ─► ACK   → broker apaga a mensagem
consumidor recebe ─► CRASH  (sem ack)  → broker REENTREGA a outro consumidor
```

- **Ack manual depois de processar** = garantia *at-least-once* (pelo menos uma vez). Consequência inevitável: **duplicatas podem acontecer** (processou e caiu antes do ack) — o consumidor precisa ser **idempotente**.
- **Auto-ack na entrega** = *at-most-once*: mais rápido, mas mensagem se perde se o consumidor cair no meio.

### Dead Letter Queue (DLQ)
E a mensagem "venenosa", que sempre falha (JSON inválido, bug)? Sem plano, ela volta para a fila e trava o consumo em loop eterno. A **DLQ** é a fila para onde vão as mensagens rejeitadas/expiradas após N tentativas — o time inspeciona, corrige e reprocessa com calma.

> Checklist do consumidor decente: ack manual **após** processar · idempotência (deduplicar por id da mensagem) · limite de tentativas com DLQ · métricas de profundidade da fila (fila crescendo = consumidores não dão conta).
$theory$, 15, 3, 1, 16),

 ('a3000000-0000-0000-0000-000000060102', 'a2000000-0000-0000-0000-000000000601', 'Kafka: o log distribuído',
$theory$
## Kafka: o log distribuído

O Kafka parece "outra fila", mas o modelo é diferente: um **log imutável e distribuído**. Entender isso explica todo o resto.

### Tópicos, partições e offsets
Um **tópico** é dividido em **partições** — cada uma é um arquivo de log *append-only*, onde cada mensagem ganha um **offset** sequencial:

```text
tópico "pedidos"
  partição 0: [0][1][2][3][4] ─► novas mensagens entram no fim
  partição 1: [0][1][2]
  partição 2: [0][1][2][3]
```

Diferença crucial vs fila tradicional: **consumir não apaga**. A mensagem fica pelo tempo de retenção (dias, ou para sempre), e cada consumidor apenas avança seu **offset** — um "marcador de página" próprio. Por isso é possível **reler do zero** (novo sistema, reprocessamento, replay após bug).

### Consumer groups: fila e broadcast ao mesmo tempo
Cada consumidor pertence a um **grupo**; o Kafka divide as partições entre os membros do grupo:

- **Dentro do grupo**: cada partição é lida por UM membro → trabalho **dividido** (comporta-se como fila).
- **Entre grupos**: cada grupo tem seus próprios offsets → todos recebem tudo (comporta-se como broadcast).

```text
                       ┌─ grupo "estoque"  (2 membros dividem as 3 partições)
tópico pedidos ────────┤
                       └─ grupo "faturamento" (1 membro lê as 3)
```

Limite prático: mais consumidores que partições = membros ociosos. **O número de partições define o paralelismo máximo** do grupo.

### Ordem: só dentro da partição
O Kafka garante ordem **por partição**, nunca entre partições. A ferramenta é a **chave da mensagem**: mensagens com a mesma chave (ex.: `pedidoId`) caem sempre na mesma partição — todos os eventos daquele pedido chegam em ordem. Sem chave, distribui round-robin (throughput ótimo, ordem global nenhuma).

### Kafka vs RabbitMQ: quando cada um
| | RabbitMQ | Kafka |
|---|---|---|
| Modelo | fila (mensagem some no ack) | log (mensagem fica, offset avança) |
| Roteamento | rico (exchanges, bindings) | simples (tópico + chave) |
| Replay | não (mensagem consumida já era) | **sim** — volte o offset |
| Vocação | tarefas/comandos, work queues, RPC | **eventos**, streaming, alto volume, múltiplos leitores |

> Regra de bolso: "faça este trabalho uma vez" → RabbitMQ. "Aconteceu isto; quem quiser reaja (inclusive quem ainda nem existe)" → Kafka.
$theory$, 15, 4, 2, 17);

-- ─── LESSONS: SQL Avançado ───────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000060201', 'a2000000-0000-0000-0000-000000000602', 'Índices e planos de execução',
$theory$
## Índices e planos de execução

### O que é um índice, de verdade
Sem índice, `WHERE email = 'ana@x.com'` obriga o banco a ler a tabela **inteira** (*sequential scan* — O(n)). Um **índice** é uma estrutura auxiliar (quase sempre uma **B-tree**) ordenada pela coluna, que localiza as linhas em **O(log n)** — como o índice remissivo de um livro.

```sql
CREATE INDEX idx_usuarios_email ON usuarios (email);
-- consultas por email deixam de varrer a tabela
```

### O preço: escrita e espaço
Cada `INSERT`/`UPDATE`/`DELETE` precisa atualizar **todos os índices** da tabela. Índice demais = escrita lenta + espaço desperdiçado. Indexe o que as consultas **realmente filtram/ordenam** — e nada além.

### Índice composto: a ordem das colunas importa
```sql
CREATE INDEX idx_pedidos ON pedidos (cliente_id, criado_em);
```
Este índice atende `WHERE cliente_id = ?` e `WHERE cliente_id = ? AND criado_em > ?` — mas **não ajuda** `WHERE criado_em > ?` sozinho. Pense numa lista telefônica ordenada por (sobrenome, nome): achar por sobrenome é fácil; achar todo mundo chamado "Ana" exige ler tudo. Regra: **colunas de igualdade primeiro, faixas/ordenação depois**.

### EXPLAIN: pergunte ao banco o plano dele
```sql
EXPLAIN ANALYZE
SELECT * FROM pedidos WHERE cliente_id = 42 ORDER BY criado_em DESC LIMIT 10;
```
O banco mostra o **plano de execução**: leia de dentro para fora e procure:

- **Seq Scan** em tabela grande com WHERE seletivo → falta índice (ou ele não é utilizável).
- **Index Scan / Index Only Scan** → o índice está sendo usado (o *only* nem toca a tabela: o índice **cobre** as colunas pedidas).
- **rows estimadas vs reais** muito diferentes → estatísticas desatualizadas (`ANALYZE`).

### Por que o banco às vezes IGNORA seu índice
- **Função sobre a coluna**: `WHERE LOWER(email) = ?` não usa o índice de `email` — crie um índice funcional: `CREATE INDEX ... ON usuarios (LOWER(email))`.
- **LIKE com curinga à esquerda**: `LIKE '%gmail.com'` não tem como usar B-tree.
- **Baixa seletividade**: filtrar `ativo = true` quando 95% são ativos — ler a tabela direto é mais barato, e o otimizador sabe disso.
- **Tipo incompatível/cast implícito** na comparação.

> Fluxo de otimização saudável: pegue a consulta lenta (log de *slow queries*) → `EXPLAIN ANALYZE` → descubra o scan culpado → crie/ajuste o índice → meça de novo. Nunca crie índice "no chute".
$theory$, 20, 4, 1, 17),

 ('a3000000-0000-0000-0000-000000060202', 'a2000000-0000-0000-0000-000000000602', 'Transações e níveis de isolamento',
$theory$
## Transações e níveis de isolamento

### ACID em uma linha cada
- **A**tomicidade — tudo ou nada (`COMMIT`/`ROLLBACK`).
- **C**onsistência — constraints e invariantes respeitadas ao fim.
- **I**solamento — transações concorrentes não se atrapalham *(o assunto desta lição)*.
- **D**urabilidade — commitou, sobreviveu (mesmo a queda de energia).

### Os fenômenos da concorrência
Duas transações mexendo nos mesmos dados podem produzir leituras estranhas:

| Fenômeno | O que acontece |
|---|---|
| **Dirty read** | ler dado que outra transação ainda **não commitou** (e pode sofrer rollback) |
| **Non-repeatable read** | ler a MESMA linha duas vezes e obter valores diferentes (alguém commitou no meio) |
| **Phantom read** | repetir um SELECT de faixa e ver linhas **novas** que surgiram no meio |

### Os níveis de isolamento
Cada nível elimina mais fenômenos — pagando mais em concorrência:

| Nível | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| READ UNCOMMITTED | possível¹ | possível | possível |
| **READ COMMITTED** *(padrão do PostgreSQL)* | não | possível | possível |
| REPEATABLE READ | não | não | possível² |
| SERIALIZABLE | não | não | não |

¹ No PostgreSQL, READ UNCOMMITTED se comporta como READ COMMITTED (dirty read nunca ocorre). ² No PostgreSQL, REPEATABLE READ também evita phantoms na prática (MVCC por snapshot).

No Spring: `@Transactional(isolation = Isolation.REPEATABLE_READ)`. O padrão (`DEFAULT`) herda o do banco.

### O clássico: lost update e como evitá-lo
Duas transações leem `saldo = 100`, cada uma soma 10 e grava 110 — um incremento **sumiu**. Soluções:

1. **UPDATE atômico**: \`UPDATE conta SET saldo = saldo + 10 WHERE id = ?\` — o banco serializa; a leitura e a escrita são uma operação.
2. **Lock pessimista**: `SELECT ... FOR UPDATE` tranca a linha até o commit (JPA: `@Lock(PESSIMISTIC_WRITE)`).
3. **Lock otimista**: coluna `@Version` na entidade — o UPDATE inclui `WHERE version = ?`; se outra transação passou antes, `OptimisticLockException` e você re-tenta. Ideal quando conflitos são raros.

### Deadlock
T1 tranca a linha A e quer B; T2 tranca B e quer A — abraço mortal. O banco detecta e **mata uma das duas** (erro de deadlock). Prevenção: transações **curtas** e adquirir locks **sempre na mesma ordem** (ex.: sempre por id crescente).

> Regras de ouro: transação curta (nunca inclua chamada HTTP externa dentro de uma!) · use UPDATE atômico quando puder · lock otimista por padrão, pessimista quando o conflito é frequente · trate erro de serialização/deadlock com retry.
$theory$, 20, 4, 2, 17);

-- ─── LESSONS: Redis & NoSQL ──────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000060301', 'a2000000-0000-0000-0000-000000000603', 'Redis: cache e além',
$theory$
## Redis: cache e além

O **Redis** é um armazenamento chave-valor **em memória**: latência de microssegundos, ordens de magnitude mais rápido que ir ao banco. O uso número 1 é **cache** — mas ele é bem mais que isso.

### Cache-aside: o padrão fundamental
A aplicação gerencia o cache explicitamente:

```text
1. GET cache["produto:42"]           ── HIT?  devolve e fim (microssegundos)
2. MISS → busca no banco (SELECT)
3. SET cache["produto:42"] = produto, TTL 5min
4. devolve
```

```java
Produto buscar(long id) {
    Produto p = redis.get("produto:" + id);
    if (p != null) return p;                    // cache hit
    p = repository.findById(id).orElseThrow();  // cache miss
    redis.set("produto:" + id, p, Duration.ofMinutes(5));
    return p;
}
```

### Os dois problemas eternos do cache
**1. Invalidação** — o produto mudou no banco; o cache está mentindo. Estratégias:
- **TTL** (expiração): simples e obrigatório como rede de segurança — a mentira dura no máximo N minutos.
- **Invalidação ativa**: ao atualizar o banco, **delete a chave** (`DEL produto:42`). Deletar é mais seguro que atualizar o valor (evita corridas entre escritores concorrentes).

**2. Stampede** — a chave quente expira e mil requisições simultâneas caem no banco ao mesmo tempo. Mitigações: lock de reconstrução (só um recalcula), TTL com jitter, ou refresh antecipado.

> A frase célebre existe por um motivo: *"There are only two hard things in Computer Science: cache invalidation and naming things."*

### O que cachear (e o que não)
- ✅ Leitura frequente + escrita rara + tolerância a leve atraso: catálogo, configurações, sessões, perfil.
- ❌ Dados de decisão crítica (saldo antes de sacar) e tudo que precise de consistência forte.

### Além do cache: as estruturas de dados
O Redis oferece estruturas nativas com operações atômicas:

| Estrutura | Operações | Uso clássico |
|---|---|---|
| String | GET/SET/INCR | cache, contadores |
| Hash | HGET/HSET | objetos campo a campo |
| List | LPUSH/RPOP | fila simples |
| Set | SADD/SISMEMBER | deduplicação, tags |
| **Sorted Set** | ZADD/ZRANGE | **ranking/leaderboard** em tempo real |
| chave + TTL + INCR | | **rate limiting** (N requisições por minuto) |

O `INCR` atômico merece destaque: contador de visitas, rate limit e semáforos simples sem race condition — o Redis executa comandos de forma single-threaded, um por vez.

> Cache é **otimização com prazo de validade**, não fonte de verdade. Desligue o Redis e o sistema deve continuar correto — só mais lento.
$theory$, 15, 3, 1, 16),

 ('a3000000-0000-0000-0000-000000060302', 'a2000000-0000-0000-0000-000000000603', 'MongoDB e o mundo dos documentos',
$theory$
## MongoDB e o mundo dos documentos

### O modelo: documentos, não linhas
O **MongoDB** guarda **documentos** (BSON — JSON binário) em **coleções**. O pedido que no relacional viraria 4 tabelas com joins pode ser **um documento**:

```json
{
  "_id": "981",
  "cliente": { "nome": "Ana", "email": "ana@x.com" },
  "itens": [
    { "sku": "CAFE-500", "quantidade": 2, "preco": 39.90 },
    { "sku": "CANECA",   "quantidade": 1, "preco": 25.00 }
  ],
  "status": "PAGO",
  "criadoEm": "2026-07-16T10:30:00Z"
}
```

Uma leitura traz o agregado inteiro, sem join. Consultas e índices funcionam sobre campos aninhados (`{"itens.sku": "CAFE-500"}`).

### "Schema flexível" não é "sem design"
O Mongo não **impõe** schema — documentos da mesma coleção podem divergir. Isso facilita evolução, mas o schema **continua existindo, implícito no código**. Sem disciplina (validação na aplicação, migrações de dados planejadas), a coleção vira um pântano de versões de documento. Flexibilidade é adiamento de decisão, não ausência dela.

### A decisão central de modelagem: embutir ou referenciar
| | **Embutir** (subdocumento) | **Referenciar** (guardar o id) |
|---|---|---|
| Leitura | 1 acesso traz tudo | exige 2ª consulta (ou $lookup) |
| Exemplo | itens dentro do pedido | autor referenciado no post |
| Quando | dado vive e morre com o pai, lido junto, cardinalidade limitada | dado compartilhado entre pais, cresce sem limite, atualizado com frequência própria |

Regra prática: **o que é lido junto, mora junto**. Itens do pedido: embuta. Autor de milhares de posts: referencie (senão cada mudança de nome atualiza milhares de documentos).

### Onde documentos brilham — e onde sofrem
- ✅ Agregados autocontidos (pedido, perfil, catálogo), eventos/logs, dados semiestruturados que variam de item para item, iteração rápida de produto.
- ❌ Dados **altamente relacionais** consultados por muitos caminhos diferentes (financeiro, ERP), transações multi-documento complexas (existem, mas são o plano B do modelo), relatórios ad-hoc com joins pesados — território do SQL.

### O ecossistema em um parágrafo
Réplica (replica set) dá alta disponibilidade; **sharding** distribui coleções gigantes entre máquinas; índices são B-trees como no SQL (as mesmas regras de composto/seletividade valem!); o *aggregation pipeline* faz o papel de GROUP BY/transformações no servidor.

> Não existe "SQL vs NoSQL, escolha um time". Sistemas reais são **poliglotas**: PostgreSQL para o núcleo transacional, Redis para cache/ranking, Mongo para agregados/eventos — cada dado no armazenamento cujo modelo casa com seu uso.
$theory$, 15, 3, 2, 15);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: RabbitMQ -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006010101', 'a3000000-0000-0000-0000-000000060101', 'MULTIPLE_CHOICE',
  'Um consumidor com ack manual processa a mensagem e CAI antes de confirmar. O que o broker faz?', 'O ack é o que apaga a mensagem.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000006010102', 'a3000000-0000-0000-0000-000000060101', 'MULTIPLE_CHOICE',
  'Um evento precisa chegar a TODAS as filas ligadas, ignorando routing key. Qual exchange usar?', 'É um broadcast.', 2, 5, 3);

-- L2: Kafka -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006010201', 'a3000000-0000-0000-0000-000000060102', 'MULTIPLE_CHOICE',
  'Como garantir que todos os eventos de um MESMO pedido sejam consumidos em ordem no Kafka?', 'Ordem só existe dentro de uma partição.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000006010202', 'a3000000-0000-0000-0000-000000060102', 'DESCRIPTIVE',
  'Explique a diferença fundamental entre o modelo do Kafka (log) e o de uma fila tradicional (RabbitMQ), e dê um cenário em que o replay de mensagens do Kafka é decisivo.', 'Consumir apaga? O offset é de quem?', 2, 10, 4);

-- L3: Índices -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006020101', 'a3000000-0000-0000-0000-000000060201', 'MULTIPLE_CHOICE',
  'Existe o índice composto `(cliente_id, criado_em)`. Qual consulta ele NÃO consegue atender bem?', 'Lista telefônica: (sobrenome, nome).', 1, 5, 4),
 ('a4000000-0000-0000-0000-000006020102', 'a3000000-0000-0000-0000-000000060201', 'MULTIPLE_CHOICE',
  'Por que não se deve simplesmente indexar TODAS as colunas de uma tabela?', 'Quem paga a conta é a escrita.', 2, 5, 3);

-- L4: Transações -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006020201', 'a3000000-0000-0000-0000-000000060202', 'MULTIPLE_CHOICE',
  'Duas transações leem saldo=100, somam 10 cada e gravam 110 — um incremento se perdeu. Qual a correção mais simples e robusta?', 'Deixe o banco fazer a conta.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000006020202', 'a3000000-0000-0000-0000-000000060202', 'DESCRIPTIVE',
  'O que é um deadlock entre duas transações, como o banco reage, e quais duas práticas reduzem a chance de ele acontecer?', 'Cada uma segura o que a outra quer.', 2, 10, 4);

-- L5: Redis -> 1 MC + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006030101', 'a3000000-0000-0000-0000-000000060301', 'MULTIPLE_CHOICE',
  'No padrão cache-aside, o que a aplicação faz num cache MISS?', 'Quem popula o cache é a própria aplicação.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000006030102', 'a3000000-0000-0000-0000-000000060301', 'CODE_CHALLENGE',
  'Implemente o padrão cache-aside em `CatalogoService.buscarProduto(id)`: consulte o cache (Map) primeiro; no miss, busque no repositório, guarde no cache e devolva.', 'GET no cache -> miss? busca no repo -> SET no cache -> devolve.', 2, 15, 3);

-- L6: MongoDB -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000006030201', 'a3000000-0000-0000-0000-000000060302', 'MULTIPLE_CHOICE',
  'Ao modelar pedidos no MongoDB, quando EMBUTIR os itens dentro do documento do pedido é a escolha certa?', 'O que é lido junto, mora junto.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000006030202', 'a3000000-0000-0000-0000-000000060302', 'MULTIPLE_CHOICE',
  '"O MongoDB não tem schema" — qual a leitura correta dessa afirmação?', 'O schema sai do banco, mas vai para onde?', 2, 5, 4);

-- ─── OPTIONS ─────────────────────────────────────────────────────────
-- L1 Q1: crash sem ack
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000601010101', 'a4000000-0000-0000-0000-000006010101', 'Reentrega a mensagem a outro consumidor — por isso o processamento precisa ser idempotente.', TRUE,  'Correto: sem ack, o broker assume falha e reentrega (at-least-once). Duplicatas são possíveis por design.', 1),
 ('a5000000-0000-0000-0000-000601010102', 'a4000000-0000-0000-0000-000006010101', 'A mensagem é perdida definitivamente.', FALSE, 'Perda seria no auto-ack (at-most-once); com ack manual a mensagem volta.', 2),
 ('a5000000-0000-0000-0000-000601010103', 'a4000000-0000-0000-0000-000006010101', 'O broker faz rollback do processamento do consumidor.', FALSE, 'O broker não conhece nem controla o que o consumidor fez — só sabe do ack.', 3),
 ('a5000000-0000-0000-0000-000601010104', 'a4000000-0000-0000-0000-000006010101', 'A fila trava até o consumidor voltar.', FALSE, 'A mensagem é redistribuída aos consumidores vivos; a fila segue.', 4);

-- L1 Q2: fanout
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000601010201', 'a4000000-0000-0000-0000-000006010102', 'fanout', TRUE,  'Correto: fanout copia a mensagem para todas as filas ligadas, ignorando a routing key.', 1),
 ('a5000000-0000-0000-0000-000601010202', 'a4000000-0000-0000-0000-000006010102', 'direct', FALSE, 'direct exige match exato da routing key — entrega seletiva, não broadcast.', 2),
 ('a5000000-0000-0000-0000-000601010203', 'a4000000-0000-0000-0000-000006010102', 'topic', FALSE, 'topic roteia por padrão (pedido.*) — broadcast só se todas as bindings forem #.', 3),
 ('a5000000-0000-0000-0000-000601010204', 'a4000000-0000-0000-0000-000006010102', 'headers', FALSE, 'headers roteia por atributos do cabeçalho, não é broadcast.', 4);

-- L2 Q1: ordem por chave
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000601020101', 'a4000000-0000-0000-0000-000006010201', 'Usar o id do pedido como CHAVE da mensagem — mesma chave cai sempre na mesma partição, onde a ordem é garantida.', TRUE,  'Correto: ordem existe por partição; a chave garante que os eventos do pedido fiquem juntos e ordenados.', 1),
 ('a5000000-0000-0000-0000-000601020102', 'a4000000-0000-0000-0000-000006010201', 'Usar um tópico com uma única partição para todo o sistema.', FALSE, 'Funciona, mas mata o paralelismo inteiro — a chave resolve por pedido sem esse custo.', 2),
 ('a5000000-0000-0000-0000-000601020103', 'a4000000-0000-0000-0000-000006010201', 'O Kafka já garante ordem global entre todas as partições.', FALSE, 'Não garante — ordem é estritamente por partição.', 3),
 ('a5000000-0000-0000-0000-000601020104', 'a4000000-0000-0000-0000-000006010201', 'Colocar timestamp na mensagem e reordenar no consumidor.', FALSE, 'Reordenação manual é frágil e complexa; a solução idiomática é a chave de partição.', 4);

-- L3 Q1: composto
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000602010101', 'a4000000-0000-0000-0000-000006020101', 'WHERE criado_em > ? (sem filtrar cliente_id)', TRUE,  'Correto: o índice é ordenado primeiro por cliente_id; sem ele, a segunda coluna não tem ordenação aproveitável.', 1),
 ('a5000000-0000-0000-0000-000602010102', 'a4000000-0000-0000-0000-000006020101', 'WHERE cliente_id = ?', FALSE, 'Usa o prefixo do índice perfeitamente.', 2),
 ('a5000000-0000-0000-0000-000602010103', 'a4000000-0000-0000-0000-000006020101', 'WHERE cliente_id = ? AND criado_em > ?', FALSE, 'O caso ideal: igualdade no prefixo + faixa na segunda coluna.', 3),
 ('a5000000-0000-0000-0000-000602010104', 'a4000000-0000-0000-0000-000006020101', 'WHERE cliente_id = ? ORDER BY criado_em DESC', FALSE, 'Também aproveita: filtra pelo prefixo e lê já ordenado pela segunda coluna.', 4);

-- L3 Q2: custo de índice
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000602010201', 'a4000000-0000-0000-0000-000006020102', 'Cada escrita (INSERT/UPDATE/DELETE) precisa atualizar todos os índices — escrita lenta e espaço desperdiçado.', TRUE,  'Correto: índice é estrutura redundante mantida a cada mudança; indexe só o que as consultas usam.', 1),
 ('a5000000-0000-0000-0000-000602010202', 'a4000000-0000-0000-0000-000006020102', 'Bancos limitam a um índice por tabela.', FALSE, 'Tabelas costumam ter vários índices — o limite é o custo, não a contagem.', 2),
 ('a5000000-0000-0000-0000-000602010203', 'a4000000-0000-0000-0000-000006020102', 'Índices deixam os SELECTs mais lentos.', FALSE, 'SELECTs são os beneficiados; o custo recai nas escritas.', 3),
 ('a5000000-0000-0000-0000-000602010204', 'a4000000-0000-0000-0000-000006020102', 'Nenhum motivo — mais índices é sempre melhor.', FALSE, 'Todo índice cobra manutenção em cada escrita; excesso é dívida.', 4);

-- L4 Q1: lost update
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000602020101', 'a4000000-0000-0000-0000-000006020201', 'UPDATE atômico: SET saldo = saldo + 10 — a leitura e a soma acontecem no banco, serializadas.', TRUE,  'Correto: elimina a janela ler-modificar-gravar da aplicação. Alternativas: SELECT FOR UPDATE ou @Version.', 1),
 ('a5000000-0000-0000-0000-000602020102', 'a4000000-0000-0000-0000-000006020201', 'Adicionar synchronized no método Java.', FALSE, 'Só protege UMA JVM — com 2 instâncias da aplicação, a corrida volta.', 2),
 ('a5000000-0000-0000-0000-000602020103', 'a4000000-0000-0000-0000-000006020201', 'Usar READ UNCOMMITTED para as duas enxergarem tudo.', FALSE, 'Reduzir isolamento AGRAVA anomalias, nunca corrige.', 3),
 ('a5000000-0000-0000-0000-000602020104', 'a4000000-0000-0000-0000-000006020201', 'Reexecutar a transação duas vezes para compensar.', FALSE, 'Repetir a operação com corrida só multiplica o problema.', 4);

-- L5 Q1: cache-aside miss
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000603010101', 'a4000000-0000-0000-0000-000006030101', 'Busca no banco, grava o resultado no cache (com TTL) e devolve.', TRUE,  'Correto: a aplicação é responsável por popular o cache no miss — é o "aside".', 1),
 ('a5000000-0000-0000-0000-000603010102', 'a4000000-0000-0000-0000-000006030101', 'Devolve null — se não está no cache, o dado não existe.', FALSE, 'O cache é acelerador, não fonte de verdade; o miss segue para o banco.', 2),
 ('a5000000-0000-0000-0000-000603010103', 'a4000000-0000-0000-0000-000006030101', 'O próprio Redis busca no banco automaticamente.', FALSE, 'No cache-aside o Redis não conhece o banco; quem orquestra é a aplicação.', 3),
 ('a5000000-0000-0000-0000-000603010104', 'a4000000-0000-0000-0000-000006030101', 'Espera até alguém popular a chave.', FALSE, 'Ninguém vai popular — a requisição atual é quem busca e grava.', 4);

-- L6 Q1: embutir
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000603020101', 'a4000000-0000-0000-0000-000006030201', 'Quando os itens vivem e morrem com o pedido, são lidos junto com ele e têm cardinalidade limitada.', TRUE,  'Correto: "o que é lido junto, mora junto" — o agregado autocontido é o ponto forte do documento.', 1),
 ('a5000000-0000-0000-0000-000603020102', 'a4000000-0000-0000-0000-000006030201', 'Sempre — embutir é a única forma de relacionar dados no Mongo.', FALSE, 'Referências (guardar ids) existem e são corretas para dados compartilhados/crescimento ilimitado.', 2),
 ('a5000000-0000-0000-0000-000603020103', 'a4000000-0000-0000-0000-000006030201', 'Quando os itens são compartilhados entre muitos pedidos diferentes.', FALSE, 'Dado compartilhado é o caso clássico de REFERENCIAR, senão cada mudança replica em N documentos.', 3),
 ('a5000000-0000-0000-0000-000603020104', 'a4000000-0000-0000-0000-000006030201', 'Nunca — subdocumentos não podem ser indexados.', FALSE, 'Índices sobre campos aninhados (itens.sku) funcionam normalmente.', 4);

-- L6 Q2: schema flexível
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000603020201', 'a4000000-0000-0000-0000-000006030202', 'O banco não IMPÕE schema, mas ele continua existindo implícito no código — e exige disciplina de validação e migração.', TRUE,  'Correto: flexibilidade é adiamento de decisão; sem governança a coleção acumula versões incompatíveis de documento.', 1),
 ('a5000000-0000-0000-0000-000603020202', 'a4000000-0000-0000-0000-000006030202', 'Significa que qualquer estrutura é sempre válida e o design de dados deixa de importar.', FALSE, 'O design importa tanto quanto no SQL — só muda de lugar (aplicação).', 2),
 ('a5000000-0000-0000-0000-000603020203', 'a4000000-0000-0000-0000-000006030202', 'É falsa: o Mongo exige DDL de coleção como o SQL.', FALSE, 'Não exige DDL; a afirmação é verdadeira no sentido de imposição, e é isso que precisa de leitura cuidadosa.', 3),
 ('a5000000-0000-0000-0000-000603020204', 'a4000000-0000-0000-0000-000006030202', 'Significa que índices não são necessários.', FALSE, 'Índices continuam essenciais para consultas — schema e índice são assuntos separados.', 4);

-- ─── DESCRIPTIVE ANSWERS ─────────────────────────────────────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000006010202', 'a4000000-0000-0000-0000-000006010202',
  'Fila tradicional: a mensagem é consumida e REMOVIDA no ack — é um repasse de trabalho; quem chegou depois não vê o que já passou. Kafka: log imutável append-only — consumir não apaga nada; cada consumidor/grupo apenas avança seu offset, e as mensagens ficam pela retenção configurada. Isso permite N grupos independentes lerem tudo e permite REPLAY: voltar o offset e reprocessar. Cenário decisivo: um bug no consumidor corrompeu os dados derivados dos últimos 3 dias — com Kafka, corrige-se o código e reprocessa-se o tópico do offset antigo; numa fila tradicional as mensagens já não existem. Outro: um sistema novo (ex.: analytics) entra hoje e consome o histórico inteiro.',
  'Deve contrastar remoção-no-ack vs log com offsets por consumidor, e dar um cenário concreto de replay (reprocessamento após bug, novo consumidor lendo histórico, reconstrução de projeção). Bônus por citar retenção configurável ou consumer groups.'),
 ('a7000000-0000-0000-0000-000006020202', 'a4000000-0000-0000-0000-000006020202',
  'Deadlock: T1 tranca o recurso A e espera B, enquanto T2 trancou B e espera A — nenhuma pode avançar. O banco detecta o ciclo de espera e mata uma das transações (erro de deadlock), que deve ser re-tentada pela aplicação. Prevenção: (1) adquirir locks sempre na MESMA ORDEM (ex.: sempre por id crescente), eliminando o ciclo; (2) transações curtas — sem chamadas HTTP/processamento longo dentro da transação, menos tempo segurando locks. Também ajudam: reduzir o número de linhas tocadas e usar lock otimista onde possível.',
  'Deve descrever o ciclo de espera mútua, mencionar que o banco detecta e aborta uma vítima (e que a aplicação re-tenta), e citar duas prevenções válidas (ordem consistente de aquisição, transações curtas, menos locks, otimista). Penalizar se disser que o banco resolve sozinho sem abortar ninguém.');

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000006030102', 'a4000000-0000-0000-0000-000006030102',
$initial$import java.util.HashMap;
import java.util.Map;

// Simula o repositório (lento, vai "ao banco")
interface ProdutoRepository {
    String buscarNome(long id);
}

class CatalogoService {
    private final ProdutoRepository repo;
    private final Map<Long, String> cache = new HashMap<>();
    int idasAoBanco = 0; // contador para os testes

    CatalogoService(ProdutoRepository repo) { this.repo = repo; }

    // TODO cache-aside:
    // 1) se o id está no cache, devolva direto (sem tocar o repo)
    // 2) no miss: busque no repo, guarde no cache e devolva
    String buscarProduto(long id) {
        idasAoBanco++;
        return repo.buscarNome(id);
    }
}
$initial$,
$solution$import java.util.HashMap;
import java.util.Map;

interface ProdutoRepository {
    String buscarNome(long id);
}

class CatalogoService {
    private final ProdutoRepository repo;
    private final Map<Long, String> cache = new HashMap<>();
    int idasAoBanco = 0;

    CatalogoService(ProdutoRepository repo) { this.repo = repo; }

    String buscarProduto(long id) {
        String hit = cache.get(id);
        if (hit != null) {
            return hit;                    // cache hit: não toca o banco
        }
        idasAoBanco++;                     // cache miss
        String nome = repo.buscarNome(id);
        cache.put(id, nome);               // popula para as próximas
        return nome;
    }
}
$solution$,
 '[{"input": "buscarProduto(42) duas vezes seguidas", "expected_output": "mesmo nome nas duas; idasAoBanco == 1"}, {"input": "buscarProduto(42); buscarProduto(7)", "expected_output": "idasAoBanco == 2 (ids diferentes, dois misses)"}]'::jsonb,
 'java',
 'Avalie se buscarProduto consulta o cache primeiro e retorna direto no hit (sem incrementar idasAoBanco nem chamar o repo), e se no miss busca no repo, grava no cache e devolve. Aceite computeIfAbsent desde que o contador continue refletindo só os misses. Penalize soluções que sempre vão ao banco, que nunca populam o cache, ou que gravam antes de buscar o valor.');
