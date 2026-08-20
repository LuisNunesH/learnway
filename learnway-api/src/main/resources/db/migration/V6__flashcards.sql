-- =====================================================================
-- LearnWay — Flashcards (repetição espaçada por carta, estilo Anki)
-- Cada carta pertence a uma lição; o agendamento SM-2 é por usuário+carta
-- e só passa a valer depois que o usuário completa a lição.
-- =====================================================================

CREATE TABLE flashcards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    front_text  TEXT NOT NULL,
    back_text   TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_flashcards_lesson ON flashcards (lesson_id);

CREATE TABLE flashcard_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id     UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    next_review_at   TIMESTAMPTZ NOT NULL,
    interval_days    INTEGER NOT NULL DEFAULT 1,
    ease_factor      DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE (user_id, flashcard_id)
);
CREATE INDEX idx_flashcard_progress_user_due ON flashcard_progress (user_id, next_review_at);

-- ─── Conquista nova ──────────────────────────────────────────────────
INSERT INTO achievements (id, slug, title, description, icon, xp_bonus) VALUES
 ('a8000000-0000-0000-0000-000000000010', 'card_master', 'Baralho Afiado', 'Revisar 50 flashcards', 'cards', 150);

-- =====================================================================
-- SEED — 5 cartas por lição (frente = pergunta, verso = resposta curta)
-- UUID: f1000000-0000-0000-0000-0000<lição:6><carta:2>
-- =====================================================================

-- ─── Java Fundamentos · Classes e Objetos (010101) ───────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001010101', 'a3000000-0000-0000-0000-000000010101',
  'O que é uma **classe** em Java?',
  'O molde que define **atributos** (estado) e **métodos** (comportamento). Objetos são instâncias criadas a partir dela com `new`.', 1),
 ('f1000000-0000-0000-0000-000001010102', 'a3000000-0000-0000-0000-000000010101',
  'O que é um **objeto**?',
  'Uma **instância** de uma classe: ocupa memória e tem estado próprio. Duas instâncias da mesma classe têm atributos independentes.', 2),
 ('f1000000-0000-0000-0000-000001010103', 'a3000000-0000-0000-0000-000000010101',
  'O que faz um **construtor**?',
  'Inicializa o objeto no momento do `new`. Tem o mesmo nome da classe e não declara retorno. Sem nenhum, o Java gera o construtor padrão vazio.', 3),
 ('f1000000-0000-0000-0000-000001010104', 'a3000000-0000-0000-0000-000000010101',
  'Para que serve a palavra-chave `this`?',
  'Referencia o próprio objeto. Desambigua atributo de parâmetro (`this.nome = nome`) e chama outro construtor da mesma classe (`this(...)`).', 4),
 ('f1000000-0000-0000-0000-000001010105', 'a3000000-0000-0000-0000-000000010101',
  'Qual a diferença entre **atributo** e **variável local**?',
  'Atributo pertence ao objeto: vive enquanto ele viver e recebe valor padrão. Variável local existe só dentro do método e precisa ser inicializada antes do uso.', 5);

-- ─── Java Fundamentos · Encapsulamento (010102) ──────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001010201', 'a3000000-0000-0000-0000-000000010102',
  'O que é **encapsulamento**?',
  'Esconder o estado interno (`private`) e expor operações controladas por métodos públicos. Protege as invariantes e permite trocar a implementação sem quebrar quem usa.', 1),
 ('f1000000-0000-0000-0000-000001010202', 'a3000000-0000-0000-0000-000000010102',
  'Por que atributos devem ser `private`?',
  'Para impedir alterações diretas que violem as regras da classe. O acesso passa por getters/setters, onde dá para **validar** antes de aceitar um valor.', 2),
 ('f1000000-0000-0000-0000-000001010203', 'a3000000-0000-0000-0000-000000010102',
  'Quais são os modificadores de acesso, do mais restrito ao mais aberto?',
  '`private` → *default* (mesmo pacote) → `protected` (pacote + subclasses) → `public`.', 3),
 ('f1000000-0000-0000-0000-000001010204', 'a3000000-0000-0000-0000-000000010102',
  'Para que servem **getters** e **setters**?',
  'Getter lê um atributo; setter altera com validação (`if (valor < 0) throw ...`). O setter é o ponto de defesa da classe contra estados inválidos.', 4),
 ('f1000000-0000-0000-0000-000001010205', 'a3000000-0000-0000-0000-000000010102',
  'O que é uma classe **imutável**?',
  'Classe cujos objetos não mudam depois de criados: atributos `final` e nenhum setter. Ex.: `String`. Facilita o raciocínio e o uso concorrente.', 5);

-- ─── Java Fundamentos · Herança e Polimorfismo (010103) ──────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001010301', 'a3000000-0000-0000-0000-000000010103',
  'O que a palavra-chave `extends` faz?',
  'Cria **herança**: a subclasse ganha os atributos e métodos da superclasse e pode especializá-los. Java só permite herança simples de classe.', 1),
 ('f1000000-0000-0000-0000-000001010302', 'a3000000-0000-0000-0000-000000010103',
  'O que é **sobrescrita** (`@Override`)?',
  'Redefinir na subclasse um método herdado, mantendo a assinatura. A anotação faz o compilador conferir que você está mesmo sobrescrevendo algo.', 2),
 ('f1000000-0000-0000-0000-000001010303', 'a3000000-0000-0000-0000-000000010103',
  'O que é **polimorfismo**?',
  'Uma referência do tipo da superclasse pode apontar para objetos de subclasses; o método executado é o do **tipo real** do objeto, decidido em tempo de execução.', 3),
 ('f1000000-0000-0000-0000-000001010304', 'a3000000-0000-0000-0000-000000010103',
  'Para que serve `super`?',
  '`super(...)` chama o construtor da superclasse (primeira linha do construtor da subclasse); `super.metodo()` invoca a versão herdada de um método sobrescrito.', 4),
 ('f1000000-0000-0000-0000-000001010305', 'a3000000-0000-0000-0000-000000010103',
  'Qual a diferença entre **sobrecarga** e **sobrescrita**?',
  'Sobrecarga: mesmo nome com parâmetros diferentes, na mesma classe — resolvida em compilação. Sobrescrita: mesma assinatura na subclasse — resolvida em execução.', 5);

-- ─── Java Fundamentos · Primitivos, Wrappers e Autoboxing (010201) ───
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001020101', 'a3000000-0000-0000-0000-000000010201',
  'Quais são os 8 tipos **primitivos** do Java?',
  '`byte`, `short`, `int`, `long`, `float`, `double`, `char` e `boolean`.', 1),
 ('f1000000-0000-0000-0000-000001020102', 'a3000000-0000-0000-0000-000000010201',
  'O que são classes **wrapper**?',
  'As versões objeto dos primitivos (`Integer`, `Double`, `Boolean`...). Necessárias em coleções e generics — e, por serem referências, podem ser `null`.', 2),
 ('f1000000-0000-0000-0000-000001020103', 'a3000000-0000-0000-0000-000000010201',
  'O que é **autoboxing** e **unboxing**?',
  'Conversão automática primitivo ↔ wrapper: `Integer x = 5` (boxing) e `int y = x` (unboxing). Cuidado: unboxing de `null` lança `NullPointerException`.', 3),
 ('f1000000-0000-0000-0000-000001020104', 'a3000000-0000-0000-0000-000000010201',
  'Por que comparar wrappers com `==` é perigoso?',
  '`==` compara **referências**. O `Integer` mantém cache de -128 a 127 — fora dessa faixa `==` costuma dar `false` mesmo com valores iguais. Use `equals()`.', 4),
 ('f1000000-0000-0000-0000-000001020105', 'a3000000-0000-0000-0000-000000010201',
  'Qual o valor padrão de um atributo `int`? E de um `Integer`?',
  '`int` inicia em `0`; `Integer` inicia em `null` (é referência). Num cálculo, o `null` explode com `NullPointerException` na hora do unboxing.', 5);

-- ─── Java Fundamentos · Strings e Imutabilidade (010202) ─────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001020201', 'a3000000-0000-0000-0000-000000010202',
  'O que significa dizer que `String` é **imutável**?',
  'Métodos como `toUpperCase()` retornam uma **nova** String — a original nunca muda. Isso dá segurança, permite cache do hash e viabiliza o pool de strings.', 1),
 ('f1000000-0000-0000-0000-000001020202', 'a3000000-0000-0000-0000-000000010202',
  'O que é o **pool de strings**?',
  'Área onde literais iguais são compartilhados: `"a" == "a"` pode ser `true`, mas `new String("a")` cria outro objeto. Por isso, compare conteúdo com `equals()`.', 2),
 ('f1000000-0000-0000-0000-000001020203', 'a3000000-0000-0000-0000-000000010202',
  'Quando usar `StringBuilder`?',
  'Em concatenações repetidas (laços): `+` cria uma String nova a cada volta, enquanto `append()` altera um buffer mutável — muito mais eficiente.', 3),
 ('f1000000-0000-0000-0000-000001020204', 'a3000000-0000-0000-0000-000000010202',
  '`equals()` vs `==` em Strings?',
  '`==` compara referências (mesmo objeto na memória); `equals()` compara o **conteúdo**. Para ignorar maiúsculas/minúsculas, `equalsIgnoreCase()`.', 4),
 ('f1000000-0000-0000-0000-000001020205', 'a3000000-0000-0000-0000-000000010202',
  'Cite 5 métodos úteis de `String`.',
  '`length()`, `substring()`, `contains()`, `split()`, `replace()` — além de `trim()/strip()`, `indexOf()`, `charAt()` e `toLowerCase()/toUpperCase()`.', 5);

-- ─── Java Fundamentos · Exceções (010301) ────────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000001030101', 'a3000000-0000-0000-0000-000000010301',
  'Qual a diferença entre exceção **checked** e **unchecked**?',
  'Checked (herda de `Exception`): o compilador obriga `try/catch` ou `throws` — falhas recuperáveis, ex.: `IOException`. Unchecked (herda de `RuntimeException`): erros de programação, ex.: `NullPointerException`.', 1),
 ('f1000000-0000-0000-0000-000001030102', 'a3000000-0000-0000-0000-000000010301',
  'Para que serve o bloco `finally`?',
  'Executa **sempre**, com ou sem exceção — tradicionalmente usado para liberar recursos. Hoje, prefira try-with-resources quando o recurso é `AutoCloseable`.', 2),
 ('f1000000-0000-0000-0000-000001030103', 'a3000000-0000-0000-0000-000000010301',
  'O que é **try-with-resources**?',
  '`try (var r = new FileReader(...)) { ... }` — fecha o recurso automaticamente ao sair do bloco, mesmo com exceção. Exige que o recurso implemente `AutoCloseable`.', 3),
 ('f1000000-0000-0000-0000-000001030104', 'a3000000-0000-0000-0000-000000010301',
  'Como criar uma **exceção personalizada**?',
  'Estenda `Exception` (checked) ou `RuntimeException` (unchecked) e ofereça construtores com mensagem e causa. Ex.: `class SaldoInsuficienteException extends RuntimeException`.', 4),
 ('f1000000-0000-0000-0000-000001030105', 'a3000000-0000-0000-0000-000000010301',
  'Cite 3 boas práticas com exceções.',
  'Capturar o tipo mais **específico** primeiro; nunca engolir exceção com catch vazio; preservar a causa original ao relançar (`throw new X(msg, causa)`).', 5);

-- ─── Java Intermediário · List, Set e Map (020101) ───────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002010101', 'a3000000-0000-0000-0000-000000020101',
  'Quando usar `List`, `Set` e `Map`?',
  '`List`: ordem e duplicatas permitidas (`ArrayList`). `Set`: sem duplicatas (`HashSet`). `Map`: pares chave → valor (`HashMap`).', 1),
 ('f1000000-0000-0000-0000-000002010102', 'a3000000-0000-0000-0000-000000020101',
  '`ArrayList` vs `LinkedList`?',
  '`ArrayList`: acesso por índice O(1), inserção no meio O(n) — o padrão na prática. `LinkedList`: inserção/remoção nas pontas O(1), acesso O(n).', 2),
 ('f1000000-0000-0000-0000-000002010103', 'a3000000-0000-0000-0000-000000020101',
  '`HashSet` vs `TreeSet` vs `LinkedHashSet`?',
  '`HashSet`: sem ordem garantida, operações O(1). `TreeSet`: mantém ordenação (`Comparable`/`Comparator`), O(log n). `LinkedHashSet`: preserva a ordem de inserção.', 3),
 ('f1000000-0000-0000-0000-000002010104', 'a3000000-0000-0000-0000-000000020101',
  'Como iterar um `Map`?',
  '`for (var e : map.entrySet()) { e.getKey(); e.getValue(); }` — ou, em estilo funcional, `map.forEach((k, v) -> ...)`.', 4),
 ('f1000000-0000-0000-0000-000002010105', 'a3000000-0000-0000-0000-000000020101',
  'O que fazem `getOrDefault` e `computeIfAbsent`?',
  '`getOrDefault(k, padrao)` evita `null` na leitura; `computeIfAbsent(k, f)` cria e guarda o valor na primeira consulta — ótimo para mapas de listas.', 5);

-- ─── Java Intermediário · equals, hashCode e coleções hash (020102) ──
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002010201', 'a3000000-0000-0000-0000-000000020102',
  'Qual é o **contrato** entre `equals` e `hashCode`?',
  'Se `a.equals(b)` é `true`, então `a.hashCode() == b.hashCode()` obrigatoriamente. Quebrar isso faz `HashSet`/`HashMap` “perderem” objetos.', 1),
 ('f1000000-0000-0000-0000-000002010202', 'a3000000-0000-0000-0000-000000020102',
  'Por que sobrescrever `equals` e `hashCode` **juntos**?',
  'Coleções hash localizam primeiro pelo `hashCode` (bucket) e só depois usam `equals`. Com hashes diferentes, dois objetos “iguais” caem em buckets diferentes e nunca se encontram.', 2),
 ('f1000000-0000-0000-0000-000002010203', 'a3000000-0000-0000-0000-000000020102',
  'O que acontece se um campo usado no `hashCode` mudar enquanto o objeto está num `HashSet`?',
  'O objeto fica “perdido”: está no bucket antigo, mas a busca procura no novo — `contains()` retorna `false`. Por isso, prefira **chaves imutáveis**.', 3),
 ('f1000000-0000-0000-0000-000002010204', 'a3000000-0000-0000-0000-000000020102',
  'Qual o jeito mais simples de implementar `equals`/`hashCode`?',
  '`Objects.equals(...)` e `Objects.hash(...)` sobre os campos significativos — ou usar um `record`, que gera os dois automaticamente.', 4),
 ('f1000000-0000-0000-0000-000002010205', 'a3000000-0000-0000-0000-000000020102',
  'O que um `record` gera automaticamente?',
  'Construtor canônico, acessores (`nome()`), `equals`, `hashCode` e `toString` baseados em **todos** os componentes. Ideal para classes de dados imutáveis.', 5);

-- ─── Java Intermediário · Generics (020201) ──────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002020101', 'a3000000-0000-0000-0000-000000020201',
  'Para que servem os **generics**?',
  'Segurança de tipos em **compilação**: `List<String>` só aceita String — elimina casts manuais e `ClassCastException` em runtime.', 1),
 ('f1000000-0000-0000-0000-000002020102', 'a3000000-0000-0000-0000-000000020201',
  'O que é **type erasure**?',
  'Os tipos genéricos são apagados na compilação (`List<String>` vira `List`). Consequência: não existe `new T()`, `T.class` nem `instanceof List<String>`.', 2),
 ('f1000000-0000-0000-0000-000002020103', 'a3000000-0000-0000-0000-000000020201',
  'Como declarar um **método genérico**?',
  'Parâmetro de tipo antes do retorno: `static <T> T primeiro(List<T> lista)`. O compilador infere o `T` no ponto de chamada.', 3),
 ('f1000000-0000-0000-0000-000002020104', 'a3000000-0000-0000-0000-000000020201',
  'O que significa `<T extends Comparable<T>>`?',
  'É um **bounded type**: `T` precisa implementar `Comparable`. O método pode chamar `compareTo` e o compilador rejeita tipos que não se comparam.', 4),
 ('f1000000-0000-0000-0000-000002020105', 'a3000000-0000-0000-0000-000000020201',
  '`List<Object>` aceita uma `List<String>`?',
  'Não! Generics são **invariantes**: `List<String>` não é subtipo de `List<Object>` — senão daria para inserir um `Integer` na lista de Strings. Flexibilidade pede wildcards.', 5);

-- ─── Java Intermediário · Wildcards e PECS (020202) ──────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002020201', 'a3000000-0000-0000-0000-000000020202',
  'O que diz o princípio **PECS**?',
  '**P**roducer **E**xtends, **C**onsumer **S**uper: se a estrutura produz valores que você lê, use `? extends T`; se consome valores que você grava, use `? super T`.', 1),
 ('f1000000-0000-0000-0000-000002020202', 'a3000000-0000-0000-0000-000000020202',
  'O que posso fazer com uma `List<? extends Number>`?',
  '**Ler** como `Number`; não dá para adicionar nada (além de `null`), pois o tipo exato é desconhecido — poderia ser `List<Integer>`, `List<Double>`...', 2),
 ('f1000000-0000-0000-0000-000002020203', 'a3000000-0000-0000-0000-000000020202',
  'O que posso fazer com uma `List<? super Integer>`?',
  '**Adicionar** `Integer` com segurança; a leitura sai como `Object`. A lista concreta pode ser `List<Integer>`, `List<Number>` ou `List<Object>`.', 3),
 ('f1000000-0000-0000-0000-000002020204', 'a3000000-0000-0000-0000-000000020202',
  'Quando usar o wildcard puro `<?>`?',
  'Quando o código não depende do tipo: `void imprimir(List<?> l)` — apenas lê como `Object` e não insere nada.', 4),
 ('f1000000-0000-0000-0000-000002020205', 'a3000000-0000-0000-0000-000000020202',
  'Cite o exemplo clássico de PECS na JDK.',
  '`Collections.copy(List<? super T> dest, List<? extends T> src)` — a origem **produz** (extends) e o destino **consome** (super).', 5);

-- ─── Java Intermediário · Lambdas (020301) ───────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002030101', 'a3000000-0000-0000-0000-000000020301',
  'O que é uma **interface funcional**?',
  'Interface com **um único método abstrato** (SAM). Pode levar `@FunctionalInterface`. É o alvo de lambdas e method references.', 1),
 ('f1000000-0000-0000-0000-000002030102', 'a3000000-0000-0000-0000-000000020301',
  'Qual a sintaxe de uma **lambda**?',
  '`(parametros) -> expressao` ou `(parametros) -> { corpo }`. Ex.: `Comparator<String> porTamanho = (a, b) -> a.length() - b.length();`', 2),
 ('f1000000-0000-0000-0000-000002030103', 'a3000000-0000-0000-0000-000000020301',
  'Quais as 4 interfaces centrais do `java.util.function`?',
  '`Predicate<T>` (T → boolean), `Function<T,R>` (T → R), `Consumer<T>` (T → void) e `Supplier<T>` (() → T).', 3),
 ('f1000000-0000-0000-0000-000002030104', 'a3000000-0000-0000-0000-000000020301',
  'O que são **method references**?',
  'Atalho para lambdas que só chamam um método existente: `String::toUpperCase`, `System.out::println`, `Pessoa::new`.', 4),
 ('f1000000-0000-0000-0000-000002030105', 'a3000000-0000-0000-0000-000000020301',
  'O que uma lambda pode **capturar** do escopo?',
  'Variáveis locais **efetivamente finais** (que nunca são reatribuídas). Atributos da classe podem ser lidos e alterados normalmente.', 5);

-- ─── Java Intermediário · Streams (020302) ───────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002030201', 'a3000000-0000-0000-0000-000000020302',
  'Quais as 3 partes de um **pipeline** de stream?',
  'Fonte (`list.stream()`) → operações intermediárias *lazy* (`filter`, `map`, `sorted`) → operação **terminal** (`collect`, `forEach`, `count`), que dispara a execução.', 1),
 ('f1000000-0000-0000-0000-000002030202', 'a3000000-0000-0000-0000-000000020302',
  '`map` vs `filter`?',
  '`map` **transforma** cada elemento (T → R); `filter` **mantém** só os que passam no `Predicate`. Ambos são intermediários e lazy.', 2),
 ('f1000000-0000-0000-0000-000002030203', 'a3000000-0000-0000-0000-000000020302',
  'O que faz `collect(Collectors.toList())`?',
  'Operação terminal que materializa o resultado numa lista. Outros coletores úteis: `toSet()`, `joining(", ")`, `groupingBy(f)` e `counting()`.', 3),
 ('f1000000-0000-0000-0000-000002030204', 'a3000000-0000-0000-0000-000000020302',
  'O que é `reduce`?',
  'Combina os elementos num único valor: `stream.reduce(0, Integer::sum)`. É a base de atalhos como `sum()`, `min()` e `max()`.', 4),
 ('f1000000-0000-0000-0000-000002030205', 'a3000000-0000-0000-0000-000000020302',
  'Um stream pode ser **reutilizado**?',
  'Não — depois da operação terminal ele está consumido; reutilizar lança `IllegalStateException`. Crie um novo stream a partir da fonte.', 5);

-- ─── Java Intermediário · Optional (020401) ──────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002040101', 'a3000000-0000-0000-0000-000000020401',
  'Para que serve `Optional`?',
  'Representar “pode não ter valor” no **tipo** do retorno, forçando quem chama a tratar a ausência — em vez de retornar `null` e arriscar um NPE.', 1),
 ('f1000000-0000-0000-0000-000002040102', 'a3000000-0000-0000-0000-000000020401',
  'Como criar um `Optional`?',
  '`Optional.of(v)` (v não pode ser null), `Optional.ofNullable(v)` (v pode ser null) e `Optional.empty()`.', 2),
 ('f1000000-0000-0000-0000-000002040103', 'a3000000-0000-0000-0000-000000020401',
  'Por que evitar `optional.get()`?',
  'Sem checar antes, `get()` lança `NoSuchElementException` — o mesmo problema do null de volta. Prefira `orElse`, `orElseGet`, `orElseThrow`, `map` e `ifPresent`.', 3),
 ('f1000000-0000-0000-0000-000002040104', 'a3000000-0000-0000-0000-000000020401',
  '`orElse` vs `orElseGet`?',
  '`orElse(x)` **sempre** avalia `x`, mesmo com valor presente; `orElseGet(() -> x)` só executa o supplier se estiver vazio — use-o para defaults caros.', 4),
 ('f1000000-0000-0000-0000-000002040105', 'a3000000-0000-0000-0000-000000020401',
  'Onde **não** usar `Optional`?',
  'Em atributos, parâmetros de método e coleções (`List<Optional<T>>`). Ele foi desenhado para **retornos** de método.', 5);

-- ─── Java Intermediário · java.time (020402) ─────────────────────────
INSERT INTO flashcards (id, lesson_id, front_text, back_text, order_index) VALUES
 ('f1000000-0000-0000-0000-000002040201', 'a3000000-0000-0000-0000-000000020402',
  'Quais as classes principais do `java.time`?',
  '`LocalDate` (data), `LocalTime` (hora), `LocalDateTime` (ambos, sem fuso), `Instant` (ponto UTC na linha do tempo) e `ZonedDateTime`/`OffsetDateTime` (com fuso/offset).', 1),
 ('f1000000-0000-0000-0000-000002040202', 'a3000000-0000-0000-0000-000000020402',
  'Por que usar `java.time` em vez de `Date`/`Calendar`?',
  'API **imutável** e thread-safe, métodos fluentes (`plusDays`), um tipo para cada conceito e formatação integrada — `Date` era mutável e propenso a erros.', 2),
 ('f1000000-0000-0000-0000-000002040203', 'a3000000-0000-0000-0000-000000020402',
  '`Period` vs `Duration`?',
  '`Period`: distância de **calendário** em anos/meses/dias — `Period.between(d1, d2)`. `Duration`: tempo em horas/minutos/segundos/nanos.', 3),
 ('f1000000-0000-0000-0000-000002040204', 'a3000000-0000-0000-0000-000000020402',
  'Como formatar e parsear datas?',
  'Com `DateTimeFormatter`: `data.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))` para formatar e `LocalDate.parse(texto, fmt)` para ler.', 4),
 ('f1000000-0000-0000-0000-000002040205', 'a3000000-0000-0000-0000-000000020402',
  'Objetos do `java.time` são mutáveis?',
  'Não — `plusDays(1)` retorna uma **nova** instância; a original não muda. Sempre reatribua: `data = data.plusDays(1);`', 5);
