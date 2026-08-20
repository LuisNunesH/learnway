-- =====================================================================
-- LearnWay — questões extras para as lições existentes
--   * +12 questões em "Java — Fundamentos" (6 lições)
--   * +8  questões em "Java — Intermediário" (8 lições)
-- Todas MULTIPLE_CHOICE; order_index continua a numeração de cada lição.
-- Convenção de UUIDs (mesma do V5/V9/V10):
--   question a4…0000 TT SS LL QQ   option a5…00 TT SS LL QQ OO
-- (as opções do V2 usam prefixo 0000…, então não há colisão)
-- =====================================================================

-- ═══ JAVA — FUNDAMENTOS ══════════════════════════════════════════════

-- ─── Classes e Objetos (010101): Q03, Q04 ────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010103', 'a3000000-0000-0000-0000-000000010101', 'MULTIPLE_CHOICE',
  'Uma classe não declara nenhum construtor. O que acontece ao fazer `new MinhaClasse()`?', 'O compilador ajuda quando você não declara nada.', 3, 5, 1),
 ('a4000000-0000-0000-0000-000001010104', 'a3000000-0000-0000-0000-000000010101', 'MULTIPLE_CHOICE',
  'Dois objetos da mesma classe compartilham os valores dos campos de instância?', 'Cada instância tem seu próprio estado.', 4, 5, 1);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101010301', 'a4000000-0000-0000-0000-000001010103', 'Funciona: o compilador gera um construtor padrão sem argumentos.', TRUE,  'Correto: sem nenhum construtor declarado, o Java fornece o construtor padrão vazio.', 1),
 ('a5000000-0000-0000-0000-000101010302', 'a4000000-0000-0000-0000-000001010103', 'Erro de compilação: construtor é obrigatório.', FALSE, 'Só é obrigatório declarar se você quiser inicialização própria — o padrão cobre o resto.', 2),
 ('a5000000-0000-0000-0000-000101010303', 'a4000000-0000-0000-0000-000001010103', 'Erro em runtime: NoSuchMethodException.', FALSE, 'O construtor padrão existe no bytecode — nenhum erro ocorre.', 3),
 ('a5000000-0000-0000-0000-000101010304', 'a4000000-0000-0000-0000-000001010103', 'O objeto é criado com todos os métodos desabilitados.', FALSE, 'Métodos não dependem de construtor declarado.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101010401', 'a4000000-0000-0000-0000-000001010104', 'Não — cada objeto tem sua própria cópia dos campos de instância.', TRUE,  'Correto: o estado é por instância; o que é compartilhado pela classe são os métodos e os campos static.', 1),
 ('a5000000-0000-0000-0000-000101010402', 'a4000000-0000-0000-0000-000001010104', 'Sim — campos são sempre compartilhados entre instâncias.', FALSE, 'Isso só vale para campos static, que pertencem à classe.', 2),
 ('a5000000-0000-0000-0000-000101010403', 'a4000000-0000-0000-0000-000001010104', 'Somente se os objetos forem criados pelo mesmo construtor.', FALSE, 'O construtor usado não muda a independência do estado.', 3),
 ('a5000000-0000-0000-0000-000101010404', 'a4000000-0000-0000-0000-000001010104', 'Sim, até que um deles chame um setter.', FALSE, 'As cópias já nascem separadas — não há “separação sob demanda”.', 4);

-- ─── Encapsulamento (010102): Q02, Q03 ───────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010202', 'a3000000-0000-0000-0000-000000010102', 'MULTIPLE_CHOICE',
  'Qual sequência ordena os modificadores de acesso do MAIS restrito ao MAIS aberto?', 'O default (sem modificador) fica entre dois deles.', 2, 5, 2),
 ('a4000000-0000-0000-0000-000001010203', 'a3000000-0000-0000-0000-000000010102', 'MULTIPLE_CHOICE',
  'O que caracteriza uma classe imutável em Java?', 'Pense na String.', 3, 5, 2);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101020201', 'a4000000-0000-0000-0000-000001010202', 'private → default (pacote) → protected → public', TRUE,  'Correto: private (só a classe), default (pacote), protected (pacote + subclasses), public (todos).', 1),
 ('a5000000-0000-0000-0000-000101020202', 'a4000000-0000-0000-0000-000001010202', 'private → protected → default → public', FALSE, 'protected é MAIS aberto que default: soma as subclasses de outros pacotes.', 2),
 ('a5000000-0000-0000-0000-000101020203', 'a4000000-0000-0000-0000-000001010202', 'default → private → protected → public', FALSE, 'private é o mais restrito de todos.', 3),
 ('a5000000-0000-0000-0000-000101020204', 'a4000000-0000-0000-0000-000001010202', 'protected → private → public → default', FALSE, 'Ordem sem correspondência com as regras de visibilidade.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101020301', 'a4000000-0000-0000-0000-000001010203', 'Estado que não muda após a construção: campos final/privados e nenhum setter.', TRUE,  'Correto: todo o estado é definido no construtor; “alterações” devolvem novas instâncias, como faz a String.', 1),
 ('a5000000-0000-0000-0000-000101020302', 'a4000000-0000-0000-0000-000001010203', 'Uma classe que não pode ser instanciada.', FALSE, 'Isso descreve classe abstrata ou de utilidades com construtor privado.', 2),
 ('a5000000-0000-0000-0000-000101020303', 'a4000000-0000-0000-0000-000001010203', 'Uma classe cujos campos são todos static.', FALSE, 'static muda o dono do campo (a classe), não a mutabilidade.', 3),
 ('a5000000-0000-0000-0000-000101020304', 'a4000000-0000-0000-0000-000001010203', 'Qualquer classe marcada com final.', FALSE, 'final na classe só impede herança; os campos podem continuar mutáveis.', 4);

-- ─── Herança e Polimorfismo (010103): Q03, Q04 ───────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001010303', 'a3000000-0000-0000-0000-000000010103', 'MULTIPLE_CHOICE',
  'Para que serve a chamada `super(...)` na primeira linha de um construtor?', 'A subclasse precisa inicializar a parte herdada.', 3, 5, 3),
 ('a4000000-0000-0000-0000-000001010304', 'a3000000-0000-0000-0000-000000010103', 'MULTIPLE_CHOICE',
  'Java não permite herança múltipla de classes. Como uma classe ganha múltiplos "contratos" de comportamento?', 'extends é um só; e o implements?', 4, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101030301', 'a4000000-0000-0000-0000-000001010303', 'Invoca o construtor da superclasse, inicializando a parte herdada do objeto.', TRUE,  'Correto: a construção acontece de cima para baixo — a base primeiro, depois a subclasse.', 1),
 ('a5000000-0000-0000-0000-000101030302', 'a4000000-0000-0000-0000-000001010303', 'Cria uma instância separada da superclasse na heap.', FALSE, 'É UM único objeto; super() inicializa a parte herdada dele, não cria outro.', 2),
 ('a5000000-0000-0000-0000-000101030303', 'a4000000-0000-0000-0000-000001010303', 'Copia os métodos da superclasse para a subclasse.', FALSE, 'Métodos são herdados por mecanismo de dispatch, não copiados em runtime.', 3),
 ('a5000000-0000-0000-0000-000101030304', 'a4000000-0000-0000-0000-000001010303', 'É opcional e nunca tem efeito se a superclasse tiver construtor padrão.', FALSE, 'Se você não escrever, o compilador insere super() implícito — o efeito existe sempre.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000101030401', 'a4000000-0000-0000-0000-000001010304', 'Implementando múltiplas interfaces (implements A, B, C).', TRUE,  'Correto: extends aceita UMA classe, mas implements aceita várias interfaces — comportamento múltiplo sem os conflitos da herança múltipla de estado.', 1),
 ('a5000000-0000-0000-0000-000101030402', 'a4000000-0000-0000-0000-000001010304', 'Usando extends com várias classes separadas por vírgula.', FALSE, 'Isso não compila: herança de classe é única em Java.', 2),
 ('a5000000-0000-0000-0000-000101030403', 'a4000000-0000-0000-0000-000001010304', 'Não há alternativa: cada classe tem no máximo um contrato.', FALSE, 'Interfaces existem exatamente para múltiplos contratos.', 3),
 ('a5000000-0000-0000-0000-000101030404', 'a4000000-0000-0000-0000-000001010304', 'Através de reflection em runtime.', FALSE, 'Reflection inspeciona tipos; não adiciona contratos à classe.', 4);

-- ─── Primitivos e Wrappers (010201): Q02, Q03 ────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001020102', 'a3000000-0000-0000-0000-000000010201', 'MULTIPLE_CHOICE',
  'O que acontece ao executar `Integer x = null; int y = x;`?', 'Unboxing chama um método no objeto.', 2, 5, 2),
 ('a4000000-0000-0000-0000-000001020103', 'a3000000-0000-0000-0000-000000010201', 'MULTIPLE_CHOICE',
  'Qual destes NÃO é um tipo primitivo do Java?', 'São 8 primitivos — um destes é uma classe.', 3, 5, 1);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000102010201', 'a4000000-0000-0000-0000-000001020102', 'NullPointerException em runtime — o unboxing chama x.intValue() num null.', TRUE,  'Correto: converter Integer -> int exige o objeto; com null, o intValue() estoura NPE.', 1),
 ('a5000000-0000-0000-0000-000102010202', 'a4000000-0000-0000-0000-000001020102', 'y recebe 0, o valor padrão de int.', FALSE, 'Valor padrão vale para CAMPOS não inicializados, não para unboxing de null.', 2),
 ('a5000000-0000-0000-0000-000102010203', 'a4000000-0000-0000-0000-000001020102', 'Erro de compilação: não se pode atribuir Integer a int.', FALSE, 'Compila normalmente — o autounboxing cuida da conversão. O problema só aparece em runtime.', 3),
 ('a5000000-0000-0000-0000-000102010204', 'a4000000-0000-0000-0000-000001020102', 'y recebe null.', FALSE, 'int é primitivo — não existe int null.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000102010301', 'a4000000-0000-0000-0000-000001020103', 'String', TRUE,  'Correto: String é uma classe (referência), apesar do suporte especial a literais. Os 8 primitivos: int, long, double, float, boolean, char, byte, short.', 1),
 ('a5000000-0000-0000-0000-000102010302', 'a4000000-0000-0000-0000-000001020103', 'boolean', FALSE, 'boolean é primitivo.', 2),
 ('a5000000-0000-0000-0000-000102010303', 'a4000000-0000-0000-0000-000001020103', 'char', FALSE, 'char é primitivo (16 bits, UTF-16).', 3),
 ('a5000000-0000-0000-0000-000102010304', 'a4000000-0000-0000-0000-000001020103', 'byte', FALSE, 'byte é primitivo (8 bits com sinal).', 4);

-- ─── Strings (010202): Q02, Q03 ──────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001020202', 'a3000000-0000-0000-0000-000000010202', 'MULTIPLE_CHOICE',
  'Considere `String a = "java"; String b = new String("java");`. O que `a == b` e `a.equals(b)` retornam?', 'Um compara referência; o outro, conteúdo.', 2, 5, 2),
 ('a4000000-0000-0000-0000-000001020203', 'a3000000-0000-0000-0000-000000010202', 'MULTIPLE_CHOICE',
  'Qual benefício NÃO é consequência da imutabilidade da String?', 'Três deles são vantagens reais.', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000102020201', 'a4000000-0000-0000-0000-000001020202', '== é false (objetos distintos); equals é true (mesmo conteúdo).', TRUE,  'Correto: new força um objeto novo fora do pool; equals compara os caracteres.', 1),
 ('a5000000-0000-0000-0000-000102020202', 'a4000000-0000-0000-0000-000001020202', 'Ambos true — o conteúdo é igual.', FALSE, '== compara referências; o new garante referências diferentes.', 2),
 ('a5000000-0000-0000-0000-000102020203', 'a4000000-0000-0000-0000-000001020202', 'Ambos false — Strings nunca são iguais entre si.', FALSE, 'equals compara conteúdo e devolve true aqui.', 3),
 ('a5000000-0000-0000-0000-000102020204', 'a4000000-0000-0000-0000-000001020202', '== é true (pool de Strings unifica); equals é false.', FALSE, 'O pool unificaria dois LITERAIS — mas o new cria objeto fora do pool.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000102020301', 'a4000000-0000-0000-0000-000001020203', 'Concatenação em loop fica mais eficiente.', TRUE,  'Correto (é o que NÃO decorre): a imutabilidade torna a concatenação MENOS eficiente — cada + cria um objeto novo; por isso existe o StringBuilder.', 1),
 ('a5000000-0000-0000-0000-000102020302', 'a4000000-0000-0000-0000-000001020203', 'Segurança para compartilhar entre threads sem sincronização.', FALSE, 'É vantagem real: objeto que não muda pode ser lido por todas as threads.', 2),
 ('a5000000-0000-0000-0000-000102020303', 'a4000000-0000-0000-0000-000001020203', 'Uso confiável como chave de HashMap.', FALSE, 'É vantagem real: o hashCode nunca muda depois de criado.', 3),
 ('a5000000-0000-0000-0000-000102020304', 'a4000000-0000-0000-0000-000001020203', 'Possibilidade do pool de Strings reutilizar literais.', FALSE, 'É vantagem real: só é seguro compartilhar porque ninguém pode alterar.', 4);

-- ─── Exceções (010301): Q03, Q04 ─────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000001030103', 'a3000000-0000-0000-0000-000000010301', 'MULTIPLE_CHOICE',
  'O que uma classe precisa implementar para ser usada no try-with-resources?', 'O try fecha o recurso chamando um método padrão.', 3, 5, 3),
 ('a4000000-0000-0000-0000-000001030104', 'a3000000-0000-0000-0000-000000010301', 'MULTIPLE_CHOICE',
  'Um método executa `return` dentro do bloco `try`. O bloco `finally` ainda executa?', 'finally é (quase) inevitável.', 4, 5, 2);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000103010301', 'a4000000-0000-0000-0000-000001030103', 'A interface AutoCloseable (ou Closeable), com o método close().', TRUE,  'Correto: o try-with-resources chama close() automaticamente ao sair do bloco, mesmo com exceção.', 1),
 ('a5000000-0000-0000-0000-000103010302', 'a4000000-0000-0000-0000-000001030103', 'A interface Serializable.', FALSE, 'Serializable é sobre serialização de objetos — nada a ver com recursos.', 2),
 ('a5000000-0000-0000-0000-000103010303', 'a4000000-0000-0000-0000-000001030103', 'Estender RuntimeException.', FALSE, 'O recurso não é uma exceção — é o objeto a ser fechado.', 3),
 ('a5000000-0000-0000-0000-000103010304', 'a4000000-0000-0000-0000-000001030103', 'Ter um método finalize() sobrescrito.', FALSE, 'finalize() está deprecated e nunca foi o mecanismo do try-with-resources.', 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000103010401', 'a4000000-0000-0000-0000-000001030104', 'Sim — o finally executa antes de o valor ser efetivamente retornado.', TRUE,  'Correto: finally roda mesmo com return, break ou exceção no try (só não roda em System.exit/queda da JVM).', 1),
 ('a5000000-0000-0000-0000-000103010402', 'a4000000-0000-0000-0000-000001030104', 'Não — o return encerra o método imediatamente.', FALSE, 'O return é “segurado” até o finally terminar.', 2),
 ('a5000000-0000-0000-0000-000103010403', 'a4000000-0000-0000-0000-000001030104', 'Só se houver um catch no mesmo try.', FALSE, 'finally independe de catch.', 3),
 ('a5000000-0000-0000-0000-000103010404', 'a4000000-0000-0000-0000-000001030104', 'Depende da JVM utilizada.', FALSE, 'É comportamento especificado pela linguagem, igual em qualquer JVM.', 4);

-- ═══ JAVA — INTERMEDIÁRIO ════════════════════════════════════════════

-- ─── List/Set/Map (020101): Q03 ──────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002010103', 'a3000000-0000-0000-0000-000000020101', 'MULTIPLE_CHOICE',
  'Você precisa de um Map que preserve a ORDEM DE INSERÇÃO ao iterar. Qual implementação escolher?', 'Hash não garante ordem; Tree ordena por chave.', 3, 5, 2);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000201010301', 'a4000000-0000-0000-0000-000002010103', 'LinkedHashMap', TRUE,  'Correto: mantém uma lista encadeada interna com a ordem de inserção das chaves.', 1),
 ('a5000000-0000-0000-0000-000201010302', 'a4000000-0000-0000-0000-000002010103', 'HashMap', FALSE, 'HashMap não garante ordem nenhuma na iteração.', 2),
 ('a5000000-0000-0000-0000-000201010303', 'a4000000-0000-0000-0000-000002010103', 'TreeMap', FALSE, 'TreeMap ordena pela ORDEM NATURAL das chaves (ou Comparator), não pela inserção.', 3),
 ('a5000000-0000-0000-0000-000201010304', 'a4000000-0000-0000-0000-000002010103', 'Hashtable', FALSE, 'Legada, sincronizada e sem garantia de ordem.', 4);

-- ─── equals/hashCode (020102): Q03 ───────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002010203', 'a3000000-0000-0000-0000-000000020102', 'MULTIPLE_CHOICE',
  'Um objeto usado como chave de HashMap tem um campo alterado DEPOIS de inserido (campo que participa do hashCode). O que acontece?', 'O balde foi escolhido com o hash antigo.', 3, 5, 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000201020301', 'a4000000-0000-0000-0000-000002010203', 'A entrada "some": get() com a chave passa a procurar no balde novo, mas ela está no antigo.', TRUE,  'Correto: por isso chaves de Map devem ser imutáveis — o hash da inserção fica congelado no balde errado.', 1),
 ('a5000000-0000-0000-0000-000201020302', 'a4000000-0000-0000-0000-000002010203', 'O HashMap detecta a mudança e realoca a entrada automaticamente.', FALSE, 'O mapa não observa suas chaves — nada é realocado.', 2),
 ('a5000000-0000-0000-0000-000201020303', 'a4000000-0000-0000-0000-000002010203', 'ConcurrentModificationException imediata.', FALSE, 'Essa exceção é sobre modificar a COLEÇÃO durante iteração — outro cenário.', 3),
 ('a5000000-0000-0000-0000-000201020304', 'a4000000-0000-0000-0000-000002010203', 'Nada: o hashCode só é calculado uma vez, na inserção.', FALSE, 'O get() recalcula o hash da chave de busca — e aí os dois divergem.', 4);

-- ─── Generics (020201): Q03 ──────────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002020103', 'a3000000-0000-0000-0000-000000020201', 'MULTIPLE_CHOICE',
  'Qual o risco de usar o tipo cru (raw type) `List lista = new ArrayList();` em vez de `List<String>`?', 'O compilador perde a capacidade de verificar o quê?', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000202010301', 'a4000000-0000-0000-0000-000002020103', 'Perde-se a checagem de tipos: qualquer objeto entra, e ClassCastException pode estourar longe dali.', TRUE,  'Correto: raw types desligam a verificação genérica — o erro migra da compilação para o runtime.', 1),
 ('a5000000-0000-0000-0000-000202010302', 'a4000000-0000-0000-0000-000002020103', 'A lista fica mais lenta por precisar de reflection.', FALSE, 'Erasure faz raw e genérico terem o MESMO bytecode — performance igual.', 2),
 ('a5000000-0000-0000-0000-000202010303', 'a4000000-0000-0000-0000-000002020103', 'Não compila em versões modernas do Java.', FALSE, 'Compila com warning — raw types seguem permitidos por compatibilidade.', 3),
 ('a5000000-0000-0000-0000-000202010304', 'a4000000-0000-0000-0000-000002020103', 'A lista aceita apenas Object, recusando Strings.', FALSE, 'Ela aceita qualquer coisa — esse é justamente o problema.', 4);

-- ─── Wildcards/PECS (020202): Q03 ────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002020203', 'a3000000-0000-0000-0000-000000020202', 'MULTIPLE_CHOICE',
  'Um método recebe `List<? extends Number> nums`. O que ele PODE fazer com a lista?', 'Producer extends: a lista produz valores para você.', 3, 5, 4);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000202020301', 'a4000000-0000-0000-0000-000002020203', 'Ler elementos como Number; não pode adicionar nada (exceto null).', TRUE,  'Correto: o tipo real pode ser List<Integer> ou List<Double> — o compilador impede add para não corromper.', 1),
 ('a5000000-0000-0000-0000-000202020302', 'a4000000-0000-0000-0000-000002020203', 'Adicionar qualquer Number, mas não ler.', FALSE, 'É o oposto — quem permite inserir é ? super.', 2),
 ('a5000000-0000-0000-0000-000202020303', 'a4000000-0000-0000-0000-000002020203', 'Ler e adicionar livremente, como numa List<Number>.', FALSE, 'List<? extends Number> NÃO é List<Number> — a escrita é bloqueada.', 3),
 ('a5000000-0000-0000-0000-000202020304', 'a4000000-0000-0000-0000-000002020203', 'Nada: wildcards tornam a lista somente-referência.', FALSE, 'Leitura como Number funciona normalmente.', 4);

-- ─── Lambdas (020301): Q03 ───────────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002030103', 'a3000000-0000-0000-0000-000000020301', 'MULTIPLE_CHOICE',
  'Uma lambda usa uma variável local do método. O que o compilador exige dessa variável?', 'final ou… quase isso.', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000203010301', 'a4000000-0000-0000-0000-000002030103', 'Que seja final ou effectively final (nunca reatribuída após a inicialização).', TRUE,  'Correto: a lambda captura o VALOR; permitir reatribuição criaria duas “versões” da variável.', 1),
 ('a5000000-0000-0000-0000-000203010302', 'a4000000-0000-0000-0000-000002030103', 'Que seja declarada volatile.', FALSE, 'volatile é para campos em concorrência, não para variáveis locais.', 2),
 ('a5000000-0000-0000-0000-000203010303', 'a4000000-0000-0000-0000-000002030103', 'Que seja static.', FALSE, 'Variáveis locais não podem ser static.', 3),
 ('a5000000-0000-0000-0000-000203010304', 'a4000000-0000-0000-0000-000002030103', 'Nada — lambdas acessam qualquer variável do escopo livremente.', FALSE, 'Campos sim; variáveis LOCAIS precisam ser effectively final.', 4);

-- ─── Streams (020302): Q03 ───────────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002030203', 'a3000000-0000-0000-0000-000000020302', 'MULTIPLE_CHOICE',
  'Após `stream.count()`, o código chama `stream.findFirst()` no MESMO stream. O que acontece?', 'Um stream é como um cano: os dados só passam uma vez.', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000203020301', 'a4000000-0000-0000-0000-000002030203', 'IllegalStateException — um stream não pode ser reutilizado após a operação terminal.', TRUE,  'Correto: cada pipeline consome o stream; para operar de novo, crie outro a partir da fonte.', 1),
 ('a5000000-0000-0000-0000-000203020302', 'a4000000-0000-0000-0000-000002030203', 'Funciona: o stream reinicia automaticamente do começo.', FALSE, 'Streams não “rebobinam” — são de uso único.', 2),
 ('a5000000-0000-0000-0000-000203020303', 'a4000000-0000-0000-0000-000002030203', 'findFirst() devolve Optional.empty() silenciosamente.', FALSE, 'A falha é ruidosa: exceção, não Optional vazio.', 3),
 ('a5000000-0000-0000-0000-000203020304', 'a4000000-0000-0000-0000-000002030203', 'Erro de compilação.', FALSE, 'O compilador não rastreia consumo de stream — o erro é em runtime.', 4);

-- ─── Optional (020401): Q03 ──────────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002040103', 'a3000000-0000-0000-0000-000000020401', 'MULTIPLE_CHOICE',
  'Por que `if (opt.isPresent()) { usar(opt.get()); }` é considerado um antipadrão, e qual a alternativa idiomática?', 'É um if-null disfarçado.', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000204010301', 'a4000000-0000-0000-0000-000002040103', 'Reproduz o if-null que o Optional quer eliminar; prefira ifPresent(), map()/orElse() ou orElseThrow().', TRUE,  'Correto: os métodos de composição expressam a intenção e evitam o get() “nu”, que estoura se alguém esquecer o if.', 1),
 ('a5000000-0000-0000-0000-000204010302', 'a4000000-0000-0000-0000-000002040103', 'É um erro de compilação nas versões novas do Java.', FALSE, 'Compila normalmente — a crítica é de estilo/robustez, não de sintaxe.', 2),
 ('a5000000-0000-0000-0000-000204010303', 'a4000000-0000-0000-0000-000002040103', 'isPresent() é lento; a alternativa é chamar get() direto.', FALSE, 'get() sem verificação é PIOR: NoSuchElementException se vazio.', 3),
 ('a5000000-0000-0000-0000-000204010304', 'a4000000-0000-0000-0000-000002040103', 'Optional não permite if — só expressões lambda.', FALSE, 'Permitir, permite; só não é o estilo idiomático.', 4);

-- ─── java.time (020402): Q03 ─────────────────────────────────────────
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000002040203', 'a3000000-0000-0000-0000-000000020402', 'MULTIPLE_CHOICE',
  'Qual a diferença entre `Duration` e `Period` na API java.time?', 'Um pensa em horas; o outro, em calendário.', 3, 5, 3);

INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000204020301', 'a4000000-0000-0000-0000-000002040203', 'Duration mede tempo em horas/minutos/segundos; Period mede em anos/meses/dias de calendário.', TRUE,  'Correto: Duration para intervalos exatos (timeout de 30s); Period para conceitos de calendário (assinatura de 1 mês).', 1),
 ('a5000000-0000-0000-0000-000204020302', 'a4000000-0000-0000-0000-000002040203', 'São sinônimos; Period é apenas o nome antigo.', FALSE, 'São classes distintas com semânticas diferentes.', 2),
 ('a5000000-0000-0000-0000-000204020303', 'a4000000-0000-0000-0000-000002040203', 'Duration funciona só com Instant; Period só com LocalDateTime.', FALSE, 'Duration casa com tempo (Instant, LocalTime...); Period com datas (LocalDate) — mas não é restrição a UMA classe.', 3),
 ('a5000000-0000-0000-0000-000204020304', 'a4000000-0000-0000-0000-000002040203', 'Period considera fuso horário; Duration não.', FALSE, 'Nenhum dos dois carrega fuso — quem lida com fuso é ZonedDateTime.', 4);
