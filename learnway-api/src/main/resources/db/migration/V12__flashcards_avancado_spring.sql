-- =====================================================================
-- LearnWay — Flashcards das trilhas "Java — Avançado" e "Spring"
-- 5 cartas por lição × 16 lições = 80 cartas.
-- UUID (mesma convenção do V6): f1000000-0000-0000-0000-0000<lição:6><carta:2>
-- =====================================================================

-- ─── Java Avançado · Threads e Runnable (030101) ─────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003010101', 'a3000000-0000-0000-0000-000000030101',
  'Qual a diferença entre `t.start()` e `t.run()`?',
  '`start()` executa `run()` numa **nova thread**; `run()` chamado direto roda na thread atual, como método comum — sem paralelismo.', 1),
 ('f1000000-0000-0000-0000-000003010102', 'a3000000-0000-0000-0000-000000030101',
  'O que faz `t.join()`?',
  'Faz a thread **atual esperar** até `t` terminar. Útil para sincronizar o fim de trabalhos paralelos.', 2),
 ('f1000000-0000-0000-0000-000003010103', 'a3000000-0000-0000-0000-000000030101',
  'O que é uma **daemon thread**?',
  'Thread de fundo que **não impede a JVM de encerrar**. Quando só restam daemons, a JVM morre. Configure com `setDaemon(true)` antes do `start()`.', 3),
 ('f1000000-0000-0000-0000-000003010104', 'a3000000-0000-0000-0000-000000030101',
  'Quais os principais estados de uma thread?',
  '`NEW` → `RUNNABLE` → (`BLOCKED`/`WAITING`/`TIMED_WAITING`) → `TERMINATED`. Consultável via `t.getState()`.', 4),
 ('f1000000-0000-0000-0000-000003010105', 'a3000000-0000-0000-0000-000000030101',
  'O que é `Runnable`?',
  'Interface funcional com um único método `void run()` — a **tarefa** a executar. Vira lambda: `Runnable r = () -> trabalho();`.', 5);

-- ─── Java Avançado · Race conditions e sincronização (030102) ────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003010201', 'a3000000-0000-0000-0000-000000030102',
  'O que é uma **race condition**?',
  'Resultado que depende da ordem de execução de threads acessando **dado mutável compartilhado** sem coordenação. Ex.: dois `valor++` simultâneos perdendo um incremento.', 1),
 ('f1000000-0000-0000-0000-000003010202', 'a3000000-0000-0000-0000-000000030102',
  'O que `synchronized` garante?',
  '**Exclusão mútua** (uma thread por vez no bloco) e **visibilidade** (mudanças visíveis a quem pegar o mesmo lock depois).', 2),
 ('f1000000-0000-0000-0000-000003010203', 'a3000000-0000-0000-0000-000000030102',
  'O que `volatile` garante — e o que NÃO garante?',
  'Garante **visibilidade** da escrita entre threads. NÃO garante atomicidade: `contador++` continua quebrado mesmo volatile.', 3),
 ('f1000000-0000-0000-0000-000003010204', 'a3000000-0000-0000-0000-000000030102',
  'Como incrementar um contador compartilhado **sem lock**?',
  '`AtomicInteger.incrementAndGet()` — operação atômica via **CAS** (compare-and-swap), escala melhor que synchronized para operações simples.', 4),
 ('f1000000-0000-0000-0000-000003010205', 'a3000000-0000-0000-0000-000000030102',
  'O que é **deadlock** e como prevenir o caso clássico?',
  'Duas threads, cada uma segurando um lock e esperando o da outra — travamento eterno. Prevenção: **adquirir os locks sempre na mesma ordem**.', 5);

-- ─── Java Avançado · ExecutorService (030201) ────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003020101', 'a3000000-0000-0000-0000-000000030201',
  'Por que usar um **pool de threads** em vez de `new Thread` por tarefa?',
  'Threads são caras (stack, troca de contexto). O pool **reutiliza** um conjunto fixo de threads para uma fila de tarefas.', 1),
 ('f1000000-0000-0000-0000-000003020102', 'a3000000-0000-0000-0000-000000030201',
  '`Runnable` vs `Callable<V>` num executor?',
  '`Callable` **devolve valor** (via `Future<V>`) e pode lançar exceção checked; `Runnable` é `void` e não lança checked.', 2),
 ('f1000000-0000-0000-0000-000003020103', 'a3000000-0000-0000-0000-000000030201',
  'O que `Future.get()` faz?',
  '**Bloqueia** a thread atual até o resultado ficar pronto (ou exceção/timeout). Por isso surgiu o CompletableFuture, que compõe sem bloquear.', 3),
 ('f1000000-0000-0000-0000-000003020104', 'a3000000-0000-0000-0000-000000030201',
  'O que acontece se você esquecer o `shutdown()` do pool?',
  'As worker threads (não-daemon) ficam vivas esperando tarefas e a **JVM não encerra**.', 4),
 ('f1000000-0000-0000-0000-000003020105', 'a3000000-0000-0000-0000-000000030201',
  'Quando usar **virtual threads** (Java 21+)?',
  'Para muitas tarefas **bloqueantes de I/O** — são baratíssimas (milhares custam pouco). Para CPU pesada, o pool de threads de plataforma continua adequado.', 5);

-- ─── Java Avançado · CompletableFuture (030202) ──────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003020201', 'a3000000-0000-0000-0000-000000030202',
  'Qual a vantagem do `CompletableFuture` sobre `Future`?',
  'Em vez de bloquear com `get()`, você **declara o pipeline**: `thenApply`, `thenCompose`, `thenCombine`, `exceptionally` — reação assíncrona ao resultado.', 1),
 ('f1000000-0000-0000-0000-000003020202', 'a3000000-0000-0000-0000-000000030202',
  '`thenApply` vs `thenCompose`?',
  '`thenApply` = **map** (função devolve valor). `thenCompose` = **flatMap** (função devolve outro CompletableFuture — evita CF<CF<T>>).', 2),
 ('f1000000-0000-0000-0000-000003020203', 'a3000000-0000-0000-0000-000000030202',
  'Como juntar dois futuros **independentes**?',
  '`f1.thenCombine(f2, (a, b) -> juntar(a, b))` — os dois rodam em paralelo; a função roda quando ambos completam. Para vários: `CompletableFuture.allOf(...)`.', 3),
 ('f1000000-0000-0000-0000-000003020204', 'a3000000-0000-0000-0000-000000030202',
  'Como tratar erro num pipeline assíncrono?',
  '`exceptionally(ex -> fallback)` roda só no erro; `handle((valor, erro) -> ...)` roda sempre, recebendo um OU outro.', 4),
 ('f1000000-0000-0000-0000-000003020205', 'a3000000-0000-0000-0000-000000030202',
  'Em qual thread roda `supplyAsync` sem executor explícito?',
  'No **ForkJoinPool.commonPool()**, dimensionado para CPU. Para I/O bloqueante, passe um executor próprio — saturar o common pool trava a aplicação toda.', 5);

-- ─── Java Avançado · Reflection (030301) ─────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003030101', 'a3000000-0000-0000-0000-000000030301',
  'O que é **reflection**?',
  'Inspecionar e manipular classes/métodos/campos **em runtime**: descobrir membros, instanciar por nome, invocar dinamicamente.', 1),
 ('f1000000-0000-0000-0000-000003030102', 'a3000000-0000-0000-0000-000000030301',
  '`getMethods()` vs `getDeclaredMethods()`?',
  '`getMethods()`: só **públicos, incluindo herdados**. `getDeclaredMethods()`: **todos os declarados na classe** (private incluso), sem herdados.', 2),
 ('f1000000-0000-0000-0000-000003030103', 'a3000000-0000-0000-0000-000000030301',
  'Como ler um campo `private` via reflection?',
  '`getDeclaredField("x")` + `setAccessible(true)` + `get(objeto)`. É o que Hibernate e Jackson fazem por baixo.', 3),
 ('f1000000-0000-0000-0000-000003030104', 'a3000000-0000-0000-0000-000000030301',
  'Por que a JPA exige construtor sem argumentos nas entidades?',
  'O Hibernate **instancia via reflection** (não conhece a classe em compilação) chamando o construtor vazio, e depois preenche os campos um a um.', 4),
 ('f1000000-0000-0000-0000-000003030105', 'a3000000-0000-0000-0000-000000030301',
  'Quais os custos do reflection?',
  'Mais **lento** que chamada direta, erros de tipo só em **runtime**, e refatorações não alcançam nomes em String. Use para frameworks, não para código de negócio.', 5);

-- ─── Java Avançado · Anotações (030302) ──────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003030201', 'a3000000-0000-0000-0000-000000030302',
  'Uma anotação executa alguma coisa por si só?',
  '**Não** — é só metadado. Algum código precisa **lê-la** (reflection, processador) e agir. O padrão é: anotar + varrer + agir.', 1),
 ('f1000000-0000-0000-0000-000003030202', 'a3000000-0000-0000-0000-000000030302',
  'O que `@Retention(RetentionPolicy.RUNTIME)` faz?',
  'Mantém a anotação **visível em runtime** para reflection (`getAnnotation`). `SOURCE` descarta na compilação; `CLASS` fica no bytecode mas invisível ao runtime.', 2),
 ('f1000000-0000-0000-0000-000003030203', 'a3000000-0000-0000-0000-000000030302',
  'O que `@Target` controla?',
  '**Onde** a anotação pode ser aplicada: `TYPE`, `METHOD`, `FIELD`, `PARAMETER`, `CONSTRUCTOR`…', 3),
 ('f1000000-0000-0000-0000-000003030204', 'a3000000-0000-0000-0000-000000030302',
  'Como declarar uma anotação com elemento e valor padrão?',
  '`public @interface Auditado { String acao(); boolean logar() default false; }` — elemento `value()` pode ser passado sem nome.', 4),
 ('f1000000-0000-0000-0000-000003030205', 'a3000000-0000-0000-0000-000000030302',
  'Como o Spring dá vida ao `@Transactional`?',
  'Um **proxy** intercepta a chamada do método anotado: abre a transação antes, delega, e commita/faz rollback no retorno. A anotação é lida via reflection no boot.', 5);

-- ─── Java Avançado · Padrões criacionais (030401) ────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003040101', 'a3000000-0000-0000-0000-000000030401',
  'O que garante o padrão **Singleton**?',
  '**Uma única instância** da classe: construtor privado + `getInstance()` estático. Thread-safe com campo `static final` (eager) ou holder idiom (lazy).', 1),
 ('f1000000-0000-0000-0000-000003040102', 'a3000000-0000-0000-0000-000000030401',
  'Qual problema o **Factory Method** resolve?',
  'Centralizar a decisão de **qual implementação criar**. O chamador conhece só a interface; adicionar um tipo novo muda um único lugar.', 2),
 ('f1000000-0000-0000-0000-000003040103', 'a3000000-0000-0000-0000-000000030401',
  'Quando o **Builder** é a escolha certa?',
  'Objetos com **muitos parâmetros opcionais**: métodos encadeáveis, validação no `build()` e resultado imutável. Ex.: `StringBuilder`, `@Builder` do Lombok.', 3),
 ('f1000000-0000-0000-0000-000003040104', 'a3000000-0000-0000-0000-000000030401',
  'Por que Singleton com estado mutável é perigoso?',
  'É **estado global compartilhado**: acopla o código, atrapalha testes e cria riscos de concorrência. No Spring, beans já são singletons gerenciados — stateless.', 4),
 ('f1000000-0000-0000-0000-000003040105', 'a3000000-0000-0000-0000-000000030401',
  'Frase-resumo dos três criacionais?',
  '**Singleton**: “só pode existir um”. **Factory**: “alguém escolhe a classe por mim”. **Builder**: “montagem passo a passo de objeto complexo/imutável”.', 5);

-- ─── Java Avançado · Strategy, Observer e Decorator (030402) ─────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000003040201', 'a3000000-0000-0000-0000-000000030402',
  'O que o padrão **Strategy** encapsula?',
  '**Variações de um algoritmo** atrás de uma interface, escolhidas em runtime. Mata cadeias de if/else de tipo. O `Comparator` do sort é Strategy puro.', 1),
 ('f1000000-0000-0000-0000-000003040202', 'a3000000-0000-0000-0000-000000030402',
  'O que o padrão **Observer** desacopla?',
  'Quem **gera** o evento de quem **reage**: o sujeito notifica uma lista de listeners sem conhecê-los. No Spring: `ApplicationEventPublisher` + `@EventListener`.', 2),
 ('f1000000-0000-0000-0000-000003040203', 'a3000000-0000-0000-0000-000000030402',
  'Como funciona o padrão **Decorator**?',
  'Um objeto **envolve outro da mesma interface** adicionando comportamento (cache, log, buffer) sem herança. Camadas empilháveis.', 3),
 ('f1000000-0000-0000-0000-000003040204', 'a3000000-0000-0000-0000-000000030402',
  'Qual padrão o `java.io` (BufferedReader envolvendo InputStreamReader…) exemplifica?',
  '**Decorator** — cada camada decora a anterior com nova responsabilidade, mantendo a mesma interface.', 4),
 ('f1000000-0000-0000-0000-000003040205', 'a3000000-0000-0000-0000-000000030402',
  'Guia rápido: quando usar Strategy, Observer ou Decorator?',
  'Comportamento **intercambiável** → Strategy. Reagir a **eventos** → Observer. **Adicionar camadas** a um objeto existente → Decorator.', 5);

-- ─── Spring · IoC e DI (040101) ──────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004010101', 'a3000000-0000-0000-0000-000000040101',
  'O que é **Inversão de Controle** (IoC)?',
  'Quem cria e conecta os objetos é o **container** (ApplicationContext), não o seu código. Você declara; o Spring monta o grafo de dependências.', 1),
 ('f1000000-0000-0000-0000-000004010102', 'a3000000-0000-0000-0000-000000040101',
  'Por que injeção por **construtor** é a recomendada?',
  'Campos `final`, objeto sempre completo, testável com `new` direto (sem Spring) e dependências explícitas — construtor gigante denuncia design ruim.', 2),
 ('f1000000-0000-0000-0000-000004010103', 'a3000000-0000-0000-0000-000000040101',
  'Para que servem `@Service`, `@Repository` e `@RestController`?',
  'Especializações **semânticas** de `@Component` — todas viram beans no component scan; o nome comunica a camada.', 3),
 ('f1000000-0000-0000-0000-000004010104', 'a3000000-0000-0000-0000-000000040101',
  'Como registrar como bean uma classe de biblioteca de terceiros?',
  'Método **`@Bean`** dentro de uma classe `@Configuration`, construindo e devolvendo o objeto. (Você não pode anotar código que não é seu.)', 4),
 ('f1000000-0000-0000-0000-000004010105', 'a3000000-0000-0000-0000-000000040101',
  'Duas implementações da mesma interface — como o Spring escolhe?',
  'Sem ajuda, falha com ambiguidade. Desambigue com `@Primary` (padrão) ou `@Qualifier("nome")` no ponto de injeção.', 5);

-- ─── Spring · Beans e escopos (040102) ───────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004010201', 'a3000000-0000-0000-0000-000000040102',
  'Qual o escopo padrão de um bean e a regra de ouro que decorre dele?',
  '**singleton** — a mesma instância atende todas as requisições/threads. Logo: bean singleton deve ser **stateless**.', 1),
 ('f1000000-0000-0000-0000-000004010202', 'a3000000-0000-0000-0000-000000040102',
  'Por que guardar estado de requisição num campo de `@Service` é bug?',
  'O singleton é compartilhado: requisições simultâneas sobrescrevem o campo — **dados de um usuário vazam para outro**.', 2),
 ('f1000000-0000-0000-0000-000004010203', 'a3000000-0000-0000-0000-000000040102',
  'Para que serve `@PostConstruct`?',
  'Callback executado **após criar o bean e injetar tudo** — o lugar certo para inicialização que depende das dependências.', 3),
 ('f1000000-0000-0000-0000-000004010204', 'a3000000-0000-0000-0000-000000040102',
  'Escopos além do singleton?',
  '`prototype` (instância por injeção), `request` (por requisição HTTP), `session` (por sessão). Declarados com `@Scope`.', 4),
 ('f1000000-0000-0000-0000-000004010205', 'a3000000-0000-0000-0000-000000040102',
  'Como levar configuração externa tipada para os beans?',
  '`@ConfigurationProperties(prefix = "app.x")` num record/classe — agrupado e testável, melhor que espalhar `@Value("${...}")`.', 5);

-- ─── Spring · Controllers REST (040201) ──────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004020101', 'a3000000-0000-0000-0000-000000040201',
  'O que `@RestController` significa?',
  '`@Controller` + `@ResponseBody`: os retornos dos métodos são serializados direto para **JSON** (via Jackson).', 1),
 ('f1000000-0000-0000-0000-000004020102', 'a3000000-0000-0000-0000-000000040201',
  'De onde vêm `@PathVariable`, `@RequestParam` e `@RequestBody`?',
  '`@PathVariable`: segmento da **URL** (`/produtos/{id}`). `@RequestParam`: **query string** (`?pagina=2`). `@RequestBody`: **corpo JSON** → objeto.', 2),
 ('f1000000-0000-0000-0000-000004020103', 'a3000000-0000-0000-0000-000000040201',
  'Status corretos para POST que cria e DELETE bem-sucedido?',
  'POST que cria → **201 Created**; DELETE sem corpo de resposta → **204 No Content**. Declare com `@ResponseStatus` ou `ResponseEntity`.', 3),
 ('f1000000-0000-0000-0000-000004020104', 'a3000000-0000-0000-0000-000000040201',
  'Por que expor **DTOs** e não entidades JPA?',
  'Evita vazar campos internos, desacopla o contrato da API do schema e previne `LazyInitializationException` na serialização.', 4),
 ('f1000000-0000-0000-0000-000004020105', 'a3000000-0000-0000-0000-000000040201',
  'Qual verbo HTTP é **idempotente** para atualização integral?',
  '**PUT** — substituir o recurso inteiro n vezes dá o mesmo resultado. `PATCH` é atualização parcial.', 5);

-- ─── Spring · Validação e erros (040202) ─────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004020201', 'a3000000-0000-0000-0000-000000040202',
  'O que dispara a validação das anotações de um DTO?',
  'O **`@Valid`** junto ao `@RequestBody`. Sem ele, `@NotBlank` e afins são decoração — nada é verificado.', 1),
 ('f1000000-0000-0000-0000-000004020202', 'a3000000-0000-0000-0000-000000040202',
  '`@NotNull` vs `@NotBlank` vs `@NotEmpty`?',
  '`@NotNull`: só não-nulo ("" passa). `@NotEmpty`: não vazio. `@NotBlank`: String com **conteúdo de verdade** (espaços não contam).', 2),
 ('f1000000-0000-0000-0000-000004020203', 'a3000000-0000-0000-0000-000000040202',
  'Para que serve o `@RestControllerAdvice`?',
  'Tratamento de exceções **centralizado** para todos os controllers: cada `@ExceptionHandler` traduz uma exceção em status + corpo padronizado.', 3),
 ('f1000000-0000-0000-0000-000004020204', 'a3000000-0000-0000-0000-000000040202',
  'Qual exceção o corpo inválido com @Valid gera, e qual status?',
  '`MethodArgumentNotValidException` → **400 Bad Request**, idealmente com a lista de campos rejeitados no corpo.', 4),
 ('f1000000-0000-0000-0000-000004020205', 'a3000000-0000-0000-0000-000000040202',
  'Divisão saudável de validação em camadas?',
  'DTO valida **formato** (Bean Validation); service valida **negócio** (exceções específicas); advice **traduz** exceções em HTTP. Controller sem try/catch.', 5);

-- ─── Spring · Repositories (040301) ──────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004030101', 'a3000000-0000-0000-0000-000000040301',
  'Como `findByCategoriaAndPrecoLessThan(...)` funciona sem implementação?',
  'É uma **derived query**: o Spring Data interpreta o NOME do método e gera a JPQL na inicialização.', 1),
 ('f1000000-0000-0000-0000-000004030102', 'a3000000-0000-0000-0000-000000040301',
  'O que é o problema **N+1** e como detectar?',
  '1 SELECT para a lista + 1 por item (relacionamento lazy). Detecte com `spring.jpa.show-sql=true`; corrija com `JOIN FETCH` ou `@EntityGraph`.', 2),
 ('f1000000-0000-0000-0000-000004030103', 'a3000000-0000-0000-0000-000000040301',
  'Como paginar resultados num repository?',
  'Receba um `Pageable` e devolva `Page<T>`: `repo.findByCategoria("x", PageRequest.of(0, 20, Sort.by("nome")))` — total e páginas vêm juntos.', 3),
 ('f1000000-0000-0000-0000-000004030104', 'a3000000-0000-0000-0000-000000040301',
  '`save()` faz INSERT ou UPDATE?',
  'Decide sozinho: entidade **nova** → INSERT; **gerenciada com id** → UPDATE no flush. Dentro de transação, entidade modificada nem precisa de save (dirty checking).', 4),
 ('f1000000-0000-0000-0000-000004030105', 'a3000000-0000-0000-0000-000000040301',
  'O que é o **Open Session in View** e por que desligar?',
  'Padrão do Boot (`open-in-view=true`) que mantém a sessão JPA aberta até o fim da resposta — mascara lazy loading no controller e segura conexões. Desligue e carregue o necessário no service.', 5);

-- ─── Spring · @Transactional (040302) ────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004030201', 'a3000000-0000-0000-0000-000000040302',
  'Como o `@Transactional` funciona por baixo?',
  'Via **proxy**: a chamada externa passa por ele → begin → método real → commit (ou rollback na exceção). Por isso auto-invocação e métodos private ficam de fora.', 1),
 ('f1000000-0000-0000-0000-000004030202', 'a3000000-0000-0000-0000-000000040302',
  'Exceção **checked** faz rollback por padrão?',
  '**Não!** Só `RuntimeException`/`Error`. Checked faz COMMIT — inclua com `@Transactional(rollbackFor = Exception.class)`.', 2),
 ('f1000000-0000-0000-0000-000004030203', 'a3000000-0000-0000-0000-000000040302',
  'Por que `this.metodoTransacional()` não abre transação?',
  '**Auto-invocação** não passa pelo proxy — vai direto ao objeto real. Solução: extrair para outro bean ou anotar o método público de entrada.', 3),
 ('f1000000-0000-0000-0000-000004030204', 'a3000000-0000-0000-0000-000000040302',
  'Para que serve `readOnly = true`?',
  'Sinaliza leitura pura: Hibernate pula dirty checking e flush — menos CPU/memória. Use em **todo** método só-consulta.', 4),
 ('f1000000-0000-0000-0000-000004030205', 'a3000000-0000-0000-0000-000000040302',
  'Quando usar propagação `REQUIRES_NEW`?',
  'Para efeitos que devem persistir **mesmo se a operação principal falhar** (auditoria, log): suspende a transação atual e commita a interna de forma independente.', 5);

-- ─── Spring · Security com JWT (040401) ──────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004040101', 'a3000000-0000-0000-0000-000000040401',
  'Autenticação vs Autorização?',
  '**Autenticação**: quem é você (login/token válido → 401 se falhar). **Autorização**: o que pode fazer (roles → 403 se faltar permissão).', 1),
 ('f1000000-0000-0000-0000-000004040102', 'a3000000-0000-0000-0000-000000040401',
  'Quais as três partes de um JWT?',
  '**Header** (algoritmo) . **Payload** (claims: sub, exp, roles) . **Assinatura**. Payload é Base64 legível — a assinatura só garante integridade.', 2),
 ('f1000000-0000-0000-0000-000004040103', 'a3000000-0000-0000-0000-000000040401',
  'Por que access token curto + refresh token?',
  'JWT não é revogável: token longo vazado = acesso prolongado. Curto limita o dano; o refresh renova sem senha e **pode** ser revogado no servidor.', 3),
 ('f1000000-0000-0000-0000-000004040104', 'a3000000-0000-0000-0000-000000040401',
  'Por que uma API JWT desliga CSRF e sessão?',
  'CSRF explora **cookies de sessão** enviados automaticamente. API stateless com Bearer token não usa cookie — `STATELESS` + `csrf.disable()`.', 4),
 ('f1000000-0000-0000-0000-000004040105', 'a3000000-0000-0000-0000-000000040401',
  'Como armazenar senhas corretamente?',
  '**BCrypt** (PasswordEncoder): hash lento de propósito, com salt embutido. Texto puro, MD5 ou SHA-1 são falhas graves.', 5);

-- ─── Spring · Testes (040402) ────────────────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000004040201', 'a3000000-0000-0000-0000-000000040402',
  'A pirâmide de testes em uma frase?',
  'Muitos **unitários** (rápidos, sem Spring), alguns **de fatia** (@WebMvcTest/@DataJpaTest), poucos **de integração** (@SpringBootTest).', 1),
 ('f1000000-0000-0000-0000-000004040202', 'a3000000-0000-0000-0000-000000040402',
  'O que fazem `@Mock` e `@InjectMocks`?',
  '`@Mock` cria o dublê controlado; `@InjectMocks` instancia a classe real sob teste injetando os mocks (com `@ExtendWith(MockitoExtension.class)`).', 2),
 ('f1000000-0000-0000-0000-000004040203', 'a3000000-0000-0000-0000-000000040402',
  'Trio básico do Mockito?',
  '`when(...).thenReturn(...)` programa o mock; `verify(...)` confere a interação; `assertThrows(...)` valida exceções esperadas.', 3),
 ('f1000000-0000-0000-0000-000004040204', 'a3000000-0000-0000-0000-000000040402',
  'Quando usar `@WebMvcTest`?',
  'Para testar **controllers**: mapeamentos, validação, status e JSON com `MockMvc` — services entram como `@MockitoBean`, sem subir o contexto todo.', 4),
 ('f1000000-0000-0000-0000-000004040205', 'a3000000-0000-0000-0000-000000040402',
  'Por que Testcontainers em vez de H2 na integração?',
  'H2 não é o banco de produção — dialetos diferentes escondem bugs. Testcontainers sobe um **Postgres real descartável** no Docker para o teste.', 5);
