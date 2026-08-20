-- =====================================================================
-- LearnWay — seed "Java — Avançado"
--   * 4 subtopics encadeados: Threads & Sincronização -> Concorrência
--     Moderna -> Reflection & Anotações -> Design Patterns
--   * 8 lessons com teoria completa
--   * 18 questões: MULTIPLE_CHOICE, DESCRIPTIVE e CODE_CHALLENGE
-- Convenção de UUIDs (mesma do V5): sufixo determinístico
--   subtopic  a2…0000000003SS      lesson    a3…000000 03 SS LL
--   question  a4…0000 03 SS LL QQ  option    a5…00 03 SS LL QQ OO
--   descr.    a7…= question        code ch.  a6…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000301', 'a1000000-0000-0000-0000-000000000003', 'threads',             'Threads & Sincronização',  'Threads, Runnable, race conditions, synchronized e volatile.',      1, NULL),
 ('a2000000-0000-0000-0000-000000000302', 'a1000000-0000-0000-0000-000000000003', 'concorrencia-moderna','Concorrência Moderna',     'ExecutorService, pools de threads e CompletableFuture.',            2, 'a2000000-0000-0000-0000-000000000301'),
 ('a2000000-0000-0000-0000-000000000303', 'a1000000-0000-0000-0000-000000000003', 'reflection-anotacoes','Reflection & Anotações',   'Inspecionar classes em runtime e criar anotações personalizadas.',  3, 'a2000000-0000-0000-0000-000000000302'),
 ('a2000000-0000-0000-0000-000000000304', 'a1000000-0000-0000-0000-000000000003', 'design-patterns',     'Design Patterns',          'Padrões criacionais, estruturais e comportamentais do GoF.',        4, 'a2000000-0000-0000-0000-000000000303');

-- ─── LESSONS: Threads & Sincronização ────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000030101', 'a2000000-0000-0000-0000-000000000301', 'Threads e Runnable',
$theory$
## Threads e Runnable

Uma **thread** é uma linha de execução independente dentro do processo. A JVM começa com a thread `main` e você pode criar outras para trabalhar em paralelo.

```java
Runnable tarefa = () -> System.out.println("Rodando em " + Thread.currentThread().getName());

Thread t = new Thread(tarefa);
t.start();   // agenda a execução — a JVM decide QUANDO rodar
t.join();    // a thread atual espera t terminar
```

### start() vs run()
Este é o erro clássico de iniciante:
- **`t.start()`** cria uma nova thread do SO e executa `run()` nela.
- **`t.run()`** é uma chamada de método **comum** — roda na thread atual, sem paralelismo nenhum.

### Ciclo de vida
Uma thread passa por estados: `NEW` → `RUNNABLE` → (`BLOCKED` / `WAITING` / `TIMED_WAITING`) → `TERMINATED`. Você observa com `t.getState()`.

### Daemon threads
```java
Thread limpeza = new Thread(tarefa);
limpeza.setDaemon(true); // não impede a JVM de encerrar
limpeza.start();
```
A JVM encerra quando só restam threads **daemon** — use-as para trabalho de fundo dispensável (limpeza de cache, monitoramento).

> Na prática moderna você raramente cria `Thread` na mão: prefere-se `ExecutorService` (próximo subtópico). Mas entender a base é essencial para depurar qualquer sistema concorrente.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000030102', 'a2000000-0000-0000-0000-000000000301', 'Race conditions, synchronized e volatile',
$theory$
## Race conditions, synchronized e volatile

Quando duas threads mexem no **mesmo dado mutável** sem coordenação, o resultado depende da ordem de execução — uma **race condition**.

```java
class Contador {
    private int valor = 0;
    void incrementar() { valor++; } // parece atômico, mas NÃO é!
}
```

`valor++` são **três operações**: ler, somar, gravar. Duas threads podem ler o mesmo valor e uma sobrescrever a outra — incrementos "somem".

### synchronized: exclusão mútua
```java
synchronized void incrementar() { valor++; }
// ou, com lock explícito em bloco:
void incrementar() {
    synchronized (this) { valor++; }
}
```
Apenas **uma thread por vez** entra na seção sincronizada (as demais ficam `BLOCKED`). Além da exclusão mútua, `synchronized` garante **visibilidade**: mudanças feitas dentro do bloco são vistas pelas próximas threads que adquirirem o mesmo lock.

### volatile: visibilidade sem atomicidade
```java
private volatile boolean rodando = true;

void parar() { rodando = false; }        // thread A
void loop()  { while (rodando) { ... } } // thread B enxerga a mudança
```
Sem `volatile`, a thread B pode nunca ver a escrita da A (cache de CPU / otimizações do JIT). **Mas atenção:** `volatile` só garante visibilidade — `valor++` continua quebrado, pois não é atômico.

### Alternativa sem lock: atômicos
```java
AtomicInteger valor = new AtomicInteger();
valor.incrementAndGet(); // atômico via compare-and-swap (CAS)
```

### Deadlock
Duas threads, cada uma segurando um lock e esperando o da outra = travamento eterno. Prevenção clássica: **adquirir os locks sempre na mesma ordem**.

> Regra mental: `synchronized` = exclusão mútua + visibilidade; `volatile` = só visibilidade; `Atomic*` = operações simples sem lock.
$theory$, 15, 4, 2, 18);

-- ─── LESSONS: Concorrência Moderna ───────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000030201', 'a2000000-0000-0000-0000-000000000302', 'ExecutorService e pools de threads',
$theory$
## ExecutorService e pools de threads

Criar uma `Thread` por tarefa não escala: threads são caras (memória de stack, troca de contexto). A solução é um **pool**: um conjunto fixo de threads reutilizadas para executar uma fila de tarefas.

```java
ExecutorService pool = Executors.newFixedThreadPool(4);

pool.submit(() -> processar(pedido));          // Runnable: fire-and-forget
Future<BigDecimal> f = pool.submit(() -> calcularTotal()); // Callable: tem retorno

BigDecimal total = f.get();  // BLOQUEIA até o resultado ficar pronto

pool.shutdown();             // para de aceitar tarefas; termina as pendentes
```

### Runnable vs Callable
| | Retorno | Exceção checked |
|---|---|---|
| `Runnable` | não (`void`) | não pode lançar |
| `Callable<V>` | `V` via `Future<V>` | pode lançar |

### Tipos de pool
- **`newFixedThreadPool(n)`** — n threads fixas; excedente espera na fila. O padrão para carga constante.
- **`newCachedThreadPool()`** — cria threads sob demanda e recicla ociosas; bom para muitas tarefas curtas, perigoso sob rajadas (pode criar milhares).
- **`newSingleThreadExecutor()`** — garante execução sequencial, uma tarefa por vez.
- **`newScheduledThreadPool(n)`** — tarefas com atraso ou periódicas.

### Encerrando direito
```java
pool.shutdown();                                  // educado
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
    pool.shutdownNow();                           // interrompe as que sobraram
}
```
Esquecer o `shutdown` deixa threads não-daemon vivas — a JVM **não encerra**.

### Virtual threads (Java 21+)
```java
try (var vt = Executors.newVirtualThreadPerTaskExecutor()) {
    vt.submit(() -> chamarApiExterna());
}
```
Threads virtuais são baratíssimas (milhares delas custam pouco) e ideais para tarefas **bloqueantes de I/O**. Para trabalho pesado de CPU, o pool de threads de plataforma continua adequado.
$theory$, 15, 4, 1, 16),

 ('a3000000-0000-0000-0000-000000030202', 'a2000000-0000-0000-0000-000000000302', 'CompletableFuture: composição assíncrona',
$theory$
## CompletableFuture: composição assíncrona

`Future.get()` bloqueia. O **`CompletableFuture`** vira o jogo: em vez de esperar o resultado, você **declara o que fazer quando ele chegar** — um pipeline assíncrono.

```java
CompletableFuture.supplyAsync(() -> buscarUsuario(id))     // roda em outra thread
    .thenApply(u -> u.getEmail())                          // transforma o resultado
    .thenAccept(email -> enviarBoasVindas(email))          // consome no final
    .exceptionally(ex -> { log.error("falhou", ex); return null; });
```

### Os três "then" que você mais usa
| Método | Recebe | Devolve | Análogo em Stream |
|---|---|---|---|
| `thenApply(fn)` | valor | novo valor | `map` |
| `thenCompose(fn)` | valor | outro `CompletableFuture` | `flatMap` |
| `thenAccept(consumer)` | valor | nada | `forEach` |

**`thenCompose` vs `thenApply`:** se a função devolve outro `CompletableFuture` (ex.: segunda chamada assíncrona), use `thenCompose` — com `thenApply` você acabaria com um `CompletableFuture<CompletableFuture<T>>` aninhado.

### Combinando futuros independentes
```java
var precoF  = CompletableFuture.supplyAsync(() -> buscarPreco(sku));
var estoqueF = CompletableFuture.supplyAsync(() -> buscarEstoque(sku));

// as duas chamadas rodam EM PARALELO; combine junta os resultados
var oferta = precoF.thenCombine(estoqueF, (preco, estoque) -> new Oferta(preco, estoque));

CompletableFuture.allOf(precoF, estoqueF).join(); // espera todos
```

### Tratamento de erros
- **`exceptionally(fn)`** — só roda se deu erro; devolve um valor de fallback.
- **`handle((valor, erro) -> ...)`** — roda sempre; recebe valor OU erro.

### Em qual thread isso roda?
Sem argumento extra, `supplyAsync` usa o **ForkJoinPool.commonPool()**. Para I/O bloqueante, passe seu próprio executor:
```java
CompletableFuture.supplyAsync(() -> chamadaHttpLenta(), meuPoolDeIo);
```
O common pool é dimensionado para CPU (nº de núcleos); saturá-lo com I/O trava o paralelismo da aplicação inteira.
$theory$, 15, 5, 2, 18);

-- ─── LESSONS: Reflection & Anotações ─────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000030301', 'a2000000-0000-0000-0000-000000000303', 'Reflection: inspecionando classes em runtime',
$theory$
## Reflection: inspecionando classes em runtime

**Reflection** é a capacidade de um programa examinar e manipular a si mesmo em tempo de execução: descobrir os métodos de uma classe, ler campos privados, instanciar objetos cujo nome só se conhece em runtime.

```java
Class<?> clazz = Class.forName("com.exemplo.Usuario"); // pela String do nome
// ou: Usuario.class  /  objeto.getClass()

// listar métodos e campos
for (Method m : clazz.getDeclaredMethods()) System.out.println(m.getName());
for (Field f : clazz.getDeclaredFields())  System.out.println(f.getName());

// instanciar e invocar dinamicamente
Object obj = clazz.getDeclaredConstructor().newInstance();
Method setNome = clazz.getMethod("setNome", String.class);
setNome.invoke(obj, "Ana");
```

### Quebrando o encapsulamento (com moderação)
```java
Field saldo = ContaBancaria.class.getDeclaredField("saldo");
saldo.setAccessible(true);            // ignora o private!
double valor = (double) saldo.get(conta);
```
É assim que Hibernate popula entidades sem chamar setters e que o Jackson lê campos privados para gerar JSON.

### getMethods() vs getDeclaredMethods()
- **`getMethods()`** — só os **públicos**, incluindo os herdados.
- **`getDeclaredMethods()`** — **todos** os declarados na própria classe (private inclusive), sem os herdados.

### Onde reflection sustenta o ecossistema
- **Spring**: encontra classes anotadas com `@Component`, injeta dependências, chama seu construtor.
- **JPA/Hibernate**: instancia entidades (por isso a exigência do construtor sem argumentos!) e preenche os campos.
- **JUnit**: descobre e invoca os métodos `@Test`.
- **Jackson/Gson**: serializa qualquer objeto sem que você escreva conversores.

### O preço
- **Performance**: invocação reflexiva é mais lenta que chamada direta (sem inline do JIT).
- **Segurança de tipos**: erros que o compilador pegaria viram exceções em runtime (`NoSuchMethodException`).
- **Refatoração**: renomear um método não atualiza a String `"setNome"`.

> Use reflection para construir **frameworks e bibliotecas**; em código de negócio do dia a dia, quase sempre há um caminho melhor e tipado.
$theory$, 15, 4, 1, 16),

 ('a3000000-0000-0000-0000-000000030302', 'a2000000-0000-0000-0000-000000000303', 'Anotações personalizadas',
$theory$
## Anotações personalizadas

Uma **anotação** é metadado estruturado que você prende a classes, métodos, campos ou parâmetros. Sozinha ela **não faz nada** — algum código precisa lê-la (via reflection, em geral) e agir.

### Declarando
```java
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)   // sobrevive até o runtime (visível via reflection)
@Target(ElementType.METHOD)           // só pode anotar métodos
public @interface Auditado {
    String acao();                    // elemento obrigatório
    boolean logarParametros() default false; // com valor padrão
}
```

### As duas meta-anotações que definem tudo
**`@Retention`** — até onde a anotação sobrevive:
| Política | Visível para | Exemplo de uso |
|---|---|---|
| `SOURCE` | só o compilador | `@Override`, Lombok |
| `CLASS` | bytecode, não runtime | instrumentação de bytecode |
| `RUNTIME` | reflection em runtime | `@Entity`, `@Autowired`, `@Test` |

**`@Target`** — o que pode ser anotado: `TYPE` (classe/interface), `METHOD`, `FIELD`, `PARAMETER`, `CONSTRUCTOR`…

### Usando e processando
```java
class PedidoService {
    @Auditado(acao = "CANCELAR_PEDIDO", logarParametros = true)
    void cancelar(UUID pedidoId) { ... }
}

// o "motor" que dá vida à anotação:
for (Method m : PedidoService.class.getDeclaredMethods()) {
    Auditado aud = m.getAnnotation(Auditado.class);
    if (aud != null) {
        System.out.println("Método auditado: " + m.getName() + " ação=" + aud.acao());
    }
}
```

É exatamente esse padrão — **anotar + varrer + agir** — que o Spring usa: `@Transactional` não abre transação nenhuma; um *proxy* do Spring detecta a anotação e envolve a chamada do método com begin/commit/rollback.

### Convenções úteis
- Elemento chamado **`value()`** pode ser passado sem nome: `@Auditado("CANCELAR")`.
- Anotações não suportam `null` — use `default ""` ou arrays vazios.
- `@Repeatable` permite aplicar a mesma anotação várias vezes no mesmo alvo.

> Anotação é **contrato declarativo**: ela descreve *o que* o elemento é ou requer; a lógica que a interpreta vive em outro lugar. Entender isso desmistifica "a mágica" do Spring.
$theory$, 15, 4, 2, 15);

-- ─── LESSONS: Design Patterns ────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000030401', 'a2000000-0000-0000-0000-000000000304', 'Padrões criacionais: Singleton, Factory e Builder',
$theory$
## Padrões criacionais: Singleton, Factory e Builder

Padrões criacionais controlam **como objetos nascem**, escondendo a complexidade da construção.

### Singleton — uma única instância
Garante que a classe tenha **uma só instância** com acesso global.

```java
public class Configuracao {
    private static final Configuracao INSTANCIA = new Configuracao(); // eager, thread-safe

    private Configuracao() { }                 // construtor PRIVADO: ninguém mais instancia

    public static Configuracao getInstance() { return INSTANCIA; }
}
```
Versão *lazy* thread-safe idiomática (holder):
```java
public class Configuracao {
    private Configuracao() { }
    private static class Holder { static final Configuracao I = new Configuracao(); }
    public static Configuracao getInstance() { return Holder.I; }
}
```
> **Cuidado:** Singleton com estado mutável é um anti-padrão disfarçado (estado global, difícil de testar). No Spring, os *beans* já são singletons gerenciados — raramente você escreve o padrão na mão.

### Factory Method — delegar a escolha da classe
Em vez de espalhar `new` + `if/else` pelo código, um método centraliza a decisão de **qual implementação** criar:

```java
interface Notificador { void enviar(String msg); }

class NotificadorFactory {
    static Notificador criar(Canal canal) {
        return switch (canal) {
            case EMAIL -> new NotificadorEmail();
            case SMS   -> new NotificadorSms();
            case PUSH  -> new NotificadorPush();
        };
    }
}
```
O chamador conhece só a **interface**; adicionar um canal novo altera um único lugar.

### Builder — construção passo a passo
Resolve o problema do **construtor telescópico** (muitos parâmetros opcionais):

```java
Pedido p = Pedido.builder()
    .cliente("Ana")
    .item("Café", 2)
    .cupom("BEMVINDO10")     // opcional — só chama quem precisa
    .observacao("sem açúcar")
    .build();                // valida e cria o objeto imutável
```
```java
class Pedido {
    private final String cliente;   // imutável após o build
    // ...
    static Builder builder() { return new Builder(); }

    static class Builder {
        private String cliente;
        Builder cliente(String c) { this.cliente = c; return this; } // encadeável
        Pedido build() {
            if (cliente == null) throw new IllegalStateException("cliente obrigatório");
            return new Pedido(this);
        }
    }
}
```
É o padrão por trás do `@Builder` do Lombok, do `StringBuilder` e de APIs fluentes como `HttpRequest.newBuilder()`.

> Guia rápido: **Singleton** = "só pode existir um"; **Factory** = "alguém decide qual classe criar por mim"; **Builder** = "muitos parâmetros opcionais, objeto imutável no final".
$theory$, 20, 4, 1, 18),

 ('a3000000-0000-0000-0000-000000030402', 'a2000000-0000-0000-0000-000000000304', 'Strategy, Observer e Decorator',
$theory$
## Strategy, Observer e Decorator

Três padrões que você já usa sem perceber — o Java moderno os absorveu na linguagem e nas bibliotecas.

### Strategy — algoritmo intercambiável
Encapsula **variações de um algoritmo** atrás de uma interface; o comportamento é escolhido em runtime.

```java
interface PoliticaDesconto {
    BigDecimal aplicar(BigDecimal valor);
}

class DescontoBlackFriday implements PoliticaDesconto {
    public BigDecimal aplicar(BigDecimal v) { return v.multiply(new BigDecimal("0.5")); }
}
class SemDesconto implements PoliticaDesconto {
    public BigDecimal aplicar(BigDecimal v) { return v; }
}

class Checkout {
    private final PoliticaDesconto politica;      // injetada — o Checkout não conhece if/else
    Checkout(PoliticaDesconto politica) { this.politica = politica; }
    BigDecimal total(BigDecimal carrinho) { return politica.aplicar(carrinho); }
}
```
Elimina cadeias de `if (tipo == BLACK_FRIDAY) ... else if ...`. Com interfaces funcionais, uma strategy pode ser uma **lambda**: `Checkout c = new Checkout(v -> v.multiply(HALF));`. O `Comparator` que você passa para `sort` é Strategy puro.

### Observer — publicar/assinar eventos
Um **sujeito** notifica uma lista de **observadores** quando algo acontece, sem conhecê-los concretamente:

```java
interface PedidoListener { void pedidoCriado(Pedido p); }

class PedidoService {
    private final List<PedidoListener> listeners = new ArrayList<>();
    void addListener(PedidoListener l) { listeners.add(l); }

    void criar(Pedido p) {
        salvar(p);
        listeners.forEach(l -> l.pedidoCriado(p)); // email, estoque, auditoria...
    }
}
```
Desacopla quem **gera** o evento de quem **reage**. No Spring, é o `ApplicationEventPublisher` + `@EventListener`; no front-end, todo sistema de eventos de UI.

### Decorator — empilhar comportamento
Envolve um objeto com outro **da mesma interface**, adicionando responsabilidade sem herança:

```java
interface Repositorio { Dado buscar(String id); }

class RepositorioComCache implements Repositorio {
    private final Repositorio interno;                 // envolve o "de verdade"
    private final Map<String, Dado> cache = new HashMap<>();

    RepositorioComCache(Repositorio interno) { this.interno = interno; }

    public Dado buscar(String id) {
        return cache.computeIfAbsent(id, interno::buscar);
    }
}

Repositorio repo = new RepositorioComCache(new RepositorioJdbc()); // empilhável
```
O exemplo canônico do JDK é o `java.io`: `new BufferedReader(new InputStreamReader(new FileInputStream(...)))` — cada camada decora a anterior.

> Como escolher: comportamento **intercambiável** = Strategy; reagir a **eventos** sem acoplamento = Observer; **adicionar camadas** a um objeto existente = Decorator.
$theory$, 20, 5, 2, 18);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: Threads e Runnable -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003010101', 'a3000000-0000-0000-0000-000000030101', 'MULTIPLE_CHOICE',
  'Qual a diferença entre chamar `t.start()` e `t.run()` em uma `Thread t`?', 'Um deles não cria thread nenhuma.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000003010102', 'a3000000-0000-0000-0000-000000030101', 'MULTIPLE_CHOICE',
  'O que acontece com uma JVM cujas únicas threads vivas restantes são daemon?', 'Daemon = trabalho de fundo dispensável.', 2, 5, 3);

-- L2: Sincronização -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003010201', 'a3000000-0000-0000-0000-000000030102', 'MULTIPLE_CHOICE',
  'Um campo `volatile int contador` é incrementado com `contador++` por várias threads. O código está correto?', 'volatile resolve visibilidade; ++ são três operações.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000003010202', 'a3000000-0000-0000-0000-000000030102', 'DESCRIPTIVE',
  'Explique o que é uma race condition e cite duas formas diferentes de eliminá-la em um contador compartilhado, comparando-as brevemente.', 'synchronized? AtomicInteger? O que cada um garante?', 2, 10, 4);

-- L3: ExecutorService -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003020101', 'a3000000-0000-0000-0000-000000030201', 'MULTIPLE_CHOICE',
  'Qual a diferença fundamental entre `Runnable` e `Callable<V>` ao submeter tarefas a um ExecutorService?', 'Um deles produz um Future com valor.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000003020102', 'a3000000-0000-0000-0000-000000030201', 'MULTIPLE_CHOICE',
  'Uma aplicação submete tarefas a um `newFixedThreadPool(4)` e nunca chama `shutdown()`. O que acontece ao final do `main`?', 'As threads do pool são daemon?', 2, 5, 4);

-- L4: CompletableFuture -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003020201', 'a3000000-0000-0000-0000-000000030202', 'MULTIPLE_CHOICE',
  'Quando usar `thenCompose` em vez de `thenApply` num pipeline de CompletableFuture?', 'O que a função passada devolve em cada caso?', 1, 5, 5),
 ('a4000000-0000-0000-0000-000003020202', 'a3000000-0000-0000-0000-000000030202', 'DESCRIPTIVE',
  'Você precisa buscar preço e estoque de um produto em dois serviços independentes e juntar os resultados. Descreva como fazer isso com CompletableFuture aproveitando o paralelismo, citando os métodos usados.', 'supplyAsync duas vezes + um método que combina.', 2, 10, 5);

-- L5: Reflection -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003030101', 'a3000000-0000-0000-0000-000000030301', 'MULTIPLE_CHOICE',
  'Por que a JPA exige que toda entidade tenha um construtor sem argumentos?', 'Como o Hibernate cria a instância sem conhecer sua classe em compilação?', 1, 5, 4),
 ('a4000000-0000-0000-0000-000003030102', 'a3000000-0000-0000-0000-000000030301', 'MULTIPLE_CHOICE',
  'Qual chamada permite ler o valor de um campo `private` de outro objeto via reflection?', 'É preciso desligar a checagem de acesso.', 2, 5, 4);

-- L6: Anotações -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003030201', 'a3000000-0000-0000-0000-000000030302', 'MULTIPLE_CHOICE',
  'Uma anotação personalizada precisa ser lida via reflection em runtime. Qual meta-anotação é indispensável?', 'Qual @Retention sobrevive até o runtime?', 1, 5, 4),
 ('a4000000-0000-0000-0000-000003030202', 'a3000000-0000-0000-0000-000000030302', 'DESCRIPTIVE',
  'A anotação `@Transactional` do Spring não contém código de transação. Explique, em linhas gerais, como o Spring faz um método anotado abrir e confirmar uma transação.', 'Anotar + varrer + agir. Pense em proxies.', 2, 10, 5);

-- L7: Padrões criacionais -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003040101', 'a3000000-0000-0000-0000-000000030401', 'MULTIPLE_CHOICE',
  'Qual problema o padrão Builder resolve melhor que um construtor tradicional?', 'Pense em objetos com muitos parâmetros opcionais.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000003040102', 'a3000000-0000-0000-0000-000000030401', 'CODE_CHALLENGE',
  'Implemente a classe `Configuracao` como um Singleton thread-safe: construtor privado e um método estático `getInstance()` que sempre devolve a mesma instância.', 'Inicialização eager num campo static final resolve.', 2, 15, 4);

-- L8: Strategy/Observer/Decorator -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000003040201', 'a3000000-0000-0000-0000-000000030402', 'MULTIPLE_CHOICE',
  'Empilhar `new BufferedReader(new InputStreamReader(new FileInputStream(...)))` é exemplo clássico de qual padrão?', 'Cada camada envolve a anterior com a mesma interface.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000003040202', 'a3000000-0000-0000-0000-000000030402', 'CODE_CHALLENGE',
  'Aplique o padrão Strategy: crie a interface `PoliticaDesconto` com o método `double aplicar(double valor)`, as implementações `DescontoDezPorcento` e `SemDesconto`, e a classe `Checkout` que recebe uma política no construtor e a usa em `total(double)`.', 'O Checkout não deve ter if/else de tipos — só delegar à política.', 2, 15, 5);

-- ─── OPTIONS (multiple choice) ───────────────────────────────────────
-- L1 Q1: start vs run
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000301010101', 'a4000000-0000-0000-0000-000003010101', 'start() executa run() numa nova thread; run() executa na thread atual, como método comum.', TRUE,  'Correto: só start() cria uma thread do SO; run() direto não tem paralelismo nenhum.', 1),
 ('a5000000-0000-0000-0000-000301010102', 'a4000000-0000-0000-0000-000003010101', 'São equivalentes — run() é apenas um atalho para start().', FALSE, 'Não: run() chamado diretamente roda de forma síncrona na thread chamadora.', 2),
 ('a5000000-0000-0000-0000-000301010103', 'a4000000-0000-0000-0000-000003010101', 'run() cria a thread e start() apenas a inicia depois.', FALSE, 'É o inverso do que start() faz — e run() nunca cria thread.', 3),
 ('a5000000-0000-0000-0000-000301010104', 'a4000000-0000-0000-0000-000003010101', 'start() bloqueia até a thread terminar; run() é assíncrono.', FALSE, 'start() retorna imediatamente; quem espera o término é join().', 4);

-- L1 Q2: daemon
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000301010201', 'a4000000-0000-0000-0000-000003010102', 'A JVM encerra — threads daemon não a mantêm viva.', TRUE,  'Correto: a JVM só permanece rodando enquanto houver ao menos uma thread não-daemon viva.', 1),
 ('a5000000-0000-0000-0000-000301010202', 'a4000000-0000-0000-0000-000003010102', 'A JVM continua rodando até todas as daemon terminarem.', FALSE, 'Esse é o comportamento para threads normais (user threads), não daemon.', 2),
 ('a5000000-0000-0000-0000-000301010203', 'a4000000-0000-0000-0000-000003010102', 'As daemon são promovidas a threads normais automaticamente.', FALSE, 'Não existe promoção automática; o status daemon é definido antes do start().', 3),
 ('a5000000-0000-0000-0000-000301010204', 'a4000000-0000-0000-0000-000003010102', 'A JVM lança IllegalThreadStateException.', FALSE, 'Essa exceção ocorre ao chamar start() duas vezes, não no encerramento.', 4);

-- L2 Q1: volatile ++
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000301020101', 'a4000000-0000-0000-0000-000003010201', 'Não — volatile garante visibilidade, mas contador++ não é atômico (ler, somar, gravar).', TRUE,  'Correto: incrementos podem se perder entre a leitura e a escrita. Use AtomicInteger ou synchronized.', 1),
 ('a5000000-0000-0000-0000-000301020102', 'a4000000-0000-0000-0000-000003010201', 'Sim — volatile torna todas as operações no campo atômicas.', FALSE, 'volatile nunca dá atomicidade a operações compostas como ++.', 2),
 ('a5000000-0000-0000-0000-000301020103', 'a4000000-0000-0000-0000-000003010201', 'Não compila: volatile não pode ser usado com int.', FALSE, 'volatile aplica-se a qualquer campo, primitivo ou referência.', 3),
 ('a5000000-0000-0000-0000-000301020104', 'a4000000-0000-0000-0000-000003010201', 'Sim, desde que as threads usem o mesmo objeto.', FALSE, 'Justamente por compartilharem o campo é que a corrida acontece.', 4);

-- L3 Q1: Runnable vs Callable
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000302010101', 'a4000000-0000-0000-0000-000003020101', 'Callable devolve um valor (via Future) e pode lançar exceção checked; Runnable não devolve nada.', TRUE,  'Correto: submit(Callable) devolve Future<V> com o resultado; Runnable é void.', 1),
 ('a5000000-0000-0000-0000-000302010102', 'a4000000-0000-0000-0000-000003020101', 'Runnable roda em paralelo; Callable roda sempre na thread atual.', FALSE, 'Ambos rodam nas threads do pool — a diferença é retorno/exceção.', 2),
 ('a5000000-0000-0000-0000-000302010103', 'a4000000-0000-0000-0000-000003020101', 'Callable é mais rápido por usar threads nativas.', FALSE, 'Não há diferença de performance; ambos usam as mesmas threads do executor.', 3),
 ('a5000000-0000-0000-0000-000302010104', 'a4000000-0000-0000-0000-000003020101', 'Runnable foi substituído por Callable e está deprecated.', FALSE, 'Runnable continua central no Java (lambdas, threads, executores).', 4);

-- L3 Q2: sem shutdown
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000302010201', 'a4000000-0000-0000-0000-000003020102', 'A JVM não encerra: as threads do pool são não-daemon e continuam vivas esperando tarefas.', TRUE,  'Correto: sem shutdown(), as worker threads ficam bloqueadas na fila e seguram a JVM.', 1),
 ('a5000000-0000-0000-0000-000302010202', 'a4000000-0000-0000-0000-000003020102', 'A JVM encerra normalmente e o pool é destruído pelo GC.', FALSE, 'O GC não encerra threads vivas; a JVM fica pendurada.', 2),
 ('a5000000-0000-0000-0000-000302010203', 'a4000000-0000-0000-0000-000003020102', 'O pool chama shutdown() sozinho após 60 segundos.', FALSE, 'FixedThreadPool não tem timeout de encerramento automático (cached recicla threads ociosas, mas também não faz shutdown).', 3),
 ('a5000000-0000-0000-0000-000302010204', 'a4000000-0000-0000-0000-000003020102', 'É lançada RejectedExecutionException.', FALSE, 'Essa exceção ocorre ao submeter tarefa APÓS o shutdown — o cenário oposto.', 4);

-- L4 Q1: thenCompose
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000302020101', 'a4000000-0000-0000-0000-000003020201', 'Quando a função passada devolve outro CompletableFuture — evita o aninhamento CF<CF<T>>.', TRUE,  'Correto: thenCompose "achata" como o flatMap dos Streams.', 1),
 ('a5000000-0000-0000-0000-000302020102', 'a4000000-0000-0000-0000-000003020201', 'Quando se quer executar a função em outra thread.', FALSE, 'Para controlar a thread existe a variante *Async(fn, executor) — de qualquer método then.', 2),
 ('a5000000-0000-0000-0000-000302020103', 'a4000000-0000-0000-0000-000003020201', 'Quando a função pode lançar exceção.', FALSE, 'Exceções fluem pelo pipeline igualmente; tratamento é com exceptionally/handle.', 3),
 ('a5000000-0000-0000-0000-000302020104', 'a4000000-0000-0000-0000-000003020201', 'thenCompose é apenas um alias antigo de thenApply.', FALSE, 'São operações distintas: map (thenApply) vs flatMap (thenCompose).', 4);

-- L5 Q1: construtor sem argumentos
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000303010101', 'a4000000-0000-0000-0000-000003030101', 'Porque o Hibernate instancia a entidade via reflection e depois preenche os campos um a um.', TRUE,  'Correto: sem conhecer a classe em compilação, o provedor chama o construtor vazio reflexivamente e injeta os valores do banco.', 1),
 ('a5000000-0000-0000-0000-000303010102', 'a4000000-0000-0000-0000-000003030101', 'Porque o SQL gerado precisa de uma linha vazia antes do INSERT.', FALSE, 'O SQL não tem relação com a forma de instanciar o objeto Java.', 2),
 ('a5000000-0000-0000-0000-000303010103', 'a4000000-0000-0000-0000-000003030101', 'Por convenção de estilo, sem efeito prático.', FALSE, 'É requisito funcional: sem ele o Hibernate falha ao materializar resultados.', 3),
 ('a5000000-0000-0000-0000-000303010104', 'a4000000-0000-0000-0000-000003030101', 'Para permitir herança entre entidades.', FALSE, 'Herança tem seus próprios mapeamentos; o construtor vazio serve à instanciação reflexiva.', 4);

-- L5 Q2: campo private
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000303010201', 'a4000000-0000-0000-0000-000003030102', 'getDeclaredField("x") seguido de setAccessible(true) e get(objeto).', TRUE,  'Correto: getDeclaredField acha o campo privado; setAccessible desliga a checagem de acesso.', 1),
 ('a5000000-0000-0000-0000-000303010202', 'a4000000-0000-0000-0000-000003030102', 'getField("x") direto — campos privados são visíveis via reflection por padrão.', FALSE, 'getField só enxerga campos public; e o acesso a private exige setAccessible.', 2),
 ('a5000000-0000-0000-0000-000303010203', 'a4000000-0000-0000-0000-000003030102', 'Não é possível: private é inviolável em qualquer circunstância.', FALSE, 'Reflection com setAccessible(true) contorna o private (é o que Hibernate/Jackson fazem).', 3),
 ('a5000000-0000-0000-0000-000303010204', 'a4000000-0000-0000-0000-000003030102', 'Chamar toString() e extrair o valor da String.', FALSE, 'toString() pode nem incluir o campo — não é um mecanismo de acesso.', 4);

-- L6 Q1: retention
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000303020101', 'a4000000-0000-0000-0000-000003030201', '@Retention(RetentionPolicy.RUNTIME)', TRUE,  'Correto: só RUNTIME mantém a anotação visível para getAnnotation() em execução.', 1),
 ('a5000000-0000-0000-0000-000303020102', 'a4000000-0000-0000-0000-000003030201', '@Retention(RetentionPolicy.SOURCE)', FALSE, 'SOURCE descarta a anotação na compilação — reflection nunca a vê.', 2),
 ('a5000000-0000-0000-0000-000303020103', 'a4000000-0000-0000-0000-000003030201', '@Target(ElementType.RUNTIME)', FALSE, '@Target define ONDE anotar (método, classe...); RUNTIME nem é um ElementType.', 3),
 ('a5000000-0000-0000-0000-000303020104', 'a4000000-0000-0000-0000-000003030201', '@Inherited', FALSE, '@Inherited trata herança da anotação por subclasses — não retenção.', 4);

-- L7 Q1: builder
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000304010101', 'a4000000-0000-0000-0000-000003040101', 'Construir objetos com muitos parâmetros opcionais de forma legível, validando no build().', TRUE,  'Correto: elimina o "construtor telescópico" e ainda permite objeto final imutável.', 1),
 ('a5000000-0000-0000-0000-000304010102', 'a4000000-0000-0000-0000-000003040101', 'Garantir que só exista uma instância da classe.', FALSE, 'Isso é o Singleton.', 2),
 ('a5000000-0000-0000-0000-000304010103', 'a4000000-0000-0000-0000-000003040101', 'Escolher qual subclasse instanciar em runtime.', FALSE, 'Isso é o Factory Method.', 3),
 ('a5000000-0000-0000-0000-000304010104', 'a4000000-0000-0000-0000-000003040101', 'Adicionar comportamento a um objeto sem herança.', FALSE, 'Isso é o Decorator.', 4);

-- L8 Q1: decorator
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000304020101', 'a4000000-0000-0000-0000-000003040201', 'Decorator', TRUE,  'Correto: cada classe envolve outra da mesma "família" adicionando buffering, decodificação etc.', 1),
 ('a5000000-0000-0000-0000-000304020102', 'a4000000-0000-0000-0000-000003040201', 'Strategy', FALSE, 'Strategy troca o algoritmo, não empilha camadas sobre o mesmo objeto.', 2),
 ('a5000000-0000-0000-0000-000304020103', 'a4000000-0000-0000-0000-000003040201', 'Observer', FALSE, 'Não há eventos nem assinantes aqui.', 3),
 ('a5000000-0000-0000-0000-000304020104', 'a4000000-0000-0000-0000-000003040201', 'Singleton', FALSE, 'Cada new cria instâncias novas — nada de instância única.', 4);

-- ─── DESCRIPTIVE ANSWERS (reference key for AI grading) ──────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000003010202', 'a4000000-0000-0000-0000-000003010202',
  'Race condition é quando o resultado depende da ordem de execução de threads que acessam dado mutável compartilhado sem coordenação — ex.: duas threads leem o mesmo valor do contador e uma sobrescreve o incremento da outra. Soluções: (1) synchronized no método/bloco — exclusão mútua + visibilidade, simples mas serializa o acesso e pode virar gargalo; (2) AtomicInteger.incrementAndGet() — atômico via CAS, sem lock, escala melhor para operações simples. Uma terceira via é evitar estado compartilhado mutável (imutabilidade/confinamento).',
  'Deve definir race condition citando o entrelaçamento de leitura-modificação-escrita e apresentar duas soluções reais (synchronized, Atomic*, locks explícitos ou eliminação do compartilhamento). Bônus por comparar custo/escalabilidade ou citar que volatile sozinho NÃO resolve.'),
 ('a7000000-0000-0000-0000-000003020202', 'a4000000-0000-0000-0000-000003020202',
  'Disparar as duas buscas em paralelo com CompletableFuture.supplyAsync(() -> buscarPreco()) e supplyAsync(() -> buscarEstoque()); em seguida juntar com precoF.thenCombine(estoqueF, (preco, estoque) -> montarOferta(preco, estoque)). Como os dois futures são criados antes de qualquer espera, as chamadas correm simultaneamente; thenCombine só executa quando ambos completam. Para I/O bloqueante, passar um executor próprio ao supplyAsync em vez de saturar o commonPool.',
  'Deve deixar claro que as duas chamadas são iniciadas independentemente (paralelismo) e nomear a combinação (thenCombine, ou allOf + join/get). Penalizar solução sequencial (get antes de disparar a segunda). Bônus por mencionar executor dedicado para I/O ou tratamento de erro.'),
 ('a7000000-0000-0000-0000-000003030202', 'a4000000-0000-0000-0000-000003030202',
  'O Spring registra o bean por trás de um proxy (dinâmico de interface ou CGLIB). Ao escanear a classe, detecta @Transactional via reflection. Quando alguém chama o método, a chamada passa primeiro pelo proxy, que abre/reaproveita a transação, delega ao método real e, no retorno, faz commit — ou rollback se sair exceção (por padrão, unchecked). Por isso auto-invocação (this.metodo()) não passa pelo proxy e não abre transação.',
  'Deve descrever o mecanismo de proxy/interceptação envolvendo a chamada (begin antes, commit/rollback depois) e que a anotação é lida via reflection/metadados. Bônus por citar a armadilha da auto-invocação ou rollback apenas em unchecked por padrão. Penalizar se disser que a anotação em si executa a lógica.');

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000003040102', 'a4000000-0000-0000-0000-000003040102',
$initial$class Configuracao {
    // TODO: transforme em Singleton thread-safe:
    // 1) construtor privado
    // 2) getInstance() estático devolvendo SEMPRE a mesma instância
    private String ambiente = "producao";

    public String getAmbiente() { return ambiente; }
}
$initial$,
$solution$class Configuracao {
    private static final Configuracao INSTANCIA = new Configuracao();

    private String ambiente = "producao";

    private Configuracao() { }

    public static Configuracao getInstance() {
        return INSTANCIA;
    }

    public String getAmbiente() { return ambiente; }
}
$solution$,
 '[{"input": "Configuracao.getInstance() == Configuracao.getInstance()", "expected_output": "true"}, {"input": "Configuracao.getInstance().getAmbiente()", "expected_output": "producao"}]'::jsonb,
 'java',
 'Avalie se o construtor é privado, se existe um método estático getInstance() e se a MESMA instância é devolvida em todas as chamadas de forma thread-safe (campo static final eager, holder idiom ou double-checked locking com volatile — todos aceitáveis). Penalize lazy init sem sincronização (if instance == null sem lock) por não ser thread-safe, e construtor público.'),

 ('a6000000-0000-0000-0000-000003040202', 'a4000000-0000-0000-0000-000003040202',
$initial$// TODO: padrão Strategy
// 1) interface PoliticaDesconto { double aplicar(double valor); }
// 2) DescontoDezPorcento -> devolve valor * 0.9
// 3) SemDesconto         -> devolve o valor intacto
// 4) Checkout recebe uma PoliticaDesconto no construtor;
//    total(double) delega para a política.

class Checkout {
    double total(double valorCarrinho) {
        return valorCarrinho; // substitua pela delegação à estratégia
    }
}
$initial$,
$solution$interface PoliticaDesconto {
    double aplicar(double valor);
}

class DescontoDezPorcento implements PoliticaDesconto {
    public double aplicar(double valor) { return valor * 0.9; }
}

class SemDesconto implements PoliticaDesconto {
    public double aplicar(double valor) { return valor; }
}

class Checkout {
    private final PoliticaDesconto politica;

    Checkout(PoliticaDesconto politica) {
        this.politica = politica;
    }

    double total(double valorCarrinho) {
        return politica.aplicar(valorCarrinho);
    }
}
$solution$,
 '[{"input": "new Checkout(new DescontoDezPorcento()).total(100.0)", "expected_output": "90.0"}, {"input": "new Checkout(new SemDesconto()).total(50.0)", "expected_output": "50.0"}]'::jsonb,
 'java',
 'Avalie se existe a interface PoliticaDesconto com aplicar(double), duas implementações corretas (10% de desconto e nenhuma), e se Checkout recebe a política por construtor e delega em total() SEM if/else ou instanceof de tipos concretos. Aceite lambdas como implementações. Penalize condicional de tipo dentro do Checkout, pois destrói o propósito do padrão.');
