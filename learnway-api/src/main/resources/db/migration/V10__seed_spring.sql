-- =====================================================================
-- LearnWay — seed "Spring & Ecossistema"
--   * 4 subtopics encadeados: Spring Core -> Spring MVC & REST ->
--     Spring Data & Transações -> Security & Testes
--   * 8 lessons com teoria completa
--   * 17 questões: MULTIPLE_CHOICE, DESCRIPTIVE e CODE_CHALLENGE
-- Convenção de UUIDs (mesma do V5/V9): sufixo determinístico
--   subtopic  a2…0000000004SS      lesson    a3…000000 04 SS LL
--   question  a4…0000 04 SS LL QQ  option    a5…00 04 SS LL QQ OO
--   descr.    a7…= question        code ch.  a6…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000401', 'a1000000-0000-0000-0000-000000000004', 'spring-core',            'Spring Core: IoC & DI',       'Inversão de controle, injeção de dependências, beans e escopos.', 1, NULL),
 ('a2000000-0000-0000-0000-000000000402', 'a1000000-0000-0000-0000-000000000004', 'spring-mvc-rest',        'Spring MVC & REST',           'Controllers, mapeamentos, validação e tratamento de erros.',      2, 'a2000000-0000-0000-0000-000000000401'),
 ('a2000000-0000-0000-0000-000000000403', 'a1000000-0000-0000-0000-000000000004', 'spring-data-transacoes', 'Spring Data & Transações',    'Repositories no contexto Boot e o @Transactional na prática.',    3, 'a2000000-0000-0000-0000-000000000402'),
 ('a2000000-0000-0000-0000-000000000404', 'a1000000-0000-0000-0000-000000000004', 'security-testes',        'Security & Testes',           'Autenticação com JWT, filtros e testes com Spring Boot.',         4, 'a2000000-0000-0000-0000-000000000403');

-- ─── LESSONS: Spring Core ────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000040101', 'a2000000-0000-0000-0000-000000000401', 'Inversão de Controle e Injeção de Dependências',
$theory$
## Inversão de Controle e Injeção de Dependências

Sem Spring, cada classe cria suas próprias dependências:

```java
class PedidoService {
    private final PedidoRepository repo = new PedidoRepositoryJdbc(); // acoplado!
}
```

Problemas: o service conhece a implementação concreta, não dá para trocar por um mock no teste, e toda a cadeia de construção fica espalhada.

### Inversão de Controle (IoC)
A ideia: **quem cria e conecta os objetos não é você — é o container**. O Spring mantém um **ApplicationContext** com todos os objetos gerenciados (**beans**), cria cada um na ordem certa e entrega pronto para quem precisa.

### Injeção de Dependências (DI)
É o mecanismo da IoC: a dependência **chega de fora**, em vez de ser construída dentro.

```java
@Service
public class PedidoService {

    private final PedidoRepository repo;   // interface, não implementação

    // Injeção POR CONSTRUTOR — a forma recomendada
    public PedidoService(PedidoRepository repo) {
        this.repo = repo;
    }
}
```

Com **um único construtor**, o Spring injeta automaticamente — nem `@Autowired` precisa.

### Por que construtor e não @Autowired no campo?
| | Construtor | Campo (`@Autowired private ...`) |
|---|---|---|
| Campo pode ser `final` | ✅ imutável | ❌ |
| Objeto sempre completo | ✅ impossível meio-construído | ❌ pode dar NPE |
| Testável sem Spring | ✅ `new PedidoService(mock)` | ❌ precisa de reflection |
| Dependências demais ficam visíveis | ✅ construtor gigante = alerta de design | ❌ escondidas |

### Como o Spring encontra os beans
No boot, o **component scan** varre os pacotes procurando classes anotadas:
- `@Component` — bean genérico;
- `@Service`, `@Repository`, `@Controller`/`@RestController` — especializações semânticas de `@Component`;
- `@Configuration` + métodos `@Bean` — para registrar objetos de terceiros (você não pode anotar uma classe que não é sua):

```java
@Configuration
class HttpConfig {
    @Bean
    RestClient restClient() {          // objeto de biblioteca externa vira bean
        return RestClient.create();
    }
}
```

> Se existir mais de uma implementação da interface, desambigue com `@Primary` (padrão) ou `@Qualifier("nome")` no ponto de injeção.
$theory$, 15, 2, 1, 15),

 ('a3000000-0000-0000-0000-000000040102', 'a2000000-0000-0000-0000-000000000401', 'Beans, escopos e ciclo de vida',
$theory$
## Beans, escopos e ciclo de vida

### O que é um bean, afinal?
Um **bean** é qualquer objeto cuja criação e ciclo de vida o Spring gerencia. Ele vive dentro do **ApplicationContext**, que funciona como um grande registro: "peça pela interface, receba a instância pronta".

### Escopos
| Escopo | Uma instância por… | Uso típico |
|---|---|---|
| `singleton` *(padrão)* | container inteiro | services, repositories — praticamente tudo |
| `prototype` | **cada** injeção/`getBean()` | objetos com estado próprio por uso |
| `request` | requisição HTTP | dados da requisição atual (web) |
| `session` | sessão HTTP | carrinho de compras clássico (web) |

```java
@Service
@Scope("prototype")
class GeradorRelatorio { ... } // nova instância a cada injeção
```

### A consequência mais importante do singleton
**Um bean singleton é compartilhado por todas as threads/requisições ao mesmo tempo.** Logo:

> ⚠️ **Não guarde estado mutável de requisição em campos de um `@Service`!** Um campo `private User usuarioAtual` num singleton vaza dados entre usuários. Estado de requisição vive em variáveis locais, parâmetros ou beans `request-scoped`.

### Ciclo de vida e ganchos
O Spring oferece callbacks para os momentos-chave:

```java
@Service
class CacheService {

    @PostConstruct           // depois de criar o bean e injetar TUDO
    void aquecer() {
        carregarCacheInicial();
    }

    @PreDestroy              // antes do shutdown do contexto
    void liberar() {
        fecharConexoes();
    }
}
```

`@PostConstruct` é o lugar certo para inicialização que depende das dependências injetadas — no construtor, elas acabaram de chegar, mas proxies e configurações podem não estar completos.

### application.properties / application.yml
Configuração externa chega aos beans com `@Value` ou, melhor, com `@ConfigurationProperties`:

```java
@ConfigurationProperties(prefix = "app.pagamento")
public record PagamentoProperties(String apiUrl, int timeoutMs) { }
// app.pagamento.api-url=https://...
// app.pagamento.timeout-ms=3000
```

Tipado, agrupado e testável — preferível a espalhar `@Value("${...}")` pelo código.

> Resumo mental: singleton compartilhado = **stateless sempre**; inicialização pós-injeção = `@PostConstruct`; configuração externa tipada = `@ConfigurationProperties`.
$theory$, 15, 3, 2, 15);

-- ─── LESSONS: Spring MVC & REST ──────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000040201', 'a2000000-0000-0000-0000-000000000402', 'Controllers REST e mapeamentos',
$theory$
## Controllers REST e mapeamentos

Um **controller** traduz HTTP ↔ Java: recebe a requisição, delega ao service e devolve a resposta.

```java
@RestController                       // @Controller + @ResponseBody (respostas viram JSON)
@RequestMapping("/api/produtos")      // prefixo comum da classe
public class ProdutoController {

    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    @GetMapping                                       // GET /api/produtos?categoria=cafe
    List<ProdutoDto> listar(@RequestParam(required = false) String categoria) {
        return service.listar(categoria);
    }

    @GetMapping("/{id}")                              // GET /api/produtos/42
    ProdutoDto buscar(@PathVariable UUID id) {
        return service.buscar(id);
    }

    @PostMapping                                      // POST /api/produtos
    @ResponseStatus(HttpStatus.CREATED)               // devolve 201 em vez de 200
    ProdutoDto criar(@RequestBody @Valid CriarProdutoRequest body) {
        return service.criar(body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)            // 204: sucesso sem corpo
    void remover(@PathVariable UUID id) {
        service.remover(id);
    }
}
```

### De onde vem cada pedaço da requisição
| Anotação | Origem do dado | Exemplo |
|---|---|---|
| `@PathVariable` | segmento da URL | `/produtos/{id}` |
| `@RequestParam` | query string | `?categoria=cafe&pagina=2` |
| `@RequestBody` | corpo JSON → objeto (Jackson) | `{"nome": "Café"}` |
| `@RequestHeader` | cabeçalho HTTP | `Authorization` |

### Verbos e semântica REST
- **GET** — leitura, sem efeitos colaterais (cacheável).
- **POST** — cria recurso ou dispara ação; devolve **201 Created** quando cria.
- **PUT** — substitui o recurso inteiro (idempotente: repetir dá o mesmo resultado).
- **PATCH** — atualização parcial.
- **DELETE** — remove; **204 No Content** é a resposta típica.

### DTOs, não entidades
Exponha **DTOs** (records são perfeitos) em vez das entidades JPA:

```java
public record ProdutoDto(UUID id, String nome, BigDecimal preco) { }
```

Motivos: evita vazar campos internos (senha, flags), desacopla o contrato da API do schema do banco e previne o clássico erro de serializar relações *lazy* (LazyInitializationException no meio do JSON).

### ResponseEntity para controle fino
```java
@GetMapping("/{id}")
ResponseEntity<ProdutoDto> buscar(@PathVariable UUID id) {
    return service.buscarOpcional(id)
        .map(ResponseEntity::ok)                      // 200 + corpo
        .orElse(ResponseEntity.notFound().build());   // 404 sem corpo
}
```

> Controller magro: traduz HTTP e **nada mais**. Regra de negócio mora no service — se o controller tem `if` de negócio, ele engordou.
$theory$, 15, 3, 1, 16),

 ('a3000000-0000-0000-0000-000000040202', 'a2000000-0000-0000-0000-000000000402', 'Validação e tratamento de erros',
$theory$
## Validação e tratamento de erros

### Bean Validation: declare as regras no DTO
As anotações do **Jakarta Bean Validation** vivem no próprio request:

```java
public record CriarUsuarioRequest(

    @NotBlank(message = "nome é obrigatório")
    @Size(max = 120)
    String nome,

    @NotBlank @Email
    String email,

    @NotNull @Min(0) @Max(120)
    Integer idade,

    @Size(min = 8, message = "senha deve ter ao menos 8 caracteres")
    String senha
) { }
```

O gatilho é o **`@Valid`** no controller:

```java
@PostMapping
UsuarioDto criar(@RequestBody @Valid CriarUsuarioRequest body) { ... }
```

Sem `@Valid`, as anotações são decoração — nada é verificado. Com ele, um corpo inválido nem chega ao seu método: o Spring lança `MethodArgumentNotValidException`, que por padrão vira **400 Bad Request**.

### As anotações mais usadas
| Anotação | Valida |
|---|---|
| `@NotNull` | não é null (mas "" passa) |
| `@NotBlank` | String com conteúdo de verdade |
| `@NotEmpty` | coleção/String não vazia |
| `@Size(min, max)` | tamanho de String/coleção |
| `@Min` / `@Max` / `@Positive` | faixas numéricas |
| `@Email` | formato de e-mail |
| `@Pattern(regexp)` | expressão regular |

### Tratamento centralizado: @RestControllerAdvice
Sem tratamento global, cada exceção vira um 500 genérico. O **`@RestControllerAdvice`** intercepta exceções de **todos** os controllers num só lugar:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // erros de validação -> 400 com a lista de campos
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErroDto validacao(MethodArgumentNotValidException ex) {
        var campos = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .toList();
        return new ErroDto("VALIDACAO", campos);
    }

    // regra de negócio violada -> 422 ou 400, conforme seu contrato
    @ExceptionHandler(SaldoInsuficienteException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    ErroDto negocio(SaldoInsuficienteException ex) {
        return new ErroDto("NEGOCIO", List.of(ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErroDto naoEncontrado(EntityNotFoundException ex) {
        return new ErroDto("NAO_ENCONTRADO", List.of(ex.getMessage()));
    }
}
```

### Status certo para cada situação
- **400** — requisição malformada / validação falhou.
- **401** — não autenticado; **403** — autenticado, mas sem permissão.
- **404** — recurso não existe.
- **409** — conflito (email já cadastrado).
- **422** — sintaxe ok, regra de negócio recusou.
- **500** — bug seu; nunca deve ser resposta "esperada".

> Fluxo saudável: DTO valida **formato** (Bean Validation), service valida **negócio** (exceções específicas), advice **traduz** exceções em status + corpo padronizado. O controller não tem try/catch.
$theory$, 15, 3, 2, 16);

-- ─── LESSONS: Spring Data & Transações ───────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000040301', 'a2000000-0000-0000-0000-000000000403', 'Repositories no Spring Boot',
$theory$
## Repositories no Spring Boot

O Spring Data JPA elimina a camada DAO manual: você declara uma **interface** e ganha a implementação em runtime.

```java
public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    // derivada do NOME do método (a Spring monta a JPQL):
    List<Produto> findByCategoriaAndPrecoLessThan(String categoria, BigDecimal teto);

    Optional<Produto> findBySku(String sku);

    boolean existsBySku(String sku);

    // JPQL explícita quando o nome ficaria ilegível:
    @Query("""
        SELECT p FROM Produto p
        WHERE p.estoque = 0 AND p.ativo = true
        ORDER BY p.atualizadoEm DESC
        """)
    List<Produto> esgotadosAtivos();

    // projeção direta em DTO (não carrega a entidade inteira):
    @Query("SELECT new com.loja.dto.ProdutoResumo(p.id, p.nome) FROM Produto p")
    List<ProdutoResumo> resumos();
}
```

### Paginação de graça
```java
Page<Produto> page = repo.findByCategoria("cafe",
        PageRequest.of(0, 20, Sort.by("nome")));

page.getContent();       // os 20 da página
page.getTotalElements(); // total geral
```
Devolva `Page<T>` no endpoint e o JSON já sai com `content`, `totalPages`, `number`…

### Save: insert ou update?
`save()` decide sozinho: entidade **sem id** (ou nova) → `INSERT`; entidade **gerenciada com id** → `UPDATE` no flush. Dentro de uma transação, aliás, entidade carregada e modificada **nem precisa de save** — o dirty checking cuida.

### As armadilhas de sempre (agora no contexto Boot)
1. **N+1**: liste 50 produtos e acesse `produto.getFornecedor()` de cada — 51 queries. Detecte com `spring.jpa.show-sql=true`; resolva com `@EntityGraph` ou `JOIN FETCH`.
2. **`findAll()` sem paginação** em tabela grande: memória e latência explodem. Exponha sempre `Pageable`.
3. **Open Session in View**: o Boot deixa `spring.jpa.open-in-view=true` por padrão, o que mascara lazy loading no controller e segura a conexão até o fim da resposta. Times experientes costumam **desligar** e carregar tudo o que precisam no service.

> Repositório devolve entidades **para o service**; quem sai pela API são DTOs. Se um controller importa `jakarta.persistence`, algo vazou.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000040302', 'a2000000-0000-0000-0000-000000000403', '@Transactional na prática',
$theory$
## @Transactional na prática

Uma **transação** agrupa operações em uma unidade tudo-ou-nada. No Spring, o `@Transactional` delimita esse escopo declarativamente:

```java
@Service
public class TransferenciaService {

    @Transactional   // begin antes, commit no fim, rollback se exceção
    public void transferir(UUID de, UUID para, BigDecimal valor) {
        contaService.debitar(de, valor);     // se o crédito falhar...
        contaService.creditar(para, valor);  // ...o débito é DESFEITO
    }
}
```

### Como funciona por baixo: proxy
O Spring envolve o bean num **proxy**. A chamada externa passa pelo proxy → ele abre a transação → delega ao método real → commit/rollback no retorno. Duas consequências práticas enormes:

1. **Auto-invocação não funciona**: `this.outroMetodo()` não passa pelo proxy — o `@Transactional` do `outroMetodo` é **ignorado**.
2. **Métodos `private` não funcionam**: o proxy não consegue interceptá-los.

### Rollback: só unchecked por padrão
Por padrão, rollback acontece para `RuntimeException` e `Error`. **Exceção checked faz COMMIT!**

```java
@Transactional(rollbackFor = Exception.class)  // inclui checked no rollback
public void importar() throws IOException { ... }
```

### readOnly: leitura otimizada
```java
@Transactional(readOnly = true)
public RelatorioDto gerar() { ... }
```
Sinaliza ao Hibernate que não haverá escrita: sem dirty checking, sem flush — menos memória e CPU. Use em **todo** método só-leitura.

### Propagação: o que acontece em chamadas aninhadas
| Propagação | Comportamento |
|---|---|
| `REQUIRED` *(padrão)* | entra na transação existente; cria se não houver |
| `REQUIRES_NEW` | **suspende** a atual e abre outra independente |
| `SUPPORTS` | usa se existir; roda sem se não existir |
| `MANDATORY` | exige transação aberta; senão, exceção |

`REQUIRES_NEW` é útil para registrar auditoria/log que deve persistir **mesmo se a operação principal falhar** — a transação interna commita sozinha.

### Onde anotar
No **service** (caso de uso completo), não no controller (HTTP não deveria segurar transação) nem no repository (métodos do Spring Data já têm transação própria, mas curta demais para agrupar operações).

> Checklist: escopo no service · `readOnly = true` nas consultas · lembrar que checked não faz rollback · cuidado com auto-invocação · `REQUIRES_NEW` para efeitos que devem sobreviver ao rollback.
$theory$, 15, 4, 2, 16);

-- ─── LESSONS: Security & Testes ──────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000040401', 'a2000000-0000-0000-0000-000000000404', 'Spring Security com JWT',
$theory$
## Spring Security com JWT

### Autenticação vs Autorização
- **Autenticação** — *quem é você?* (login, token válido)
- **Autorização** — *o que você pode fazer?* (roles, permissões)

### Por que JWT em APIs REST
Sessão tradicional guarda estado no servidor — ruim para escalar horizontalmente. O **JWT** (JSON Web Token) inverte: o servidor assina um token com os dados do usuário e **não guarda nada**; cada requisição traz o token no header:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmEi...
```

Um JWT tem três partes separadas por ponto: **header** (algoritmo), **payload** (claims: `sub`, `exp`, roles…) e **assinatura**. A assinatura garante **integridade** — qualquer byte alterado invalida o token.

> ⚠️ O payload é apenas **Base64, não criptografado** — qualquer um decodifica e lê. Nunca coloque senha ou dado sensível nas claims.

### O fluxo completo
1. `POST /auth/login` com credenciais → servidor valida e devolve **access token** (curto, ex.: 15 min) + **refresh token** (longo).
2. Cliente envia o access token em cada chamada.
3. Um **filtro** valida assinatura + expiração e popula o contexto de segurança.
4. Access expirou? Cliente troca o refresh por um novo par — sem pedir a senha de novo.

### A SecurityFilterChain
Spring Security é uma **cadeia de filtros** antes dos controllers:

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                    // API stateless não usa cookie de sessão
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll() // login/registro são públicos
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
```

O **filtro JWT** roda a cada requisição: extrai o `Bearer`, valida, e monta o `Authentication` no `SecurityContextHolder`. Dali em diante, `@PreAuthorize` e as regras de URL enxergam o usuário.

### Autorização por método
```java
@PreAuthorize("hasRole('ADMIN')")          // exige ROLE_ADMIN
@DeleteMapping("/usuarios/{id}")
void excluir(@PathVariable UUID id) { ... }
```
(Habilite com `@EnableMethodSecurity` na configuração.)

### Senhas: só com hash forte
```java
@Bean
PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
```
**BCrypt** é lento de propósito (dificulta força bruta) e embute o salt. Senha em texto puro ou MD5/SHA-1 é falha grave.

> Os dois erros que mais aparecem em revisão: (1) segredo do JWT fraco ou commitado no repositório — use variável de ambiente; (2) confiar em claims do token para dados que mudam (role revogada continua no token até expirar — por isso tokens curtos).
$theory$, 20, 4, 1, 18),

 ('a3000000-0000-0000-0000-000000040402', 'a2000000-0000-0000-0000-000000000404', 'Testes com Spring Boot',
$theory$
## Testes com Spring Boot

### A pirâmide na prática
- **Unitários** (base, muitos): testam UMA classe com dependências mockadas. Milissegundos, sem Spring.
- **De fatia** (meio): sobem só um pedaço do contexto — `@WebMvcTest` (controllers), `@DataJpaTest` (repositories).
- **De integração** (topo, poucos): `@SpringBootTest` sobe o contexto inteiro.

Quanto mais alto, mais lento e frágil — a maioria dos testes deve viver na base.

### Unitário puro: JUnit 5 + Mockito
```java
@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock PedidoRepository repo;              // dublê controlado
    @InjectMocks PedidoService service;       // classe real sob teste

    @Test
    void deveCalcularTotalComDesconto() {
        // given
        when(repo.findById(ID)).thenReturn(Optional.of(pedidoDe(100.0)));

        // when
        BigDecimal total = service.totalComDesconto(ID, 10);

        // then
        assertEquals(new BigDecimal("90.00"), total);
        verify(repo).findById(ID);            // interação aconteceu
    }

    @Test
    void deveFalharSePedidoNaoExiste() {
        when(repo.findById(any())).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class,
            () -> service.totalComDesconto(ID, 10));
    }
}
```
Repare: **nenhuma anotação do Spring**. Injeção por construtor torna isso possível.

### Fatia web: @WebMvcTest
Sobe só o MVC (controllers, advice, conversão JSON) — services viram mocks:

```java
@WebMvcTest(ProdutoController.class)
class ProdutoControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean ProdutoService service;      // substitui o bean real no contexto

    @Test
    void devePedir400QuandoNomeVazio() throws Exception {
        mvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"\"}"))
           .andExpect(status().isBadRequest());
    }
}
```

### Fatia de persistência: @DataJpaTest
Sobe JPA + um banco (H2 em memória ou Testcontainers) e nada mais. Ideal para validar queries derivadas e JPQL personalizadas.

### Integração de verdade: @SpringBootTest + Testcontainers
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class FluxoCompraIT {
    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");
    // testa o fluxo completo contra um Postgres REAL descartável
}
```
H2 é rápido, mas não é o banco de produção — diferenças de dialeto escondem bugs. **Testcontainers** dá o melhor dos dois mundos.

### O que vale a pena testar primeiro
1. Regras de negócio no service (unitário) — maior retorno por esforço.
2. Contratos da API: status e formato de erro (`@WebMvcTest`).
3. Queries não triviais (`@DataJpaTest`).
4. Um ou dois fluxos críticos ponta a ponta (`@SpringBootTest`).

> Teste bom falha por **um** motivo claro, roda rápido e não depende de ordem. Se precisar de `Thread.sleep`, algo está errado.
$theory$, 20, 4, 2, 18);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: IoC/DI -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004010101', 'a3000000-0000-0000-0000-000000040101', 'MULTIPLE_CHOICE',
  'Por que a injeção por construtor é preferível a `@Autowired` direto no campo?', 'Pense em final, testes e objeto completo.', 1, 5, 2),
 ('a4000000-0000-0000-0000-000004010102', 'a3000000-0000-0000-0000-000000040101', 'MULTIPLE_CHOICE',
  'Você precisa registrar como bean um objeto de uma biblioteca de terceiros (não pode anotá-lo com @Component). Qual o caminho?', 'Existe uma anotação para métodos que produzem beans.', 2, 5, 3);

-- L2: Beans/escopos -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004010201', 'a3000000-0000-0000-0000-000000040102', 'MULTIPLE_CHOICE',
  'Qual é o escopo padrão de um bean Spring e sua principal consequência prática?', 'Quantas instâncias existem no container?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004010202', 'a3000000-0000-0000-0000-000000040102', 'DESCRIPTIVE',
  'Um colega guardou o usuário logado num campo `private User usuarioAtual` de um `@Service`. Explique por que isso é um bug grave e como corrigir.', 'Quantas requisições compartilham esse service ao mesmo tempo?', 2, 10, 4);

-- L3: Controllers REST -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004020101', 'a3000000-0000-0000-0000-000000040201', 'MULTIPLE_CHOICE',
  'Em `GET /api/produtos/42?detalhado=true`, como capturar o `42` e o `detalhado` no controller?', 'Um vem do caminho, outro da query string.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004020102', 'a3000000-0000-0000-0000-000000040201', 'MULTIPLE_CHOICE',
  'Qual status HTTP um `POST` que cria um recurso com sucesso deve devolver?', 'Não é o 200 genérico.', 2, 5, 2);

-- L4: Validação/erros -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004020201', 'a3000000-0000-0000-0000-000000040202', 'MULTIPLE_CHOICE',
  'Um DTO tem `@NotBlank` no campo nome, mas requisições com nome vazio continuam entrando no service. Qual a causa mais provável?', 'As anotações precisam de um gatilho no controller.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004020202', 'a3000000-0000-0000-0000-000000040202', 'CODE_CHALLENGE',
  'Crie um `@RestControllerAdvice` chamado `ApiExceptionHandler` com dois handlers: `EntityNotFoundException` → 404 e `IllegalArgumentException` → 400, ambos devolvendo um `ErroDto(String codigo, String mensagem)`.', 'Um @ExceptionHandler + @ResponseStatus para cada exceção.', 2, 15, 4);

-- L5: Repositories -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004030101', 'a3000000-0000-0000-0000-000000040301', 'MULTIPLE_CHOICE',
  'O que o método `findByCategoriaAndPrecoLessThan(String c, BigDecimal p)` faz num `JpaRepository`, sem nenhuma implementação escrita?', 'A Spring lê algo para gerar a consulta.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004030102', 'a3000000-0000-0000-0000-000000040301', 'MULTIPLE_CHOICE',
  'Uma listagem exibe 50 pedidos e o log mostra 51 SELECTs. Qual é o diagnóstico e a correção mais indicada?', 'Um SELECT para a lista + um por item…', 2, 5, 4);

-- L6: @Transactional -> 1 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004030201', 'a3000000-0000-0000-0000-000000040302', 'MULTIPLE_CHOICE',
  'Um método `@Transactional` lança `IOException` (checked) no meio da execução. O que acontece com a transação, por padrão?', 'O padrão de rollback cobre só um tipo de exceção.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000004030202', 'a3000000-0000-0000-0000-000000040302', 'DESCRIPTIVE',
  'Dentro da mesma classe, o método `a()` (sem anotação) chama `this.b()`, que tem `@Transactional`. Por que a transação de `b()` não abre, e quais são duas formas de resolver?', 'Lembre como o Spring intercepta chamadas: por onde a chamada externa passa?', 2, 10, 5);

-- L7: Security/JWT -> 2 MULTIPLE_CHOICE + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004040101', 'a3000000-0000-0000-0000-000000040401', 'MULTIPLE_CHOICE',
  'O payload de um JWT é visível para qualquer pessoa que possua o token?', 'Base64 é codificação, não criptografia.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004040102', 'a3000000-0000-0000-0000-000000040401', 'MULTIPLE_CHOICE',
  'Qual a diferença entre responder 401 e 403 numa API?', 'Um é sobre identidade, outro sobre permissão.', 2, 5, 3),
 ('a4000000-0000-0000-0000-000004040103', 'a3000000-0000-0000-0000-000000040401', 'DESCRIPTIVE',
  'Explique por que APIs REST com JWT preferem tokens de acesso CURTOS acompanhados de um refresh token, em vez de um único token de longa duração.', 'O que acontece se um token vaza? E se uma role é revogada?', 3, 10, 4);

-- L8: Testes -> 1 MULTIPLE_CHOICE + 1 CODE_CHALLENGE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000004040201', 'a3000000-0000-0000-0000-000000040402', 'MULTIPLE_CHOICE',
  'Para testar as validações e os status HTTP de um controller sem subir o contexto inteiro, qual anotação usar?', 'Existe uma fatia específica para a camada web.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000004040202', 'a3000000-0000-0000-0000-000000040402', 'CODE_CHALLENGE',
  'Escreva um teste unitário (JUnit 5 + Mockito) para `SaqueService.sacar(id, valor)`: mock do `ContaRepository` devolvendo uma conta com saldo 100.0; verifique que sacar 30.0 deixa saldo 70.0 e que sacar 200.0 lança `SaldoInsuficienteException`.', 'when(...).thenReturn(...) para o mock; assertThrows para a exceção.', 2, 15, 4);

-- ─── OPTIONS (multiple choice) ───────────────────────────────────────
-- L1 Q1: construtor
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000401010101', 'a4000000-0000-0000-0000-000004010101', 'Permite campos final, garante objeto completo ao nascer e facilita testes com new direto.', TRUE,  'Correto: imutabilidade, impossibilidade de estado meio-injetado e testes sem reflection/contexto.', 1),
 ('a5000000-0000-0000-0000-000401010102', 'a4000000-0000-0000-0000-000004010101', 'É mais rápida em runtime, pois evita reflection.', FALSE, 'O ganho não é performance — o container usa reflection de qualquer forma na construção.', 2),
 ('a5000000-0000-0000-0000-000401010103', 'a4000000-0000-0000-0000-000004010101', 'É a única forma que o Spring moderno aceita.', FALSE, 'Injeção em campo continua funcionando — só não é recomendada.', 3),
 ('a5000000-0000-0000-0000-000401010104', 'a4000000-0000-0000-0000-000004010101', 'Evita que a classe precise de interface.', FALSE, 'Interface é decisão de design independente do estilo de injeção.', 4);

-- L1 Q2: @Bean
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000401010201', 'a4000000-0000-0000-0000-000004010102', 'Declarar um método @Bean numa classe @Configuration que constrói e devolve o objeto.', TRUE,  'Correto: métodos @Bean registram no container objetos que você constrói manualmente — ideal para classes de terceiros.', 1),
 ('a5000000-0000-0000-0000-000401010202', 'a4000000-0000-0000-0000-000004010102', 'Editar o .jar da biblioteca adicionando @Component na classe.', FALSE, 'Modificar bytecode de dependência é inviável e desnecessário.', 2),
 ('a5000000-0000-0000-0000-000401010203', 'a4000000-0000-0000-0000-000004010102', 'Usar new normalmente — todo objeto criado vira bean automaticamente.', FALSE, 'new cria objetos FORA do container; o Spring não os gerencia nem injeta.', 3),
 ('a5000000-0000-0000-0000-000401010204', 'a4000000-0000-0000-0000-000004010102', 'Adicionar o nome da classe no application.properties.', FALSE, 'Properties configuram valores, não registram beans.', 4);

-- L2 Q1: singleton
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000401020101', 'a4000000-0000-0000-0000-000004010201', 'singleton — uma instância única compartilhada por todas as requisições, que portanto deve ser stateless.', TRUE,  'Correto: o mesmo objeto atende todas as threads; estado mutável de requisição nele vaza entre usuários.', 1),
 ('a5000000-0000-0000-0000-000401020102', 'a4000000-0000-0000-0000-000004010201', 'prototype — uma instância nova por injeção, por isso é seguro guardar estado.', FALSE, 'prototype existe, mas NÃO é o padrão.', 2),
 ('a5000000-0000-0000-0000-000401020103', 'a4000000-0000-0000-0000-000004010201', 'request — uma instância por requisição HTTP.', FALSE, 'request é escopo web opcional, não o padrão.', 3),
 ('a5000000-0000-0000-0000-000401020104', 'a4000000-0000-0000-0000-000004010201', 'thread — uma instância por thread do servidor.', FALSE, 'Não existe escopo thread padrão no Spring.', 4);

-- L3 Q1: path/query
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000402010101', 'a4000000-0000-0000-0000-000004020101', '@PathVariable para o 42 (segmento da URL) e @RequestParam para o detalhado (query string).', TRUE,  'Correto: caminho -> @PathVariable; parâmetros após "?" -> @RequestParam.', 1),
 ('a5000000-0000-0000-0000-000402010102', 'a4000000-0000-0000-0000-000004020101', '@RequestParam para ambos.', FALSE, 'O 42 faz parte do caminho — precisa de @PathVariable com o template {id}.', 2),
 ('a5000000-0000-0000-0000-000402010103', 'a4000000-0000-0000-0000-000004020101', '@RequestBody para ambos.', FALSE, '@RequestBody lê o corpo JSON — GET nem costuma ter corpo.', 3),
 ('a5000000-0000-0000-0000-000402010104', 'a4000000-0000-0000-0000-000004020101', '@PathVariable para ambos.', FALSE, 'detalhado vem depois do "?" — é query string, não segmento de caminho.', 4);

-- L3 Q2: 201
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000402010201', 'a4000000-0000-0000-0000-000004020102', '201 Created', TRUE,  'Correto: criação bem-sucedida = 201, idealmente com o recurso (ou Location) na resposta.', 1),
 ('a5000000-0000-0000-0000-000402010202', 'a4000000-0000-0000-0000-000004020102', '200 OK', FALSE, 'Funciona, mas perde a semântica — 201 comunica explicitamente a criação.', 2),
 ('a5000000-0000-0000-0000-000402010203', 'a4000000-0000-0000-0000-000004020102', '204 No Content', FALSE, '204 é para sucesso SEM corpo — típico de DELETE, não de criação.', 3),
 ('a5000000-0000-0000-0000-000402010204', 'a4000000-0000-0000-0000-000004020102', '302 Found', FALSE, '3xx são redirecionamentos — não se aplicam aqui.', 4);

-- L4 Q1: @Valid faltando
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000402020101', 'a4000000-0000-0000-0000-000004020201', 'Falta o @Valid junto ao @RequestBody — sem ele as anotações do DTO não são verificadas.', TRUE,  'Correto: @Valid é o gatilho da validação; sem ele, @NotBlank é só decoração.', 1),
 ('a5000000-0000-0000-0000-000402020102', 'a4000000-0000-0000-0000-000004020201', '@NotBlank só funciona em entidades JPA, não em DTOs.', FALSE, 'Bean Validation funciona em qualquer classe — DTOs são o alvo mais comum.', 2),
 ('a5000000-0000-0000-0000-000402020103', 'a4000000-0000-0000-0000-000004020201', 'O banco precisa ter uma constraint NOT NULL correspondente.', FALSE, 'A validação do DTO acontece antes e independentemente do banco.', 3),
 ('a5000000-0000-0000-0000-000402020104', 'a4000000-0000-0000-0000-000004020201', 'É preciso chamar validator.validate() manualmente em todo controller.', FALSE, 'Com @Valid o Spring valida automaticamente — o manual só é necessário fora do fluxo MVC.', 4);

-- L5 Q1: query derivada
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000403010101', 'a4000000-0000-0000-0000-000004030101', 'A Spring interpreta o NOME do método e gera a JPQL (WHERE categoria = ? AND preco < ?) em runtime.', TRUE,  'Correto: são as derived queries — convenção de nomes vira consulta, sem implementação manual.', 1),
 ('a5000000-0000-0000-0000-000403010102', 'a4000000-0000-0000-0000-000004030101', 'Nada — métodos sem corpo lançam UnsupportedOperationException.', FALSE, 'A implementação é gerada pelo Spring Data na inicialização.', 2),
 ('a5000000-0000-0000-0000-000403010103', 'a4000000-0000-0000-0000-000004030101', 'Ele só funciona se existir uma @Query na interface.', FALSE, '@Query é para consultas explícitas; o nome do método basta para as derivadas.', 3),
 ('a5000000-0000-0000-0000-000403010104', 'a4000000-0000-0000-0000-000004030101', 'Ele busca todos os registros e filtra em memória.', FALSE, 'O filtro vira SQL no banco — não há varredura em memória.', 4);

-- L5 Q2: N+1
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000403010201', 'a4000000-0000-0000-0000-000004030102', 'Problema N+1: cada pedido dispara um SELECT do relacionamento lazy. Corrigir com JOIN FETCH ou @EntityGraph.', TRUE,  'Correto: 1 consulta para a lista + N para os relacionamentos. Traga tudo junto na consulta.', 1),
 ('a5000000-0000-0000-0000-000403010202', 'a4000000-0000-0000-0000-000004030102', 'Cache do Hibernate desligado; ligar o second-level cache resolve.', FALSE, 'Cache pode mascarar, mas o diagnóstico correto é o padrão de acesso lazy por item.', 2),
 ('a5000000-0000-0000-0000-000403010203', 'a4000000-0000-0000-0000-000004030102', 'Falta índice na tabela; criar índice elimina as consultas extras.', FALSE, 'Índice acelera consultas, mas não reduz a QUANTIDADE delas.', 3),
 ('a5000000-0000-0000-0000-000403010204', 'a4000000-0000-0000-0000-000004030102', 'Comportamento normal do JPA, sem correção possível.', FALSE, 'É o problema mais clássico de ORM — e tem correção padrão (fetch join).', 4);

-- L6 Q1: checked commit
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000403020101', 'a4000000-0000-0000-0000-000004030201', 'A transação faz COMMIT — por padrão só RuntimeException/Error causam rollback.', TRUE,  'Correto: exceção checked commita o que já foi feito. Use rollbackFor para incluí-la.', 1),
 ('a5000000-0000-0000-0000-000403020102', 'a4000000-0000-0000-0000-000004030201', 'Rollback automático, como com qualquer exceção.', FALSE, 'Checked NÃO dispara rollback por padrão — pegadinha clássica.', 2),
 ('a5000000-0000-0000-0000-000403020103', 'a4000000-0000-0000-0000-000004030201', 'A transação fica aberta até timeout do banco.', FALSE, 'O proxy sempre finaliza a transação no retorno — commit ou rollback.', 3),
 ('a5000000-0000-0000-0000-000403020104', 'a4000000-0000-0000-0000-000004030201', 'O Spring converte a IOException em RuntimeException automaticamente.', FALSE, 'Não há conversão automática de exceções do seu código.', 4);

-- L7 Q1: payload visível
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000404010101', 'a4000000-0000-0000-0000-000004040101', 'Sim — é apenas Base64; a assinatura impede ALTERAR, mas não LER. Nada sensível nas claims.', TRUE,  'Correto: qualquer um decodifica o payload; a assinatura garante só integridade.', 1),
 ('a5000000-0000-0000-0000-000404010102', 'a4000000-0000-0000-0000-000004040101', 'Não — o payload é criptografado com a chave do servidor.', FALSE, 'JWT comum (JWS) é assinado, não criptografado.', 2),
 ('a5000000-0000-0000-0000-000404010103', 'a4000000-0000-0000-0000-000004040101', 'Só o servidor consegue ler, pois possui o segredo.', FALSE, 'O segredo valida a assinatura; a leitura do payload é livre.', 3),
 ('a5000000-0000-0000-0000-000404010104', 'a4000000-0000-0000-0000-000004040101', 'Depende do algoritmo escolhido no header.', FALSE, 'O algoritmo muda a assinatura, não a visibilidade do payload.', 4);

-- L7 Q2: 401 vs 403
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000404010201', 'a4000000-0000-0000-0000-000004040102', '401 = não autenticado (sem credencial válida); 403 = autenticado, mas sem permissão para o recurso.', TRUE,  'Correto: 401 pede identidade; 403 nega acesso a quem já se identificou.', 1),
 ('a5000000-0000-0000-0000-000404010202', 'a4000000-0000-0000-0000-000004040102', '401 e 403 são intercambiáveis por convenção.', FALSE, 'Têm semânticas distintas e clientes tratam de formas diferentes (renovar login vs esconder recurso).', 2),
 ('a5000000-0000-0000-0000-000404010203', 'a4000000-0000-0000-0000-000004040102', '403 = token expirado; 401 = role insuficiente.', FALSE, 'É o inverso: expiração/ausência de token -> 401; role insuficiente -> 403.', 3),
 ('a5000000-0000-0000-0000-000404010204', 'a4000000-0000-0000-0000-000004040102', '401 é para APIs e 403 para páginas web.', FALSE, 'Ambos aplicam-se a qualquer HTTP — a diferença é autenticação vs autorização.', 4);

-- L8 Q1: @WebMvcTest
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000404020101', 'a4000000-0000-0000-0000-000004040201', '@WebMvcTest — sobe só a camada MVC com MockMvc; services entram como mocks.', TRUE,  'Correto: a fatia web testa mapeamentos, validação e status sem o contexto completo.', 1),
 ('a5000000-0000-0000-0000-000404020102', 'a4000000-0000-0000-0000-000004040201', '@SpringBootTest — é a única forma de testar controllers.', FALSE, 'Funciona, mas sobe o contexto inteiro — lento e desnecessário para isso.', 2),
 ('a5000000-0000-0000-0000-000404020103', 'a4000000-0000-0000-0000-000004040201', '@DataJpaTest — cobre controllers e repositories juntos.', FALSE, '@DataJpaTest sobe SÓ a camada de persistência.', 3),
 ('a5000000-0000-0000-0000-000404020104', 'a4000000-0000-0000-0000-000004040201', '@Mock do controller com Mockito puro.', FALSE, 'Mockar o controller não exercita mapeamentos nem validação — testa nada do MVC.', 4);

-- ─── DESCRIPTIVE ANSWERS (reference key for AI grading) ──────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000004010202', 'a4000000-0000-0000-0000-000004010202',
  'O @Service é singleton: a MESMA instância atende todas as requisições/threads simultaneamente. Um campo com o usuário logado é sobrescrito por cada requisição que chega — a requisição A pode ler o usuário da requisição B (vazamento de dados entre usuários, race condition). Correção: nunca guardar estado de requisição em campo de singleton; obter o usuário do contexto por chamada (parâmetro de método, SecurityContextHolder no Spring Security) ou usar bean @RequestScope.',
  'Deve identificar que o singleton é compartilhado entre requisições/threads e que o campo causa vazamento/corrida entre usuários. A correção deve mover o estado para escopo de requisição (parâmetro, SecurityContext, @RequestScope). Penalizar se sugerir apenas synchronized (não resolve a mistura de usuários).'),
 ('a7000000-0000-0000-0000-000004030202', 'a4000000-0000-0000-0000-000004030202',
  'O @Transactional funciona via proxy: só chamadas EXTERNAS ao bean passam pelo proxy que abre a transação. this.b() é uma chamada direta ao objeto real, sem interceptação — a anotação de b() é ignorada (auto-invocação). Soluções: (1) extrair b() para outro bean e injetá-lo, fazendo a chamada atravessar o proxy; (2) anotar o método de entrada a() com @Transactional. Alternativas menos comuns: auto-injetar o próprio bean e chamar via referência injetada, ou usar TransactionTemplate programático.',
  'Deve explicar o mecanismo de proxy e que auto-invocação não passa por ele. Precisa dar duas soluções válidas (mover para outro bean, anotar o método público de entrada, auto-injeção ou TransactionTemplate). Penalizar respostas que digam que basta tornar b() público — visibilidade não é a causa aqui.'),
 ('a7000000-0000-0000-0000-000004040103', 'a4000000-0000-0000-0000-000004040103',
  'JWT é stateless: uma vez emitido, não dá para revogá-lo no servidor — ele vale até expirar. Token longo vazado dá acesso prolongado ao atacante, e mudanças (role revogada, senha trocada, usuário banido) não têm efeito enquanto o token viver. Com access token curto (minutos), a janela de dano de um vazamento é pequena e as permissões são "reavaliadas" a cada renovação; o refresh token, de vida longa, fica armazenado com mais cuidado, é usado só no endpoint de refresh e PODE ser revogado/rotacionado no servidor, mantendo a experiência sem novo login.',
  'Deve conectar a natureza stateless/sem revogação do JWT com o risco de tokens longos (vazamento, permissões desatualizadas) e explicar o papel do refresh token (renovação sem senha, possibilidade de revogação/rotação server-side). Bônus por citar rotação de refresh tokens ou armazenamento mais seguro. Penalizar quem disser que o access token curto é criptografado ou que o servidor guarda sessão do access token.');

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
INSERT INTO code_challenges (id, question_id, initial_code, solution_code, test_cases, language, validation_prompt) VALUES
 ('a6000000-0000-0000-0000-000004020202', 'a4000000-0000-0000-0000-000004020202',
$initial$import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

record ErroDto(String codigo, String mensagem) { }

// TODO: transforme em um @RestControllerAdvice com dois handlers:
//   EntityNotFoundException  -> 404 + ErroDto("NAO_ENCONTRADO", mensagem da exceção)
//   IllegalArgumentException -> 400 + ErroDto("REQUISICAO_INVALIDA", mensagem da exceção)
class ApiExceptionHandler {

}
$initial$,
$solution$import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

record ErroDto(String codigo, String mensagem) { }

@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErroDto naoEncontrado(EntityNotFoundException ex) {
        return new ErroDto("NAO_ENCONTRADO", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErroDto requisicaoInvalida(IllegalArgumentException ex) {
        return new ErroDto("REQUISICAO_INVALIDA", ex.getMessage());
    }
}
$solution$,
 '[{"input": "service lança EntityNotFoundException(\"pedido 9 não existe\")", "expected_output": "HTTP 404 + {\"codigo\": \"NAO_ENCONTRADO\", \"mensagem\": \"pedido 9 não existe\"}"}, {"input": "service lança IllegalArgumentException(\"valor negativo\")", "expected_output": "HTTP 400 + {\"codigo\": \"REQUISICAO_INVALIDA\", \"mensagem\": \"valor negativo\"}"}]'::jsonb,
 'java',
 'Avalie se a classe tem @RestControllerAdvice (ou @ControllerAdvice + @ResponseBody), um @ExceptionHandler para cada exceção pedida, os status corretos (404 para EntityNotFoundException via @ResponseStatus ou ResponseEntity, 400 para IllegalArgumentException) e a construção do ErroDto com código e mensagem. Aceite ResponseEntity<ErroDto> como alternativa ao @ResponseStatus. Penalize handlers que engolem a exceção sem devolver o corpo pedido ou status trocados.'),

 ('a6000000-0000-0000-0000-000004040202', 'a4000000-0000-0000-0000-000004040202',
$initial$// Classes de apoio (já existem no projeto):
//   class Conta { UUID id; double saldo; getters/setters }
//   interface ContaRepository { Optional<Conta> findById(UUID id); Conta save(Conta c); }
//   class SaqueService {
//       SaqueService(ContaRepository repo) { ... }
//       Conta sacar(UUID id, double valor)  // debita ou lança SaldoInsuficienteException
//   }

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SaqueServiceTest {

    // TODO:
    // 1) crie o mock do ContaRepository e o SaqueService com ele
    // 2) teste: conta com saldo 100.0, sacar 30.0 -> saldo final 70.0
    // 3) teste: sacar 200.0 -> lança SaldoInsuficienteException
}
$initial$,
$solution$import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SaqueServiceTest {

    private final ContaRepository repo = mock(ContaRepository.class);
    private final SaqueService service = new SaqueService(repo);
    private final UUID id = UUID.randomUUID();

    private Conta contaComSaldo(double saldo) {
        Conta c = new Conta();
        c.setId(id);
        c.setSaldo(saldo);
        return c;
    }

    @Test
    void deveDebitarQuandoHaSaldo() {
        when(repo.findById(id)).thenReturn(Optional.of(contaComSaldo(100.0)));
        when(repo.save(any(Conta.class))).thenAnswer(inv -> inv.getArgument(0));

        Conta resultado = service.sacar(id, 30.0);

        assertEquals(70.0, resultado.getSaldo());
        verify(repo).save(any(Conta.class));
    }

    @Test
    void deveFalharSemSaldoSuficiente() {
        when(repo.findById(id)).thenReturn(Optional.of(contaComSaldo(100.0)));

        assertThrows(SaldoInsuficienteException.class,
                () -> service.sacar(id, 200.0));
    }
}
$solution$,
 '[{"input": "saldo 100.0, sacar(30.0)", "expected_output": "saldo final 70.0"}, {"input": "saldo 100.0, sacar(200.0)", "expected_output": "SaldoInsuficienteException"}]'::jsonb,
 'java',
 'Avalie se o teste cria o mock do ContaRepository (mock() ou @Mock), injeta no SaqueService por construtor, programa o findById com when/thenReturn devolvendo conta com saldo 100.0, verifica o saldo final 70.0 no caso feliz e usa assertThrows para SaldoInsuficienteException no saque acima do saldo. Aceite variações (@ExtendWith(MockitoExtension.class), @InjectMocks, BDDMockito given). Penalize testes sem asserção ou que instanciam repositório real em vez de mock.');
