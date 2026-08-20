-- =====================================================================
-- LearnWay — seed "Java — Intermediário"
--   * 4 subtopics encadeados: Collections -> Generics -> Lambdas &
--     Streams -> Optional & java.time
--   * 8 lessons com teoria completa
--   * 16 questões: MULTIPLE_CHOICE, DESCRIPTIVE e CODE_CHALLENGE
-- Convenção de UUIDs (mesma do V2): sufixo determinístico
--   subtopic  a2…0000000002SS      lesson    a3…000000 02 SS LL
--   question  a4…0000 02 SS LL QQ  option    a5…00 02 SS LL QQ OO
--   descr.    a7…= question        code ch.  a6…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000201', 'a1000000-0000-0000-0000-000000000002', 'collections',     'Collections Framework',   'List, Set, Map e o contrato equals/hashCode.',              1, NULL),
 ('a2000000-0000-0000-0000-000000000202', 'a1000000-0000-0000-0000-000000000002', 'generics',        'Generics',                'Tipos parametrizados, type erasure, wildcards e PECS.',     2, 'a2000000-0000-0000-0000-000000000201'),
 ('a2000000-0000-0000-0000-000000000203', 'a1000000-0000-0000-0000-000000000002', 'lambdas-streams', 'Lambdas & Streams',       'Interfaces funcionais, lambdas e pipelines de dados.',      3, 'a2000000-0000-0000-0000-000000000202'),
 ('a2000000-0000-0000-0000-000000000204', 'a1000000-0000-0000-0000-000000000002', 'optional-time',   'Optional & java.time',    'Ausência de valor sem null e a API moderna de datas.',      4, 'a2000000-0000-0000-0000-000000000203');

-- ─── LESSONS: Collections ────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000020101', 'a2000000-0000-0000-0000-000000000201', 'List, Set e Map na prática',
$theory$
## List, Set e Map na prática

O **Collections Framework** oferece três famílias principais, cada uma com um contrato diferente:

| Interface | Contrato | Implementações comuns |
|-----------|----------|----------------------|
| `List` | sequência **ordenada**, aceita duplicatas | `ArrayList`, `LinkedList` |
| `Set` | **sem duplicatas** | `HashSet`, `LinkedHashSet`, `TreeSet` |
| `Map` | pares **chave → valor**, chave única | `HashMap`, `TreeMap` |

```java
List<String> nomes = new ArrayList<>();
nomes.add("Ana");
nomes.add("Ana");            // ok: List aceita duplicata

Set<String> unicos = new HashSet<>(nomes);
System.out.println(unicos.size()); // 1

Map<String, Integer> idade = new HashMap<>();
idade.put("Ana", 28);
idade.put("Ana", 29);        // sobrescreve: chave é única
```

### Qual List escolher?
- **`ArrayList`**: acesso por índice `get(i)` em **O(1)**; é a escolha padrão.
- **`LinkedList`**: inserções/remoções nas pontas em O(1), mas `get(i)` é O(n). Raramente vence o ArrayList na prática.

### Qual Set/Map escolher?
- **`HashSet`/`HashMap`**: mais rápidos (O(1) médio), **sem ordem garantida**.
- **`LinkedHashSet`/`LinkedHashMap`**: mantêm a **ordem de inserção**.
- **`TreeSet`/`TreeMap`**: mantêm **ordem natural** (ou de um `Comparator`) — operações em O(log n).

> Programe para a **interface** (`List`, `Set`, `Map`), não para a implementação. Trocar `ArrayList` por `LinkedList` não deve quebrar nenhum chamador.
$theory$, 15, 2, 1, 15),

 ('a3000000-0000-0000-0000-000000020102', 'a2000000-0000-0000-0000-000000000201', 'equals, hashCode e coleções hash',
$theory$
## equals, hashCode e coleções hash

`HashSet` e `HashMap` localizam elementos em dois passos: primeiro acham o **balde** pelo `hashCode()`, depois confirmam a igualdade com `equals()`. Por isso os dois métodos formam um **contrato**:

1. Se `a.equals(b)` então `a.hashCode() == b.hashCode()` — **obrigatório**.
2. O inverso não precisa valer (colisões são permitidas).

### O bug clássico
```java
class Ponto {
    final int x, y;
    Ponto(int x, int y) { this.x = x; this.y = y; }

    @Override public boolean equals(Object o) {
        return o instanceof Ponto p && p.x == x && p.y == y;
    }
    // hashCode() NÃO sobrescrito — usa o da identidade!
}

Set<Ponto> set = new HashSet<>();
set.add(new Ponto(1, 2));
set.contains(new Ponto(1, 2)); // false 😱 — caiu em outro balde
```

### A forma correta
```java
@Override public boolean equals(Object o) {
    return o instanceof Ponto p && p.x == x && p.y == y;
}
@Override public int hashCode() {
    return Objects.hash(x, y);
}
```

### Ou deixe o compilador trabalhar
`record` gera `equals`, `hashCode` e `toString` corretos automaticamente:
```java
record Ponto(int x, int y) { }
```

> Nunca use objetos **mutáveis** como chave de `HashMap`: se o estado mudar, o hashCode muda e o objeto "some" do mapa.
$theory$, 15, 3, 2, 15);

-- ─── LESSONS: Generics ───────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000020201', 'a2000000-0000-0000-0000-000000000202', 'Generics: tipos parametrizados',
$theory$
## Generics: tipos parametrizados

Generics permitem escrever classes e métodos que funcionam para **qualquer tipo**, com segurança verificada em **tempo de compilação**:

```java
List<String> nomes = new ArrayList<>();
nomes.add("Ana");
String s = nomes.get(0);   // sem cast — o compilador garante
nomes.add(42);             // ERRO de compilação 🎉
```

### Classes e métodos genéricos
```java
class Caixa<T> {
    private T conteudo;
    void guardar(T item) { this.conteudo = item; }
    T abrir() { return conteudo; }
}

static <T> T primeiro(List<T> lista) {
    return lista.get(0);
}
```

### Type erasure
Os generics existem **só em compilação**. Em runtime, `List<String>` e `List<Integer>` são a mesma classe (`List`):

```java
new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass(); // true
```

Consequências práticas:
- Não existe `new T()` nem `T[]` diretamente.
- `instanceof List<String>` não compila — só `instanceof List<?>`.

### Invariância
`List<String>` **não é** subtipo de `List<Object>`, mesmo String sendo subtipo de Object. Se fosse permitido, você poderia inserir um `Integer` numa lista de Strings através da referência mais genérica. Essa rigidez protege o código — e é flexibilizada com *wildcards*, tema da próxima lição.

> Generics eliminam casts e transformam erros de runtime (`ClassCastException`) em erros de compilação — sempre mais baratos de corrigir.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000020202', 'a2000000-0000-0000-0000-000000000202', 'Wildcards e o princípio PECS',
$theory$
## Wildcards e o princípio PECS

Wildcards (`?`) devolvem a flexibilidade que a invariância tira:

```java
double somar(List<? extends Number> nums) {  // aceita List<Integer>, List<Double>…
    double total = 0;
    for (Number n : nums) total += n.doubleValue();
    return total;
}
```

### PECS — Producer Extends, Consumer Super
- **`? extends T`** — a coleção é **produtora**: você **lê** T dela, mas não pode inserir (o compilador não sabe o subtipo exato).
- **`? super T`** — a coleção é **consumidora**: você **insere** T nela, mas ao ler só recebe `Object`.

```java
void copiar(List<? super Integer> destino, List<? extends Integer> origem) {
    for (Integer i : origem) {   // origem PRODUZ inteiros  (extends)
        destino.add(i);          // destino CONSOME inteiros (super)
    }
}

copiar(new ArrayList<Number>(), List.of(1, 2, 3)); // ok!
```

É exatamente a assinatura de `Collections.copy` no JDK.

### Bounded type parameters
Limites também valem em parâmetros de tipo nomeados:

```java
static <T extends Comparable<T>> T max(List<T> lista) {
    T maior = lista.get(0);
    for (T t : lista) if (t.compareTo(maior) > 0) maior = t;
    return maior;
}
```

> Regra de bolso: se o método **só lê** da coleção → `? extends`. Se **só escreve** → `? super`. Se lê **e** escreve → tipo exato, sem wildcard.
$theory$, 15, 4, 2, 18);

-- ─── LESSONS: Lambdas & Streams ──────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000020301', 'a2000000-0000-0000-0000-000000000203', 'Lambdas e interfaces funcionais',
$theory$
## Lambdas e interfaces funcionais

Uma **interface funcional** tem exatamente um método abstrato — e por isso pode ser implementada por uma **lambda**:

```java
// antes (classe anônima)
Runnable r1 = new Runnable() {
    @Override public void run() { System.out.println("oi"); }
};

// depois (lambda)
Runnable r2 = () -> System.out.println("oi");
```

### As quatro interfaces que você mais vai usar (`java.util.function`)

| Interface | Assinatura | Uso típico |
|-----------|-----------|------------|
| `Predicate<T>` | `T -> boolean` | filtros e validações |
| `Function<T, R>` | `T -> R` | transformações |
| `Consumer<T>` | `T -> void` | efeitos colaterais |
| `Supplier<T>` | `() -> T` | criação preguiçosa |

```java
Predicate<String> vazio   = s -> s.isBlank();
Function<String, Integer> tamanho = s -> s.length();
Consumer<String> imprime  = s -> System.out.println(s);
Supplier<List<String>> nova = () -> new ArrayList<>();
```

### Method references
Quando a lambda só delega para um método existente, use a forma `::` — mais curta e legível:

```java
s -> s.toUpperCase()      →  String::toUpperCase
x -> System.out.println(x) → System.out::println
() -> new ArrayList<>()    → ArrayList::new
```

### Variáveis capturadas
Lambdas podem usar variáveis locais do escopo externo, desde que sejam **efetivamente finais** (não reatribuídas depois).

> Lambda não é açúcar para classe anônima: não cria um novo escopo de `this` — o `this` dentro dela é o da classe envolvente.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000020302', 'a2000000-0000-0000-0000-000000000203', 'Streams: pipelines de dados',
$theory$
## Streams: pipelines de dados

Um `Stream` descreve um **pipeline declarativo** sobre uma fonte de dados: operações **intermediárias** (lazy) encadeadas e **uma** operação **terminal** que dispara tudo.

```java
List<String> resultado = nomes.stream()
        .filter(n -> n.length() > 3)   // intermediária
        .map(String::toUpperCase)      // intermediária
        .sorted()                      // intermediária
        .toList();                     // TERMINAL — só aqui algo executa
```

### Operações intermediárias vs terminais
- **Intermediárias** (`filter`, `map`, `sorted`, `distinct`, `limit`): devolvem outro Stream e **não executam nada** sozinhas.
- **Terminais** (`toList`, `forEach`, `count`, `reduce`, `collect`, `anyMatch`): consomem o stream — depois delas, o stream não pode ser reutilizado.

### Redução e coleta
```java
int soma = List.of(1, 2, 3).stream()
        .mapToInt(Integer::intValue)
        .sum();

Map<Integer, List<String>> porTamanho = nomes.stream()
        .collect(Collectors.groupingBy(String::length));
```

### Armadilhas comuns
- **Reutilizar stream**: `IllegalStateException` — crie outro a partir da fonte.
- **Efeitos colaterais no `map`/`filter`**: quebra a legibilidade e o paralelismo; mutação pertence ao terminal.
- **`parallelStream()` por reflexo**: paralelismo só compensa com muitas iterações e trabalho pesado por elemento.

> Streams não substituem todo `for`. Para lógica simples com `break`/índices, o loop clássico ainda é mais claro.
$theory$, 20, 4, 2, 18);

-- ─── LESSONS: Optional & java.time ───────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000020401', 'a2000000-0000-0000-0000-000000000204', 'Optional: ausência de valor sem null',
$theory$
## Optional: ausência de valor sem null

`Optional<T>` é um contêiner que **pode ou não** ter um valor — torna a ausência **explícita no tipo**, em vez de escondida num `null` que estoura depois.

```java
Optional<Usuario> buscarPorEmail(String email) { ... }

// quem chama é OBRIGADO a lidar com a ausência:
String nome = buscarPorEmail("a@b.com")
        .map(Usuario::getNome)
        .orElse("visitante");
```

### Criando
```java
Optional.of(valor);          // valor não pode ser null
Optional.ofNullable(valor);  // vira Optional.empty() se null
Optional.empty();
```

### Consumindo — do pior ao melhor
```java
opt.get();                        // ⚠️ estoura se vazio — evite
if (opt.isPresent()) opt.get();   // funciona, mas é o "if null" disfarçado
opt.orElse(padrao);               // valor padrão (avaliado sempre)
opt.orElseGet(() -> caro());      // padrão lazy (só se vazio)
opt.orElseThrow(() -> new NotFoundException());
opt.map(Usuario::getNome)         // transforma sem desembrulhar
   .filter(n -> !n.isBlank())
   .ifPresent(System.out::println);
```

### Onde NÃO usar
- **Campos de entidade/DTO** — serialização e JPA não gostam; use null com cuidado interno.
- **Parâmetros de método** — força `Optional.of(...)` em todo chamador; prefira sobrecarga.
- **Coleções** — devolva coleção **vazia**, nunca `Optional<List<T>>`.

> Optional foi desenhado para **tipos de retorno**. É documentação executável: a assinatura avisa "posso não ter resposta".
$theory$, 15, 3, 1, 12),

 ('a3000000-0000-0000-0000-000000020402', 'a2000000-0000-0000-0000-000000000204', 'Datas e horas com java.time',
$theory$
## Datas e horas com java.time

A API `java.time` (Java 8+) substituiu `Date`/`Calendar` com classes **imutáveis** e de propósito claro:

| Classe | Representa | Exemplo |
|--------|-----------|---------|
| `LocalDate` | só a data | aniversário, vencimento |
| `LocalTime` | só a hora | horário de abertura |
| `LocalDateTime` | data + hora, **sem fuso** | agendamento local |
| `ZonedDateTime` | data + hora + **fuso** | evento global, log |
| `Instant` | ponto na linha do tempo (UTC) | timestamps |

```java
LocalDate hoje = LocalDate.now();
LocalDate vencimento = hoje.plusDays(30);     // NOVA instância!
hoje.plusDays(30);                            // sem efeito se ignorar o retorno

ZonedDateTime reuniao = ZonedDateTime.of(
    LocalDateTime.of(2026, 7, 10, 14, 0),
    ZoneId.of("America/Sao_Paulo"));
```

### Duration e Period
- **`Duration`** — tempo em horas/minutos/segundos: `Duration.between(inicio, fim)`.
- **`Period`** — tempo em anos/meses/dias: `Period.between(nascimento, hoje).getYears()`.

### Formatação e parsing
```java
DateTimeFormatter br = DateTimeFormatter.ofPattern("dd/MM/yyyy");
String texto = hoje.format(br);              // "03/07/2026"
LocalDate volta = LocalDate.parse("03/07/2026", br);
```

### Imutabilidade
Como `String`, todas essas classes são imutáveis: `plusDays`, `withYear`, `minusMonths` sempre **retornam uma nova instância**. Isso as torna seguras para compartilhar entre threads.

> Regra prática: armazene instantes em **UTC** (`Instant`) e converta para o fuso do usuário só na exibição.
$theory$, 15, 2, 2, 12);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: List, Set e Map -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002010101', 'a3000000-0000-0000-0000-000000020101', 'MULTIPLE_CHOICE',
  'Você precisa de acesso frequente por índice (`get(i)`) em uma sequência grande. Qual implementação escolher?', 'Pense no custo de get(i) em cada estrutura.', 1, 5, 2),
 ('a4000000-0000-0000-0000-000002010102', 'a3000000-0000-0000-0000-000000020101', 'MULTIPLE_CHOICE',
  'Você precisa garantir que não haja elementos duplicados, sem se importar com a ordem. Qual coleção usar?', 'Qual contrato proíbe duplicatas?', 2, 5, 2);

-- L2: equals/hashCode -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002010201', 'a3000000-0000-0000-0000-000000020102', 'MULTIPLE_CHOICE',
  'Uma classe sobrescreve `equals()` mas NÃO sobrescreve `hashCode()`. O que pode acontecer ao usá-la num `HashSet`?', 'Lembre dos dois passos: balde primeiro, equals depois.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000002010202', 'a3000000-0000-0000-0000-000000020102', 'DESCRIPTIVE',
  'Explique o contrato entre `equals()` e `hashCode()` e por que ele é essencial para `HashMap` funcionar corretamente.', 'O que o HashMap usa para achar o balde? E para confirmar a chave?', 2, 10, 3);

-- L3: Generics -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002020101', 'a3000000-0000-0000-0000-000000020201', 'MULTIPLE_CHOICE',
  'O que o *type erasure* significa na prática para `List<String>` e `List<Integer>`?', 'Generics existem em compilação ou em runtime?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000002020102', 'a3000000-0000-0000-0000-000000020201', 'DESCRIPTIVE',
  'Um método recebe `List<Object>`. Por que o compilador rejeita passar uma `List<String>` para ele, se String é subtipo de Object? Que problema essa restrição evita?', 'Imagine o método inserindo um Integer na lista recebida.', 2, 10, 4);

-- L4: Wildcards/PECS -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002020201', 'a3000000-0000-0000-0000-000000020202', 'MULTIPLE_CHOICE',
  'Segundo o princípio PECS, um parâmetro `List<? super Integer>` indica que o método pretende…', 'Producer Extends, Consumer Super.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000002020202', 'a3000000-0000-0000-0000-000000020202', 'CODE_CHALLENGE',
  'Implemente o método genérico `somar` que aceita uma lista de qualquer subtipo de `Number` e retorna a soma como `double`.', 'O método só LÊ da lista — qual wildcard usar?', 2, 15, 4);

-- L5: Lambdas -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002030101', 'a3000000-0000-0000-0000-000000020301', 'MULTIPLE_CHOICE',
  'Qual interface funcional representa uma função que recebe um `T` e devolve um `boolean`?', 'É a interface típica de filtros.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000002030102', 'a3000000-0000-0000-0000-000000020301', 'MULTIPLE_CHOICE',
  'Qual lambda é equivalente ao method reference `String::toUpperCase` aplicado a um `Stream<String>`?', 'O primeiro parâmetro vira o receptor da chamada.', 2, 5, 3);

-- L6: Streams -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002030201', 'a3000000-0000-0000-0000-000000020302', 'MULTIPLE_CHOICE',
  'Um pipeline tem `filter` e `map`, mas nenhuma operação terminal. O que acontece ao executá-lo?', 'Operações intermediárias são lazy.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000002030202', 'a3000000-0000-0000-0000-000000020302', 'CODE_CHALLENGE',
  'Usando Streams, implemente `filtrarNomes`: receba uma lista de nomes e retorne apenas os com mais de 3 letras, em MAIÚSCULAS e em ordem alfabética.', 'filter -> map -> sorted -> toList.', 2, 15, 4);

-- L7: Optional -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002040101', 'a3000000-0000-0000-0000-000000020401', 'MULTIPLE_CHOICE',
  'Qual a diferença prática entre `orElse(caro())` e `orElseGet(() -> caro())`?', 'Quando cada argumento é avaliado?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000002040102', 'a3000000-0000-0000-0000-000000020401', 'DESCRIPTIVE',
  'Por que retornar `Optional<T>` é melhor do que retornar `null`? Cite também um lugar onde Optional NÃO deve ser usado, justificando.', 'Pense no que a assinatura do método comunica.', 2, 10, 3);

-- L8: java.time -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002040201', 'a3000000-0000-0000-0000-000000020402', 'MULTIPLE_CHOICE',
  'Após executar `LocalDate data = LocalDate.of(2026, 7, 3); data.plusDays(10);` qual é o valor de `data`?', 'As classes de java.time são imutáveis.', 1, 5, 2),
 ('a4000000-0000-0000-0000-000002040202', 'a3000000-0000-0000-0000-000000020402', 'MULTIPLE_CHOICE',
  'Para armazenar a data de aniversário de um usuário (sem hora, sem fuso), qual classe é a mais adequada?', 'Só a data importa aqui.', 2, 5, 2);

-- ─── OPTIONS (multiple choice) ───────────────────────────────────────
-- L1 Q1: acesso por índice
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000201010101', 'a4000000-0000-0000-0000-000002010101', 'ArrayList', TRUE,  'Correto: ArrayList é baseado em array — get(i) é O(1).', 1),
 ('a5000000-0000-0000-0000-000201010102', 'a4000000-0000-0000-0000-000002010101', 'LinkedList', FALSE, 'LinkedList percorre nó a nó: get(i) é O(n).', 2),
 ('a5000000-0000-0000-0000-000201010103', 'a4000000-0000-0000-0000-000002010101', 'HashSet', FALSE, 'Set não tem índice — nem existe get(i).', 3),
 ('a5000000-0000-0000-0000-000201010104', 'a4000000-0000-0000-0000-000002010101', 'TreeMap', FALSE, 'TreeMap é chave→valor ordenado por chave, não uma sequência indexada.', 4);

-- L1 Q2: sem duplicatas
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000201010201', 'a4000000-0000-0000-0000-000002010102', 'HashSet', TRUE,  'Correto: Set proíbe duplicatas, e HashSet é a implementação mais rápida quando a ordem não importa.', 1),
 ('a5000000-0000-0000-0000-000201010202', 'a4000000-0000-0000-0000-000002010102', 'ArrayList', FALSE, 'List aceita duplicatas livremente.', 2),
 ('a5000000-0000-0000-0000-000201010203', 'a4000000-0000-0000-0000-000002010102', 'LinkedList', FALSE, 'Também é List — aceita duplicatas.', 3),
 ('a5000000-0000-0000-0000-000201010204', 'a4000000-0000-0000-0000-000002010102', 'TreeSet', FALSE, 'Evita duplicatas, mas mantém ordenação (custo O(log n)) que o enunciado dispensou — HashSet é mais adequado.', 4);

-- L2 Q1: equals sem hashCode
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000201020101', 'a4000000-0000-0000-0000-000002010201', 'Objetos "iguais" podem cair em baldes diferentes — contains() falha e duplicatas aparecem.', TRUE,  'Correto: sem hashCode coerente, dois objetos iguais têm hashes diferentes e o Set nem chega a chamar o equals.', 1),
 ('a5000000-0000-0000-0000-000201020102', 'a4000000-0000-0000-0000-000002010201', 'Erro de compilação: hashCode é obrigatório junto com equals.', FALSE, 'Compila normalmente — o contrato é semântico, não verificado pelo compilador.', 2),
 ('a5000000-0000-0000-0000-000201020103', 'a4000000-0000-0000-0000-000002010201', 'Nada: HashSet usa apenas equals().', FALSE, 'HashSet acha o balde pelo hashCode ANTES de usar equals.', 3),
 ('a5000000-0000-0000-0000-000201020104', 'a4000000-0000-0000-0000-000002010201', 'RuntimeException ao inserir o segundo objeto igual.', FALSE, 'Não há exceção — o bug é silencioso, o que o torna ainda mais perigoso.', 4);

-- L3 Q1: type erasure
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000202010101', 'a4000000-0000-0000-0000-000002020101', 'Em runtime as duas são a mesma classe — o parâmetro de tipo é apagado na compilação.', TRUE,  'Correto: o bytecode só conhece List; a verificação de tipos acontece toda em compilação.', 1),
 ('a5000000-0000-0000-0000-000202010102', 'a4000000-0000-0000-0000-000002020101', 'A JVM cria uma classe separada para cada tipo, como templates do C++.', FALSE, 'Esse é o modelo do C++. Java apaga o tipo — uma classe só.', 2),
 ('a5000000-0000-0000-0000-000202010103', 'a4000000-0000-0000-0000-000002020101', 'Listas de String ficam mais rápidas que listas de Integer.', FALSE, 'Erasure não tem efeito de performance entre tipos de elemento.', 3),
 ('a5000000-0000-0000-0000-000202010104', 'a4000000-0000-0000-0000-000002020101', 'É possível descobrir o tipo do elemento com instanceof List<String>.', FALSE, 'Justamente o contrário: instanceof com tipo genérico concreto não compila.', 4);

-- L4 Q1: PECS super
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000202020101', 'a4000000-0000-0000-0000-000002020201', 'Inserir Integers na lista (a lista é consumidora).', TRUE,  'Correto: super = consumer. Dá para add(Integer); a leitura devolve apenas Object.', 1),
 ('a5000000-0000-0000-0000-000202020102', 'a4000000-0000-0000-0000-000002020201', 'Ler Integers da lista (a lista é produtora).', FALSE, 'Ler com tipo Integer pede ? extends Integer — producer extends.', 2),
 ('a5000000-0000-0000-0000-000202020103', 'a4000000-0000-0000-0000-000002020201', 'Impedir qualquer modificação na lista.', FALSE, 'Imutabilidade não tem relação com wildcards — seria List.copyOf ou Collections.unmodifiableList.', 3),
 ('a5000000-0000-0000-0000-000202020104', 'a4000000-0000-0000-0000-000002020201', 'Aceitar apenas exatamente List<Integer>.', FALSE, 'super aceita List<Integer>, List<Number> e List<Object>.', 4);

-- L5 Q1: Predicate
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000203010101', 'a4000000-0000-0000-0000-000002030101', 'Predicate<T>', TRUE,  'Correto: Predicate<T> define boolean test(T t) — a interface dos filtros.', 1),
 ('a5000000-0000-0000-0000-000203010102', 'a4000000-0000-0000-0000-000002030101', 'Function<T, Boolean>', FALSE, 'Funciona, mas devolve o wrapper Boolean e não é a interface idiomática para filtros.', 2),
 ('a5000000-0000-0000-0000-000203010103', 'a4000000-0000-0000-0000-000002030101', 'Consumer<T>', FALSE, 'Consumer recebe T e não devolve nada (void).', 3),
 ('a5000000-0000-0000-0000-000203010104', 'a4000000-0000-0000-0000-000002030101', 'Supplier<T>', FALSE, 'Supplier não recebe nada e devolve T — o oposto do pedido.', 4);

-- L5 Q2: method reference
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000203010201', 'a4000000-0000-0000-0000-000002030102', 's -> s.toUpperCase()', TRUE,  'Correto: em referências a método de instância pelo tipo, o primeiro parâmetro vira o receptor.', 1),
 ('a5000000-0000-0000-0000-000203010202', 'a4000000-0000-0000-0000-000002030102', '() -> String.toUpperCase()', FALSE, 'toUpperCase não é estático e a aridade não bate com Stream<String>.map.', 2),
 ('a5000000-0000-0000-0000-000203010203', 'a4000000-0000-0000-0000-000002030102', 's -> String.toUpperCase(s)', FALSE, 'Não existe String.toUpperCase(String) estático no JDK.', 3),
 ('a5000000-0000-0000-0000-000203010204', 'a4000000-0000-0000-0000-000002030102', '(a, b) -> a.toUpperCase(b)', FALSE, 'Duas entradas não correspondem à Function<String, String> que o map espera.', 4);

-- L6 Q1: lazy
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000203020101', 'a4000000-0000-0000-0000-000002030201', 'Nada é processado — sem operação terminal, o pipeline nunca executa.', TRUE,  'Correto: intermediárias são lazy; é o terminal que puxa os dados pelo pipeline.', 1),
 ('a5000000-0000-0000-0000-000203020102', 'a4000000-0000-0000-0000-000002030201', 'O filter roda, mas o map não.', FALSE, 'Nenhuma das duas roda — ambas são intermediárias.', 2),
 ('a5000000-0000-0000-0000-000203020103', 'a4000000-0000-0000-0000-000002030201', 'Tudo roda normalmente e o resultado é descartado.', FALSE, 'Sem terminal, nem sequer há iteração sobre a fonte.', 3),
 ('a5000000-0000-0000-0000-000203020104', 'a4000000-0000-0000-0000-000002030201', 'Lança IllegalStateException.', FALSE, 'Essa exceção acontece ao REUSAR um stream já consumido — outro cenário.', 4);

-- L7 Q1: orElse vs orElseGet
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000204010101', 'a4000000-0000-0000-0000-000002040101', 'orElse avalia o argumento sempre; orElseGet só executa o Supplier se o Optional estiver vazio.', TRUE,  'Correto: por isso orElseGet é preferível quando o padrão é caro de construir.', 1),
 ('a5000000-0000-0000-0000-000204010102', 'a4000000-0000-0000-0000-000002040101', 'São idênticos — apenas estilos diferentes.', FALSE, 'A avaliação eager vs lazy do argumento é uma diferença real de comportamento.', 2),
 ('a5000000-0000-0000-0000-000204010103', 'a4000000-0000-0000-0000-000002040101', 'orElseGet lança exceção se o Optional estiver vazio.', FALSE, 'Quem lança exceção é orElseThrow; orElseGet devolve o valor do Supplier.', 3),
 ('a5000000-0000-0000-0000-000204010104', 'a4000000-0000-0000-0000-000002040101', 'orElse só funciona com tipos primitivos.', FALSE, 'orElse aceita qualquer T do Optional<T>.', 4);

-- L8 Q1: imutabilidade
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000204020101', 'a4000000-0000-0000-0000-000002040201', '2026-07-03 — plusDays devolve uma NOVA instância, que foi ignorada.', TRUE,  'Correto: java.time é imutável; sem reatribuir (data = data.plusDays(10)), nada muda.', 1),
 ('a5000000-0000-0000-0000-000204020102', 'a4000000-0000-0000-0000-000002040201', '2026-07-13 — o método altera a própria data.', FALSE, 'plusDays nunca modifica o objeto original — ele é imutável.', 2),
 ('a5000000-0000-0000-0000-000204020103', 'a4000000-0000-0000-0000-000002040201', 'Erro de compilação por descartar o retorno.', FALSE, 'Descartar retorno compila (algumas IDEs apenas avisam).', 3),
 ('a5000000-0000-0000-0000-000204020104', 'a4000000-0000-0000-0000-000002040201', 'null, pois a data foi consumida.', FALSE, 'Nada "consome" a instância — ela permanece intacta.', 4);

-- L8 Q2: classe adequada
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000204020201', 'a4000000-0000-0000-0000-000002040202', 'LocalDate', TRUE,  'Correto: só a data, sem hora nem fuso — exatamente o caso de um aniversário.', 1),
 ('a5000000-0000-0000-0000-000204020202', 'a4000000-0000-0000-0000-000002040202', 'LocalDateTime', FALSE, 'Carregaria uma hora sem significado para aniversário.', 2),
 ('a5000000-0000-0000-0000-000204020203', 'a4000000-0000-0000-0000-000002040202', 'ZonedDateTime', FALSE, 'Fuso horário não faz sentido para uma data de aniversário.', 3),
 ('a5000000-0000-0000-0000-000204020204', 'a4000000-0000-0000-0000-000002040202', 'Instant', FALSE, 'Instant é um ponto exato na linha do tempo UTC — não representa "um dia".', 4);

-- ─── DESCRIPTIVE ANSWERS (reference key for AI grading) ──────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000002010202', 'a4000000-0000-0000-0000-000002010202',
  'O contrato exige que objetos iguais por equals() tenham o mesmo hashCode(). O HashMap usa o hashCode para escolher o balde onde a chave fica e só depois usa equals para confirmar. Se duas chaves iguais tiverem hashes diferentes, caem em baldes diferentes: get() não encontra o valor, containsKey() retorna false e "duplicatas" convivem no mapa.',
  'Deve citar o contrato (iguais => mesmo hash), o mecanismo de baldes em duas fases (hash localiza, equals confirma) e pelo menos um sintoma prático da violação (lookup falhando/duplicatas). Penalizar se inverter o contrato (mesmo hash => iguais).'),
 ('a7000000-0000-0000-0000-000002020102', 'a4000000-0000-0000-0000-000002020102',
  'Generics são invariantes: List<String> não é subtipo de List<Object>. Se fosse permitido, o método poderia fazer lista.add(Integer) através da referência List<Object>, corrompendo a lista original de Strings — o erro só apareceria depois, como ClassCastException ao ler. A invariância transforma esse risco em erro de compilação. Para aceitar listas de vários tipos apenas para leitura, usa-se List<? extends Object> (ou wildcards adequados).',
  'Deve explicar a invariância, dar o cenário de corrupção (inserir tipo errado via referência genérica) e reconhecer que o problema viraria erro de runtime. Bônus por mencionar wildcards como solução para leitura.'),
 ('a7000000-0000-0000-0000-000002040102', 'a4000000-0000-0000-0000-000002040102',
  'Optional torna a ausência explícita na assinatura: o chamador é forçado pelo tipo a decidir o que fazer quando não há valor, em vez de esquecer um if null e tomar NullPointerException longe da origem. Também habilita composição (map/filter/orElse). Não deve ser usado em campos de entidades/DTOs (problemas com serialização e JPA), em parâmetros de método (polui os chamadores) nem para coleções (retorne coleção vazia).',
  'Deve mencionar a explicitação da ausência no tipo/assinatura e o ganho sobre null (NPE evitada ou tratamento forçado). Precisa citar ao menos um antipadrão (campo, parâmetro ou coleção) com justificativa. Bônus por mencionar orElse/map.');

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000002020202', 'a4000000-0000-0000-0000-000002020202',
$initial$import java.util.List;

class Calculadora {
    // TODO: torne este método genérico o suficiente para aceitar
    // List<Integer>, List<Double>, List<Long>... e some tudo como double.
    static double somar(List<Integer> numeros) {
        double total = 0;
        for (Integer n : numeros) total += n;
        return total;
    }
}
$initial$,
$solution$import java.util.List;

class Calculadora {
    static double somar(List<? extends Number> numeros) {
        double total = 0;
        for (Number n : numeros) {
            total += n.doubleValue();
        }
        return total;
    }
}
$solution$,
 '[{"input": "Calculadora.somar(List.of(1, 2, 3))", "expected_output": "6.0"}, {"input": "Calculadora.somar(List.of(1.5, 2.5))", "expected_output": "4.0"}, {"input": "Calculadora.somar(List.of(10L, 20L))", "expected_output": "30.0"}]'::jsonb,
 'java',
 'Avalie se o método usa o wildcard "? extends Number" (producer extends) no parâmetro, itera como Number e soma via doubleValue(). Aceite variações equivalentes como <T extends Number>. Penalize se aceitar apenas List<Integer> ou se usar casts inseguros.'),

 ('a6000000-0000-0000-0000-000002030202', 'a4000000-0000-0000-0000-000002030202',
$initial$import java.util.List;

class Filtro {
    // TODO: usando Streams, retorne apenas os nomes com mais de 3 letras,
    // convertidos para MAIÚSCULAS e em ordem alfabética.
    static List<String> filtrarNomes(List<String> nomes) {
        return nomes; // substitua pelo pipeline
    }
}
$initial$,
$solution$import java.util.List;

class Filtro {
    static List<String> filtrarNomes(List<String> nomes) {
        return nomes.stream()
                .filter(n -> n.length() > 3)
                .map(String::toUpperCase)
                .sorted()
                .toList();
    }
}
$solution$,
 '[{"input": "Filtro.filtrarNomes(List.of(\"Ana\", \"Bruno\", \"Carla\", \"Li\"))", "expected_output": "[BRUNO, CARLA]"}, {"input": "Filtro.filtrarNomes(List.of(\"Zeca\", \"Alice\"))", "expected_output": "[ALICE, ZECA]"}, {"input": "Filtro.filtrarNomes(List.of(\"Bia\"))", "expected_output": "[]"}]'::jsonb,
 'java',
 'Avalie se a solução usa a API de Streams com filter (length() > 3), map para maiúsculas (String::toUpperCase ou equivalente), sorted() e coleta com toList()/collect(Collectors.toList()). A ordem das operações filter/map pode variar desde que o resultado seja correto; sorted deve vir antes da coleta. Penalize soluções com loop imperativo sem streams, pois o enunciado exige Streams.');
