/**
 * Biblioteca de conteúdo teórico (sem exercícios, só leitura).
 * Cada artigo é markdown puro, renderizado com a classe global `.md`.
 * Para adicionar um novo assunto, basta acrescentar um objeto aqui.
 */
export interface TheoryArticle {
  /** slug usado na URL e no track */
  id: string;
  title: string;
  /** chamada curta exibida no card/cabeçalho */
  summary: string;
  /** ícone do conjunto lw-icon */
  icon: string;
  /** etiquetas exibidas no cabeçalho */
  tags: string[];
  /** minutos estimados de leitura */
  readingMinutes: number;
  /** corpo em markdown */
  body: string;
}

const JPA_HIBERNATE: TheoryArticle = {
  id: 'jpa-hibernate-spring-data',
  title: 'Banco de dados, JPA, Hibernate e Spring Data',
  summary:
    'Como o Java conversa com o banco de dados: do JDBC cru à JPA, ao Hibernate por baixo e ao Spring Data por cima.',
  icon: 'database',
  tags: ['Persistência', 'Spring', 'Consultas', 'Fundamentos'],
  readingMinutes: 18,
  body: `
## O problema: dois mundos diferentes

Toda aplicação séria precisa **guardar dados em algum lugar** que sobreviva a
reinícios: usuários, pedidos, mensagens, saldos. Esse lugar quase sempre é um
**banco de dados relacional** (PostgreSQL, MySQL, Oracle, SQL Server…), onde a
informação vive em **tabelas** com linhas e colunas.

Só que o seu programa Java não pensa em tabelas — ele pensa em **objetos**. Você
tem uma classe \`Usuario\` com campos \`nome\` e \`email\`, e talvez uma lista de
\`Pedido\`. O banco tem uma tabela \`usuarios\` e outra \`pedidos\` ligadas por uma
chave estrangeira.

> Esse descompasso entre "mundo dos objetos" e "mundo das tabelas" tem nome:
> **impedância objeto-relacional** (*object-relational impedance mismatch*).
> Boa parte da tecnologia deste artigo existe só para resolver isso.

Vamos subir a escada, degrau por degrau, do mais baixo nível ao mais alto.

## Degrau 0 — O banco relacional e o SQL

O banco relacional organiza dados em tabelas e você fala com ele numa linguagem
própria, o **SQL** (*Structured Query Language*):

\`\`\`sql
CREATE TABLE usuarios (
  id    BIGINT PRIMARY KEY,
  nome  VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL
);

SELECT nome, email FROM usuarios WHERE id = 42;
\`\`\`

Pontos importantes que valem para tudo o que vem depois:

- **Chave primária** (\`PRIMARY KEY\`): identifica cada linha de forma única.
- **Chave estrangeira** (\`FOREIGN KEY\`): liga uma tabela a outra (um pedido
  aponta para o usuário dono dele).
- **Transação**: um conjunto de operações que acontece "tudo ou nada". Ou todas
  são confirmadas (\`COMMIT\`) ou todas são desfeitas (\`ROLLBACK\`). É o que
  garante que dinheiro não suma no meio de uma transferência.

O banco é um programa **separado** da sua aplicação. Para conversar com ele, o
Java precisa de uma ponte.

## Degrau 1 — JDBC: a ponte crua

O **JDBC** (*Java Database Connectivity*) é a API padrão do Java para falar com
qualquer banco relacional. Cada banco fornece um **driver** (um \`.jar\`) que
implementa essa API. Com JDBC você:

1. Abre uma conexão.
2. Escreve o SQL na mão, como texto.
3. Executa e lê o resultado linha por linha, coluna por coluna.

\`\`\`java
String sql = "SELECT nome, email FROM usuarios WHERE id = ?";
try (Connection con = dataSource.getConnection();
     PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setLong(1, 42);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            Usuario u = new Usuario();
            u.setNome(rs.getString("nome"));   // coluna -> campo, na mão
            u.setEmail(rs.getString("email"));
        }
    }
}
\`\`\`

Funciona, mas repare no trabalho: **você** converte cada coluna em cada campo,
**você** trata a conexão, **você** escreve todo SQL. Em uma aplicação grande, são
milhares de linhas repetitivas e frágeis. JDBC é a fundação — tudo por cima dele
existe para você não precisar escrever isso à mão.

## Degrau 2 — ORM: mapear objeto ↔ tabela

**ORM** (*Object-Relational Mapping*) é a ideia de deixar uma biblioteca fazer a
tradução automática entre suas **classes** e as **tabelas**. Você anota a classe
dizendo "esta classe é a tabela \`usuarios\`, este campo é a coluna \`email\`", e a
ferramenta gera o SQL e converte os resultados para você.

O ORM cuida de:

- Transformar um \`SELECT\` numa lista de objetos prontos.
- Gerar \`INSERT\`, \`UPDATE\` e \`DELETE\` a partir de mudanças nos objetos.
- Traduzir relacionamentos (um usuário tem vários pedidos) em *joins* e chaves
  estrangeiras.

ORM é um **conceito**, não uma biblioteca específica. Agora precisamos de um
padrão que diga *como* fazer esse mapeamento em Java.

## Degrau 3 — JPA: a especificação (o contrato)

**JPA** (*Jakarta Persistence API*, antiga *Java Persistence API*) é a
**especificação oficial** de ORM para Java. Repare na palavra: **especificação**.
JPA é um **conjunto de interfaces, anotações e regras** — um *contrato*. Ela
**não** contém a implementação que realmente conversa com o banco.

É JPA que define as anotações que você provavelmente já viu:

\`\`\`java
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    @OneToMany(mappedBy = "usuario")
    private List<Pedido> pedidos;

    // getters e setters
}
\`\`\`

E também define a peça central para trabalhar com essas entidades, o
**\`EntityManager\`**, e uma linguagem de consulta orientada a objetos, a
**JPQL** (parecida com SQL, mas você consulta *classes e campos*, não tabelas e
colunas):

\`\`\`java
// JPQL: "Usuario" é a CLASSE, não a tabela
List<Usuario> lista = entityManager
    .createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
    .setParameter("email", "ana@exemplo.com")
    .getResultList();
\`\`\`

Como JPA é só o contrato, você precisa de alguém que **implemente** esse contrato
de verdade. É aí que entra o Hibernate — mas antes vale parar na JPQL, porque é
com ela que você vai escrever a maioria das suas consultas.

## Foco: JPQL, a linguagem de consulta da JPA

**JPQL** (*Jakarta Persistence Query Language*) é a linguagem de consulta que a
própria JPA define. Ela **se parece muito com SQL**, mas com uma diferença
essencial que muda tudo:

> No SQL você consulta **tabelas e colunas** (o banco).
> Na JPQL você consulta **entidades e atributos** (seus objetos Java).

Ou seja, JPQL trabalha no "mundo dos objetos". Você não escreve o nome da tabela
\`usuarios\`, escreve o nome da **classe** \`Usuario\`. Não escreve a coluna
\`email\`, escreve o **campo** \`u.email\`. O Hibernate depois traduz isso para o SQL
específico do seu banco.

### SQL × JPQL lado a lado

A mesma pergunta — "quais usuários têm o email da Ana?" — nas duas linguagens:

\`\`\`sql
-- SQL: fala com a TABELA e as COLUNAS
SELECT * FROM usuarios WHERE email = 'ana@exemplo.com';
\`\`\`

\`\`\`java
// JPQL: fala com a CLASSE Usuario e o CAMPO email
SELECT u FROM Usuario u WHERE u.email = 'ana@exemplo.com'
\`\`\`

Repare no \`u\`: é um **alias** (apelido) para a entidade, igual ao SQL. E o
\`SELECT u\` devolve o **objeto \`Usuario\` inteiro**, não colunas soltas — por isso
o resultado já vem como uma \`List<Usuario>\` pronta para usar.

### Por que JPQL em vez de SQL puro?

- **Portável entre bancos.** A mesma JPQL vira o SQL correto para PostgreSQL,
  MySQL, Oracle… O Hibernate cuida das diferenças de dialeto.
- **Pensa em objetos.** Você navega pelos relacionamentos que já modelou nas
  entidades, em vez de escrever *joins* na mão o tempo todo.
- **Segura contra injeção.** Usando parâmetros nomeados (\`:email\`), os valores
  nunca são "colados" no texto da consulta.
- **Validada cedo.** Em consultas \`@Query\` de repositórios Spring Data, a JPQL é
  checada quando a aplicação sobe — um erro de digitação estoura no boot, não em
  produção.

### Parâmetros: nunca concatene texto

Sempre passe valores por **parâmetros**, não grudando na string:

\`\`\`java
// Parâmetro NOMEADO (:email) — o jeito recomendado
entityManager.createQuery(
        "SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
    .setParameter("email", entrada)   // valor tratado com segurança
    .getResultList();

// Também existe o parâmetro POSICIONAL (?1), menos legível
"SELECT u FROM Usuario u WHERE u.email = ?1"
\`\`\`

### Navegando por relacionamentos (o superpoder)

Como \`Usuario\` tem uma lista de \`Pedido\`, você "anda" pelo relacionamento com um
ponto, sem escrever o *join* manualmente:

\`\`\`java
// Usuários que têm pelo menos um pedido acima de 100 reais.
// u.pedidos é a lista mapeada na entidade; "p" percorre cada pedido.
SELECT DISTINCT u
FROM Usuario u JOIN u.pedidos p
WHERE p.valor > 100
\`\`\`

Aqui \`JOIN u.pedidos p\` não usa chave estrangeira nenhuma no texto — a JPA já
sabe como as tabelas se ligam, porque você declarou o \`@OneToMany\` na entidade.

### Trazendo dados relacionados junto: JOIN FETCH

Por padrão o Hibernate carrega relacionamentos de forma **preguiçosa** (*lazy*):
a lista de pedidos só vai ao banco quando você a acessa. Se você percorre 50
usuários e lê os pedidos de cada um, isso vira **51 consultas** (o famoso
*problema N+1*). O \`JOIN FETCH\` resolve trazendo tudo de uma vez:

\`\`\`java
SELECT DISTINCT u
FROM Usuario u JOIN FETCH u.pedidos
WHERE u.ativo = true
\`\`\`

### Selecionando só alguns campos (projeção)

Nem sempre você quer a entidade inteira. Dá para escolher campos específicos, que
voltam como um \`Object[]\`, ou montar um objeto próprio com \`new\` (*constructor
expression*):

\`\`\`java
// Colunas soltas -> cada linha vira um Object[] { nome, email }
SELECT u.nome, u.email FROM Usuario u

// Melhor: monta direto um DTO
SELECT new com.exemplo.dto.ResumoUsuario(u.nome, u.email) FROM Usuario u
\`\`\`

### JPQL dentro do Spring Data

Nos repositórios, você usa JPQL na anotação \`@Query\` quando quer controle total,
enquanto os métodos por convenção de nome geram JPQL nos bastidores:

\`\`\`java
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // A Spring gera a JPQL a partir do nome
    Optional<Usuario> findByEmail(String email);

    // Você escreve a JPQL na mão quando precisa
    @Query("SELECT u FROM Usuario u WHERE SIZE(u.pedidos) > :minimo")
    List<Usuario> comMaisPedidosQue(@Param("minimo") int minimo);
}
\`\`\`

> **JPQL não é SQL, e não é a única opção.** Para SQL de verdade (recursos
> específicos do banco, performance extrema) existe a **consulta nativa**
> (\`@Query(value = "...", nativeQuery = true)\`). E para montar consultas
> dinamicamente em código Java, existe a **Criteria API**. Mas, no dia a dia, a
> JPQL cobre a grande maioria dos casos com o melhor equilíbrio entre poder e
> legibilidade.

## Degrau 4 — Hibernate: a implementação (o motor)

**Hibernate** é a **implementação** de JPA mais usada do mundo (existem outras,
como EclipseLink). Ele é o **provedor de persistência** que roda por baixo: pega
suas entidades anotadas com JPA, gera o SQL de verdade, usa o JDBC para executar
e devolve seus objetos prontos.

A relação é exatamente essa:

| Camada | O que é | Papel |
|---|---|---|
| **JPA** | Especificação (interfaces + anotações) | Define *o que* fazer |
| **Hibernate** | Implementação concreta | Define *como* fazer, gera o SQL |
| **JDBC** | Ponte de baixo nível | Executa o SQL no banco |

Uma analogia: **JPA é a tomada padrão** (o formato do plugue); **Hibernate é o
aparelho** que você pluga nela. Como você programa contra o padrão JPA, poderia
em tese trocar o Hibernate por outra implementação sem reescrever suas entidades.

O Hibernate também traz recursos poderosos além do básico: **cache**,
**lazy loading** (carregar dados relacionados só quando você realmente usa),
detecção automática de mudanças (*dirty checking*) e uma peça central que vale
entender — o **contexto de persistência**.

### O contexto de persistência (a "memória de curto prazo")

Enquanto uma transação está aberta, o Hibernate mantém um **contexto de
persistência**: uma espécie de caderno com todas as entidades que ele está
gerenciando naquele momento. Se você carrega um \`Usuario\`, muda o \`email\` e não
chama nenhum \`save\` explícito, na hora do \`COMMIT\` o Hibernate **percebe a
mudança sozinho** e dispara o \`UPDATE\`. Isso é o *dirty checking*, e é uma das
grandes conveniências (e pegadinhas) do ORM.

## Degrau 5 — Spring Data JPA: menos código ainda

Mesmo com JPA + Hibernate, ainda sobra código repetitivo: abrir/fechar
\`EntityManager\`, escrever consultas comuns ("buscar por id", "buscar por email"),
controlar transações. O **Spring Data JPA** é a camada da Spring que **elimina
esse boilerplate**.

A ideia é quase mágica: você declara uma **interface** de repositório, e a Spring
**gera a implementação em tempo de execução**:

\`\`\`java
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // A Spring LÊ o nome do método e gera a consulta automaticamente:
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByNomeContainingIgnoreCase(String trecho);

    // Consulta explícita quando você quiser controle:
    @Query("SELECT u FROM Usuario u WHERE u.pedidos IS EMPTY")
    List<Usuario> buscarSemPedidos();
}
\`\`\`

Só de herdar \`JpaRepository\`, você já ganha de graça \`save\`, \`findById\`,
\`findAll\`, \`delete\`, paginação, ordenação e mais. Os métodos como
\`findByEmail\` funcionam pela **convenção de nomes**: a Spring interpreta o nome
do método e monta a JPQL correspondente.

Importante: **o Spring Data não substitui o Hibernate** — ele fica *por cima*
dele. Quando você chama \`findByEmail\`, o Spring Data traduz isso para uma
operação JPA, que o Hibernate transforma em SQL, que o JDBC executa no banco.

## A pilha inteira, de cima a baixo

Juntando tudo, a chamada de um \`usuarioRepository.findByEmail(...)\` atravessa
esta pilha:

\`\`\`text
  Seu código  ─────────────►  usuarioRepository.findByEmail("ana@...")
      │
      ▼
  Spring Data JPA  ──────────  gera a implementação do repositório
      │
      ▼
  JPA (contrato)   ──────────  EntityManager, @Entity, JPQL
      │
      ▼
  Hibernate (motor) ─────────  transforma em SQL, faz cache, lazy loading
      │
      ▼
  JDBC  ─────────────────────  executa o SQL via driver
      │
      ▼
  Banco de dados  ───────────  PostgreSQL, MySQL, Oracle...
\`\`\`

Cada camada **esconde a complexidade** da de baixo. Você escreve uma linha; cinco
camadas colaboram para que ela vire uma consulta SQL e volte como objeto Java.

## Resumo em uma frase cada

- **Banco de dados relacional** — guarda os dados em tabelas; fala **SQL**.
- **JDBC** — a API Java crua para executar SQL; a fundação de tudo.
- **ORM** — a ideia de mapear objetos ↔ tabelas automaticamente.
- **JPA** — a **especificação** oficial de ORM em Java (anotações + interfaces).
- **Hibernate** — a **implementação** de JPA que gera o SQL de fato.
- **Spring Data JPA** — camada da Spring que gera repositórios e mata o
  boilerplate, apoiada no Hibernate.

## Como isso aparece no dia a dia

Num projeto Spring Boot típico (como o próprio LearnWay), você quase nunca toca
em JDBC ou no \`EntityManager\` diretamente. Você:

1. Cria classes \`@Entity\` (JPA) que descrevem suas tabelas.
2. Cria interfaces \`Repository\` (Spring Data) para acessá-las.
3. Deixa o **Hibernate** e o **driver JDBC** cuidarem do resto nos bastidores.

E só desce para camadas mais baixas quando precisa de algo específico: uma
consulta nativa em SQL para performance, um ajuste fino de *lazy loading*, ou
depurar exatamente qual SQL o Hibernate está gerando.

> **Dica de estudo:** ative o log do SQL do Hibernate
> (\`spring.jpa.show-sql=true\`) e observe, para cada método de repositório que
> você chama, qual SQL aparece no console. É a melhor forma de enxergar todas
> essas camadas trabalhando juntas de verdade.
`.trim(),
};

const SPRING_DATA_PRATICA: TheoryArticle = {
  id: 'spring-data-na-pratica',
  title: 'Spring Data na prática: entidades, repositories e relações',
  summary:
    'Mão na massa: as anotações do dia a dia, como modelar entidades e relacionamentos, criar repositories e não cair nas armadilhas do lazy loading.',
  icon: 'code',
  tags: ['Spring Data', 'JPA', 'Prática', 'Anotações'],
  readingMinutes: 22,
  body: `
Se o assunto anterior explicou **o que é cada camada**, este aqui é o manual de
uso: as anotações que você vai digitar todo dia, como uma entidade fica de pé,
como ligar uma classe na outra e onde estão as armadilhas clássicas.

## A anatomia de uma entidade

Uma **entidade** é uma classe Java que representa uma tabela. O mínimo que ela
precisa: \`@Entity\` e um \`@Id\`.

\`\`\`java
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity                          // "esta classe é uma tabela"
@Table(name = "usuarios")        // nome da tabela (opcional: default = nome da classe)
public class Usuario {

    @Id                                                  // chave primária
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // quem gera o valor
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(unique = true, nullable = false, length = 160)
    private String email;

    @Column(name = "criado_em", updatable = false)       // nome diferente no banco
    private OffsetDateTime criadoEm;

    @Enumerated(EnumType.STRING)                         // salva "ATIVO", não 0
    private StatusUsuario status;

    @Transient                                           // NÃO vira coluna
    private String tokenTemporario;

    protected Usuario() { }   // construtor sem args: a JPA EXIGE (pode ser protected)

    // getters, setters, equals/hashCode
}
\`\`\`

Regras que valem a pena memorizar:

- A JPA **exige um construtor sem argumentos** (ela instancia a classe por
  reflexão). Pode ser \`protected\` para não ser usado por engano no seu código.
- Sem \`@Column\`, o campo vira coluna com o mesmo nome (em Spring Boot,
  \`criadoEm\` → \`criado_em\` pela estratégia de nomes padrão).
- \`@Transient\` marca campos que existem só em memória e **não** são persistidos.

## Chave primária e geração de ID

O \`@Id\` marca a chave primária. O \`@GeneratedValue\` diz **quem gera o valor** —
e essa escolha tem consequências reais:

| Estratégia | Como funciona | Quando usar |
|---|---|---|
| \`IDENTITY\` | O **banco** gera (coluna auto-increment / \`serial\`) | Simples e comum em MySQL. Desvantagem: força um \`INSERT\` imediato, atrapalhando o *batch* |
| \`SEQUENCE\` | Usa uma **sequence** do banco; o Hibernate pega blocos de ids | **Preferida** em PostgreSQL/Oracle. Permite otimizações de lote |
| \`AUTO\` | O provedor escolhe por você | Padrão; costuma virar \`SEQUENCE\` |
| \`UUID\` | Gera um UUID (na aplicação, sem ida ao banco) | Ids não sequenciais/expostos publicamente, sistemas distribuídos |

\`\`\`java
// Sequence dedicada, com allocationSize para pegar ids em blocos (mais rápido)
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usuario_seq")
@SequenceGenerator(name = "usuario_seq", sequenceName = "usuario_seq", allocationSize = 50)
private Long id;

// UUID gerado pela aplicação (é o que o LearnWay usa)
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;
\`\`\`

> **Cuidado com o \`equals\`/\`hashCode\`.** Se você basear no \`id\`, lembre que ele é
> \`null\` antes de salvar — uma entidade nova colocada num \`HashSet\` pode "sumir"
> depois que o id é atribuído. Prática segura: comparar por um campo de negócio
> único (o email), ou tratar o \`null\` explicitamente.

## Relacionamentos entre classes

Aqui é onde o ORM brilha — e onde mais se erra. Existem quatro cardinalidades.

### @ManyToOne — o lado "dono", onde fica a chave estrangeira

Muitos pedidos pertencem a um usuário. **A coluna FK fica na tabela de pedidos**,
então o \`@ManyToOne\` mora em \`Pedido\`:

\`\`\`java
@Entity
public class Pedido {

    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)              // SEMPRE declare LAZY (ver abaixo)
    @JoinColumn(name = "usuario_id", nullable = false)  // a coluna FK nesta tabela
    private Usuario usuario;

    private BigDecimal valor;
}
\`\`\`

### @OneToMany — o lado inverso (espelho)

O outro lado é apenas um **espelho** do relacionamento. Por isso ele usa
\`mappedBy\`, que significa: "quem manda nessa relação é o campo \`usuario\` lá em
\`Pedido\`; eu não crio coluna nenhuma".

\`\`\`java
@Entity
public class Usuario {

    @OneToMany(
        mappedBy = "usuario",            // nome do CAMPO na outra classe
        cascade = CascadeType.ALL,       // salvar/apagar o usuário propaga aos pedidos
        orphanRemoval = true             // pedido removido da lista é APAGADO do banco
    )
    private List<Pedido> pedidos = new ArrayList<>();  // inicialize a lista!
}
\`\`\`

> **Erro clássico:** esquecer o \`mappedBy\`. Sem ele, o Hibernate acha que são
> *dois* relacionamentos diferentes e cria uma **tabela de junção** inesperada.

Como os dois lados vivem em memória, mantenha-os **em sincronia** com um método
auxiliar — senão você salva um pedido cuja lista do usuário está desatualizada:

\`\`\`java
public void adicionarPedido(Pedido pedido) {
    pedidos.add(pedido);
    pedido.setUsuario(this);   // os DOIS lados
}
\`\`\`

### @OneToOne

Um usuário tem um perfil. A FK fica onde você colocar o \`@JoinColumn\`:

\`\`\`java
@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
@JoinColumn(name = "perfil_id")
private Perfil perfil;
\`\`\`

### @ManyToMany

Muitos alunos para muitos cursos: exige uma **tabela de junção**.

\`\`\`java
@ManyToMany
@JoinTable(
    name = "aluno_curso",                              // a tabela do meio
    joinColumns = @JoinColumn(name = "aluno_id"),      // FK para ESTA entidade
    inverseJoinColumns = @JoinColumn(name = "curso_id")// FK para a OUTRA
)
private Set<Curso> cursos = new HashSet<>();
\`\`\`

Na prática, quando a relação precisa de dados próprios (nota, data de matrícula),
o \`@ManyToMany\` não serve: você cria uma **entidade intermediária** (\`Matricula\`)
com dois \`@ManyToOne\`. É o caminho mais comum em sistemas reais.

## Lazy loading: a armadilha mais famosa

Cada relacionamento tem uma estratégia de **fetch**:

- **LAZY** (preguiçoso) — os dados relacionados **só** vão ao banco quando você
  os acessa de fato. O Hibernate coloca um *proxy* no lugar.
- **EAGER** (ansioso) — carrega tudo junto, sempre, mesmo que você nunca use.

Os padrões da JPA são traiçoeiros:

| Anotação | Padrão | O que fazer |
|---|---|---|
| \`@ManyToOne\` | **EAGER** | Mude para \`LAZY\` |
| \`@OneToOne\` | **EAGER** | Mude para \`LAZY\` |
| \`@OneToMany\` | LAZY | Mantenha |
| \`@ManyToMany\` | LAZY | Mantenha |

> **Regra de ouro:** declare **tudo como \`LAZY\`** e traga o que precisar,
> quando precisar, com \`JOIN FETCH\`. \`EAGER\` espalhado faz uma consulta simples
> arrastar meio banco junto.

### Os dois erros que todo mundo comete

**1. \`LazyInitializationException\`** — você tenta acessar a lista *depois* que a
transação fechou. O proxy não tem mais como ir ao banco:

\`\`\`java
Usuario u = repo.findById(1L).orElseThrow();  // transação abre e FECHA aqui
u.getPedidos().size();                         // 💥 LazyInitializationException
\`\`\`

A solução **não** é trocar para \`EAGER\` (isso só troca um problema por outro). É
buscar já com os dados que você vai usar:

\`\`\`java
@Query("SELECT u FROM Usuario u JOIN FETCH u.pedidos WHERE u.id = :id")
Optional<Usuario> buscarComPedidos(@Param("id") Long id);
\`\`\`

**2. Problema N+1** — você lista 50 usuários e lê os pedidos de cada um: 1
consulta para os usuários + 50 para os pedidos = **51 idas ao banco**. Mesma
cura: \`JOIN FETCH\` ou \`@EntityGraph\`.

\`\`\`java
@EntityGraph(attributePaths = "pedidos")   // "traga os pedidos junto"
List<Usuario> findByStatus(StatusUsuario status);
\`\`\`

## Repositories na prática

Você **declara uma interface** e a Spring gera a implementação. Não existe classe
\`UsuarioRepositoryImpl\` escrita por você.

\`\`\`java
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // <Usuario, Long> = <tipo da entidade, tipo do @Id>
}
\`\`\`

Só com isso você já ganha: \`save\`, \`saveAll\`, \`findById\`, \`findAll\`, \`count\`,
\`existsById\`, \`delete\`, \`deleteById\`, paginação e ordenação.

### Query methods: consultas pelo nome do método

A Spring **lê o nome** do método e escreve a JPQL por você. É só seguir a
convenção:

\`\`\`java
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByStatus(StatusUsuario status);

    // AND / OR
    List<Usuario> findByStatusAndNomeContainingIgnoreCase(StatusUsuario s, String nome);

    // comparações e datas
    List<Usuario> findByCriadoEmAfter(OffsetDateTime data);

    // ordenação e limite embutidos no nome
    List<Usuario> findTop10ByOrderByCriadoEmDesc();

    // navegando pelo relacionamento: usuários pelo valor do pedido
    List<Usuario> findByPedidosValorGreaterThan(BigDecimal valor);

    boolean existsByEmail(String email);
    long countByStatus(StatusUsuario status);
    void deleteByEmail(String email);
}
\`\`\`

Palavras-chave mais úteis: \`Containing\`, \`StartingWith\`, \`EndingWith\`,
\`IgnoreCase\`, \`Between\`, \`LessThan\`, \`GreaterThan\`, \`In\`, \`IsNull\`,
\`IsNotNull\`, \`True\`/\`False\`, \`OrderBy…Asc/Desc\`, \`Top\`/\`First\`.

> Se o nome do método começar a parecer um trava-língua
> (\`findByStatusAndNomeContainingAndCriadoEmBetweenOrderBy…\`), esse é o sinal de
> que chegou a hora de usar \`@Query\`.

### @Query: quando você quer controle

\`\`\`java
// JPQL (fala de CLASSES e CAMPOS)
@Query("SELECT u FROM Usuario u WHERE SIZE(u.pedidos) > :minimo")
List<Usuario> comMaisPedidosQue(@Param("minimo") int minimo);

// Projeção direta num DTO
@Query("SELECT new com.exemplo.dto.ResumoUsuario(u.nome, u.email) FROM Usuario u")
List<ResumoUsuario> resumos();

// SQL nativo, quando precisa de recurso específico do banco
@Query(value = "SELECT * FROM usuarios WHERE email ILIKE %:t%", nativeQuery = true)
List<Usuario> buscaNativa(@Param("t") String trecho);

// Alterações precisam de @Modifying + @Transactional
@Modifying
@Transactional
@Query("UPDATE Usuario u SET u.status = :status WHERE u.id = :id")
int atualizarStatus(@Param("id") Long id, @Param("status") StatusUsuario status);
\`\`\`

### Paginação

\`\`\`java
Page<Usuario> findByStatus(StatusUsuario status, Pageable pageable);

// no service:
var pagina = repo.findByStatus(
        StatusUsuario.ATIVO,
        PageRequest.of(0, 20, Sort.by("nome").ascending()));

pagina.getContent();        // a lista da página
pagina.getTotalElements();  // total no banco
pagina.getTotalPages();
\`\`\`

## Transações e o "save que você não precisa chamar"

O \`@Transactional\` (do Spring) delimita a transação. Ponha-o no **service**, não
no controller nem no repository:

\`\`\`java
@Service
public class UsuarioService {

    private final UsuarioRepository repo;

    public UsuarioService(UsuarioRepository repo) {   // injeção por construtor
        this.repo = repo;
    }

    @Transactional(readOnly = true)   // otimiza: sem dirty checking, sem flush
    public Usuario buscar(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("não achei"));
    }

    @Transactional
    public void renomear(Long id, String novoNome) {
        Usuario u = repo.findById(id).orElseThrow();
        u.setNome(novoNome);
        // repo.save(u) é DESNECESSÁRIO: a entidade está "gerenciada" e o Hibernate
        // detecta a mudança sozinho (dirty checking) e emite o UPDATE no commit.
    }
}
\`\`\`

Essa é uma das ideias mais estranhas para quem vem do JDBC: **dentro de uma
transação, mudar o objeto já é mudar o banco**. O \`save()\` só é realmente
necessário para entidades **novas**.

## Colinha das anotações

| Anotação | Para que serve |
|---|---|
| \`@Entity\` | Marca a classe como tabela |
| \`@Table(name=…)\` | Define o nome da tabela |
| \`@Id\` | Chave primária |
| \`@GeneratedValue\` | Como o id é gerado (\`IDENTITY\`, \`SEQUENCE\`, \`UUID\`) |
| \`@Column\` | Nome, \`nullable\`, \`unique\`, \`length\` da coluna |
| \`@Enumerated(EnumType.STRING)\` | Salva o enum como texto (**sempre use STRING**) |
| \`@Transient\` | Campo que **não** vai para o banco |
| \`@ManyToOne\` + \`@JoinColumn\` | Lado dono; onde fica a FK |
| \`@OneToMany(mappedBy=…)\` | Lado inverso (espelho) |
| \`@OneToOne\` | Relação um-para-um |
| \`@ManyToMany\` + \`@JoinTable\` | Relação com tabela de junção |
| \`@Repository\` | Estereótipo Spring (opcional em interfaces \`JpaRepository\`) |
| \`@Query\` / \`@Modifying\` | Consulta explícita / consulta que altera dados |
| \`@EntityGraph\` | Carrega relacionamentos junto (mata o N+1) |
| \`@Transactional\` | Delimita a transação (use no service) |

## Checklist de sobrevivência

1. Todo relacionamento nasce **\`LAZY\`** — corrija o padrão EAGER do \`@ManyToOne\`
   e do \`@OneToOne\`.
2. Precisa dos dados relacionados? **\`JOIN FETCH\`** ou **\`@EntityGraph\`**, nunca
   \`EAGER\`.
3. \`@Enumerated\` **sempre** com \`EnumType.STRING\` (o padrão \`ORDINAL\` grava
   números — reordenar o enum corrompe os dados antigos).
4. Inicialize as coleções (\`= new ArrayList<>()\`) e sincronize os dois lados.
5. \`@Transactional\` no **service**; \`readOnly = true\` nas leituras.
6. Ligue \`spring.jpa.show-sql=true\` e **olhe o SQL gerado**. É assim que você
   descobre um N+1 antes que a produção descubra por você.
`.trim(),
};

const REST_APIS: TheoryArticle = {
  id: 'apis-rest-na-pratica',
  title: 'APIs REST na prática: HTTP, verbos, status e contratos',
  summary:
    'O que faz uma API ser "REST de verdade": a anatomia do HTTP, a semântica de cada verbo e status, e como desenhar contratos que não envergonham em produção.',
  icon: 'network',
  tags: ['API', 'HTTP', 'REST', 'Design'],
  readingMinutes: 16,
  body: `
## Antes de REST: o HTTP nu e cru

Toda chamada de API é uma **requisição HTTP** viajando até o servidor e uma
**resposta** voltando. Vale enxergar o formato real, porque tudo o que vem
depois é convenção em cima disso:

\`\`\`text
POST /api/pedidos HTTP/1.1          ← método + caminho + versão
Host: loja.exemplo.com
Authorization: Bearer eyJhbGc...    ← cabeçalhos (metadados)
Content-Type: application/json

{"produtoId": 42, "quantidade": 2}  ← corpo (opcional)
\`\`\`

\`\`\`text
HTTP/1.1 201 Created                ← status: o resumo do que aconteceu
Location: /api/pedidos/981
Content-Type: application/json

{"id": 981, "status": "PENDENTE"}
\`\`\`

Três peças carregam todo o significado: o **método** (a intenção), o
**caminho** (o recurso) e o **status** (o desfecho). REST é, em essência, usar
essas três peças com disciplina.

## A ideia central: recursos, não ações

REST modela a API como um conjunto de **recursos** (substantivos) manipulados
pelos verbos do HTTP — em vez de um catálogo de ações (verbos) estilo RPC:

\`\`\`text
❌ estilo RPC                        ✅ estilo REST
POST /criarPedido                    POST   /pedidos
POST /buscarPedido                   GET    /pedidos/981
POST /cancelarPedido                 DELETE /pedidos/981
POST /listarPedidosDoUsuario         GET    /usuarios/7/pedidos
\`\`\`

Regras práticas de nomenclatura:

- **Substantivos no plural**: \`/pedidos\`, \`/usuarios\`, \`/produtos\`.
- **Hierarquia expressa no caminho**: \`/usuarios/7/pedidos\` = pedidos do usuário 7.
- **Nada de verbo na URL** — o verbo é o método HTTP.
- Ações que não mapeiam bem em CRUD (ex.: "pagar") viram **sub-recursos**:
  \`POST /pedidos/981/pagamento\`.

## Os verbos e suas promessas

Cada método HTTP carrega duas promessas formais que os clientes (e caches,
proxies, retry policies) levam a sério:

| Método | Uso | Seguro?¹ | Idempotente?² |
|---|---|---|---|
| \`GET\` | ler um recurso | ✅ | ✅ |
| \`POST\` | criar / disparar ação | ❌ | ❌ |
| \`PUT\` | substituir o recurso **inteiro** | ❌ | ✅ |
| \`PATCH\` | atualizar **parte** do recurso | ❌ | ❌³ |
| \`DELETE\` | remover | ❌ | ✅ |

¹ *Seguro* = não altera estado. ² *Idempotente* = repetir N vezes tem o mesmo
efeito que 1 vez. ³ PATCH pode ser idempotente, mas o contrato não garante.

A idempotência não é teoria: quando a rede falha depois do envio, o cliente
**reenvia**. Um \`PUT\` reenviado é inofensivo; um \`POST\` reenviado pode criar
o pedido duas vezes — por isso APIs de pagamento usam **chaves de idempotência**
(\`Idempotency-Key\` no header) para deduplicar POSTs.

## Status codes: o vocabulário do desfecho

A família do código já conta a história: **2xx** deu certo, **3xx** vá para
outro lugar, **4xx** o erro é do cliente, **5xx** o erro é do servidor.

### Os que você vai usar toda semana

| Status | Quando |
|---|---|
| \`200 OK\` | leitura/atualização bem-sucedida com corpo |
| \`201 Created\` | recurso criado (idealmente com \`Location\`) |
| \`204 No Content\` | sucesso sem corpo — típico de DELETE |
| \`400 Bad Request\` | corpo malformado, validação de formato falhou |
| \`401 Unauthorized\` | **não autenticado** (sem credencial válida) |
| \`403 Forbidden\` | autenticado, mas **sem permissão** |
| \`404 Not Found\` | recurso não existe (ou você esconde que existe) |
| \`409 Conflict\` | conflito de estado — email já cadastrado, versão desatualizada |
| \`422 Unprocessable Entity\` | sintaxe ok, mas a regra de negócio recusou |
| \`429 Too Many Requests\` | rate limit — devolva \`Retry-After\` |
| \`500 Internal Server Error\` | bug seu; nunca é resposta "planejada" |
| \`503 Service Unavailable\` | dependência fora do ar, manutenção |

Dois erros de iniciante que destroem a confiança no contrato:

1. **Devolver 200 com \`{"erro": "..."}\` no corpo.** Monitoramento, caches e
   clientes tratam 200 como sucesso. O status É o contrato.
2. **Devolver 500 para erro de validação.** 5xx aciona alertas e retries de
   quem chama; erro do cliente é 4xx.

## O corpo do erro também é contrato

Padronize o formato de erro **uma vez** e use em toda a API. Existe até um
padrão IETF para isso (RFC 9457, *Problem Details*):

\`\`\`json
{
  "type": "https://api.exemplo.com/erros/saldo-insuficiente",
  "title": "Saldo insuficiente",
  "status": 422,
  "detail": "Saque de R$ 500,00 excede o saldo de R$ 120,00.",
  "instance": "/contas/42/saques"
}
\`\`\`

O mínimo aceitável: um **código estável** que o front possa tratar
programaticamente (\`"SALDO_INSUFICIENTE"\`) e uma **mensagem humana**. Mensagem
sozinha não dá: ninguém quer fazer \`if\` em texto de erro.

## Paginação, filtro e ordenação

Toda coleção que cresce precisa dos três, e a query string é a casa deles:

\`\`\`text
GET /produtos?categoria=cafe&precoMax=50&sort=preco,asc&page=0&size=20
\`\`\`

A resposta paginada carrega os metadados junto (o formato do Spring
\`Page<T>\` é um bom padrão):

\`\`\`json
{
  "content": [ ... ],
  "totalElements": 137,
  "totalPages": 7,
  "number": 0,
  "size": 20
}
\`\`\`

Para tabelas gigantes ou feeds infinitos, considere **paginação por cursor**
(\`?after=id981&limit=20\`): estável sob inserções concorrentes, enquanto
\`page/size\` pode pular ou repetir itens quando a lista muda entre páginas.

## Versionamento: planeje antes de precisar

Contratos publicados são promessas. Quando uma mudança **quebra** clientes
(remover campo, mudar tipo, mudar semântica), você precisa de uma versão nova:

- **No caminho** — \`/api/v1/pedidos\` → \`/api/v2/pedidos\`. Explícito, cacheável,
  o mais comum.
- **No header** — \`Accept: application/vnd.exemplo.v2+json\`. URLs limpas,
  porém menos óbvio para depurar.

E o mais importante: **mudanças aditivas não quebram** — adicionar um campo
novo na resposta é seguro *se os clientes forem tolerantes a campos
desconhecidos* (e devem ser). Guarde a v2 para quando for inevitável.

## Cabeçalhos que resolvem problemas reais

- \`Content-Type\` / \`Accept\` — o formato do corpo que vai / que se aceita.
- \`Authorization: Bearer <token>\` — autenticação (veja o artigo de JWT).
- \`Cache-Control\` — \`max-age=60\` economiza banco em GETs quentes.
- \`ETag\` + \`If-None-Match\` — cache validado: o servidor responde \`304 Not
  Modified\` sem corpo se nada mudou.
- \`If-Match\` — trava otimista via HTTP: "só aplique se a versão ainda for
  esta", senão \`412 Precondition Failed\`.

## Checklist de design

1. Substantivos no plural, hierarquia no caminho, verbos só no método.
2. Status honesto: 2xx sucesso, 4xx culpa do cliente, 5xx culpa sua.
3. \`201 + Location\` ao criar; \`204\` ao deletar.
4. Formato de erro único, com código estável + mensagem humana.
5. Coleções sempre com paginação, filtro e ordenação na query string.
6. Idempotência: PUT/DELETE por natureza; POST crítico com Idempotency-Key.
7. Aditivo não quebra; breaking change = versão nova.

> **Dica de estudo:** abra o DevTools do navegador na aba Network usando o
> próprio LearnWay e observe métodos, status e cabeçalhos de cada chamada —
> a API que você consome é o melhor laboratório do contrato REST.
`.trim(),
};

const SEGURANCA_JWT: TheoryArticle = {
  id: 'seguranca-jwt',
  title: 'Autenticação: de sessões a JWT e Spring Security',
  summary:
    'Como uma API sabe quem é você: sessões com cookie, tokens JWT, refresh tokens, hash de senha e onde o Spring Security entra nessa história.',
  icon: 'shield',
  tags: ['Segurança', 'JWT', 'Spring Security', 'Autenticação'],
  readingMinutes: 18,
  body: `
## As duas perguntas de qualquer sistema seguro

- **Autenticação** — *quem é você?* Provar identidade (senha, token, biometria).
- **Autorização** — *o que você pode fazer?* Permissões de quem já se identificou.

Elas mapeiam direto para dois status HTTP: falhou a primeira → **401
Unauthorized**; falhou a segunda → **403 Forbidden**. Confundi-los é o erro
de nomenclatura mais comum em APIs.

## Era 1 — Sessão no servidor (o mundo dos cookies)

O modelo clássico da web: no login, o servidor cria um registro em memória
("sessão 8f3a = usuário Ana") e devolve o identificador num **cookie**. O
navegador reenvia o cookie sozinho em cada requisição.

\`\`\`text
POST /login  →  Set-Cookie: JSESSIONID=8f3a...; HttpOnly; Secure
GET  /perfil →  Cookie: JSESSIONID=8f3a...   (automático)
\`\`\`

**Forças:** revogação instantânea (basta apagar a sessão) e simplicidade.

**Fraquezas para APIs modernas:**
- O estado vive **no servidor** — com 3 instâncias atrás de um load balancer,
  ou todas compartilham um Redis de sessões, ou o balanceador precisa de
  *sticky sessions*.
- Cookies são enviados automaticamente pelo navegador — nasce daí o **CSRF**
  (outro site induz seu navegador a disparar uma requisição autenticada sem
  você saber), que exige tokens anti-CSRF.
- Apps mobile e serviços consumindo a API não têm navegador nem cookie jar.

## Era 2 — Token no cliente: JWT

O **JWT** (JSON Web Token) inverte a responsabilidade: o servidor **assina**
um documento com os dados do usuário e o entrega ao cliente. O servidor não
guarda nada; a cada requisição, o cliente apresenta o documento e o servidor
apenas **verifica a assinatura**.

\`\`\`text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoxNzM1Njg5NjAwfQ.4kZq...
                      └── header ──────┘ └── payload ─────────────────────┘ └ assinatura ┘
\`\`\`

Três partes em Base64, separadas por ponto:

1. **Header** — algoritmo de assinatura (\`HS256\`, \`RS256\`...).
2. **Payload** — as **claims**: \`sub\` (id do usuário), \`exp\` (expiração),
   roles e o que mais você incluir.
3. **Assinatura** — HMAC/RSA sobre as duas partes anteriores com o segredo
   do servidor.

> ⚠️ **Base64 não é criptografia.** Qualquer pessoa com o token lê o payload
> inteiro (cole um em jwt.io). A assinatura impede **alterar** — um byte
> mudado e a verificação falha — mas não impede **ler**. Nunca coloque senha,
> documentos ou dados sensíveis nas claims.

### O trade-off fundamental: revogação

A força do JWT (servidor sem estado) é também sua fraqueza: **não dá para
revogar um token emitido**. Banir o usuário, trocar a senha, rebaixar a role —
o token antigo continua válido até o \`exp\`. As consequências práticas:

- **Access token curto** (5–15 minutos): limita a janela de dano de um
  vazamento e "reavalia" permissões a cada renovação.
- **Refresh token longo** (dias/semanas): guardado com mais cuidado, usado
  apenas no endpoint de renovação — e como o servidor **pode** manter estado
  sobre refresh tokens, ele é revogável e rotacionável.

\`\`\`text
login    → access (15 min) + refresh (14 dias)
API call → Bearer <access>
expirou? → POST /auth/refresh { refresh } → novo par (sem pedir senha)
logout   → servidor invalida o refresh; o access morre sozinho em minutos
\`\`\`

É exatamente o desenho do LearnWay: o interceptor Angular detecta o 401,
chama o refresh e repete a requisição original de forma transparente.

## Senhas: o que "guardar direito" significa

Senha **nunca** é armazenada — nem criptografada (criptografia é reversível).
Armazena-se um **hash**: função de mão única onde comparar é possível, mas
recuperar o original não.

E não é qualquer hash. MD5 e SHA-256 são **rápidos demais** — uma GPU testa
bilhões por segundo. Os corretos são deliberadamente lentos e com **salt**
(tempero aleatório por usuário, que anula tabelas pré-computadas):

\`\`\`java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();   // salt embutido, custo ajustável
}

// no cadastro:
user.setPasswordHash(encoder.encode(senhaEmTextoPuro));
// no login:
if (!encoder.matches(senhaDigitada, user.getPasswordHash())) { ... 401 ... }
\`\`\`

**BCrypt** (ou Argon2/scrypt) + salt + custo configurável. O hash resultante
já embute tudo: \`$2a$10$N9qo8uLOickgx2ZMRZoMye...\`.

## Onde o Spring Security entra

O Spring Security é uma **cadeia de filtros** (filter chain) que roda antes
de qualquer controller. Cada filtro tem uma chance de autenticar, autorizar
ou barrar a requisição:

\`\`\`java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                 // sem cookie de sessão, sem CSRF
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
\`\`\`

O **filtro JWT** (que você escreve) faz o trabalho por requisição:

1. Extrai o token do header \`Authorization: Bearer ...\`.
2. Verifica assinatura e expiração.
3. Monta um \`Authentication\` e o coloca no **\`SecurityContextHolder\`** — um
   ThreadLocal que carrega "quem é o usuário desta requisição".

Dali em diante, o resto do Spring enxerga o usuário:

\`\`\`java
@PreAuthorize("hasRole('ADMIN')")       // autorização por método
@DeleteMapping("/usuarios/{id}")
void excluir(@PathVariable UUID id) { ... }
\`\`\`

### Por que desligar CSRF numa API JWT?

CSRF explora o envio **automático** de cookies pelo navegador. Uma API
stateless com Bearer token não usa cookie — o token é anexado explicitamente
pelo código do front. Sem envio automático, não há CSRF; o \`csrf.disable()\`
é correto (e não uma gambiarra) nesse desenho.

## Os erros que aparecem em toda revisão de segurança

1. **Segredo do JWT fraco ou commitado.** O segredo assina TUDO — vaza o
   segredo, o atacante forja qualquer usuário. Variável de ambiente, longa e
   aleatória.
2. **Dados sensíveis no payload.** É Base64 público.
3. **Token de vida longa sem refresh.** Vazou = acesso por semanas.
4. **Confiar na claim para dados que mudam.** Role revogada vive no token até
   o exp — decisões críticas conferem no banco.
5. **Mensagem de login detalhada.** "Senha incorreta" confirma que o email
   existe; prefira "credenciais inválidas".
6. **CORS escancarado** com \`*\` em produção — restrinja às origens reais.

## O mapa mental para levar

\`\`\`text
sessão+cookie  → estado no servidor, revogável, CSRF, difícil de escalar
JWT            → estado no cliente, escala fácil, NÃO revogável
               → por isso: access curto + refresh revogável
senha          → nunca guardada: BCrypt(hash lento + salt)
Spring Security→ cadeia de filtros; seu filtro JWT popula o SecurityContext
401 vs 403     → não sei quem é você  vs  sei quem é, e não pode
\`\`\`
`.trim(),
};

const TESTES_AUTOMATIZADOS: TheoryArticle = {
  id: 'testes-automatizados',
  title: 'Testes automatizados: JUnit 5, Mockito e a pirâmide',
  summary:
    'Por que testar, o que testar primeiro e como: anatomia de um bom teste, mocks sem exagero, as fatias do Spring Boot e as armadilhas que tornam suítes inúteis.',
  icon: 'target',
  tags: ['Testes', 'JUnit 5', 'Mockito', 'Qualidade'],
  readingMinutes: 18,
  body: `
## Para que servem os testes (de verdade)

Teste automatizado não existe para "provar que funciona hoje" — isso o teste
manual faz. Ele existe para **continuar provando amanhã**, quando outra pessoa
(ou você mesmo) mudar o código. Uma suíte saudável compra três coisas:

1. **Coragem para refatorar** — mudou, rodou, passou: siga em frente.
2. **Documentação executável** — o teste mostra como a classe deve ser usada
   e o que ela promete, sem desatualizar como um comentário.
3. **Feedback em segundos** — o bug aparece no seu terminal, não no usuário.

## A pirâmide: onde investir

\`\`\`text
        ▲  E2E / integração completa      poucos, lentos, frágeis
       ▲▲  fatias (@WebMvcTest, @DataJpaTest)
     ▲▲▲▲  unitários                      muitos, milissegundos, estáveis
\`\`\`

Quanto mais alto na pirâmide, mais **realista** e mais **caro** (tempo,
manutenção, flakiness). A regra de bolso: teste a **lógica** com unitários,
os **contratos** com fatias, e reserve a integração completa para um punhado
de fluxos críticos ponta a ponta.

## Anatomia de um bom teste unitário

O esqueleto universal é **Arrange / Act / Assert** (ou given/when/then):

\`\`\`java
class CupomServiceTest {

    private final CupomService service = new CupomService();

    @Test
    void deveRejeitarCupomExpirado() {
        // Arrange — monta o cenário
        Cupom cupom = new Cupom("NATAL10", LocalDate.now().minusDays(1));

        // Act — executa A ação sob teste
        var resultado = service.validar(cupom);

        // Assert — verifica o desfecho
        assertFalse(resultado.valido());
        assertEquals("CUPOM_EXPIRADO", resultado.motivo());
    }
}
\`\`\`

As qualidades que separam um teste bom de um estorvo:

- **Um motivo para falhar.** Se o teste quebra, o nome dele já diz o que
  regrediu. Testes que verificam dez coisas falham por qualquer uma delas.
- **Nome que descreve comportamento**: \`deveRejeitarCupomExpirado\`, não
  \`testValidar2\`.
- **Independente e determinístico**: sem depender de ordem, de rede, de
  relógio (\`LocalDate.now()\` injetável via \`Clock\`!) ou de estado deixado
  por outro teste.
- **Rápido.** Milissegundos. Suíte lenta é suíte que ninguém roda.

### O kit JUnit 5

\`\`\`java
@Test                                  // um caso de teste
@DisplayName("rejeita saque > saldo")  // nome legível no relatório
@BeforeEach / @AfterEach               // setup/teardown por teste
@Nested                                // agrupa cenários relacionados
@ParameterizedTest                     // mesmo teste, vários dados:
@ValueSource(ints = {0, -1, -100})
void deveRejeitarValoresInvalidos(int valor) {
    assertThrows(IllegalArgumentException.class, () -> service.sacar(valor));
}
\`\`\`

\`assertThrows\` merece destaque: exceção esperada é **comportamento**, e
se testa como qualquer outro.

## Mockito: isolando a classe sob teste

Um service que depende de repositório e gateway de pagamento não deveria
precisar de banco nem de API externa para ter sua **lógica** testada. Entra o
**mock** — um dublê programável:

\`\`\`java
@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock PedidoRepository repo;            // dublê
    @Mock PagamentoGateway gateway;         // dublê
    @InjectMocks PedidoService service;     // classe REAL, com os dublês injetados

    @Test
    void deveEstornarSePagamentoFalhar() {
        when(repo.findById(ID)).thenReturn(Optional.of(pedido()));
        when(gateway.cobrar(any())).thenThrow(new PagamentoRecusadoException());

        assertThrows(PagamentoRecusadoException.class, () -> service.finalizar(ID));

        verify(repo).save(argThat(p -> p.getStatus() == Status.ESTORNADO));
    }
}
\`\`\`

O vocabulário essencial:

| Chamada | Papel |
|---|---|
| \`when(x).thenReturn(y)\` | programa a resposta do dublê |
| \`when(x).thenThrow(e)\` | simula falha da dependência |
| \`verify(mock).metodo(...)\` | confirma que a interação aconteceu |
| \`verify(mock, never())\` | confirma que NÃO aconteceu |
| \`any()\`, \`eq(v)\`, \`argThat(pred)\` | matchers de argumento |

### Quando NÃO mockar

Mock é para **fronteiras** (banco, HTTP, fila, relógio). Se você mocka objetos
de domínio ou, pior, a própria classe sob teste, o teste passa a validar a
implementação, não o comportamento — qualquer refatoração o quebra sem haver
bug. Sintoma clássico: um \`verify\` para cada linha do método. Isso é um teste
que "sabe demais".

## As fatias do Spring Boot

Entre o unitário puro e o contexto inteiro existem as **test slices**, que
sobem só uma camada:

\`\`\`java
@WebMvcTest(ProdutoController.class)       // só o MVC: mapeamentos, validação, JSON
class ProdutoControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ProdutoService service;   // o service é dublê

    @Test
    void devePedir400QuandoNomeVazio() throws Exception {
        mvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\\"nome\\": \\"\\"}"))
           .andExpect(status().isBadRequest());
    }
}
\`\`\`

- **\`@WebMvcTest\`** — controllers + advice + serialização. Testa contrato
  HTTP sem subir service/banco.
- **\`@DataJpaTest\`** — entidades + repositories + um banco de teste. Valida
  queries derivadas e JPQL.
- **\`@SpringBootTest\`** — o contexto inteiro; com
  \`webEnvironment = RANDOM_PORT\` dá para bater HTTP de verdade.

### Banco de teste: H2 ou Testcontainers?

H2 em memória é rápido, mas **não é o Postgres de produção** — funções,
dialetos e constraints divergem e escondem bugs. O padrão moderno é
**Testcontainers**: o teste sobe um Postgres real e descartável no Docker.
Custa segundos no boot da suíte; paga-se sozinho no primeiro bug de dialeto
que ele pega.

## Cobertura: métrica útil, meta perigosa

Cobertura mede **linhas executadas**, não **comportamento verificado** — um
teste sem asserção cobre tudo e garante nada. Use cobertura para achar
**buracos** ("essa regra crítica não tem teste nenhum!"), nunca como meta a
perseguir ("precisamos de 90%"). Metas de cobertura geram testes vazios
escritos para o número, e um teste ruim é pior que nenhum: dá falsa confiança
e custa manutenção.

## Por onde começar num projeto sem testes

1. **A regra de negócio mais crítica** (dinheiro, permissão, cálculo) —
   unitários com Mockito. Maior retorno por esforço.
2. **O contrato da API**: status e formato de erro dos endpoints principais
   (\`@WebMvcTest\`).
3. **As queries não triviais** (\`@DataJpaTest\`).
4. **Um fluxo ponta a ponta** que valide a fiação toda (\`@SpringBootTest\`).
5. Depois, a regra do escoteiro: todo bug corrigido ganha antes um teste que
   o **reproduz** — a suíte cresce exatamente onde o sistema mostrou fraqueza.

> Se um teste precisa de \`Thread.sleep\`, depende da ordem de execução ou
> falha "às vezes", conserte-o ou apague-o. Um teste intermitente treina o
> time a ignorar vermelho — e aí a suíte inteira perde o valor.
`.trim(),
};

const DOCKER_JAVA: TheoryArticle = {
  id: 'docker-para-devs-java',
  title: 'Docker para devs Java: da imagem ao docker-compose',
  summary:
    'O que são imagens e containers, como empacotar uma aplicação Spring Boot num Dockerfile decente e como subir app + banco com um comando via docker-compose.',
  icon: 'cloud',
  tags: ['Docker', 'DevOps', 'Deploy', 'Infra'],
  readingMinutes: 15,
  body: `
## O problema que o Docker resolve

"Na minha máquina funciona." A aplicação depende de uma versão exata do Java,
de variáveis de ambiente, de um Postgres na porta certa… e cada ambiente
(sua máquina, a do colega, o servidor) tem um pedaço diferente disso.

O **container** empacota a aplicação **junto com tudo o que ela precisa** —
runtime, bibliotecas, configuração — numa unidade que roda idêntica em
qualquer lugar que tenha Docker. Não é uma máquina virtual: containers
compartilham o kernel do host e por isso sobem em **milissegundos** e pesam
**megabytes**, não gigabytes.

## Os três substantivos que organizam tudo

| Conceito | O que é | Analogia Java |
|---|---|---|
| **Imagem** | pacote imutável com app + dependências | o \`.jar\` |
| **Container** | uma instância da imagem em execução | o processo da JVM |
| **Registry** | repositório de imagens (Docker Hub, ECR, GHCR) | o Maven Central |

O fluxo de vida: \`Dockerfile\` → **build** → imagem → **push** para o registry
→ **pull** no servidor → **run** vira container.

\`\`\`bash
docker build -t learnway-api:1.0 .        # constrói a imagem
docker run -p 8080:8080 learnway-api:1.0  # roda (porta host:container)
docker ps                                  # containers vivos
docker logs -f <id>                        # acompanha o stdout
docker exec -it <id> sh                    # abre um shell dentro
\`\`\`

## O Dockerfile de uma app Spring Boot

A versão ingênua funciona, mas carrega o JDK inteiro e o cache do Maven para
produção. A forma correta é o **multi-stage build**: um estágio para compilar,
outro — enxuto — para rodar:

\`\`\`dockerfile
# ── Estágio 1: build (JDK + Maven, pesado, descartado no final) ─────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# 1º as dependências (aproveita cache entre builds)…
COPY pom.xml .
RUN mvn dependency:go-offline -q

# …depois o código (só esta camada invalida quando você edita fonte)
COPY src ./src
RUN mvn -DskipTests package -q

# ── Estágio 2: runtime (só o JRE + o jar) ────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
USER 1000                                  # não rode como root
ENTRYPOINT ["java", "-jar", "app.jar"]
\`\`\`

Por que essa ordem importa: cada instrução vira uma **camada** cacheada.
Se o \`pom.xml\` não mudou, o Docker reaproveita a camada das dependências —
o rebuild após editar um \`.java\` leva segundos, não minutos. A imagem final
sai com ~200 MB (JRE alpine) em vez de ~800 MB (JDK + Maven + caches).

## Configuração: ambiente entra por fora

A mesma imagem deve rodar em dev, staging e produção — o que muda é a
**configuração**, injetada por variáveis de ambiente. O Spring Boot já mapeia
automaticamente: \`SPRING_DATASOURCE_URL\` sobrescreve
\`spring.datasource.url\`.

\`\`\`bash
docker run -p 8080:8080 \\
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/learnway \\
  -e SPRING_DATASOURCE_PASSWORD=... \\
  -e GEMINI_API_KEY=... \\
  learnway-api:1.0
\`\`\`

> **Nunca** copie \`.env\`, senhas ou chaves para dentro da imagem — imagem vai
> para registry, registry vaza. Segredo entra em runtime (env vars, secrets
> do orquestrador).

## docker-compose: o ambiente inteiro num arquivo

Sua aplicação não vive só: precisa de Postgres, talvez Redis. O
**docker-compose** declara o conjunto e sobe tudo com um comando:

\`\`\`yaml
services:
  api:
    build: ./learnway-api
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/learnway
      SPRING_DATASOURCE_USERNAME: learnway
      SPRING_DATASOURCE_PASSWORD: dev123
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: learnway
      POSTGRES_USER: learnway
      POSTGRES_PASSWORD: dev123
    volumes:
      - pgdata:/var/lib/postgresql/data   # dados sobrevivem ao container
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learnway"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
\`\`\`

\`\`\`bash
docker compose up -d      # sobe api + banco
docker compose logs -f api
docker compose down       # derruba tudo (o volume pgdata fica)
\`\`\`

Três detalhes que valem entender:

- **Rede interna**: os serviços se enxergam **pelo nome** — a API acessa o
  banco em \`db:5432\`, não em \`localhost\`. (Dentro do container, localhost é
  o próprio container!)
- **Volume**: containers são descartáveis; o que precisa sobreviver (dados do
  Postgres) vive num volume.
- **healthcheck + depends_on**: a API só sobe quando o Postgres está de fato
  aceitando conexão — sem isso, corrida de inicialização e stacktrace de
  \`Connection refused\`.

## Onde isso encaixa no caminho do deploy

\`\`\`text
git push → CI (GitHub Actions):
             mvn test
             docker build -t registry/learnway-api:sha123 .
             docker push registry/learnway-api:sha123
          → CD: o servidor (ou Kubernetes) faz pull da imagem nova e troca
            os containers — rollback = voltar a tag anterior
\`\`\`

A imagem imutável e versionada é o que torna deploy e rollback **operações
banais**: nada de "subir arquivo por FTP e rezar". Kubernetes, ECS e afins
são, em essência, gerentes de containers em escala — mas todos começam com
você dominando exatamente o que está nesta página.

## Colinha de sobrevivência

\`\`\`bash
docker build -t nome:tag .          # Dockerfile -> imagem
docker run -d -p 8080:8080 nome     # roda em background
docker ps / docker ps -a            # rodando / todos
docker logs -f <container>          # stdout ao vivo
docker exec -it <container> sh      # shell dentro do container
docker images / docker rmi          # lista / remove imagens
docker compose up -d / down         # ambiente inteiro sobe / desce
docker system prune                 # limpa o entulho (cuidado!)
\`\`\`

> **Dica de estudo:** containerize o próprio LearnWay — Dockerfile
> multi-stage na API e um compose com o Postgres. É o exercício perfeito:
> você conhece a aplicação, e cada erro de configuração vira aprendizado
> concreto de rede, env vars e volumes.
`.trim(),
};

const GIT_EQUIPES: TheoryArticle = {
  id: 'git-para-equipes',
  title: 'Git para equipes: commits, branches, merge e pull requests',
  summary:
    'O modelo mental do Git que evita 90% dos sustos: como commits e branches funcionam de verdade, merge vs rebase, e o fluxo de PR que os times usam no dia a dia.',
  icon: 'map',
  tags: ['Git', 'Fluxo de trabalho', 'Colaboração', 'Ferramentas'],
  readingMinutes: 16,
  body: `
## O modelo mental: um grafo de fotografias

Quase toda confusão com Git vem de um modelo mental errado. O correto é
simples: o repositório é um **grafo de commits**, e cada commit é uma
**fotografia completa** do projeto naquele instante (não um diff!), apontando
para o commit **pai** que veio antes.

\`\`\`text
A ── B ── C ── D        ← main
\`\`\`

Sobre esse grafo existem só dois tipos de "etiqueta":

- **Branch** — um ponteiro móvel para um commit. Criar branch é criar um
  post-it, não copiar arquivos: por isso é instantâneo.
- **Tag** — um ponteiro fixo (marca a v1.2.0 para sempre).

E o **HEAD** é "onde você está agora" — normalmente apontando para um branch.

## As três áreas por onde uma mudança passa

\`\`\`text
working directory ──(git add)──► staging area ──(git commit)──► histórico
   (seus arquivos)                (o que VAI entrar               (imutável)
                                   no próximo commit)
\`\`\`

O **staging** existe para você **escolher** o que entra em cada commit —
metade dos arquivos numa correção, a outra metade em outra. É o que separa
commits cirúrgicos de commits "WIP tudo junto".

\`\`\`bash
git status                  # o mapa: o que mudou, o que está staged
git add src/PedidoService.java
git add -p                  # escolhe TRECHO a trecho (interativo)
git commit -m "Corrige arredondamento no total do pedido"
git log --oneline --graph   # o grafo, legível
\`\`\`

### Commits que ajudam o time

- **Pequenos e atômicos**: uma mudança lógica por commit. Reverter, revisar e
  entender ficam triviais.
- **Mensagem no imperativo, dizendo o PORQUÊ**: "Corrige cálculo de frete
  para CEPs sem cobertura" conta mais que "fix" ou "ajustes".
- O histórico é **documentação**: daqui a um ano, \`git log\` e \`git blame\`
  serão a única testemunha do motivo de uma linha existir.

## Branches: universos paralelos baratos

\`\`\`bash
git switch -c feature/cupom-desconto   # cria e muda para o branch
# ...commits...
git switch main                        # volta — os arquivos MUDAM no disco
\`\`\`

\`\`\`text
              E ── F        ← feature/cupom-desconto
             /
A ── B ── C ── D            ← main
\`\`\`

O branch isola seu trabalho: a main continua limpa e implantável enquanto a
feature amadurece. Essa é a base de qualquer fluxo de equipe.

## Juntando os universos: merge vs rebase

### Merge — costura os dois históricos

\`\`\`bash
git switch main
git merge feature/cupom-desconto
\`\`\`

\`\`\`text
              E ── F
             /      \\
A ── B ── C ── D ──── M     ← main (M = merge commit, com DOIS pais)
\`\`\`

O histórico fica fiel ao que aconteceu (trabalho paralelo), ao custo de
"trançar" o grafo quando há muitos branches.

### Rebase — reescreve como se fosse sequencial

\`\`\`bash
git switch feature/cupom-desconto
git rebase main            # "replanta" E e F em cima do D
\`\`\`

\`\`\`text
A ── B ── C ── D ── E' ── F'     ← histórico linear, fácil de ler
\`\`\`

Atenção ao apóstrofo: **E' e F' são commits NOVOS** (outro hash). Rebase
reescreve história — e daí vem a regra de ouro:

> **Nunca rebase commits que já foram enviados para um branch
> compartilhado.** Reescrever o que os colegas já baixaram cria históricos
> divergentes e uma tarde de sofrimento coletivo. No SEU branch, antes do
> merge: à vontade.

### Conflitos: sem pânico

Conflito não é erro — é o Git dizendo "vocês dois mexeram na mesma linha,
decida você":

\`\`\`text
<<<<<<< HEAD
    return valor * 0.9;
=======
    return valor * 0.85;
>>>>>>> feature/cupom-desconto
\`\`\`

Edite o arquivo para a versão final (apagando os marcadores), \`git add\` e
prossiga (\`git merge --continue\` / \`git rebase --continue\`). Conflitos
grandes são sintoma de branches **vividos demais** — integre com frequência
e eles encolhem.

## O fluxo que os times realmente usam

O **feature branch + pull request** (GitHub flow) domina a indústria:

\`\`\`text
1. git switch -c feature/x  ─► trabalha, commita
2. git push -u origin feature/x
3. Abre o PULL REQUEST      ─► CI roda; colegas revisam e comentam
4. Ajusta pelo feedback     ─► novos commits no mesmo branch
5. Merge na main (squash é comum) ─► branch apagado
\`\`\`

O PR é o ponto de encontro de tudo: **revisão de código** (segundo par de
olhos), **CI verde obrigatório** (branch protection) e discussão registrada.
O "squash merge" comprime os 15 commits de trabalho num único commit limpo na
main — histórico legível sem burocracia durante o desenvolvimento.

### Sincronizando com o remoto

\`\`\`bash
git fetch          # baixa novidades SEM tocar nos seus arquivos
git pull           # fetch + merge (ou rebase, com pull.rebase=true)
git push           # publica seus commits
\`\`\`

\`git fetch\` + \`git log origin/main..main\` mostra o que você tem que os
outros não têm — espiar antes de agir evita surpresas.

## Desfazendo coisas (a parte que salva o dia)

| Situação | Comando | Seguro? |
|---|---|---|
| Desfazer mudanças não commitadas num arquivo | \`git restore arquivo\` | ⚠️ descarta de verdade |
| Tirar do staging (mantendo a edição) | \`git restore --staged arquivo\` | ✅ |
| Corrigir a MENSAGEM do último commit | \`git commit --amend\` | ✅ se ainda não deu push |
| Desfazer um commit JÁ publicado | \`git revert <hash>\` | ✅ cria commit inverso |
| Voltar o branch para um ponto anterior | \`git reset --hard <hash>\` | ⚠️ apaga commits locais |
| "Perdi um commit!" | \`git reflog\` | 🛟 o diário de bordo do HEAD |

A distinção que importa: **revert** é público e seguro (adiciona um commit
que desfaz); **reset** reescreve e só cabe em commits que nunca saíram da sua
máquina. E o \`git reflog\` registra **todo** lugar por onde o HEAD passou —
no Git, commit feito quase nunca está realmente perdido.

### O kit de sobrevivência diário

\`\`\`bash
git stash            # guarda mudanças não commitadas numa gaveta
git stash pop        # traz de volta
git cherry-pick <h>  # copia UM commit específico para o branch atual
git blame arquivo    # quem mudou cada linha, em qual commit
git bisect start     # busca binária pelo commit que introduziu um bug
\`\`\`

> **Dica de estudo:** crie um repositório descartável e provoque os desastres
> de propósito — conflito, rebase errado, reset --hard, resgate via reflog.
> Errar onde não dói é o que torna o Git confortável onde dói.
`.trim(),
};

const ARQUITETURA_CAMADAS: TheoryArticle = {
  id: 'arquitetura-em-camadas',
  title: 'Arquitetura em camadas: organizando um backend que cresce',
  summary:
    'Controller, service, repository: o que cada camada faz (e não faz), por que DTOs existem, onde a regra de negócio mora e como não deixar o projeto virar um novelo.',
  icon: 'layers',
  tags: ['Arquitetura', 'Design', 'Spring', 'Boas práticas'],
  readingMinutes: 17,
  body: `
## Por que camadas existem

Todo backend responde às mesmas três perguntas: como o mundo externo **fala
comigo** (HTTP), **o que** o negócio exige (regras) e **onde** os dados vivem
(banco). A arquitetura em camadas dá um endereço para cada resposta:

\`\`\`text
HTTP ──► CONTROLLER  (traduz o mundo externo)
              │  DTOs
              ▼
         SERVICE     (decide — a regra de negócio mora aqui)
              │  entidades
              ▼
         REPOSITORY  (persiste — fala com o banco)
              │
              ▼
           banco
\`\`\`

A regra que sustenta tudo: **dependências apontam para baixo, e cada camada
só conhece a de baixo**. Controller não toca repository; repository não sabe
que HTTP existe. Quando isso quebra, o projeto "funciona" — e vira um novelo
onde toda mudança tem efeito colateral em lugar inesperado.

## Controller: tradutor, não decisor

O controller converte HTTP ↔ chamadas de service. Só isso:

\`\`\`java
@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PedidoDto criar(@RequestBody @Valid CriarPedidoRequest body) {
        return service.criar(body);       // traduziu, delegou, acabou
    }
}
\`\`\`

Sinais de que um controller engordou:

- \`if\` de **negócio** ("se o cliente é VIP, desconto de..."): isso é service.
- Acesso direto a repository: pulou uma camada; a regra que deveria proteger
  aquele dado foi contornada.
- Try/catch de exceção de negócio: isso é papel do
  \`@RestControllerAdvice\`.

Teste rápido: se você trocasse REST por outra interface (fila, gRPC, CLI),
**o que sobra intocado?** Tudo que precisaria ser reescrito além da tradução
está no lugar errado.

## Service: onde o negócio acontece

O service implementa os **casos de uso**: "criar pedido", "cancelar
assinatura", "aplicar cupom". É a camada que decide — e por isso concentra
transação e regras:

\`\`\`java
@Service
public class PedidoService {

    private final PedidoRepository pedidos;
    private final EstoqueService estoque;

    // construtor com as dependências...

    @Transactional
    public PedidoDto criar(CriarPedidoRequest req) {
        // 1. valida REGRAS (formato já foi validado pelo @Valid no DTO)
        if (!estoque.disponivel(req.itens())) {
            throw new EstoqueInsuficienteException();
        }
        // 2. orquestra o domínio
        Pedido pedido = Pedido.criar(req.clienteId(), req.itens());
        pedidos.save(pedido);
        estoque.reservar(pedido);
        // 3. devolve DTO — a entidade não sai daqui
        return PedidoDto.de(pedido);
    }
}
\`\`\`

Três disciplinas mantêm a camada saudável:

1. **\`@Transactional\` no service** — o caso de uso é a unidade de
   atomicidade, não o repository (curto demais) nem o controller (HTTP não
   deveria segurar transação).
2. **Exceções de negócio específicas** (\`EstoqueInsuficienteException\`), não
   \`RuntimeException("erro")\` — o advice traduz cada uma no status certo.
3. **Service chama service** quando o caso de uso atravessa domínios — nunca
   o repository de outro domínio direto (a regra do outro domínio mora no
   service dele; pular direto ao repository contorna essas regras).

## Repository: persistência, sem opinião

\`\`\`java
public interface PedidoRepository extends JpaRepository<Pedido, UUID> {
    List<Pedido> findByClienteIdAndStatus(UUID clienteId, StatusPedido status);
}
\`\`\`

O repository responde "busque/salve isto" — ele **não decide** nada. Um método
\`buscarPedidosQuePodemSerCancelados()\` no repository é regra de negócio
escondida na camada errada: amanhã a regra muda e ninguém procura por ela ali.

## DTOs: a fronteira que protege as duas pontas

**DTO** (Data Transfer Object) é o objeto que atravessa a fronteira da API —
e a razão de existir é o **desacoplamento de contratos**:

\`\`\`java
// o que ENTRA (com validação de formato)
public record CriarPedidoRequest(
    @NotNull UUID clienteId,
    @NotEmpty List<ItemRequest> itens
) { }

// o que SAI (só o que o cliente da API precisa ver)
public record PedidoDto(UUID id, String status, BigDecimal total) {
    static PedidoDto de(Pedido p) {
        return new PedidoDto(p.getId(), p.getStatus().name(), p.getTotal());
    }
}
\`\`\`

Por que nunca expor a entidade JPA direto:

- **Vazamento de dados** — a entidade tem campos internos (flags, auditoria,
  relacionamentos) que o JSON exporia sem você perceber.
- **Acoplamento de contrato** — renomear uma coluna quebraria os clientes da
  API; com DTO, o contrato externo evolui separado do schema.
- **LazyInitializationException** — serializar entidade com relação lazy fora
  da transação é o erro clássico de quem pula o DTO.
- **Segurança de escrita** — um \`@RequestBody Pedido\` deixaria o cliente
  setar QUALQUER campo da entidade (id, status, total!). O request DTO define
  exatamente o que pode entrar.

## O domínio rico: entidades que se defendem

Nas versões mais maduras dessa arquitetura, a entidade não é só um saco de
getters/setters — ela **protege as próprias invariantes**:

\`\`\`java
@Entity
public class Pedido {
    // ...

    public void cancelar() {
        if (status == StatusPedido.ENVIADO) {
            throw new PedidoJaEnviadoException(id);
        }
        this.status = StatusPedido.CANCELADO;   // única forma de cancelar
    }
}
\`\`\`

Compare com \`pedido.setStatus(CANCELADO)\` espalhado pelo código: a regra
"enviado não cancela" teria que ser lembrada em **cada** lugar que seta o
status. Método de negócio na entidade = regra num único lugar, impossível de
esquecer. (É a mesma lição do encapsulamento — aplicada ao domínio.)

## Organização de pacotes: por camada ou por feature?

\`\`\`text
por CAMADA                        por FEATURE (recomendado ao crescer)
controllers/                      pedido/
  PedidoController                  PedidoController
  UsuarioController                 PedidoService
services/                           PedidoRepository
  PedidoService                     Pedido
  UsuarioService                  usuario/
repositories/                       UsuarioController
  ...                               ...
\`\`\`

Por camada parece organizado, mas toda mudança real ("adicionar campo ao
pedido") toca 4 pastas distantes. Por **feature**, tudo do pedido mora junto
— coesão alta, e cada pacote é um candidato natural a módulo (ou microservice)
no futuro. É o layout do próprio LearnWay: \`content/\`, \`progress/\`,
\`gamification/\`...

## Os desvios que viram novelo (checklist de review)

1. **Controller gordo** — regra de negócio na camada de tradução.
2. **Service anêmico + entidade anêmica** — a regra não mora em lugar nenhum;
   está duplicada nos chamadores.
3. **Entidade JPA como contrato da API** — os quatro problemas acima.
4. **Camada pulada** — controller → repository "só dessa vez".
5. **Service de um domínio mexendo no repository de outro** — as regras do
   vizinho foram contornadas.
6. **Repository com nome de regra de negócio** — decisão escondida na
   persistência.

> Camadas não são burocracia — são **endereços previsíveis**: qualquer pessoa
> do time sabe onde procurar uma regra e onde adicionar a próxima. O teste
> final de uma arquitetura é esse: *o código novo tem um lugar óbvio onde
> morar?*
`.trim(),
};

const ESTRUTURA_PASTAS: TheoryArticle = {
  id: 'estrutura-de-pastas-backend',
  title: 'Estrutura de pastas: onde mora cada coisa no backend',
  summary:
    'O guia prático de organização: para que servem controller, dto, service, usecase, model, repository, config, mapper e os outros — e como decidir entre organizar por camada ou por feature.',
  icon: 'binary',
  tags: ['Arquitetura', 'Organização', 'Boas práticas', 'Estrutura'],
  readingMinutes: 19,
  body: `
Se o artigo de **arquitetura em camadas** explicou *o que cada camada faz*,
este é o mapa das **pastas**: o nome de cada uma, a responsabilidade que ela
carrega e — a pergunta que mais gera dúvida — *onde colocar aquele arquivo
novo que você acabou de criar*.

## Antes das pastas: a pergunta que decide tudo

Existe uma escolha que vem **antes** de nomear qualquer pasta, e ela molda o
projeto inteiro: você agrupa os arquivos **por tipo técnico** (todos os
controllers juntos, todos os services juntos) ou **por assunto do negócio**
(tudo de "pedido" junto, tudo de "usuário" junto)?

\`\`\`text
POR CAMADA (package by layer)        POR FEATURE (package by feature)
com.loja                             com.loja
├── controller                       ├── pedido
│   ├── PedidoController             │   ├── PedidoController
│   └── UsuarioController            │   ├── PedidoService
├── service                          │   ├── PedidoRepository
│   ├── PedidoService                │   ├── Pedido
│   └── UsuarioService               │   └── dto/
├── repository                       ├── usuario
│   ├── PedidoRepository             │   ├── UsuarioController
│   └── UsuarioRepository            │   ├── UsuarioService
├── model                            │   ├── UsuarioRepository
│   ├── Pedido                       │   └── Usuario
│   └── Usuario                      └── config
└── dto ...
\`\`\`

**Por camada** é o layout dos tutoriais — parece arrumado, mas "adicionar um
campo ao pedido" te faz abrir 4 pastas distantes, e nada impede o
\`UsuarioController\` de chamar o \`PedidoRepository\` (tudo é visível).

**Por feature** mantém junto o que **muda junto**. A coesão sobe, o acoplamento
entre domínios cai, e cada pacote vira um candidato natural a módulo — ou a
microservice — no futuro. É o layout do próprio LearnWay
(\`content/\`, \`progress/\`, \`gamification/\`, \`auth/\`...).

> Regra prática: **projeto pequeno/estudo → por camada tolera; qualquer coisa
> que vá crescer → por feature.** O resto deste artigo assume por feature, e
> as pastas descritas viram sub-pacotes dentro de cada domínio.

## O dicionário das pastas

### controller (ou web, api, resource)
A **borda HTTP**. Recebe a requisição, valida o formato, delega ao caso de uso
e devolve a resposta. Não decide regra de negócio nenhuma.

\`\`\`text
pedido/
└── PedidoController.java   → @RestController, mapeia /api/pedidos
\`\`\`
Nomes comuns por ecossistema: \`controller\` (Spring/MVC), \`web\`, \`api\`,
\`resource\` (JAX-RS/Quarkus). Escolha um e seja consistente.

### dto
Os objetos que **cruzam a fronteira da API** — o contrato público, separado das
suas entidades internas. Quase sempre vale dividir entre entrada e saída:

\`\`\`text
pedido/
└── dto/
    ├── CriarPedidoRequest.java    → o que ENTRA (com @NotBlank, @Valid...)
    └── PedidoResponse.java        → o que SAI (só o que o cliente vê)
\`\`\`
Por que existem: evitam vazar campos internos, desacoplam o contrato do schema
do banco e impedem que o cliente escreva campos proibidos (id, status, saldo).
\`records\` são perfeitos para DTOs.

### model (ou domain, entity)
O **coração do negócio**: as entidades e as regras que as protegem. Aqui há uma
distinção fina que confunde muita gente:

- **\`entity\`** costuma significar a classe \`@Entity\` mapeada ao banco (JPA).
- **\`domain\`/\`model\`** é um termo mais amplo: entidades + objetos de valor
  (\`Dinheiro\`, \`CPF\`) + enums de negócio + regras.

Em projetos simples, os dois viram a mesma pasta \`model\`. Em projetos que
separam persistência de domínio (veja "arquitetura hexagonal" abaixo), são
pastas distintas. O importante: **a regra de negócio mora aqui**, dentro de
métodos da própria entidade (\`pedido.cancelar()\`), não espalhada em setters.

### repository (ou dao, persistence)
O **acesso a dados**, e nada além. Interfaces que salvam e buscam:

\`\`\`text
pedido/
└── PedidoRepository.java   → extends JpaRepository<Pedido, UUID>
\`\`\`
\`repository\` é o termo do mundo Spring/DDD; \`dao\` (Data Access Object) é o
nome mais antigo, equivalente. Um método com nome de **regra de negócio** aqui
(\`buscarPedidosQuePodemSerReembolsados\`) é um cheiro: a decisão vazou para a
camada de persistência.

### service vs usecase — a dúvida clássica

Ambos representam a **camada de aplicação** (o "o que o sistema faz"). A escolha
entre os dois nomes reflete duas filosofias:

**\`service\`** — o padrão pragmático (Spring tradicional). Uma classe agrupa
vários casos de uso relacionados de um domínio:

\`\`\`java
@Service
class PedidoService {
    PedidoResponse criar(...)   { ... }
    void            cancelar(...) { ... }
    PedidoResponse  buscar(...)  { ... }
}
\`\`\`

**\`usecase\`** (ou \`application\`) — a abordagem da Clean Architecture. **Um
caso de uso por classe**, cada um com um único método público:

\`\`\`text
pedido/
└── usecase/
    ├── CriarPedidoUseCase.java     → execute(CriarPedidoCommand)
    ├── CancelarPedidoUseCase.java  → execute(CancelarPedidoCommand)
    └── BuscarPedidoUseCase.java
\`\`\`

| | \`service\` | \`usecase\` |
|---|---|---|
| Granularidade | várias operações por classe | uma operação por classe |
| Legibilidade | classes maiores, menos arquivos | cada intenção explícita, muitos arquivos |
| Quando brilha | CRUDs, domínios simples | fluxos complexos, regras densas, times grandes |
| Risco | vira uma classe "deus" de 800 linhas | explosão de arquivos em coisas triviais |

> Não existe certo absoluto: **\`service\` para a maioria dos casos**; migre para
> \`usecase\` quando um service começar a inchar e a misturar responsabilidades.
> Muitos projetos usam os dois — \`usecase\` para os fluxos ricos, \`service\`
> para operações auxiliares. O que não vale é misturar os nomes sem critério.

### mapper (ou converter, assembler)
A tradução **entidade ↔ DTO**. Isolar isso evita poluir o service com código
repetitivo de "copiar campo por campo":

\`\`\`text
pedido/
└── PedidoMapper.java   → toResponse(Pedido) / toEntity(CriarPedidoRequest)
\`\`\`
Pode ser um método estático simples, uma classe dedicada ou uma biblioteca
(MapStruct gera o mapper em tempo de compilação). Em projetos pequenos, um
método \`static\` \`de(...)\` no próprio DTO já resolve — pasta dedicada só quando
os mapeamentos crescem.

### config
A **fiação da aplicação**: classes \`@Configuration\`, beans de terceiros,
Security, CORS, propriedades tipadas.

\`\`\`text
config/
├── SecurityConfig.java          → SecurityFilterChain, PasswordEncoder
├── WebConfig.java               → CORS, interceptors
├── OpenApiConfig.java           → documentação Swagger
└── PagamentoProperties.java     → @ConfigurationProperties("app.pagamento")
\`\`\`
\`config\` costuma ser **transversal** (um pacote na raiz), não por feature —
segurança e CORS servem o app inteiro.

### exception (ou error)
As exceções de negócio e o **tratamento centralizado**:

\`\`\`text
exception/
├── EstoqueInsuficienteException.java   → exceção de negócio específica
├── RecursoNaoEncontradoException.java
├── GlobalExceptionHandler.java         → @RestControllerAdvice (transversal)
└── ErroResponse.java                   → o corpo de erro padronizado
\`\`\`
As exceções específicas podem morar junto do domínio que as lança; o
\`@RestControllerAdvice\` que as traduz em status HTTP é transversal.

### client (ou gateway, integration, external)
A conversa com o **mundo externo**: outras APIs, gateways de pagamento, filas.
Isolar aqui deixa claro onde estão as fronteiras de rede (e onde aplicar
timeout, retry, circuit breaker):

\`\`\`text
pagamento/
└── client/
    └── StripeClient.java   → chamadas HTTP ao provedor externo
\`\`\`

### common (ou shared, util) — com cuidado
O lugar do que é **genuinamente compartilhado** por vários domínios: helpers de
data, constantes, tipos-base. É a pasta mais perigosa do projeto:

> ⚠️ \`util\` tende a virar um **depósito de tudo** — uma classe \`Utils\` de 2000
> linhas sem coesão. Antes de jogar algo em \`common\`, pergunte: "isto pertence
> mesmo a nenhum domínio?" Muitas vezes o "helper" é uma regra de negócio
> disfarçada que deveria estar numa entidade.

## Um exemplo completo (por feature)

\`\`\`text
com.loja
├── LojaApplication.java
├── config/                      ← transversal
│   ├── SecurityConfig.java
│   └── WebConfig.java
├── shared/                      ← transversal, coeso e enxuto
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   └── ErroResponse.java
│   └── dinheiro/Dinheiro.java   ← value object reutilizado
├── pedido/                      ← FEATURE completa e autocontida
│   ├── PedidoController.java
│   ├── PedidoService.java
│   ├── PedidoRepository.java
│   ├── PedidoMapper.java
│   ├── model/
│   │   ├── Pedido.java
│   │   ├── ItemPedido.java
│   │   └── StatusPedido.java
│   ├── dto/
│   │   ├── CriarPedidoRequest.java
│   │   └── PedidoResponse.java
│   └── exception/
│       └── PedidoJaEnviadoException.java
├── pagamento/
│   ├── PagamentoService.java
│   ├── client/StripeClient.java
│   └── model/Pagamento.java
└── usuario/
    ├── UsuarioController.java
    ├── UsuarioService.java
    └── ...
\`\`\`

Repare no efeito: para entender pedidos, você abre **uma pasta** e vê tudo —
a borda HTTP, a regra, a persistência, o contrato. E \`pedido\` não importa nada
de \`usuario\` diretamente; se um dia virar microservice, a fronteira já existe.

## E a arquitetura hexagonal / clean?

Em sistemas mais exigentes, aparece uma organização que **inverte as
dependências** para blindar o domínio de frameworks e banco:

\`\`\`text
pedido/
├── domain/         ← entidades e regras PURAS (zero import de Spring/JPA)
├── application/    ← usecases + PORTAS (interfaces: "preciso salvar pedido")
│   └── port/
└── infrastructure/ ← ADAPTADORES: controllers, repositories JPA, clients
\`\`\`

A regra de ouro (o *dependency rule*): **as setas apontam para dentro**. O
domínio não conhece a infraestrutura; a infraestrutura implementa as
**interfaces (portas)** que o domínio define. Trocar Postgres por Mongo, ou
REST por gRPC, mexe só na casca — o núcleo de negócio fica intocado.

> É poderoso e é **caro**: mais camadas, mais interfaces, mais indireção. Vale
> em domínios ricos e de vida longa; para um CRUD, é over-engineering. Comece
> na estrutura simples por feature e evolua para portas/adaptadores **quando a
> dor de acoplamento aparecer**, não por antecipação.

## Princípios que valem para qualquer nomenclatura

1. **Uma responsabilidade por pasta** — se você hesita sobre onde um arquivo
   vai, talvez ele faça coisas demais.
2. **Consistência acima de perfeição** — \`service\` ou \`usecase\`, \`model\` ou
   \`domain\`: escolha e aplique no projeto todo. Meio-a-meio confunde mais que
   qualquer escolha "errada".
3. **A estrutura reflete o domínio, não o framework** — as pastas de topo
   deveriam gritar "loja de café", não "Spring Boot".
4. **Dependências fluem numa direção** — controller → service → repository, e
   nunca o contrário. Ferramentas como ArchUnit testam essa regra
   automaticamente.
5. **Transversal na raiz; específico na feature** — \`config\` e o handler
   global de exceções servem todos; o DTO de pedido só serve pedido.

## Checklist do arquivo novo

Antes de criar aquele arquivo, responda:

- É tradução HTTP? → \`controller\`
- É o contrato de entrada/saída da API? → \`dto\`
- É regra ou estado de negócio? → \`model\`/\`domain\` (dentro de um método da
  entidade, se possível)
- É um caso de uso, orquestrando o fluxo? → \`service\` ou \`usecase\`
- É acesso ao banco? → \`repository\`
- É conversa com sistema externo? → \`client\`/\`gateway\`
- É fiação/beans/segurança? → \`config\`
- "Não é de nenhum domínio"? → pense duas vezes antes do \`common\`.

> **Dica de estudo:** abra o repositório do próprio LearnWay e mapeie cada
> pacote (\`auth\`, \`content\`, \`gamification\`...) aos conceitos deste artigo.
> Ver a teoria numa base real, com as decisões e os atalhos que projetos de
> verdade tomam, fixa muito mais que qualquer diagrama.
`.trim(),
};

const MICROSSERVICOS: TheoryArticle = {
  id: 'microsservicos',
  title: 'Microsserviços: quando vale, como cortar e o que quebra',
  summary:
    'Do monolito ao sistema distribuído: onde traçar as fronteiras, por que cada serviço tem seu próprio banco, consistência eventual, saga, resiliência, observabilidade — e o preço honesto de tudo isso.',
  icon: 'cpu',
  tags: ['Arquitetura', 'Sistemas distribuídos', 'Escala', 'Boas práticas'],
  readingMinutes: 21,
  body: `
## O ponto de partida: o monolito

Um **monolito** é uma aplicação única: um processo, um deploy, um banco. Pedidos,
pagamentos, catálogo e usuários moram todos no mesmo \`.jar\`.

E isso é **bom**. Chamada de método em vez de chamada de rede; transação ACID
atravessando domínios de graça; um build, um log, um lugar para depurar. Todo
sistema deveria começar assim — inclusive os que um dia virarão microsserviços.

O monolito começa a doer quando o **produto e o time** crescem:

- Mudar uma linha no catálogo exige redeploy (e risco) de tudo.
- Oito times no mesmo repositório viram fila de merge e janela de release.
- O relatório pesado come CPU e derruba o checkout — não dá para escalar só a
  parte que precisa.
- Uma dependência travada numa versão antiga trava o projeto inteiro.
- O acoplamento cresce de fininho: alguém chamou \`pedidoRepository\` de dentro
  de \`pagamento\` e agora ninguém consegue separar as duas coisas.

> Repare: quase todas essas dores são **organizacionais e operacionais**, não
> técnicas. Microsserviços são, antes de tudo, uma resposta a *times grandes que
> precisam entregar de forma independente*.

## O que é (e o que não é) um microsserviço

Um microsserviço é um serviço que pode ser **desenvolvido, testado, deployado e
escalado sozinho**, dono do próprio dado e da própria regra.

A palavra-chave é **independência de deploy**. Esse é o teste definitivo:

> Se para subir a versão nova do serviço A você precisa combinar com o time do
> serviço B, **você não tem microsserviços** — tem um monolito distribuído, que
> é o pior dos dois mundos: a complexidade da rede sem a autonomia dos times.

O que **não** define microsserviço:

- **Tamanho em linhas de código.** "Micro" nunca foi sobre isso; é sobre escopo
  de responsabilidade. Um serviço de pedidos com 15 mil linhas pode estar certo.
- **Quantidade de serviços.** Três serviços bem cortados valem mais que trinta
  mal cortados.
- **Ter uma API REST.** Um monolito também tem.

## Onde cortar: pelo negócio, nunca pela camada

O erro clássico é cortar pelas camadas técnicas — um "serviço de controllers",
um "serviço de banco". Isso apenas espalha uma única funcionalidade por vários
processos: toda mudança tocaria todos eles, agora com rede no meio.

O corte correto é por **capacidade de negócio** (o *bounded context* do DDD):

\`\`\`text
CORTE ERRADO (por camada técnica)      CORTE CERTO (por domínio)

api-gateway-service                    pedidos      (cria, cancela, consulta)
business-logic-service                 pagamentos   (cobra, estorna)
data-access-service                    estoque      (reserva, repõe)
                                       notificacoes (e-mail, push)
\`\`\`

Como reconhecer uma boa fronteira:

1. **Vocabulário próprio.** "Cliente" no serviço de cobrança (com CNPJ e limite
   de crédito) não é o mesmo "cliente" do serviço de marketing (com preferências
   e segmento). Quando o mesmo nome significa coisas diferentes, ali há uma
   fronteira natural — cada lado guarda a *sua* versão.
2. **Muda junto, vive junto.** Se duas partes sempre mudam na mesma tarefa, elas
   pertencem ao mesmo serviço. Alta coesão dentro, baixo acoplamento fora.
3. **Um time consegue ser dono.** Se um serviço precisa de três times para
   evoluir, ele não foi cortado, foi rachado.

> **Lei de Conway:** a arquitetura do sistema tende a copiar o organograma da
> empresa. Times separados produzem serviços separados — e times que se falam o
> tempo todo produzem serviços acoplados, por mais diagramas que você desenhe.

## A regra mais importante: um banco por serviço

Cada serviço é dono exclusivo dos seus dados. **Nenhum outro serviço lê ou
escreve na tabela dele** — nem "só para um relatório".

\`\`\`text
   CERTO                                ERRADO (banco compartilhado)

pedidos ──► [db pedidos]              pedidos ───┐
   │ API/evento                                  ├──► [ um banco só ]
pagamentos ──► [db pagamentos]        pagamentos ┘
\`\`\`

Por que essa regra é inegociável: no banco compartilhado, o **schema vira a API
pública** de todo mundo. Renomear uma coluna quebra três serviços que você nem
sabia que liam sua tabela; e a regra de negócio que protege aquele dado
("pedido enviado não cancela") é contornada por qualquer \`UPDATE\` alheio. Você
teria pago o preço da rede e continuaria sem conseguir deployar sozinho.

O contrato entre serviços é sempre **API ou evento** — nunca a tabela.

## Como os serviços conversam

### Síncrono (HTTP/REST, gRPC)

O chamador espera a resposta. Simples de entender e de depurar, e é o certo
quando você **precisa do resultado agora** (consultar saldo antes de aprovar).

O custo é o acoplamento temporal: se o serviço chamado está fora do ar ou
lento, **você** fica fora do ar ou lento. Uma cadeia de cinco chamadas com 99,9%
de disponibilidade cada entrega ~99,5% — os erros se multiplicam.

### Assíncrono (mensageria)

O emissor publica um fato e segue a vida; o interessado consome quando puder.

\`\`\`text
pedidos ──publica──► [ broker ] ──entrega──► estoque
   "PedidoCriado"        │      ──entrega──► notificações
                         └──────entrega──► antifraude
\`\`\`

Isso **inverte a dependência**: quem cria o pedido não sabe (nem quer saber)
quem se interessa por ele. Adicionar um consumidor novo não toca no produtor, e
um consumidor fora do ar não derruba o fluxo principal — as mensagens esperam.

É por isso que os artigos seguintes existem: **mensageria** é o assunto que trata
dessa conversa, e **RabbitMQ** e **Kafka** são as duas ferramentas dominantes
para fazê-la acontecer.

Regra prática: **pergunta → síncrono; fato consumado → evento.**

## Consistência eventual e o padrão Saga

No monolito, "criar pedido + reservar estoque + cobrar" cabe numa
\`@Transactional\`. Distribuído, isso acaba: não existe rollback atravessando
bancos de serviços diferentes (transação distribuída/2PC existe, mas trava
recursos e derruba disponibilidade — na prática ninguém usa).

O que existe é **consistência eventual**: por alguns instantes o sistema fica
inconsistente e depois converge. E o padrão que gerencia isso é a **Saga**: a
operação vira uma sequência de transações locais, cada uma com sua
**compensação**.

\`\`\`text
1. pedidos    → cria pedido (PENDENTE)      compensa: cancela pedido
2. estoque    → reserva itens               compensa: libera reserva
3. pagamento  → cobra cartão                compensa: estorna
4. pedidos    → confirma pedido
\`\`\`

Se o passo 3 falha, os passos 2 e 1 são **compensados** na ordem inversa — não
"desfeitos", mas anulados por uma nova operação de negócio (o estorno é um fato
novo, não um \`ROLLBACK\`).

Dois sabores: **coreografia** (cada serviço reage a eventos dos outros — simples
com poucos passos, vira um emaranhado com muitos) e **orquestração** (um serviço
orquestrador conduz os passos — mais visível e depurável quando o fluxo é longo).

Consequência que muda o produto, não só o código: a tela precisa aceitar
estados intermediários ("pagamento em processamento"). Isso é **decisão de UX**,
e não adianta esconder do usuário.

## A rede não é confiável: resiliência obrigatória

As **falácias da computação distribuída** dizem que todo iniciante assume que a
rede é confiável, a latência é zero, a banda é infinita e a topologia não muda.
Nenhuma dessas coisas é verdade. Daí o kit mínimo de sobrevivência:

- **Timeout em tudo.** Chamada sem timeout é vazamento de thread esperando para
  acontecer. O default de muitos clientes HTTP é *infinito*.
- **Retry com backoff exponencial e *jitter*.** Retentar imediatamente e em
  massa transforma uma soluçada em queda: todo mundo volta ao mesmo tempo
  (*thundering herd*). E só retente o que for seguro repetir.
- **Idempotência.** Como você nunca sabe se o timeout foi "não chegou" ou
  "chegou e a resposta se perdeu", a operação precisa poder ser repetida sem
  duplicar efeito — normalmente com uma chave de idempotência:

\`\`\`java
@PostMapping("/cobrancas")
CobrancaDto cobrar(@RequestHeader("Idempotency-Key") String chave,
                   @RequestBody @Valid CobrarRequest req) {
    // se a chave já foi processada, devolve o MESMO resultado — não cobra de novo
    return service.cobrarUmaVezSo(chave, req);
}
\`\`\`

- **Circuit breaker.** Depois de N falhas seguidas, o circuito "abre" e as
  chamadas falham na hora, sem esperar timeout. Isso protege quem chama (threads
  livres) e quem é chamado (para de apanhar enquanto tenta se recuperar). Depois
  de um tempo ele deixa passar uma chamada de teste e fecha se der certo.
  (Resilience4j é o padrão no ecossistema Spring.)
- **Fallback e degradação graciosa.** "Recomendados para você" fora do ar deve
  virar uma lista genérica, não uma página de erro.
- **Bulkhead.** Separe pools de conexão/thread por dependência: o serviço lento
  consome só a própria cota, e não todas as threads da aplicação.

## Fiação: gateway, descoberta e configuração

- **API Gateway** — porta única para o mundo externo: roteia, autentica,
  aplica *rate limit*, agrega. Evita que o front conheça 20 endereços e que
  cada serviço reimplemente segurança.
- **Service discovery** — endereços mudam a cada deploy/escala. Os serviços se
  registram e se descobrem por nome (no Kubernetes, o DNS interno já resolve
  isso; fora dele, Consul ou Eureka).
- **Configuração externa** — nada de \`application.yml\` com senha por serviço:
  variáveis de ambiente, *secrets* do orquestrador ou um config server.
- **Autenticação entre serviços** — JWT propagado ou mTLS. Um serviço interno
  aberto porque "está na rede privada" é a definição de perímetro frágil.

## Observabilidade: sem isso você está cego

No monolito, uma *stack trace* conta a história inteira. Distribuído, um erro do
usuário atravessa cinco serviços — e cada um tem só o seu pedaço.

O tripé:

1. **Logs estruturados com correlation ID.** Um identificador nasce na borda e
   viaja em todas as chamadas, para você filtrar a requisição inteira num lugar
   só.
2. **Tracing distribuído** (OpenTelemetry, Jaeger, Zipkin): a linha do tempo da
   requisição serviço a serviço, mostrando *onde* foram os 2 segundos.
3. **Métricas e alertas** (Micrometer + Prometheus + Grafana): latência p95/p99,
   taxa de erro, fila crescendo, circuito aberto.

Somando: **health checks** (\`/actuator/health\`) para o orquestrador saber
reiniciar/tirar do balanceador quem está doente.

> Regra honesta: **observabilidade não é fase 2**. Sem ela, o primeiro incidente
> em produção vira arqueologia — e você vai desejar ter ficado no monolito.

## Testes num mundo distribuído

- **Unitários e de integração** continuam valendo dentro de cada serviço
  (Testcontainers sobe o banco e o broker de verdade).
- **Testes de contrato** (Pact, Spring Cloud Contract) resolvem o problema novo:
  garantir que o produtor não quebrou quem consome, **sem** subir os dois juntos
  a cada build.
- **End-to-end** com tudo no ar: caro e instável. Tenha poucos, só nos fluxos
  críticos de dinheiro.

Sobre versionar contrato: mudança **compatível** (campo novo opcional) não
quebra ninguém; mudança incompatível exige versão nova e um período com as duas
no ar. Vale para REST e — principalmente — para o formato dos eventos.

## O preço, dito sem romantismo

Adotar microsserviços te dá autonomia de time, escala seletiva, isolamento de
falha e liberdade tecnológica. Em troca, você paga:

- Infraestrutura: orquestrador, broker, gateway, CI/CD por serviço, ambientes.
- Depuração distribuída, consistência eventual, versionamento de contrato.
- Latência de rede e serialização onde antes havia chamada de método.
- Duplicação deliberada de dados (cada serviço guarda uma cópia do que precisa).
- Carga cognitiva: ninguém mais tem o sistema inteiro na cabeça.

## O meio-termo honesto: monolito modular

Antes de distribuir, arrume a casa. Um **monolito modular** organiza o código
por domínio, com fronteiras explícitas: cada módulo tem sua API interna, seu
schema de tabelas e **proíbe** acesso direto ao vizinho (ArchUnit ou Spring
Modulith testam isso no build).

Você ganha quase toda a clareza dos microsserviços mantendo transação local,
deploy único e depuração trivial. E se um módulo realmente precisar sair de casa
— por escala ou por time — a fronteira já existe: extrair vira um trabalho de
semanas, não de anos.

> A migração saudável quase sempre é essa: **monolito → monolito modular →
> extrair os módulos que doem**, um de cada vez (padrão *strangler fig*),
> começando pelo mais independente. Nunca "reescrever tudo em microsserviços".

## Checklist antes de adotar

1. **Times independentes de verdade?** Se é um time só, o custo não se paga.
2. **Consegue traçar as fronteiras de domínio?** Se o negócio ainda muda toda
   semana, cortar agora é cortar no lugar errado — e mudar uma fronteira depois
   de distribuída é caríssimo.
3. **Tem CI/CD automatizado?** Deploy manual × 20 serviços é inviável.
4. **Tem observabilidade (logs correlacionados, tracing, métricas)?**
5. **O time aceita consistência eventual no produto**, não só no código?
6. **A dor atual é real** (deploy travado, escala, autonomia) ou é vontade de
   usar a arquitetura da moda?

Se você respondeu "não" a duas ou mais, a resposta certa provavelmente é
**monolito modular bem feito** — e voltar a esta conversa quando a dor aparecer.
`.trim(),
};

const MENSAGERIA: TheoryArticle = {
  id: 'mensageria',
  title: 'Mensageria: comunicação assíncrona entre sistemas',
  summary:
    'Os conceitos que valem para qualquer broker: síncrono × assíncrono, fila × tópico × log, evento × comando, garantias de entrega, idempotência, ordem, outbox, DLQ e backpressure — antes de escolher a ferramenta.',
  icon: 'cards',
  tags: ['Mensageria', 'Integração', 'Sistemas distribuídos', 'Fundamentos'],
  readingMinutes: 19,
  body: `
## O problema: o acoplamento temporal

Duas aplicações precisam se falar. O jeito mais natural é uma chamar a outra e
esperar a resposta — HTTP, gRPC, chamada de método remota. É **comunicação
síncrona**, e ela carrega uma exigência silenciosa:

> Para a chamada dar certo, **as duas pontas precisam estar de pé, saudáveis e
> rápidas, no mesmo instante**. Isso se chama **acoplamento temporal**.

Veja o efeito no checkout de uma loja. Ao confirmar o pedido, o sistema precisa
gravar o pedido, cobrar o cartão, reservar estoque, mandar e-mail, emitir nota
fiscal e alimentar o BI:

\`\`\`text
SÍNCRONO (tudo em cadeia)

usuário ──► pedidos ──► pagamento (300ms)
                   └──► estoque   (150ms)
                   └──► e-mail    (400ms)   ◄── está fora do ar
                   └──► nota      (900ms)
                   └──► BI        (200ms)
             usuário espera a SOMA de tudo — e o pedido falha por causa do e-mail
\`\`\`

Dois problemas de uma vez: a latência é a soma de todos, e a disponibilidade é o
**produto** de todas. Cinco dependências com 99,9% cada dão ~99,5% no total — e
o pior é que o e-mail, que é o serviço menos importante do fluxo, tem poder de
derrubar a venda.

## A ideia da mensageria

Coloque um intermediário no meio. O emissor entrega a mensagem a ele e segue a
vida; o interessado busca quando puder.

\`\`\`text
ASSÍNCRONO (com broker)

usuário ──► pedidos ──publica──► [ BROKER ] ──► pagamento
            (responde em 20ms)       │       ──► estoque
                                     │       ──► e-mail   (fora do ar? espera)
                                     └───────► nota, BI
\`\`\`

O **broker** (RabbitMQ, Kafka, SQS, ActiveMQ…) é um servidor especializado em
receber, guardar e entregar mensagens de forma confiável. O que ele te dá:

- **Desacoplamento temporal** — o destinatário pode estar fora do ar; a mensagem
  espera por ele.
- **Desacoplamento de conhecimento** — quem publica não sabe quem consome.
  Adicionar um consumidor novo não toca uma linha do produtor.
- **Absorção de pico** (*buffer*) — chegam 10 mil pedidos/min e o serviço de nota
  processa 500/min. A fila cresce e depois esvazia; ninguém cai.
- **Isolamento de falha** — o consumidor quebrado atrapalha só a si mesmo.
- **Escala independente** — precisa de mais vazão num ponto? Suba mais
  consumidores só ali.

E o que ele **cobra** por isso:

- **Consistência eventual** — o efeito acontece "daqui a pouco", e a interface
  precisa admitir estados intermediários ("pagamento em processamento").
- **Mais uma peça** para operar, monitorar e entender.
- **Depuração distribuída** — o erro não está mais numa stack trace só.
- **Duplicatas e reordenação** viram problema seu (veremos como resolver).

## Os três modelos de comunicação

Toda ferramenta de mensageria é uma variação destes três desenhos.

### 1. Ponto a ponto (fila / *work queue*)

Uma mensagem, **um** consumidor. Vários trabalhadores disputam a mesma fila e
cada mensagem é entregue a apenas um deles.

\`\`\`text
produtor ──► [ fila ] ──► worker A
                      ──► worker B     cada mensagem vai para UM worker
                      ──► worker C
\`\`\`

É o modelo de **distribuição de trabalho**: gerar PDF, enviar e-mail,
redimensionar imagem. Quer processar mais rápido? Suba mais workers — o padrão
se chama *competing consumers*.

### 2. Publish/subscribe (tópico)

Uma mensagem, **todos** os interessados. Cada assinante recebe a **sua cópia**.

\`\`\`text
produtor ──► [ tópico ] ──► assinante "estoque"     (cópia)
                        ──► assinante "antifraude"  (cópia)
                        ──► assinante "BI"          (cópia)
\`\`\`

É o modelo de **notificação de fato**: "o pedido foi criado, quem se importa que
se sirva". Aqui o produtor deixa de saber quem existe do outro lado — o
desacoplamento máximo.

### 3. Log de eventos (*streaming*)

Um pub/sub em que as mensagens **não são apagadas ao serem lidas**: ficam
gravadas em ordem por um prazo de retenção, e cada consumidor guarda a própria
posição de leitura.

\`\`\`text
[ log ] │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ ...
          ▲               ▲
      consumidor B    consumidor A     cada um no seu ritmo, e podem VOLTAR
\`\`\`

Ganha-se o **replay**: um serviço novo lê o histórico para se popular; um bug
corrigido permite reprocessar a janela afetada. O log deixa de ser um cano por
onde as coisas passam e vira **registro do que aconteceu**.

> Na prática: RabbitMQ é excelente nos modelos 1 e 2; Kafka **é** o modelo 3.
> Essa é a raiz de quase toda a diferença entre os dois — e o assunto dos dois
> artigos seguintes.

## O vocabulário: mensagem, comando e evento

Nem toda mensagem é igual, e confundir os tipos gera arquitetura ruim:

| Tipo | Intenção | Nome | Destinatário |
| --- | --- | --- | --- |
| **Comando** | pedir uma ação | imperativo: \`EnviarEmail\` | um, específico |
| **Evento** | contar um fato consumado | passado: \`PedidoCriado\` | zero ou muitos |
| **Documento** | transportar dado | substantivo: \`RelatorioDiario\` | quem precisa |

A distinção que importa: **comando acopla, evento desacopla**. Quando o serviço
de pedidos publica \`EnviarEmail\`, ele decidiu o que o outro faz — é uma chamada
síncrona disfarçada de mensagem. Quando publica \`PedidoCriado\`, ele só narra o
que aconteceu no domínio dele; se amanhã o e-mail virar SMS, ou aparecer um
consumidor de antifraude, **nada muda no produtor**.

Bom evento é um **fato do passado, imutável, com nome de negócio**, carregando o
que os outros precisam para agir sem ter que voltar perguntando.

## Garantias de entrega: os três níveis

Esta é a parte que mais confunde, e cabe em três linhas:

- **At-most-once** (no máximo uma vez) — confirma antes de processar. Nunca
  duplica, **pode perder**. Serve para telemetria, métrica, batida de sensor.
- **At-least-once** (ao menos uma vez) — confirma depois de processar. Nunca
  perde, **pode duplicar**. É o padrão de praticamente todo sistema sério.
- **Exactly-once** (exatamente uma vez) — o ideal que, ponta a ponta, **não
  existe** de graça.

Por que a terceira é uma miragem: quando o produtor manda uma mensagem e o
timeout estoura, ele **não tem como saber** se a mensagem não chegou ou se
chegou e a confirmação se perdeu. Só há duas escolhas — reenviar (e arriscar
duplicar) ou desistir (e arriscar perder). Não existe terceira opção; é uma
limitação da rede, não da ferramenta.

> A resposta prática da indústria é sempre a mesma: **at-least-once + consumidor
> idempotente**. É mais simples, mais barato e mais robusto do que perseguir
> garantia perfeita.

## Idempotência: a habilidade de repetir sem estragar

Uma operação é **idempotente** quando executá-la duas vezes tem o mesmo efeito
que executá-la uma. Como a reentrega vai acontecer, isso deixa de ser refinamento
e vira requisito.

As três receitas, da mais simples à mais robusta:

**1. Deduplicação por id da mensagem.** Cada mensagem carrega um id único; o
consumidor registra o que já processou e ignora repetido:

\`\`\`java
@Transactional
public void processar(PedidoCriadoEvent evento) {
    // a PK da tabela é o id do evento: a segunda tentativa colide e sai fora
    if (!processados.registrarSeNovo(evento.eventoId())) {
        return;                      // já tratei este evento — nada a fazer
    }
    estoque.reservar(evento.pedidoId(), evento.itens());
}
\`\`\`

Detalhe que faz diferença: o registro do id e o efeito precisam estar na
**mesma transação**. Registrar antes e falhar no meio significa perder o
processamento para sempre.

**2. Operação naturalmente idempotente.** \`UPDATE saldo SET valor = 500\` pode
rodar mil vezes; \`UPDATE saldo SET valor = valor + 500\` não. Sempre que possível,
modele a mensagem carregando o **estado final**, não o delta.

**3. Chave de idempotência no destino.** Quando o efeito é uma chamada externa
(cobrar cartão), envie uma chave estável e deixe o provedor deduplicar — é assim
que gateways de pagamento sérios funcionam.

## Ordem: você tem menos do que imagina

Assim que existem dois consumidores na mesma fila, **a ordem acaba**: a mensagem
A pode terminar depois da B só porque caiu num worker mais lento.

Três formas de conviver com isso:

1. **Não depender de ordem.** Mensagens comutativas e idempotentes ("o estado do
   pedido agora é X") resolvem sozinhas — é a saída mais barata.
2. **Ordenar por chave.** Garanta que tudo de uma mesma entidade caia no mesmo
   caminho de processamento (é exatamente o que a partição por chave do Kafka
   faz). Ordem por pedido, paralelismo entre pedidos.
3. **Consumidor único.** Ordem total garantida, vazão de um. Só quando o volume
   é baixo e a ordem é inegociável.

Some a isso a defesa contra mensagem atrasada: carregue **versão ou timestamp**
no evento e descarte o que for mais velho que o estado atual.

## O buraco entre o banco e o broker: o padrão Outbox

Este é o bug mais sutil de mensageria, e quase todo projeto o comete uma vez:

\`\`\`java
@Transactional
public void criar(CriarPedidoRequest req) {
    pedidos.save(pedido);              // 1. commitou no banco
    broker.publicar(new PedidoCriado(pedido));   // 2. e se falhar AQUI?
}
\`\`\`

Banco e broker são dois sistemas diferentes: **não existe transação atômica
entre eles**. Se o passo 2 falha, o pedido existe e ninguém ficou sabendo — o
estoque nunca reserva. Inverter a ordem só troca de problema (evento publicado
de um pedido que não foi salvo).

A solução padrão é o **Outbox**: grave o evento numa tabela **na mesma transação
do dado**, e deixe um processo separado publicar a partir dela.

\`\`\`sql
CREATE TABLE outbox (
  id          UUID PRIMARY KEY,
  tipo        VARCHAR(120) NOT NULL,
  payload     JSONB        NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT now(),
  publicado_em TIMESTAMP                       -- NULL = ainda não publicado
);
\`\`\`

\`\`\`text
[transação única]  salva pedido + insere na outbox   ──► commit atômico
                                │
       publicador (job ou CDC) lê a outbox ──► broker ──► marca publicado_em
\`\`\`

O banco vira a fonte da verdade e o evento **não se perde**. Como o publicador
pode publicar e cair antes de marcar, você ganha duplicata — e volta ao acordo
de sempre: at-least-once com consumidor idempotente.

## Quando dá errado: DLQ, retry e *poison message*

Uma mensagem que falha e volta imediatamente para a fila falha de novo, para
sempre: é a *poison message*, e ela consome CPU, polui log e pode travar o fluxo.
O tratamento maduro tem três camadas:

1. **Distinga o erro.** Falha **transitória** (API fora por 3 s, deadlock) merece
   nova tentativa. Falha **permanente** (JSON inválido, campo obrigatório
   faltando, regra de negócio violada) **nunca** deve ser retentada — vai falhar
   igual daqui a mil tentativas.
2. **Retente com backoff exponencial.** 1 s, 2 s, 4 s, 8 s — com um limite. Retry
   imediato e em massa vira *thundering herd* em cima de um serviço que já estava
   sofrendo.
3. **Dead Letter Queue (DLQ).** Estourou o limite? A mensagem vai para uma fila
   de erro onde alguém investiga e reprocessa depois. Nada é descartado em
   silêncio.

> **DLQ sem alerta é lixeira.** Se ninguém olha, você trocou "perder mensagem"
> por "perder mensagem numa fila bonita". Monitore o tamanho da DLQ como um
> incidente.

## Backpressure: quando o consumidor não dá conta

A métrica mais importante de qualquer sistema de mensageria é o **lag**: o
tamanho da fila, ou a distância entre o que foi produzido e o que foi consumido.

Fila crescendo em rampa significa produtor mais rápido que consumidor, e só há
quatro saídas honestas: **escalar consumidores** (se o modelo permitir
paralelismo), **otimizar o consumidor** (o gargalo quase sempre é uma query ou
uma API externa), **agrupar em lote** (uma escrita de 100 em vez de 100 escritas)
ou **limitar o produtor**. Ignorar não é uma delas — a fila é um amortecedor com
tamanho finito, e o dia em que ela estoura é sempre no pico.

## O panorama de ferramentas

| Ferramenta | Modelo dominante | Onde brilha |
| --- | --- | --- |
| **RabbitMQ** | fila + pub/sub (AMQP) | roteamento rico, tarefas, retry maduro |
| **Kafka** | log distribuído | eventos, replay, alto volume, analytics |
| **AWS SQS/SNS** | fila / pub/sub gerenciados | zero operação em quem já vive na AWS |
| **ActiveMQ Artemis** | JMS clássico | ecossistema Java corporativo, XA |
| **Redis Streams** | log simples | baixa latência, quando o Redis já existe |
| **Apache Pulsar** | fila + log | multi-tenant, geo-replicação nativa |

Padrões em volta: **JMS** é a API padrão Java (só define a interface, não o
protocolo); **AMQP** é um protocolo de fato, interoperável entre linguagens; e
**Spring** oferece abstrações (\`spring-amqp\`, \`spring-kafka\`, \`JmsTemplate\`)
que deixam produtor e consumidor com cara parecida qualquer que seja o broker.

## Como escolher, sem torcida

Comece pela pergunta que separa os mundos: **o dado precisa ser relido depois?**

- **Não, é uma tarefa** ("processe isto, uma vez, por um trabalhador") →
  fila/broker de tarefa (**RabbitMQ**, SQS).
- **Sim, é um fato que muitos vão querer ler, talvez de novo** → **log de
  eventos** (**Kafka**).

Depois refine com: precisa de roteamento sofisticado (Rabbit) ou de ordem por
entidade e volume alto (Kafka)? O time consegue operar cluster ou é melhor
gerenciado? Já existe algo na casa que resolve — porque **um broker a menos é
sempre mais simples**?

## Quando **não** usar mensageria

Assíncrono não é sinônimo de melhor. Fique no síncrono quando:

- **Você precisa da resposta para continuar** — validar saldo, autenticar,
  consultar preço. Pergunta é síncrona; fato consumado é evento.
- **O usuário precisa do resultado imediato na tela** e o negócio não aceita
  "em processamento".
- **O sistema é pequeno e o time é um só** — um broker a mais é uma peça a mais
  para operar, monitorar e explicar para quem entra no time.
- **Falta observabilidade.** Sem log correlacionado e métrica de lag, o primeiro
  incidente vira arqueologia.

> Regra de bolso: mensageria resolve **acoplamento**, não lentidão. Se o
> problema é uma query de 4 segundos, jogar a query numa fila só muda o lugar
> onde a demora acontece.

## Checklist de mensageria bem feita

1. **Evento é fato no passado** (\`PedidoCriado\`), não comando disfarçado.
2. **Toda mensagem tem id** — sem id não há deduplicação.
3. **Consumidor é idempotente** — porque a reentrega *vai* acontecer.
4. **Publicação pelo outbox** — nada de commit no banco e evento perdido.
5. **Erro tem política**: transitório retenta com backoff, permanente vai direto
   para a DLQ.
6. **DLQ monitorada e com alerta.**
7. **Lag da fila em gráfico**, com alerta de crescimento sustentado.
8. **Schema do evento versionado e evoluído de forma compatível** — o evento
   vira contrato público e vive mais que o código que o criou.
9. **Payload enxuto** — trafegue a referência do arquivo, não o arquivo.
10. **Ordem: você depende dela?** Se sim, saiba exatamente qual mecanismo a
    garante.

Com esses conceitos no lugar, os dois artigos seguintes deixam de ser "como
configurar uma ferramenta" e passam a ser o que realmente são: **duas respostas
diferentes** para as mesmas perguntas que você acabou de ver.
`.trim(),
};

const RABBITMQ: TheoryArticle = {
  id: 'rabbitmq',
  title: 'RabbitMQ: filas, exchanges e entrega confiável',
  summary:
    'O modelo AMQP explicado do zero: producer, exchange, binding, fila e consumer; tipos de roteamento, ack e prefetch, durabilidade, dead-letter e retry — com Spring AMQP na prática.',
  icon: 'send',
  tags: ['Mensageria', 'RabbitMQ', 'Integração', 'Spring'],
  readingMinutes: 19,
  body: `
## Onde o RabbitMQ se encaixa

O artigo de **mensageria** explicou *por que* colocar um broker no meio:
desacoplamento temporal, absorção de pico, isolamento de falha. Este mostra
*como* uma ferramenta específica faz isso — e o RabbitMQ é o representante
clássico do modelo de **fila de trabalho**.

Ele é um broker que implementa o protocolo **AMQP 0-9-1**. Ele é
excelente em **roteamento** e em **trabalho por tarefa** — quando o que você quer
é entregar cada mensagem a *um* trabalhador que a processa e a descarta.

## O modelo mental do AMQP

Este é o desenho que resolve 90% das dúvidas de RabbitMQ:

\`\`\`text
                            binding (routing key)
  PRODUCER ──publish──►  EXCHANGE ────────────────►  QUEUE  ──deliver──► CONSUMER
                            │  (decide o destino)      (guarda)
                            └────────────────────────► QUEUE ──────────► CONSUMER
\`\`\`

Quatro peças e uma regra:

- **Producer** publica — e ele publica **sempre numa exchange**, nunca direto
  numa fila.
- **Exchange** é o roteador: recebe a mensagem e decide para quais filas copiá-la
  (pode ser nenhuma, uma ou muitas).
- **Binding** é a regra que liga exchange → fila, normalmente com uma
  *routing key*.
- **Queue** é onde a mensagem **fica guardada** até alguém consumir.
- **Consumer** recebe da fila e confirma o processamento.

> A confusão mais comum de quem vem do Kafka: no RabbitMQ, **a mensagem some da
> fila depois de processada**. Não existe "reler o histórico" — a fila é um
> buffer de trabalho, não um registro. É a diferença central entre os dois
> mundos.

## Os tipos de exchange (o coração do roteamento)

### direct — chave exata

A mensagem vai para as filas cujo binding tem **exatamente** a routing key
publicada.

\`\`\`text
publish(routing_key = "pedido.criado")
  └─► exchange direct ─► fila "pedidos" (binding: "pedido.criado")   ✔
                       ─► fila "cancel"  (binding: "pedido.cancelado") ✘
\`\`\`

### fanout — copia para todas

Ignora a routing key e copia para **todas** as filas ligadas. É o broadcast:
"aconteceu, quem estiver ligado recebe".

### topic — padrões com \`*\` e \`#\`

O mais usado em sistemas reais. A routing key vira uma hierarquia com pontos, e
o binding usa curingas: \`*\` casa **uma** palavra, \`#\` casa **zero ou mais**.

\`\`\`text
routing keys publicadas:   pedido.criado.br     pagamento.aprovado.br

binding "pedido.*.*"   →  pega pedido.criado.br
binding "pedido.#"     →  pega qualquer coisa de pedido
binding "#.br"         →  pega tudo do Brasil
binding "#"            →  pega tudo (vira um fanout)
\`\`\`

Combine com uma convenção de nomes (\`dominio.evento.detalhe\`) e você tem um
esquema de roteamento que aguenta o sistema crescer sem reescrever produtor.

### headers — pelo cabeçalho

Roteia por atributos do cabeçalho em vez da routing key. Raro; use quando os
critérios são muitos e não cabem numa string.

> Existe ainda a *default exchange* (\`""\`), que entrega para a fila cujo nome é
> igual à routing key. Serve para brincar, mas amarra produtor a nome de fila —
> em produção, crie exchanges nomeadas.

## O ciclo de vida da mensagem: ack e prefetch

O consumidor precisa dizer ao broker o que aconteceu:

- **ack** — processei com sucesso, pode apagar.
- **nack/reject com \`requeue=true\`** — falhei, devolve para a fila.
- **nack/reject com \`requeue=false\`** — falhei de vez, manda para o
  dead-letter (veja adiante).

Se o consumidor **cair antes do ack**, o RabbitMQ percebe a conexão morta e
reentrega a mensagem a outro consumidor. Isso te dá **entrega ao menos uma vez**
(*at-least-once*) — e por isso o processamento precisa ser **idempotente**:
processar a mesma mensagem duas vezes não pode cobrar duas vezes.

> Nunca use *auto-ack* em trabalho que importa: ele confirma na entrega, antes
> do processamento. Se o consumidor morrer no meio, a mensagem foi perdida e
> ninguém fica sabendo.

O **prefetch** (QoS) limita quantas mensagens não confirmadas o broker manda por
consumidor. Sem limite, o primeiro consumidor a conectar puxa a fila inteira
para a memória e os outros ficam ociosos — mesmo com trabalho sobrando.
\`prefetch = 1\` distribui de forma justa (bom para tarefas longas e desiguais);
valores de 10 a 100 dão mais vazão em tarefas curtas.

## Durabilidade: o que sobrevive a um restart

Três chaves precisam estar ligadas juntas, e cada uma cobre uma ponta:

1. **Fila durável** (\`durable = true\`) — a fila continua existindo após o
   broker reiniciar.
2. **Mensagem persistente** (\`delivery_mode = 2\`) — o conteúdo é gravado em
   disco. Fila durável com mensagem transiente perde as mensagens do mesmo jeito.
3. **Publisher confirms** — o broker responde ao produtor "recebi e gravei". Sem
   isso, um \`publish\` que se perdeu na rede parece sucesso para a sua
   aplicação.

Falta ainda o buraco clássico: e se o banco confirmou a transação e o \`publish\`
falhou (ou o contrário)? Você fica com estados divergentes. A solução padrão é o
***outbox***: na **mesma transação** do banco, grave o evento numa tabela
\`outbox\`; um processo separado lê essa tabela e publica no broker, marcando o
que já foi. O banco vira a fonte da verdade e o evento nunca se perde.

## Quando dá errado: dead-letter e retry

Uma mensagem que falha e volta para a fila **imediatamente** volta a falhar —
e você criou um laço infinito que consome CPU e polui o log. Duas peças
resolvem:

**Dead Letter Exchange (DLX).** A fila é configurada com uma exchange de destino
para onde a mensagem vai quando é rejeitada (\`requeue=false\`), expira por TTL ou
estoura o limite da fila. Dali ela cai numa **fila de erro** onde você inspeciona
o que aconteceu, sem perder nada.

**Retry com atraso.** Falha transitória (API fora por 3 segundos) merece nova
tentativa — mas depois de esperar. O jeito clássico usa uma fila de espera com
TTL cujo dead-letter aponta de volta para a fila principal:

\`\`\`text
                falha
fila.pedidos ──────────► fila.pedidos.retry (TTL 30s, DLX → fila.pedidos)
      ▲                              │
      └──── volta após 30s ──────────┘

  depois de N tentativas ──► fila.pedidos.dlq  (parking lot: alguém olha)
\`\`\`

Use o cabeçalho de contagem de tentativas para desistir depois de N vezes e
mandar para a *parking lot queue*. Regra de ouro: **erro de dado nunca deve ser
retentado** (JSON inválido vai falhar para sempre) — só erro de infraestrutura.
Existe também o plugin \`rabbitmq_delayed_message_exchange\`, que faz o atraso
nativamente.

## Distribuindo o trabalho: competing consumers

Vários consumidores na **mesma fila** disputam as mensagens: cada mensagem vai
para **um** deles. É assim que você escala — subiu mais réplicas, processou mais
rápido, sem mudar nada no produtor.

O preço: **a ordem se perde**. Se as mensagens A e B saem em ordem mas caem em
consumidores diferentes, B pode terminar antes de A. Se a ordem importa para uma
entidade específica, ou você usa um consumidor só (perde vazão) ou modela o
processamento para ser **comutativo/idempotente** (a mensagem carrega o estado
final, não o delta). Ordenação forte por chave é justamente o que o Kafka faz
melhor.

## Mão na massa com Spring AMQP

Dependência: \`spring-boot-starter-amqp\`. Configuração:

\`\`\`yaml
spring:
  rabbitmq:
    host: \${RABBIT_HOST:localhost}
    port: 5672
    username: \${RABBIT_USER:guest}
    password: \${RABBIT_PASS:guest}
    publisher-confirm-type: correlated   # publisher confirms
    listener:
      simple:
        prefetch: 20
        acknowledge-mode: auto           # ack no retorno do método, nack se lançar
        default-requeue-rejected: false  # falhou -> vai pro DLX, não volta em loop
\`\`\`

Declarando a topologia como beans (o Spring cria no start se não existir):

\`\`\`java
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "pedidos.exchange";
    public static final String FILA      = "pedidos.criados";
    public static final String DLX       = "pedidos.dlx";
    public static final String DLQ       = "pedidos.criados.dlq";

    @Bean TopicExchange exchange() { return new TopicExchange(EXCHANGE); }
    @Bean FanoutExchange dlx()     { return new FanoutExchange(DLX); }

    @Bean
    Queue fila() {
        return QueueBuilder.durable(FILA)
                .deadLetterExchange(DLX)     // para onde vai quando falha
                .build();
    }

    @Bean Queue dlq() { return QueueBuilder.durable(DLQ).build(); }

    @Bean
    Binding binding() {
        return BindingBuilder.bind(fila()).to(exchange()).with("pedido.criado.#");
    }

    @Bean Binding dlqBinding() { return BindingBuilder.bind(dlq()).to(dlx()); }

    /** Sem isso o payload vai como serialização Java — use JSON. */
    @Bean MessageConverter jsonConverter() { return new Jackson2JsonMessageConverter(); }
}
\`\`\`

Publicando (dentro do serviço, junto com a regra de negócio):

\`\`\`java
@Service
public class PedidoService {

    private final RabbitTemplate rabbit;
    private final PedidoRepository pedidos;

    // construtor...

    @Transactional
    public PedidoDto criar(CriarPedidoRequest req) {
        Pedido pedido = pedidos.save(Pedido.criar(req));
        rabbit.convertAndSend(
            RabbitConfig.EXCHANGE,
            "pedido.criado.br",                       // routing key
            new PedidoCriadoEvent(pedido.getId(), pedido.getTotal())
        );
        return PedidoDto.de(pedido);
    }
}
\`\`\`

Consumindo:

\`\`\`java
@Component
public class PedidoCriadoListener {

    @RabbitListener(queues = RabbitConfig.FILA, concurrency = "3-10")
    public void aoCriarPedido(PedidoCriadoEvent evento) {
        // 1. idempotência: já processei este id? então só retorno.
        // 2. faz o trabalho de verdade
        // retornar normalmente = ACK; lançar exceção = NACK -> DLX
    }
}
\`\`\`

Note o contrato implícito: **retornar confirma, lançar rejeita**. Por isso
capturar exceção e engolir dentro do listener é perigoso — o Rabbit vai achar
que deu tudo certo.

Para retentar antes de mandar ao DLQ, ligue o retry do listener:

\`\`\`yaml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true
          max-attempts: 4
          initial-interval: 1s
          multiplier: 2.0        # 1s, 2s, 4s
\`\`\`

## Operação: o que olhar em produção

- **Fila crescendo sem parar** é o alarme número um: produtor mais rápido que
  consumidor. Ou escala consumidores, ou o consumidor tem um gargalo (query
  lenta, API externa).
- **Mensagens não confirmadas (*unacked*) altas** — consumidores travados
  segurando mensagens; revise prefetch e timeouts.
- **DLQ com itens** — sempre com alerta. DLQ silenciosa é dado perdido que
  ninguém viu.
- **Quorum queues** (replicadas via Raft) são o padrão moderno para filas que
  precisam sobreviver à queda de um nó; *lazy queues* mantêm o conteúdo em disco
  e evitam estourar a RAM em filas gigantes.
- **Mensagem pequena.** Não trafegue arquivo pelo broker: publique a referência
  (o caminho no S3/bucket) e deixe o consumidor buscar.

## Erros comuns (checklist de revisão)

1. **Auto-ack em trabalho que importa** — perde mensagem em silêncio.
2. **Sem prefetch** — um consumidor açambarca a fila, os outros ficam ociosos.
3. **\`requeue=true\` no erro** — laço infinito de reprocessamento.
4. **Fila durável com mensagem transiente** (ou vice-versa) — durabilidade só
   funciona com as duas pontas ligadas.
5. **Sem DLQ** — mensagem ruim some ou trava a fila.
6. **Consumidor não idempotente** — reentrega vira cobrança duplicada.
7. **Publicar fora do outbox** — banco commitado e evento perdido (ou o inverso).
8. **Usar Rabbit como banco** — fila é caminho de passagem; histórico e replay
   são caso de Kafka.

> Resumo do que o RabbitMQ é: um **roteador de tarefas** muito bom, com
> roteamento expressivo, entrega confiável por mensagem e política de erro
> madura. Quando o requisito vira "reler o histórico inteiro", "ordenar por
> chave" ou "milhões de eventos por segundo", o próximo artigo é o seu.
`.trim(),
};

const KAFKA: TheoryArticle = {
  id: 'kafka',
  title: 'Kafka: o log distribuído que guarda os eventos',
  summary:
    'Tópicos, partições e offsets; por que a chave define a ordem; consumer groups e rebalance; retenção, replay e compactação; replicação e garantias — com Spring Kafka e a comparação honesta com RabbitMQ.',
  icon: 'zap',
  tags: ['Mensageria', 'Kafka', 'Streaming', 'Sistemas distribuídos'],
  readingMinutes: 20,
  body: `
## Kafka não é uma fila — é um log

A frase mais útil para entender Kafka: ele é um **log append-only, distribuído e
persistente**. Um caderno onde eventos são anotados no fim, em ordem, e ficam lá
pelo tempo que você configurar.

A diferença prática com uma fila tradicional muda tudo:

\`\`\`text
FILA (RabbitMQ)                     LOG (Kafka)
consumiu -> a mensagem SOME         consumiu -> o registro FICA
o broker controla o que foi lido    o CONSUMIDOR controla onde está (offset)
reprocessar? só se republicar       reprocessar? volta o offset e lê de novo
\`\`\`

Como o dado **permanece**, três coisas viram triviais no Kafka e difíceis fora
dele: **vários consumidores independentes** lendo o mesmo fluxo sem se atrapalhar,
**replay** (um serviço novo lê os últimos 7 dias para se popular; um bug foi
corrigido e você reprocessa) e **vazão altíssima**, porque escrever no fim de um
arquivo sequencial é a operação mais rápida que existe em disco.

## Tópico, partição e offset

- **Tópico** é o nome do fluxo (\`pedidos\`, \`cliques\`, \`pagamentos\`).
- Cada tópico é dividido em **partições** — e é a partição que é, de fato, o log.
- Dentro de uma partição, cada registro ganha um número sequencial: o **offset**.

\`\`\`text
tópico "pedidos"

partição 0 │ 0 │ 1 │ 2 │ 3 │ 4 │ ◄── novos entram aqui
partição 1 │ 0 │ 1 │ 2 │
partição 2 │ 0 │ 1 │ 2 │ 3 │
\`\`\`

Duas consequências que precisam ficar grudadas na sua cabeça:

1. **A ordem é garantida dentro da partição — nunca no tópico inteiro.** Não
   existe "ordem global" em tópico com várias partições.
2. **Partição é a unidade de paralelismo.** Um tópico com 6 partições comporta,
   no máximo, 6 consumidores ativos do mesmo grupo. Poucas partições limitam a
   escala; partições demais custam memória, arquivos e tempo de rebalance.

## A chave decide a partição (e, portanto, a ordem)

Todo registro pode ter uma **chave**. O produtor calcula
\`hash(chave) % nº de partições\` e sempre manda a mesma chave para a mesma
partição.

\`\`\`text
chave = "pedido-42"  ──► sempre partição 1  ──► ordem preservada para esse pedido
chave = "pedido-77"  ──► sempre partição 2
chave = null         ──► distribuição balanceada, sem garantia de ordem
\`\`\`

Esse é o truque central do Kafka: você tem **ordem por entidade e paralelismo ao
mesmo tempo**. Todos os eventos de um pedido são processados em sequência, e
pedidos diferentes rodam em paralelo. Escolha a chave como a entidade cuja
história precisa ser ordenada (id do pedido, do cliente, da conta).

> Cuidado com a **chave quente**: se 80% do tráfego tem a mesma chave, uma
> partição vira o gargalo e as outras ficam à toa. E aumentar o número de
> partições depois **muda o cálculo do hash** — chaves passam a cair em outro
> lugar e a ordem histórica se quebra. Dimensione com folga desde o começo.

## O produtor: o que \`acks\` significa

\`\`\`text
acks=0   → dispara e esquece. Rápido e capaz de perder tudo.
acks=1   → o líder gravou. Se o líder cair antes de replicar, perdeu.
acks=all → o líder e as réplicas em sincronia gravaram. É o que se usa.
\`\`\`

Com \`acks=all\` + \`min.insync.replicas=2\` (num cluster de 3), você aguenta
perder um nó sem perder dado. Some \`enable.idempotence=true\` e o produtor
deixa de gerar duplicatas quando um retry acontece após um timeout.

O produtor também **agrupa** registros em lotes (\`linger.ms\`, \`batch.size\`) e
comprima-os (\`compression.type=lz4\`). Esperar 5 ms para juntar mensagens
multiplica a vazão — é assim que Kafka chega a números que fila por mensagem não
alcança.

## Consumer group: como o trabalho se divide

Consumidores que declaram o **mesmo \`group.id\`** formam um grupo, e o Kafka
distribui as partições entre eles — cada partição é atendida por **um único**
membro do grupo.

\`\`\`text
tópico "pedidos" (3 partições)

grupo "estoque":       consumidor A → p0, p1     consumidor B → p2
grupo "notificacoes":  consumidor C → p0, p1, p2   (lê TUDO, independente)
\`\`\`

Dois grupos diferentes leem o **mesmo dado** sem interferir um no outro — cada
grupo tem seu próprio marcador de posição. É o mesmo fluxo servindo estoque,
notificações, antifraude e BI de uma vez.

Quando um consumidor entra, sai ou trava, acontece um **rebalance**: as
partições são redistribuídas e o consumo pausa por um instante. Rebalance demais
é sintoma de \`max.poll.interval.ms\` curto para o tempo de processamento — o
broker acha que o consumidor morreu porque ele demorou a voltar ao \`poll()\`.

## Offsets, commit e a garantia real

O grupo guarda, para cada partição, o offset já processado (num tópico interno,
\`__consumer_offsets\`). Quando o consumidor reinicia, ele retoma dali.

Onde mora o risco:

- **Commit antes de processar** → se cair no meio, aquele registro nunca será
  processado. Você perdeu dado (*at-most-once*).
- **Commit depois de processar** → se cair depois de processar e antes do commit,
  o registro é lido de novo (*at-least-once*).

O padrão é o segundo, com **commit manual depois do trabalho** — e, de novo,
**idempotência no consumidor**. Guardar o id do evento já tratado, ou fazer
\`UPSERT\` em vez de \`INSERT\`, é o que transforma "pode repetir" em "repetir não
faz mal".

## Retenção e replay: o superpoder

O Kafka apaga por **política de retenção** (por tempo ou por tamanho), não por
consumo:

\`\`\`text
retention.ms = 604800000   → guarda 7 dias, tenha alguém lido ou não
retention.ms = -1          → guarda para sempre (com custo de disco)
\`\`\`

Isso habilita coisas que fila não faz:

- Subir um serviço novo e **populá-lo com o histórico** só de apontar o offset
  para o começo.
- Corrigir um bug de consumidor e **reprocessar** a janela afetada.
- Auditar exatamente o que chegou, na ordem em que chegou.

> É por isso que Kafka é a espinha dorsal de arquiteturas orientadas a eventos,
> *event sourcing* e pipelines de dados: o log **é** a fonte da verdade
> compartilhada, não um cano por onde as coisas passam.

## Replicação: como ele não perde dados

Cada partição tem um **líder** e N **réplicas** em outros brokers
(\`replication.factor=3\` é o comum). Toda escrita e leitura passa pelo líder; as
réplicas copiam. As que estão em dia formam o conjunto **ISR** (*in-sync
replicas*).

Se o broker líder cai, uma réplica do ISR é promovida — os clientes redescobrem
o novo líder e a vida segue. Por isso a combinação \`acks=all\` +
\`min.insync.replicas=2\` importa: ela garante que o dado confirmado existe em
mais de uma máquina antes de o produtor comemorar.

## Compactação: o log que vira "estado atual"

Além de apagar por tempo, o Kafka pode **compactar**: manter apenas o **último
valor de cada chave**.

\`\`\`text
antes:  (cliente-1, "SP") (cliente-2, "RJ") (cliente-1, "MG")
depois: (cliente-2, "RJ") (cliente-1, "MG")
\`\`\`

Um tópico compactado funciona como uma tabela de estado atual reconstruível: é
assim que se replicam dados de referência entre serviços (cada serviço mantém
sua cópia local atualizada) e é a base do **CDC** (Change Data Capture, com
Debezium lendo o log do banco e publicando as mudanças). Publicar valor \`null\`
para uma chave é a *tombstone*: manda apagar aquele registro.

## Exactly-once: existe, e raramente é o que você precisa

Kafka suporta **transações**: produzir em vários tópicos e commitar offsets de
forma atômica, o que dá *exactly-once* no fluxo
**consome → processa → produz** (o modo \`read_committed\`). É a base do Kafka
Streams.

Mas quando o efeito colateral sai do Kafka (gravar no seu banco, chamar uma API
de pagamento), não existe exactly-once mágico. A resposta continua sendo a de
sempre: **at-least-once + idempotência**. É mais simples, mais barato e mais
robusto do que tentar garantia global.

## Contrato dos eventos: schema importa

O evento é um contrato público que vai durar mais que o código que o gerou. Trate
com o mesmo cuidado de uma API REST:

- Prefira formatos com schema (Avro, Protobuf, JSON Schema) e um **Schema
  Registry** validando compatibilidade no build.
- Evolua de forma **compatível**: adicionar campo opcional, sim; remover ou
  renomear campo, não — publique um tópico v2 e migre os consumidores.
- Publique **fatos**, no passado: \`PedidoCriado\`, \`PagamentoAprovado\`. Comando
  disfarçado de evento (\`EnviarEmail\`) recria o acoplamento que você queria
  eliminar.

## Mão na massa com Spring Kafka

Dependência: \`spring-kafka\`. Configuração:

\`\`\`yaml
spring:
  kafka:
    bootstrap-servers: \${KAFKA_BROKERS:localhost:9092}
    producer:
      acks: all
      properties:
        enable.idempotence: true
        linger.ms: 5
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: estoque-service
      auto-offset-reset: earliest      # grupo novo lê desde o começo
      enable-auto-commit: false        # commit manual, depois de processar
      properties:
        spring.json.trusted.packages: com.learnway.*
    listener:
      ack-mode: record
      concurrency: 3                   # 3 threads = até 3 partições por instância
\`\`\`

Produzindo — repare na **chave**, que define partição e ordem:

\`\`\`java
@Service
public class PedidoEventPublisher {

    private final KafkaTemplate<String, PedidoCriadoEvent> kafka;

    // construtor...

    public void publicar(Pedido pedido) {
        kafka.send("pedidos",
                   pedido.getId().toString(),          // chave = id do pedido
                   new PedidoCriadoEvent(pedido.getId(), pedido.getTotal()))
             .whenComplete((res, erro) -> {
                 if (erro != null) log.error("falha ao publicar", erro);
             });
    }
}
\`\`\`

Consumindo:

\`\`\`java
@Component
public class PedidoCriadoConsumer {

    @KafkaListener(topics = "pedidos", groupId = "estoque-service")
    public void consumir(ConsumerRecord<String, PedidoCriadoEvent> registro) {
        var evento = registro.value();
        // idempotência: se este id já foi tratado, retorne sem repetir o efeito
        estoque.reservar(evento.pedidoId(), evento.itens());
        // retornou sem exceção -> o container commita o offset
    }
}
\`\`\`

Retry e *dead-letter topic* (o equivalente à DLQ):

\`\`\`java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);   // -> "pedidos.DLT"
    // 3 tentativas: 1s, 2s, 4s — depois manda para o DLT e segue a vida
    return new DefaultErrorHandler(recoverer, new ExponentialBackOff(1000L, 2.0));
}
\`\`\`

Detalhe que só se aprende apanhando: no Kafka, um registro que falha e **não** é
desviado **trava a partição** — como o offset não avança, ninguém atrás dele
passa. Sem tratamento de erro, uma mensagem envenenada para o fluxo inteiro.

## Kafka ou RabbitMQ?

| Critério | RabbitMQ | Kafka |
| --- | --- | --- |
| Modelo | fila: consumiu, sumiu | log: consumiu, permanece |
| Roteamento | rico (topic, fanout, headers) | simples: tópico + partição |
| Ordem | frágil com vários consumidores | garantida por chave/partição |
| Replay | não | sim, é o ponto central |
| Vazão típica | dezenas de milhares/s | milhões/s |
| Vários consumidores do mesmo fluxo | precisa duplicar filas | grupos independentes, nativo |
| Retentativa por mensagem | madura (DLX, TTL, delay) | manual (retry + DLT) |
| Operação | mais simples | mais peças e mais tuning |

Como escolher, sem torcida:

- **RabbitMQ** quando o caso é **tarefa**: "processe este trabalho, uma vez, por
  um trabalhador" — envio de e-mail, geração de PDF, integrações pontuais, com
  roteamento esperto e política de erro por mensagem.
- **Kafka** quando o caso é **fluxo de eventos**: muitos consumidores lendo o
  mesmo fato, ordem por entidade, replay, retenção, volume alto, analytics e
  CDC.
- **Os dois juntos** é comum e legítimo: Kafka como espinha dorsal de eventos de
  negócio, Rabbit para filas de tarefa dentro de cada serviço.

## Checklist antes de ir para produção

1. **A chave está certa?** Ela define ordem *e* balanceamento. Chave errada = ou
   ordem quebrada, ou partição quente.
2. **Nº de partições dimensionado com folga** — aumentar depois embaralha o
   hash e o histórico.
3. **\`acks=all\`, \`min.insync.replicas=2\`, \`replication.factor=3\`** em tópico
   que carrega dado de negócio.
4. **Commit manual depois de processar** e consumidor **idempotente**.
5. **Tratamento de erro com DLT** — senão a partição trava.
6. **Retenção consciente** — quanto tempo você precisa poder reprocessar?
7. **Consumer lag monitorado** — é a métrica que diz se você está acompanhando
   o produtor. Lag subindo em rampa é incidente a caminho.
8. **Schema versionado e compatível** — o evento sobrevive ao código.

> Fechando a trilha: **microsserviços** criam a necessidade de conversar sem
> acoplamento; **RabbitMQ** entrega tarefa com roteamento e retentativa; **Kafka**
> guarda a história dos fatos para quem quiser ler, agora ou daqui a uma semana.
> Saber qual das três ideias resolve o seu problema vale mais do que dominar a
> configuração de qualquer uma delas.
`.trim(),
};

export const THEORY_ARTICLES: TheoryArticle[] = [
  JPA_HIBERNATE,
  SPRING_DATA_PRATICA,
  REST_APIS,
  SEGURANCA_JWT,
  TESTES_AUTOMATIZADOS,
  DOCKER_JAVA,
  GIT_EQUIPES,
  ARQUITETURA_CAMADAS,
  ESTRUTURA_PASTAS,
  MICROSSERVICOS,
  MENSAGERIA,
  RABBITMQ,
  KAFKA,
];
