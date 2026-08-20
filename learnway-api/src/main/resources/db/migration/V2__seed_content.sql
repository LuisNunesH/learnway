-- =====================================================================
-- LearnWay — seed data
--   * 9 achievements
--   * 8 trail topics (the full map)
--   * "Java - Fundamentos" fully fleshed out (3 subtopics, 6 lessons,
--     covering MULTIPLE_CHOICE, DESCRIPTIVE and CODE_CHALLENGE)
-- Fixed UUIDs are used so foreign keys can be wired deterministically.
-- =====================================================================

-- ─── ACHIEVEMENTS ────────────────────────────────────────────────────
INSERT INTO achievements (id, slug, title, description, icon, xp_bonus) VALUES
 ('a8000000-0000-0000-0000-000000000001', 'first_lesson',        'Primeira Faísca',          'Completar a 1ª lição',                              'sparkles',   50),
 ('a8000000-0000-0000-0000-000000000002', 'streak_7',            'Uma Semana Sólida',        '7 dias consecutivos de estudo',                     'flame',      100),
 ('a8000000-0000-0000-0000-000000000003', 'streak_30',           'Mês do Dev',               '30 dias consecutivos de estudo',                    'flame',      300),
 ('a8000000-0000-0000-0000-000000000004', 'java_trail_complete', 'Mestre Java',              'Completar a trilha Java Avançado',                  'crown',      500),
 ('a8000000-0000-0000-0000-000000000005', 'speed_demon',         'Velocidade de Pensamento', 'Acertar 10 múltipla escolha em menos de 30s cada',  'zap',        150),
 ('a8000000-0000-0000-0000-000000000006', 'code_warrior',        'Guerreiro do Código',      'Completar 5 desafios de código',                    'sword',      200),
 ('a8000000-0000-0000-0000-000000000007', 'no_mistakes',         'Sem Falhas',               'Completar uma lição sem nenhum erro',               'shield',     120),
 ('a8000000-0000-0000-0000-000000000008', 'reviewer',            'Memória de Ferro',         'Fazer 20 revisões espaçadas',                       'brain',      150),
 ('a8000000-0000-0000-0000-000000000009', '10h_study',           '10 Horas de Estudo',       'Acumular 10 horas de tempo de estudo',              'clock',      200);

-- ─── TOPICS (the 8 trails of the map) ────────────────────────────────
INSERT INTO topics (id, slug, title, description, icon, color_hex, order_index, is_active) VALUES
 ('a1000000-0000-0000-0000-000000000001', 'java-fundamentos',  'Java — Fundamentos',          'POO, tipos, strings, coleções básicas e exceções.',           'coffee',      '#6C63FF', 1, TRUE),
 ('a1000000-0000-0000-0000-000000000002', 'java-intermediario','Java — Intermediário',        'Collections, Generics, Lambdas, Streams, Optional, java.time.','layers',      '#00D4AA', 2, TRUE),
 ('a1000000-0000-0000-0000-000000000003', 'java-avancado',     'Java — Avançado',             'Concorrência, Reflection, anotações e Design Patterns.',      'cpu',         '#FF6B6B', 3, TRUE),
 ('a1000000-0000-0000-0000-000000000004', 'spring',            'Spring & Ecossistema',        'Spring Core, MVC, Data JPA, Security e testes.',              'leaf',        '#00D4AA', 4, TRUE),
 ('a1000000-0000-0000-0000-000000000005', 'arquitetura',       'Arquitetura & Microservices', 'Microservices, gateways, resiliência, Saga, CQRS.',          'network',     '#6C63FF', 5, TRUE),
 ('a1000000-0000-0000-0000-000000000006', 'mensageria-dados',  'Mensageria & Dados',          'RabbitMQ, Kafka, SQL avançado, Redis, MongoDB.',             'database',    '#FFB347', 6, TRUE),
 ('a1000000-0000-0000-0000-000000000007', 'cloud-devops',      'Cloud & DevOps',              'Docker, Kubernetes, CI/CD, Azure e AWS.',                    'cloud',       '#00D4AA', 7, TRUE),
 ('a1000000-0000-0000-0000-000000000008', 'dsa',               'Estruturas de Dados & Algoritmos','Listas, árvores, grafos, Big O e ordenação.',             'binary',      '#FF6B6B', 8, TRUE);

-- ─── SUBTOPICS for "Java — Fundamentos" ──────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000101', 'a1000000-0000-0000-0000-000000000001', 'poo',          'Programação Orientada a Objetos', 'Classes, objetos, encapsulamento, herança e polimorfismo.', 1, NULL),
 ('a2000000-0000-0000-0000-000000000102', 'a1000000-0000-0000-0000-000000000001', 'tipos-strings','Tipos, Wrappers e Strings',       'Primitivos, autoboxing e manipulação de Strings.',          2, 'a2000000-0000-0000-0000-000000000101'),
 ('a2000000-0000-0000-0000-000000000103', 'a1000000-0000-0000-0000-000000000001', 'excecoes',     'Tratamento de Exceções',          'Checked, unchecked e exceções personalizadas.',             3, 'a2000000-0000-0000-0000-000000000102');

-- ─── LESSONS ─────────────────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000010101', 'a2000000-0000-0000-0000-000000000101', 'Classes e Objetos',
$theory$
## Classes e Objetos

Uma **classe** é um molde (blueprint) que define o estado e o comportamento de um tipo. Um **objeto** é uma instância concreta dessa classe, criada em tempo de execução.

```java
public class Carro {
    // estado (atributos / campos)
    private String modelo;
    private int velocidade;

    // construtor
    public Carro(String modelo) {
        this.modelo = modelo;
        this.velocidade = 0;
    }

    // comportamento (métodos)
    public void acelerar(int incremento) {
        this.velocidade += incremento;
    }
}

Carro meuCarro = new Carro("Civic"); // 'meuCarro' é um objeto (instância)
```

### Conceitos-chave
- **Campos (fields):** guardam o estado de cada instância.
- **Construtor:** inicializa o objeto. Se você não declarar nenhum, o Java fornece um construtor padrão sem argumentos.
- **`this`:** referência ao próprio objeto; resolve ambiguidade entre parâmetros e campos.
- **`new`:** aloca o objeto na *heap* e devolve uma referência.

> Cada objeto tem sua própria cópia dos campos de instância. Métodos, por outro lado, são compartilhados — pertencem à classe.
$theory$, 10, 1, 1, 12),

 ('a3000000-0000-0000-0000-000000010102', 'a2000000-0000-0000-0000-000000000101', 'Encapsulamento',
$theory$
## Encapsulamento

Encapsulamento é o princípio de **esconder o estado interno** de um objeto e expor o acesso apenas por métodos controlados (getters/setters). Protege invariantes e reduz acoplamento.

```java
public class ContaBancaria {
    private double saldo; // privado: ninguém altera diretamente

    public double getSaldo() {
        return saldo;
    }

    public void depositar(double valor) {
        if (valor <= 0) throw new IllegalArgumentException("Valor inválido");
        this.saldo += valor;
    }
}
```

### Por que encapsular?
- **Validação:** o `depositar` impede valores inválidos — impossível com um campo público.
- **Liberdade de refatoração:** você pode mudar a implementação interna sem quebrar quem usa a classe.
- **Invariantes garantidas:** o objeto nunca entra num estado ilegal.

> Regra prática: campos `private`, comportamento `public`. Exponha *o que* o objeto faz, não *como*.
$theory$, 10, 2, 2, 12),

 ('a3000000-0000-0000-0000-000000010103', 'a2000000-0000-0000-0000-000000000101', 'Herança e Polimorfismo',
$theory$
## Herança e Polimorfismo

**Herança** (`extends`) permite que uma classe reutilize e especialize outra. **Polimorfismo** permite tratar objetos de subtipos através de uma referência do supertipo, com o método correto escolhido em tempo de execução (*dynamic dispatch*).

```java
abstract class Animal {
    abstract String som();
}

class Cachorro extends Animal {
    @Override String som() { return "Au au"; }
}

class Gato extends Animal {
    @Override String som() { return "Miau"; }
}

Animal a = new Cachorro();
System.out.println(a.som()); // "Au au" — decidido em runtime
```

### Pontos importantes
- **`@Override`:** documenta e faz o compilador validar a sobrescrita.
- **`super`:** chama o construtor/método da superclasse.
- **Favoreça composição sobre herança** quando a relação não for um verdadeiro "é um".
- Herança de implementação é única em Java; comportamento múltiplo vem de **interfaces**.
$theory$, 15, 3, 3, 15);

INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000010201', 'a2000000-0000-0000-0000-000000000102', 'Primitivos, Wrappers e Autoboxing',
$theory$
## Primitivos, Wrappers e Autoboxing

Java tem **8 tipos primitivos** (`int`, `long`, `double`, `float`, `boolean`, `char`, `byte`, `short`) e suas **classes wrapper** correspondentes (`Integer`, `Long`, `Double`, ...).

```java
int primitivo = 42;
Integer objeto = primitivo;   // autoboxing: int -> Integer
int devolta = objeto;         // unboxing: Integer -> int
```

### Cuidados clássicos
- **Cache do Integer:** `Integer` entre -128 e 127 é cacheado. Por isso `==` pode enganar:
```java
Integer a = 127, b = 127;
System.out.println(a == b);      // true  (mesmo objeto cacheado)
Integer c = 200, d = 200;
System.out.println(c == d);      // false (objetos distintos)
System.out.println(c.equals(d)); // true  — sempre use equals()
```
- **NullPointerException no unboxing:** um `Integer` nulo dentro de uma operação aritmética estoura NPE.

> Use primitivos para performance; use wrappers quando precisar de `null`, coleções ou genéricos.
$theory$, 10, 2, 1, 12),

 ('a3000000-0000-0000-0000-000000010202', 'a2000000-0000-0000-0000-000000000102', 'Strings e Imutabilidade',
$theory$
## Strings e Imutabilidade

`String` em Java é **imutável**: qualquer operação que "modifica" na verdade cria uma nova String.

```java
String s = "abc";
s.toUpperCase();      // NÃO altera s — devolve "ABC"
s = s.toUpperCase();  // agora sim, s aponta para a nova String
```

### String pool e comparação
```java
String a = "java";        // vai para o pool
String b = "java";        // mesma referência do pool
String c = new String("java"); // novo objeto na heap

a == b;        // true  (mesmo objeto no pool)
a == c;        // false (objetos diferentes)
a.equals(c);   // true  — compare conteúdo com equals()
```

### Concatenação eficiente
Para muitas concatenações em loop, use **`StringBuilder`** — concatenar com `+` em loop cria objetos intermediários:
```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.append(i);
String resultado = sb.toString();
```
$theory$, 10, 2, 2, 12);

INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000010301', 'a2000000-0000-0000-0000-000000000103', 'Checked, Unchecked e Exceções Personalizadas',
$theory$
## Exceções em Java

Toda exceção herda de `Throwable`. A hierarquia prática divide-se em:

- **Checked** (`extends Exception`): o compilador **obriga** a tratar ou declarar (`throws`). Ex.: `IOException`, `SQLException`.
- **Unchecked** (`extends RuntimeException`): não obrigatórias. Indicam erros de programação. Ex.: `NullPointerException`, `IllegalArgumentException`.
- **Error**: falhas graves da JVM (`OutOfMemoryError`) — não trate.

```java
public class SaldoInsuficienteException extends RuntimeException {
    public SaldoInsuficienteException(String msg) {
        super(msg);
    }
}

public void sacar(double valor) {
    if (valor > saldo) {
        throw new SaldoInsuficienteException("Saldo insuficiente para saque");
    }
    saldo -= valor;
}
```

### try-with-resources
Para recursos que precisam ser fechados (`AutoCloseable`), use:
```java
try (var reader = new BufferedReader(new FileReader("a.txt"))) {
    return reader.readLine();
} // reader.close() é chamado automaticamente, mesmo com exceção
```

> Regra: lance checked para condições recuperáveis esperadas; unchecked para violações de contrato/programação.
$theory$, 15, 3, 1, 15);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- Lesson: Classes e Objetos -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010101', 'a3000000-0000-0000-0000-000000010101', 'MULTIPLE_CHOICE',
  'O que a palavra-chave `new` faz ao criar um objeto em Java?', 'Pense em onde o objeto é armazenado e o que é devolvido.', 1, 5, 1),
 ('a4000000-0000-0000-0000-000001010102', 'a3000000-0000-0000-0000-000000010101', 'DESCRIPTIVE',
  'Explique, com suas palavras, a diferença entre uma classe e um objeto. Dê um exemplo do mundo real.', 'Uma é o molde; o outro é a instância concreta.', 2, 10, 1);

-- Lesson: Encapsulamento -> 1 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010201', 'a3000000-0000-0000-0000-000000010102', 'MULTIPLE_CHOICE',
  'Qual a principal vantagem de declarar um campo como `private` e expô-lo via método?', 'Pense em validação e invariantes.', 1, 5, 2);

-- Lesson: Herança e Polimorfismo -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010301', 'a3000000-0000-0000-0000-000000010103', 'MULTIPLE_CHOICE',
  'Em `Animal a = new Cachorro(); a.som();`, quando o método `som()` concreto é escolhido?', 'Dynamic dispatch.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000001010302', 'a3000000-0000-0000-0000-000000010103', 'CODE_CHALLENGE',
  'Implemente a classe `Retangulo` que estende `Forma` e sobrescreve `area()` retornando largura * altura.', 'Use @Override e os campos do construtor.', 2, 15, 3);

-- Lesson: Primitivos/Wrappers -> 1 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001020101', 'a3000000-0000-0000-0000-000000010201', 'MULTIPLE_CHOICE',
  'Por que `Integer c = 200, d = 200; c == d` retorna `false`?', 'Cache do Integer é -128..127.', 1, 5, 2);

-- Lesson: Strings -> 1 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001020201', 'a3000000-0000-0000-0000-000000010202', 'MULTIPLE_CHOICE',
  'Qual estrutura é mais eficiente para concatenar Strings dentro de um loop grande?', 'Imutabilidade gera objetos intermediários.', 1, 5, 2);

-- Lesson: Exceções -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001030101', 'a3000000-0000-0000-0000-000000010301', 'MULTIPLE_CHOICE',
  'Qual destas é uma exceção **checked**?', 'Checked herda de Exception (não RuntimeException).', 1, 5, 3),
 ('a4000000-0000-0000-0000-000001030102', 'a3000000-0000-0000-0000-000000010301', 'DESCRIPTIVE',
  'Quando você criaria uma exceção checked em vez de unchecked? Justifique.', 'Recuperável vs erro de programação.', 2, 10, 3);

-- ─── OPTIONS (multiple choice) ───────────────────────────────────────
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001010101', 'a4000000-0000-0000-0000-000001010101', 'Aloca o objeto na heap e devolve uma referência a ele.', TRUE,  'Correto: `new` reserva memória na heap, executa o construtor e retorna a referência.', 1),
 ('a5000000-0000-0000-0000-000001010102', 'a4000000-0000-0000-0000-000001010101', 'Copia o objeto da stack para a heap.', FALSE, 'Não há cópia stack→heap; `new` cria um objeto novo diretamente na heap.', 2),
 ('a5000000-0000-0000-0000-000001010103', 'a4000000-0000-0000-0000-000001010101', 'Apenas declara uma variável, sem criar nada.', FALSE, 'Declaração é `Carro c;`. É o `new` que efetivamente cria o objeto.', 3),
 ('a5000000-0000-0000-0000-000001010104', 'a4000000-0000-0000-0000-000001010101', 'Libera a memória do objeto anterior.', FALSE, 'Liberação de memória é responsabilidade do Garbage Collector, não do `new`.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001010201', 'a4000000-0000-0000-0000-000001010201', 'Permite validar e proteger invariantes ao alterar o estado.', TRUE,  'Correto: o método controla as mudanças, garantindo que o objeto nunca fique inválido.', 1),
 ('a5000000-0000-0000-0000-000001010202', 'a4000000-0000-0000-0000-000001010201', 'Deixa o código mais rápido em runtime.', FALSE, 'Encapsulamento é sobre design e manutenção, não sobre performance.', 2),
 ('a5000000-0000-0000-0000-000001010203', 'a4000000-0000-0000-0000-000001010201', 'Obriga o uso de herança.', FALSE, 'Encapsulamento é independente de herança.', 3),
 ('a5000000-0000-0000-0000-000001010204', 'a4000000-0000-0000-0000-000001010201', 'Faz os campos virarem estáticos automaticamente.', FALSE, '`private` controla visibilidade, não tem relação com `static`.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001010301', 'a4000000-0000-0000-0000-000001010301', 'Em tempo de execução, com base no tipo real do objeto.', TRUE,  'Correto: isso é dynamic dispatch — o tipo concreto (Cachorro) decide o método.', 1),
 ('a5000000-0000-0000-0000-000001010302', 'a4000000-0000-0000-0000-000001010301', 'Em tempo de compilação, pelo tipo da variável.', FALSE, 'O tipo da variável (Animal) define o que é *acessível*, mas não qual implementação roda.', 2),
 ('a5000000-0000-0000-0000-000001010303', 'a4000000-0000-0000-0000-000001010301', 'Sempre executa o método da superclasse.', FALSE, 'A subclasse sobrescreve; é a versão dela que roda.', 3),
 ('a5000000-0000-0000-0000-000001010304', 'a4000000-0000-0000-0000-000001010301', 'Depende da ordem de declaração das classes.', FALSE, 'A ordem de declaração é irrelevante para dynamic dispatch.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001020101', 'a4000000-0000-0000-0000-000001020101', 'Porque 200 está fora do cache do Integer (-128..127), gerando dois objetos.', TRUE,  'Correto: fora do range cacheado, autoboxing cria instâncias distintas; `==` compara referências.', 1),
 ('a5000000-0000-0000-0000-000001020102', 'a4000000-0000-0000-0000-000001020101', 'Porque 200 é grande demais para um int.', FALSE, 'int vai até ~2,1 bilhões; 200 cabe tranquilamente.', 2),
 ('a5000000-0000-0000-0000-000001020103', 'a4000000-0000-0000-0000-000001020101', 'Porque `==` nunca funciona com números.', FALSE, 'Para primitivos `int`, `==` compara valor normalmente. O problema é o boxing para Integer.', 3),
 ('a5000000-0000-0000-0000-000001020104', 'a4000000-0000-0000-0000-000001020101', 'Porque falta chamar `new Integer()`.', FALSE, 'O autoboxing já cria os objetos; o ponto é o cache, não a forma de criação.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001020201', 'a4000000-0000-0000-0000-000001020201', 'StringBuilder', TRUE,  'Correto: StringBuilder é mutável e evita criar uma nova String a cada concatenação.', 1),
 ('a5000000-0000-0000-0000-000001020202', 'a4000000-0000-0000-0000-000001020201', 'Concatenar com `+` dentro do loop', FALSE, 'Cada `+` em loop cria objetos intermediários — ineficiente para muitas iterações.', 2),
 ('a5000000-0000-0000-0000-000001020203', 'a4000000-0000-0000-0000-000001020201', 'String.concat() em loop', FALSE, '`concat` também devolve uma nova String a cada chamada.', 3),
 ('a5000000-0000-0000-0000-000001020204', 'a4000000-0000-0000-0000-000001020201', 'Arrays de char manipulados manualmente', FALSE, 'Funciona, mas é verboso e propenso a erro; StringBuilder é a resposta idiomática.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000001030101', 'a4000000-0000-0000-0000-000001030101', 'IOException', TRUE,  'Correto: IOException estende Exception (não RuntimeException), logo é checked.', 1),
 ('a5000000-0000-0000-0000-000001030102', 'a4000000-0000-0000-0000-000001030101', 'NullPointerException', FALSE, 'NPE estende RuntimeException — é unchecked.', 2),
 ('a5000000-0000-0000-0000-000001030103', 'a4000000-0000-0000-0000-000001030101', 'IllegalArgumentException', FALSE, 'Também estende RuntimeException — unchecked.', 3),
 ('a5000000-0000-0000-0000-000001030104', 'a4000000-0000-0000-0000-000001030101', 'ArrayIndexOutOfBoundsException', FALSE, 'Unchecked: estende RuntimeException (via IndexOutOfBoundsException).', 4);

-- ─── DESCRIPTIVE ANSWERS (reference key for AI grading) ──────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000001010102', 'a4000000-0000-0000-0000-000001010102',
  'Uma classe é um molde/blueprint que define atributos e comportamentos; um objeto é uma instância concreta dessa classe na memória, com seu próprio estado. Ex.: a classe "Carro" define que todo carro tem modelo e velocidade; "meuCivic = new Carro()" é um objeto específico.',
  'Deve distinguir claramente molde (classe) de instância (objeto), mencionar que objetos têm estado próprio e trazer um exemplo coerente. Penalizar se confundir os dois conceitos.'),
 ('a7000000-0000-0000-0000-000001030102', 'a4000000-0000-0000-0000-000001030102',
  'Criaria uma checked quando a condição é esperada e recuperável pelo chamador (ex.: arquivo não encontrado, falha de rede), forçando o tratamento explícito. Usaria unchecked para erros de programação/violação de contrato (argumento inválido, estado ilegal), que não deveriam acontecer se o código estiver correto.',
  'Avaliar se diferencia recuperável/esperado (checked) de erro de programação (unchecked), e se justifica a obrigação de tratamento. Bônus por citar exemplos concretos.');

-- ─── CODE CHALLENGE ──────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000001010302', 'a4000000-0000-0000-0000-000001010302',
$initial$abstract class Forma {
    abstract double area();
}

// Implemente Retangulo abaixo:
class Retangulo extends Forma {
    // TODO: campos largura e altura, construtor e área
}
$initial$,
$solution$abstract class Forma {
    abstract double area();
}

class Retangulo extends Forma {
    private final double largura;
    private final double altura;

    Retangulo(double largura, double altura) {
        this.largura = largura;
        this.altura = altura;
    }

    @Override
    double area() {
        return largura * altura;
    }
}
$solution$,
 '[{"input": "new Retangulo(3, 4).area()", "expected_output": "12.0"}, {"input": "new Retangulo(2.5, 2).area()", "expected_output": "5.0"}]'::jsonb,
 'java',
 'Avalie se Retangulo estende Forma, sobrescreve area() corretamente com @Override, possui construtor que recebe largura e altura, e retorna largura*altura. Verifique boas práticas: campos final/private e uso de @Override.');
