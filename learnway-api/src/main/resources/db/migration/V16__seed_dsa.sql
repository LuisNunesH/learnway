-- =====================================================================
-- LearnWay — seed "Estruturas de Dados & Algoritmos"
--   * 3 subtopics encadeados: Complexidade -> Estruturas -> Algoritmos
--   * 6 lessons com teoria completa
--   * 13 questões: MULTIPLE_CHOICE, DESCRIPTIVE e 3 CODE_CHALLENGEs
-- Convenção de UUIDs: sufixo determinístico (topic 08)
--   subtopic  a2…0000000008SS      lesson    a3…000000 08 SS LL
--   question  a4…0000 08 SS LL QQ  option    a5…00 08 SS LL QQ OO
--   descr.    a7…= question        code ch.  a6…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000801', 'a1000000-0000-0000-0000-000000000008', 'complexidade', 'Complexidade & Big O',   'Medir algoritmos e conhecer o custo das coleções Java.',   1, NULL),
 ('a2000000-0000-0000-0000-000000000802', 'a1000000-0000-0000-0000-000000000008', 'estruturas',   'Estruturas de Dados',    'Pilhas, filas, árvores, heaps e tabelas hash por dentro.', 2, 'a2000000-0000-0000-0000-000000000801'),
 ('a2000000-0000-0000-0000-000000000803', 'a1000000-0000-0000-0000-000000000008', 'algoritmos',   'Algoritmos Clássicos',   'Busca binária, ordenação, recursão e memoização.',         3, 'a2000000-0000-0000-0000-000000000802');

-- ─── LESSONS: Complexidade ───────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000080101', 'a2000000-0000-0000-0000-000000000801', 'Big O: medindo algoritmos',
$theory$
## Big O: medindo algoritmos

**Big O** descreve como o custo de um algoritmo **cresce** quando a entrada cresce. Não mede segundos — mede a **forma da curva**. Um algoritmo O(n²) pode ser mais rápido que um O(n) para 10 elementos; para 10 milhões, a curva sempre vence.

### As classes que importam
| Ordem | Nome | Intuição | Exemplo |
|---|---|---|---|
| O(1) | constante | não depende do tamanho | acesso `array[i]`, `HashMap.get` |
| O(log n) | logarítmica | corta o problema pela metade a cada passo | busca binária |
| O(n) | linear | visita cada elemento uma vez | achar o maior valor |
| O(n log n) | linearítmica | divide e conquista | bons algoritmos de ordenação |
| O(n²) | quadrática | cada elemento contra todos | loops aninhados, bubble sort |
| O(2ⁿ) | exponencial | dobra a cada elemento | fibonacci recursivo ingênuo |

Para sentir a diferença, n = 1 milhão: O(log n) ≈ **20 passos**; O(n) = 1 milhão; O(n²) = **1 trilhão** (inviável).

### Lendo o código
```java
int maior(int[] v) {              // O(n): um passe
    int max = v[0];
    for (int x : v) max = Math.max(max, x);
    return max;
}

boolean temDuplicata(int[] v) {   // O(n²): pares — loop dentro de loop
    for (int i = 0; i < v.length; i++)
        for (int j = i + 1; j < v.length; j++)
            if (v[i] == v[j]) return true;
    return false;
}

boolean temDuplicataRapido(int[] v) {  // O(n): troca tempo por memória
    Set<Integer> vistos = new HashSet<>();
    for (int x : v)
        if (!vistos.add(x)) return true;   // add devolve false se já existia
    return false;
}
```
O terceiro exemplo mostra o padrão mais comum de otimização na prática: **usar a estrutura de dados certa** (um `HashSet` de apoio) derruba O(n²) para O(n).

### As regras de simplificação
- **Constantes caem**: O(2n) = O(n); O(n/2) = O(n). A curva é a mesma.
- **Só o termo dominante fica**: O(n² + n + 10) = O(n²).
- **Entradas independentes, letras diferentes**: comparar lista A com lista B é O(a·b), não O(n²).

### Pior caso, e a memória também
Por padrão, Big O fala do **pior caso** — a garantia que você pode prometer. E existe a **complexidade de espaço**: `temDuplicataRapido` usa O(n) de memória extra pelo Set, enquanto o quadrático usa O(1). Tempo × espaço é o trade-off eterno.

> Entrevistas à parte, o valor real do Big O é o reflexo mental: "isto é um loop dentro de um loop sobre a mesma coleção — vai doer quando os dados crescerem?"
$theory$, 15, 2, 1, 15),

 ('a3000000-0000-0000-0000-000000080102', 'a2000000-0000-0000-0000-000000000801', 'O custo real das coleções Java',
$theory$
## O custo real das coleções Java

Você já usa `ArrayList`, `HashMap` e `HashSet` todos os dias. Esta lição responde: **quanto custa cada operação — e por quê?**

### ArrayList vs LinkedList
`ArrayList` é um **array que cresce**; `LinkedList` é uma **cadeia de nós**.

| Operação | ArrayList | LinkedList |
|---|---|---|
| `get(i)` | **O(1)** — aritmética de índice | O(n) — percorre nó a nó |
| `add(x)` no fim | O(1) amortizado¹ | O(1) |
| inserir/remover no meio | O(n) — desloca os seguintes | O(n) para CHEGAR lá² |
| `contains(x)` | O(n) | O(n) |

¹ Quando o array enche, aloca-se um maior e copia-se tudo (O(n)), mas raramente — na média, O(1).
² O mito clássico: "LinkedList insere no meio em O(1)". A inserção em si é O(1), mas **encontrar a posição é O(n)** — e o cache da CPU odeia ponteiros espalhados. Na prática, `ArrayList` vence em quase tudo.

### HashMap e HashSet: o O(1) e sua letra miúda
`hashCode()` da chave → índice do **balde** → `equals()` confirma. Busca, inserção e remoção: **O(1) médio**.

A letra miúda:
- O(1) **depende de um hashCode bem distribuído**. Um `hashCode()` que devolve sempre 42 joga todas as chaves no mesmo balde — e a busca degrada para O(n).
- Colisões acontecem normalmente; baldes lotados viram árvores (O(log n)) nas implementações modernas do Java.

### TreeMap e TreeSet: ordem custa O(log n)
Árvore rubro-negra (balanceada): tudo em **O(log n)**, e a iteração sai **ordenada**. Bônus poderosos: `firstKey()`, `floorKey(k)`, `subMap(a, b)` — consultas de faixa que hash nenhum faz.

### PriorityQueue: sempre o menor primeiro
Um **heap binário**: `peek()` do menor em O(1), `offer`/`poll` em O(log n). É a resposta para "processe sempre o item de maior prioridade" sem reordenar a lista toda a cada inserção.

### A tabela de decisão
| Preciso de… | Use | Custo chave |
|---|---|---|
| acesso por índice | `ArrayList` | get O(1) |
| busca por chave | `HashMap` | get O(1) médio |
| unicidade sem ordem | `HashSet` | contains O(1) médio |
| ordenação + consultas de faixa | `TreeMap`/`TreeSet` | O(log n) |
| fila com prioridade | `PriorityQueue` | poll O(log n) |
| pilha/fila das duas pontas | `ArrayDeque` | O(1) nas pontas |

> O erro de performance mais comum em código Java de produção não é algoritmo exótico — é `list.contains(...)` dentro de um loop (O(n²) disfarçado) onde um `HashSet` daria O(n).
$theory$, 15, 3, 2, 15);

-- ─── LESSONS: Estruturas ─────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000080201', 'a2000000-0000-0000-0000-000000000802', 'Pilhas e filas',
$theory$
## Pilhas e filas

Duas estruturas definidas não pelo **como guardam**, mas pela **ordem em que devolvem**:

### Pilha (Stack) — LIFO
*Last In, First Out*: o último a entrar é o primeiro a sair, como pratos empilhados.

```java
Deque<String> pilha = new ArrayDeque<>();
pilha.push("A");  pilha.push("B");  pilha.push("C");
pilha.pop();   // "C" — o último que entrou
pilha.peek();  // "B" — espia sem remover
```

Onde pilhas aparecem (mais do que você imagina):
- **A call stack da JVM** — cada chamada de método empilha um frame; retornar desempilha. (Recursão infinita = `StackOverflowError` — a pilha estourou literalmente.)
- **Desfazer/refazer** (Ctrl+Z) — cada ação empilhada; desfazer = pop.
- **Validação de parênteses/tags** — abriu, empilha; fechou, tem que casar com o topo.
- Navegação "voltar" do navegador.

### Fila (Queue) — FIFO
*First In, First Out*: o primeiro a entrar é o primeiro a sair — a fila do banco.

```java
Queue<Tarefa> fila = new ArrayDeque<>();
fila.offer(t1);  fila.offer(t2);   // entram no fim
fila.poll();                        // sai t1 — o primeiro
```

Onde filas aparecem: **filas de mensagens** (RabbitMQ é literalmente isto), pool de tarefas do executor, **BFS** em grafos, buffers entre produtor e consumidor.

### ArrayDeque: a implementação para os dois papéis
Em Java, use **`ArrayDeque`** tanto para pilha quanto para fila (`Deque` = *double-ended queue*, opera nas duas pontas em **O(1)**):

| Papel | Métodos |
|---|---|
| Pilha | `push` / `pop` / `peek` (topo) |
| Fila | `offer` (fim) / `poll` / `peek` (início) |

> A classe `java.util.Stack` é legada (herda de `Vector`, sincronizada e lenta) — o próprio Javadoc manda usar `ArrayDeque`. E `LinkedList` implementa `Deque`, mas o `ArrayDeque` é mais rápido na prática.

### O exemplo canônico: parênteses balanceados
`"{[()]}"` é válido; `"{[}]"` não. O algoritmo com pilha é elegante:

```text
para cada caractere:
  é abertura ( [ { ?  → empilha
  é fechamento ) ] } ? → a pilha está vazia OU o topo não casa? inválido
                         senão → desempilha
no fim: válido se a pilha estiver VAZIA
```

Cada símbolo entra e sai da pilha no máximo uma vez: **O(n)** — e é exatamente assim que editores e compiladores validam o seu código.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000080202', 'a2000000-0000-0000-0000-000000000802', 'Árvores, BST e heaps',
$theory$
## Árvores, BST e heaps

### Árvores: hierarquia por natureza
Uma **árvore** é nós ligados sem ciclos, com uma **raiz** e **folhas**. Você as encontra em toda parte: o DOM do HTML, o filesystem, a AST do compilador, a hierarquia de classes — e dentro do `TreeMap`.

### BST: a árvore de busca binária
A regra que dá o nome: para cada nó, **menores à esquerda, maiores à direita**.

```text
        50
       /  \
     30    70
    /  \   /  \
  20   40 60  80
```

Buscar 60: `50? maior → direita. 70? menor → esquerda. 60? achou` — **3 passos para 7 nós**. Cada comparação descarta metade da árvore: busca, inserção e remoção em **O(altura)** = O(log n) se a árvore for **balanceada**.

### O caso degenerado (a pegadinha favorita)
Insira 1, 2, 3, 4, 5 em ordem numa BST ingênua:

```text
1 → 2 → 3 → 4 → 5      (só filhos à direita)
```

Virou uma **lista encadeada**: altura n, busca O(n) — a vantagem inteira evaporou. Por isso as estruturas reais usam árvores **auto-balanceadas** (AVL, **rubro-negra**), que se reorganizam a cada inserção para manter altura O(log n) garantida. O `TreeMap`/`TreeSet` do Java usa rubro-negra — você ganha o balanceamento de graça.

### Percursos
- **Em ordem** (esq → nó → dir): numa BST, visita os valores **em ordem crescente** — é assim que o TreeSet itera ordenado.
- **Pré/pós-ordem**: copiar/serializar a árvore; liberar filhos antes do pai.
- **Por níveis** (BFS com fila): andar de andar em andar.

### Heap: quase ordenado, e é o suficiente
Um **heap binário** (min-heap) garante apenas: **pai ≤ filhos**. O mínimo está sempre na raiz — o resto fica "frouxamente" organizado:

- `peek()` do menor: **O(1)**
- `offer`/`poll`: **O(log n)** (o elemento "borbulha" para a posição certa)

É a `PriorityQueue` do Java:

```java
PriorityQueue<Pedido> urgencias =
    new PriorityQueue<>(Comparator.comparing(Pedido::getPrioridade));
urgencias.offer(pedido);          // O(log n)
Pedido proximo = urgencias.poll(); // sempre o mais prioritário
```

**BST vs heap em uma linha**: a BST mantém **ordem total** (qualquer consulta de faixa); o heap mantém só **o extremo acessível** — mais barato, e suficiente para agendadores, Dijkstra e "top K de um stream".

> Heurística: "preciso navegar/consultar por faixas" → árvore (TreeMap). "Só preciso sempre do menor/maior próximo" → heap (PriorityQueue).
$theory$, 20, 4, 2, 17);

-- ─── LESSONS: Algoritmos ─────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000080301', 'a2000000-0000-0000-0000-000000000803', 'Busca binária e ordenação',
$theory$
## Busca binária e ordenação

### Busca binária: 20 passos para 1 milhão
Num array **ordenado**, compare com o elemento do meio e descarte metade a cada passo:

```java
int buscaBinaria(int[] v, int alvo) {
    int ini = 0, fim = v.length - 1;
    while (ini <= fim) {
        int meio = ini + (fim - ini) / 2;   // evita overflow de (ini+fim)
        if (v[meio] == alvo) return meio;
        if (v[meio] < alvo) ini = meio + 1; // alvo está à direita
        else                fim = meio - 1; // alvo está à esquerda
    }
    return -1;                              // não existe
}
```

**O(log n)** — 1 milhão de elementos, ~20 comparações. O pré-requisito inegociável: **o array PRECISA estar ordenado**; em dados desordenados o algoritmo simplesmente devolve lixo, sem avisar.

Os bugs clássicos ao implementar: loop com `<` em vez de `<=` (perde o último candidato), `meio = (ini+fim)/2` (overflow com arrays gigantes) e esquecer o `+1/-1` (loop infinito). No dia a dia, use `Arrays.binarySearch`/`Collections.binarySearch` — mas saiba escrever a sua.

O padrão generaliza além de arrays: "**qual o menor valor que satisfaz X?**" — versão mínima de recurso que passa nos testes, primeiro commit quebrado (`git bisect`!), capacidade mínima que atende a demanda.

### Ordenação: o que você precisa saber de verdade
Os quadráticos didáticos (bubble, insertion — O(n²)) explicam a mecânica; os reais são **divide e conquista, O(n log n)**:

- **Merge sort** — divide no meio, ordena metades, intercala. Estável, sempre O(n log n), usa O(n) extra.
- **Quick sort** — particiona em torno de um pivô. Rapidíssimo na prática; pior caso O(n²) (mitigado com pivô aleatório).

**Estabilidade** — critério que importa e poucos conhecem: um sort **estável** preserva a ordem relativa dos empates. Ordene pedidos por data e depois por cliente (sort estável): os pedidos de cada cliente **continuam em ordem de data**. Encadeamento de ordenações depende disso.

### O que o Java usa (e por que você quase nunca implementa)
- `Arrays.sort(int[])` — **dual-pivot quicksort** para primitivos.
- `Arrays.sort(Object[])` / `Collections.sort` / `list.sort` — **Timsort**: merge sort adaptativo e **estável**, que explora trechos já ordenados dos dados reais.

```java
pedidos.sort(Comparator.comparing(Pedido::getData));                 // O(n log n)
pedidos.sort(Comparator.comparing(Pedido::getCliente)
                       .thenComparing(Pedido::getValor).reversed()); // composto
```

> A escolha diária não é "qual algoritmo implemento?" — é "ordeno uma vez e busco binário (O(n log n) + O(log n) por consulta), ou uso um HashMap (O(1) por consulta, sem faixas)?" Estruture os dados para a pergunta que você fará com mais frequência.
$theory$, 20, 4, 1, 16),

 ('a3000000-0000-0000-0000-000000080302', 'a2000000-0000-0000-0000-000000000803', 'Recursão e memoização',
$theory$
## Recursão e memoização

### Recursão: o problema definido em termos de si mesmo
Toda recursão correta tem **duas partes obrigatórias**:

1. **Caso base** — a resposta direta, sem chamar a si mesmo (o "fundo do poço").
2. **Passo recursivo** — resolve para uma entrada **menor**, aproximando-se do caso base.

```java
long fatorial(int n) {
    if (n <= 1) return 1;         // caso base
    return n * fatorial(n - 1);   // passo: problema MENOR
}
```

Sem caso base (ou sem reduzir a entrada), as chamadas se empilham até estourar a call stack: **`StackOverflowError`** — literalmente a pilha de frames da JVM transbordando.

Recursão brilha em **estruturas recursivas por natureza**: árvores (o filho é uma árvore), filesystem (a pasta contém pastas), JSON aninhado. Percorrer uma árvore recursivamente é mais claro que qualquer versão iterativa.

### A armadilha: recomputar o já computado
Fibonacci ingênuo:

```java
long fib(int n) {                 // ⚠️ O(2^n)
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
```

`fib(50)` recalcula `fib(48)` duas vezes, `fib(47)` três, `fib(2)` **bilhões** de vezes — a árvore de chamadas dobra a cada nível. `fib(50)` ingênuo leva **minutos**; são ~2⁵⁰ chamadas.

### Memoização: lembre-se do que já resolveu
**Memoizar** = guardar o resultado de cada subproblema na primeira vez e **consultar o cache** nas seguintes:

```java
Map<Integer, Long> memo = new HashMap<>();

long fib(int n) {
    if (n <= 1) return n;
    Long pronto = memo.get(n);
    if (pronto != null) return pronto;    // já resolvido: O(1)
    long resultado = fib(n - 1) + fib(n - 2);
    memo.put(n, resultado);               // registra para o futuro
    return resultado;
}
```

Cada subproblema é resolvido **uma única vez**: de O(2ⁿ) para **O(n)**. `fib(50)`: de minutos para microssegundos — a otimização mais dramática que você verá.

É o mesmo princípio do **cache** (Redis, HTTP): trocar memória por recomputação. A diferença é o escopo: memoização cacheia **funções puras** dentro do algoritmo.

### Quando memoizar funciona
1. **Subproblemas sobrepostos** — a recursão revisita as mesmas entradas (fibonacci sim; fatorial não — cada `fatorial(k)` é chamado uma vez, memoizar não ganha nada).
2. **Função pura** — mesmo argumento, mesma resposta, sem efeitos colaterais.

Memoização é a porta de entrada da **programação dinâmica** (DP): a versão *bottom-up* preenche uma tabela iterativamente (sem recursão, sem risco de stack overflow), mas a ideia é idêntica — nunca resolver o mesmo subproblema duas vezes.

> Roteiro prático: escreva a recursão clara → ela revisita subproblemas? → adicione o `Map` de memo (3 linhas) → se a profundidade estourar a pilha, converta para bottom-up.
$theory$, 20, 4, 2, 17);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: Big O -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008010101', 'a3000000-0000-0000-0000-000000080101', 'MULTIPLE_CHOICE',
  'Um método compara cada elemento de uma lista com TODOS os outros (dois loops aninhados sobre a mesma lista). Qual a complexidade?', 'n elementos, n comparações cada.', 1, 5, 2),
 ('a4000000-0000-0000-0000-000008010102', 'a3000000-0000-0000-0000-000000080101', 'MULTIPLE_CHOICE',
  'Um algoritmo O(log n) sobre 1 milhão de elementos executa aproximadamente quantos passos?', '2^20 ≈ 1 milhão.', 2, 5, 3);

-- L2: coleções -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008010201', 'a3000000-0000-0000-0000-000000080102', 'MULTIPLE_CHOICE',
  'Um código chama `lista.contains(x)` (ArrayList) dentro de um loop sobre outra lista de tamanho n. Qual o problema e a correção?', 'contains em ArrayList é linear.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000008010202', 'a3000000-0000-0000-0000-000000080102', 'DESCRIPTIVE',
  'Por que o get do HashMap é O(1) "médio"— e o que faz esse custo degradar na prática? Explique o mecanismo de baldes.', 'hashCode -> balde -> equals. E se todas as chaves caírem no mesmo balde?', 2, 10, 4);

-- L3: pilhas/filas -> 1 MC + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008020101', 'a3000000-0000-0000-0000-000000080201', 'MULTIPLE_CHOICE',
  'Para implementar o desfazer (Ctrl+Z) de um editor, qual estrutura é a natural — e por quê?', 'A última ação feita é a primeira desfeita.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000008020102', 'a3000000-0000-0000-0000-000000080201', 'CODE_CHALLENGE',
  'Implemente `balanceado(String s)`: devolva true se os parênteses/colchetes/chaves de s estão corretamente balanceados e aninhados. Use uma pilha (ArrayDeque).', 'Abertura empilha; fechamento tem que casar com o topo; no fim a pilha deve estar vazia.', 2, 15, 4);

-- L4: árvores/heap -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008020201', 'a3000000-0000-0000-0000-000000080202', 'MULTIPLE_CHOICE',
  'Inserir 1, 2, 3, 4, 5 (em ordem) numa BST sem balanceamento produz o quê?', 'Só filhos à direita…', 1, 5, 4),
 ('a4000000-0000-0000-0000-000008020202', 'a3000000-0000-0000-0000-000000080202', 'MULTIPLE_CHOICE',
  'Você precisa processar sempre a tarefa de MAIOR prioridade, com inserções constantes. Qual estrutura Java usar?', 'O extremo sempre acessível, sem reordenar tudo.', 2, 5, 3);

-- L5: busca/ordenação -> 1 MC + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008030101', 'a3000000-0000-0000-0000-000000080301', 'MULTIPLE_CHOICE',
  'Qual é o pré-requisito para a busca binária funcionar?', 'O que permite descartar metade a cada passo?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000008030102', 'a3000000-0000-0000-0000-000000080301', 'CODE_CHALLENGE',
  'Implemente `buscaBinaria(int[] v, int alvo)` iterativa: devolva o índice do alvo no array ORDENADO, ou -1 se não existir.', 'Dois ponteiros (ini/fim) e o meio; cuidado com o <= e o +1/-1.', 2, 15, 4);

-- L6: recursão/memo -> 1 MC + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000008030201', 'a3000000-0000-0000-0000-000000080302', 'MULTIPLE_CHOICE',
  'Uma função recursiva sem caso base (ou que nunca o alcança) resulta em quê, em Java?', 'Cada chamada empilha um frame na call stack.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000008030202', 'a3000000-0000-0000-0000-000000080302', 'CODE_CHALLENGE',
  'O `fib(n)` recursivo ingênuo é O(2^n). Adicione MEMOIZAÇÃO com um Map para levá-lo a O(n), mantendo a assinatura `long fib(int n)`.', 'Antes de recursar, consulte o Map; depois de calcular, registre.', 2, 15, 4);

-- ─── OPTIONS ─────────────────────────────────────────────────────────
-- L1 Q1: O(n²)
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000801010101', 'a4000000-0000-0000-0000-000008010101', 'O(n²) — para cada um dos n elementos, até n comparações.', TRUE,  'Correto: loops aninhados sobre a mesma coleção = quadrático. Com 10x mais dados, 100x mais trabalho.', 1),
 ('a5000000-0000-0000-0000-000801010102', 'a4000000-0000-0000-0000-000008010101', 'O(n) — a lista é percorrida apenas duas vezes.', FALSE, 'O loop interno roda POR ITERAÇÃO do externo — multiplica, não soma.', 2),
 ('a5000000-0000-0000-0000-000801010103', 'a4000000-0000-0000-0000-000008010101', 'O(2n), que é maior que O(n²).', FALSE, 'O(2n) = O(n) (constantes caem) e é MENOR que O(n²).', 3),
 ('a5000000-0000-0000-0000-000801010104', 'a4000000-0000-0000-0000-000008010101', 'O(log n), pois as comparações descartam elementos.', FALSE, 'Nada é descartado pela metade aqui — todos os pares são visitados.', 4);

-- L1 Q2: log n
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000801010201', 'a4000000-0000-0000-0000-000008010102', 'Cerca de 20', TRUE,  'Correto: 2^20 ≈ 1.048.576 — cortar 1 milhão pela metade ~20 vezes chega a 1.', 1),
 ('a5000000-0000-0000-0000-000801010202', 'a4000000-0000-0000-0000-000008010102', 'Cerca de 1.000', FALSE, '1.000 ≈ raiz quadrada de 1 milhão — isso seria O(√n).', 2),
 ('a5000000-0000-0000-0000-000801010203', 'a4000000-0000-0000-0000-000008010102', 'Cerca de 500.000', FALSE, 'Metade de n é O(n) — constantes caem.', 3),
 ('a5000000-0000-0000-0000-000801010204', 'a4000000-0000-0000-0000-000008010102', 'Exatamente 1 milhão', FALSE, 'Isso é O(n) — o log é o superpoder de cortar pela metade.', 4);

-- L2 Q1: contains em loop
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000801020101', 'a4000000-0000-0000-0000-000008010201', 'É O(n²) disfarçado: contains é O(n). Converta a lista consultada para HashSet antes do loop — O(n) total.', TRUE,  'Correto: o erro de performance mais comum do dia a dia. Set.contains é O(1) médio.', 1),
 ('a5000000-0000-0000-0000-000801020102', 'a4000000-0000-0000-0000-000008010201', 'Nenhum problema — contains de ArrayList é O(1).', FALSE, 'ArrayList.contains varre a lista: O(n).', 2),
 ('a5000000-0000-0000-0000-000801020103', 'a4000000-0000-0000-0000-000008010201', 'O problema é de memória, não de tempo.', FALSE, 'A memória fica igual; o tempo é que explode quadraticamente.', 3),
 ('a5000000-0000-0000-0000-000801020104', 'a4000000-0000-0000-0000-000008010201', 'Trocar por LinkedList.contains resolve.', FALSE, 'LinkedList.contains também é O(n) — e com constante pior.', 4);

-- L3 Q1: undo
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000802010101', 'a4000000-0000-0000-0000-000008020101', 'Pilha (LIFO) — a ÚLTIMA ação realizada é a primeira a ser desfeita.', TRUE,  'Correto: cada ação é empilhada; Ctrl+Z faz pop. Refazer usa uma segunda pilha.', 1),
 ('a5000000-0000-0000-0000-000802010102', 'a4000000-0000-0000-0000-000008020101', 'Fila (FIFO) — as ações saem na ordem em que foram feitas.', FALSE, 'FIFO desfaria a ação mais ANTIGA primeiro — o oposto do esperado.', 2),
 ('a5000000-0000-0000-0000-000802010103', 'a4000000-0000-0000-0000-000008020101', 'HashMap de ações por timestamp.', FALSE, 'Mapa não modela a ordem de desfazer; a pilha o faz naturalmente.', 3),
 ('a5000000-0000-0000-0000-000802010104', 'a4000000-0000-0000-0000-000008020101', 'PriorityQueue ordenada por importância da ação.', FALSE, 'Desfazer não é por prioridade — é estritamente a última ação.', 4);

-- L4 Q1: BST degenerada
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000802020101', 'a4000000-0000-0000-0000-000008020201', 'Uma árvore degenerada em lista (só filhos à direita) — busca O(n), a vantagem se perde.', TRUE,  'Correto: entrada ordenada é o pior caso da BST ingênua; árvores auto-balanceadas (rubro-negra) existem para isso.', 1),
 ('a5000000-0000-0000-0000-000802020102', 'a4000000-0000-0000-0000-000008020201', 'Uma árvore perfeitamente balanceada, pois os valores são sequenciais.', FALSE, 'Sequencial é justamente o que desbalanceia: cada novo valor é maior que tudo.', 2),
 ('a5000000-0000-0000-0000-000802020103', 'a4000000-0000-0000-0000-000008020201', 'Erro — BSTs rejeitam inserções em ordem crescente.', FALSE, 'A inserção funciona; o problema é a FORMA resultante.', 3),
 ('a5000000-0000-0000-0000-000802020104', 'a4000000-0000-0000-0000-000008020201', 'A árvore se rebalanceia sozinha em qualquer implementação.', FALSE, 'Auto-balanceamento é característica de AVL/rubro-negra, não da BST básica.', 4);

-- L4 Q2: priority queue
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000802020201', 'a4000000-0000-0000-0000-000008020202', 'PriorityQueue — heap com peek O(1) do extremo e offer/poll O(log n).', TRUE,  'Correto: mantém o mais prioritário sempre acessível sem reordenar a coleção toda.', 1),
 ('a5000000-0000-0000-0000-000802020202', 'a4000000-0000-0000-0000-000008020202', 'ArrayList reordenada com sort() a cada inserção.', FALSE, 'O(n log n) POR INSERÇÃO — o heap faz o mesmo serviço em O(log n).', 2),
 ('a5000000-0000-0000-0000-000802020203', 'a4000000-0000-0000-0000-000008020202', 'ArrayDeque usada como fila comum.', FALSE, 'FIFO ignora prioridade — sai o mais antigo, não o mais importante.', 3),
 ('a5000000-0000-0000-0000-000802020204', 'a4000000-0000-0000-0000-000008020202', 'HashSet, pela busca O(1).', FALSE, 'Set não tem noção de ordem nem de extremo.', 4);

-- L5 Q1: pré-requisito
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000803010101', 'a4000000-0000-0000-0000-000008030101', 'O array precisa estar ORDENADO — é o que permite descartar metade a cada comparação.', TRUE,  'Correto: sem ordenação, "menor que o meio" não diz em que metade o alvo está — o resultado é lixo silencioso.', 1),
 ('a5000000-0000-0000-0000-000803010102', 'a4000000-0000-0000-0000-000008030101', 'O array precisa ter tamanho par.', FALSE, 'Tamanho é irrelevante; o meio arredonda.', 2),
 ('a5000000-0000-0000-0000-000803010103', 'a4000000-0000-0000-0000-000008030101', 'Os elementos precisam ser únicos.', FALSE, 'Duplicatas funcionam (devolve UM dos índices).', 3),
 ('a5000000-0000-0000-0000-000803010104', 'a4000000-0000-0000-0000-000008030101', 'Nenhum — busca binária funciona em qualquer array.', FALSE, 'Em array desordenado ela falha sem nem lançar erro — o pior tipo de bug.', 4);

-- L6 Q1: sem caso base
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000803020101', 'a4000000-0000-0000-0000-000008030201', 'StackOverflowError — as chamadas se empilham na call stack até transbordar.', TRUE,  'Correto: cada chamada é um frame na pilha da JVM; sem fundo do poço, ela estoura.', 1),
 ('a5000000-0000-0000-0000-000803020102', 'a4000000-0000-0000-0000-000008030201', 'OutOfMemoryError na heap.', FALSE, 'A pressão é na STACK (frames), não na heap — erro diferente.', 2),
 ('a5000000-0000-0000-0000-000803020103', 'a4000000-0000-0000-0000-000008030201', 'O compilador detecta e recusa compilar.', FALSE, 'O compilador não prova terminação — o erro é em runtime.', 3),
 ('a5000000-0000-0000-0000-000803020104', 'a4000000-0000-0000-0000-000008030201', 'A JVM converte automaticamente para um loop.', FALSE, 'Java NÃO faz tail-call optimization — a recursão empilha de verdade.', 4);

-- ─── DESCRIPTIVE ANSWERS ─────────────────────────────────────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000008010202', 'a4000000-0000-0000-0000-000008010202',
  'O HashMap calcula hashCode() da chave e o converte no índice de um BALDE; no balde (idealmente com pouquíssimos elementos), confirma com equals(). Como o acesso ao balde é direto (aritmética), o custo médio é O(1). Degrada quando muitas chaves caem no MESMO balde: hashCode mal distribuído (ex.: retornar constante), ou colisões naturais em excesso — a busca dentro do balde vira varredura O(n) (ou O(log n) nas versões modernas, que convertem baldes grandes em árvores). Também contribui um fator de carga alto antes do redimensionamento. Por isso o contrato equals/hashCode e uma boa distribuição são essenciais.',
  'Deve descrever o mecanismo em duas fases (hash -> balde, equals -> confirmação) e explicar que a degradação vem de colisões concentradas (hashCode ruim), levando a busca linear no balde. Bônus por citar a conversão de balde em árvore (O(log n)) no Java moderno, fator de carga/resize, ou o contrato equals/hashCode.');

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000008020102', 'a4000000-0000-0000-0000-000008020102',
$initial$import java.util.ArrayDeque;
import java.util.Deque;

class Validador {
    // TODO: devolva true se (), [] e {} estão balanceados e bem aninhados.
    // Estratégia: abertura -> empilha; fechamento -> deve casar com o topo.
    static boolean balanceado(String s) {
        return false; // substitua pela solução com pilha
    }
}
$initial$,
$solution$import java.util.ArrayDeque;
import java.util.Deque;

class Validador {
    static boolean balanceado(String s) {
        Deque<Character> pilha = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '(', '[', '{' -> pilha.push(c);
                case ')' -> { if (pilha.isEmpty() || pilha.pop() != '(') return false; }
                case ']' -> { if (pilha.isEmpty() || pilha.pop() != '[') return false; }
                case '}' -> { if (pilha.isEmpty() || pilha.pop() != '{') return false; }
                default -> { /* ignora outros caracteres */ }
            }
        }
        return pilha.isEmpty();
    }
}
$solution$,
 '[{"input": "Validador.balanceado(\"{[()]}\")", "expected_output": "true"}, {"input": "Validador.balanceado(\"{[}]\")", "expected_output": "false"}, {"input": "Validador.balanceado(\"((\")", "expected_output": "false"}, {"input": "Validador.balanceado(\"\")", "expected_output": "true"}]'::jsonb,
 'java',
 'Avalie se a solução usa uma pilha (ArrayDeque ou equivalente): empilha aberturas, e em cada fechamento verifica pilha não vazia + topo correspondente (pop). Deve devolver true somente se, ao final, a pilha estiver vazia (pega o caso "((" ). Aceite mapeamentos com Map<Character,Character> ou switch. Penalize soluções por contagem simples de caracteres (não detectam aninhamento errado como "{[}]") e esquecerem a checagem final de pilha vazia.'),

 ('a6000000-0000-0000-0000-000008030102', 'a4000000-0000-0000-0000-000008030102',
$initial$class Busca {
    // TODO: busca binária ITERATIVA num array ORDENADO.
    // Devolva o índice do alvo, ou -1 se não existir.
    static int buscaBinaria(int[] v, int alvo) {
        return -1; // substitua pela solução
    }
}
$initial$,
$solution$class Busca {
    static int buscaBinaria(int[] v, int alvo) {
        int ini = 0, fim = v.length - 1;
        while (ini <= fim) {
            int meio = ini + (fim - ini) / 2;
            if (v[meio] == alvo) return meio;
            if (v[meio] < alvo) {
                ini = meio + 1;
            } else {
                fim = meio - 1;
            }
        }
        return -1;
    }
}
$solution$,
 '[{"input": "Busca.buscaBinaria(new int[]{10, 20, 30, 40, 50}, 30)", "expected_output": "2"}, {"input": "Busca.buscaBinaria(new int[]{10, 20, 30, 40, 50}, 50)", "expected_output": "4"}, {"input": "Busca.buscaBinaria(new int[]{10, 20, 30}, 25)", "expected_output": "-1"}, {"input": "Busca.buscaBinaria(new int[]{}, 5)", "expected_output": "-1"}]'::jsonb,
 'java',
 'Avalie se é uma busca binária iterativa correta: ponteiros ini/fim, loop com ini <= fim, meio calculado sem overflow (ini + (fim-ini)/2 — aceite (ini+fim)/2 com observação), atualização ini = meio+1 / fim = meio-1, retorno do índice no acerto e -1 ao final. Deve funcionar com array vazio e alvo nas extremidades. Penalize varredura linear (não é busca binária), loops sem o caso de igualdade e atualizações sem +1/-1 (loop infinito).'),

 ('a6000000-0000-0000-0000-000008030202', 'a4000000-0000-0000-0000-000008030202',
$initial$import java.util.HashMap;
import java.util.Map;

class Fibonacci {
    // fib ingênuo: O(2^n) — fib(50) demora minutos.
    // TODO: adicione MEMOIZAÇÃO com o Map abaixo para tornar O(n).
    private final Map<Integer, Long> memo = new HashMap<>();

    long fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}
$initial$,
$solution$import java.util.HashMap;
import java.util.Map;

class Fibonacci {
    private final Map<Integer, Long> memo = new HashMap<>();

    long fib(int n) {
        if (n <= 1) return n;
        Long pronto = memo.get(n);
        if (pronto != null) {
            return pronto;              // subproblema já resolvido
        }
        long resultado = fib(n - 1) + fib(n - 2);
        memo.put(n, resultado);         // registra para reuso
        return resultado;
    }
}
$solution$,
 '[{"input": "new Fibonacci().fib(10)", "expected_output": "55"}, {"input": "new Fibonacci().fib(50)", "expected_output": "12586269025 (instantâneo com memo; minutos sem)"}, {"input": "new Fibonacci().fib(0)", "expected_output": "0"}]'::jsonb,
 'java',
 'Avalie se a memoização está correta: consulta o Map ANTES de recursar (retornando o valor pronto) e grava o resultado APÓS calcular, mantendo o caso base n <= 1. Aceite computeIfAbsent (atenção: computeIfAbsent com recursão dentro pode lançar ConcurrentModificationException — se o aluno usar, aponte o risco sem reprovar se a lógica estiver clara) e versões bottom-up iterativas com array/Map. Penalize se consultar o memo mas nunca preenchê-lo, ou se remover o caso base.');
