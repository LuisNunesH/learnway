-- =====================================================================
-- LearnWay — seed "Cloud & DevOps"
--   * 3 subtopics encadeados: Docker -> Kubernetes -> CI/CD
--   * 6 lessons com teoria completa
--   * 12 questões: MULTIPLE_CHOICE e DESCRIPTIVE
-- Convenção de UUIDs: sufixo determinístico (topic 07)
--   subtopic  a2…0000000007SS      lesson    a3…000000 07 SS LL
--   question  a4…0000 07 SS LL QQ  option    a5…00 07 SS LL QQ OO
--   descr.    a7…= question
-- =====================================================================

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
INSERT INTO subtopics (id, topic_id, slug, title, description, order_index, prerequisite_subtopic_id) VALUES
 ('a2000000-0000-0000-0000-000000000701', 'a1000000-0000-0000-0000-000000000007', 'docker',     'Docker & Containers', 'Imagens, containers, Dockerfile, compose, redes e volumes.', 1, NULL),
 ('a2000000-0000-0000-0000-000000000702', 'a1000000-0000-0000-0000-000000000007', 'kubernetes', 'Kubernetes',          'Pods, Deployments, Services, config, secrets e probes.',     2, 'a2000000-0000-0000-0000-000000000701'),
 ('a2000000-0000-0000-0000-000000000703', 'a1000000-0000-0000-0000-000000000007', 'ci-cd',      'CI/CD',               'Pipelines, integração contínua e estratégias de deploy.',    3, 'a2000000-0000-0000-0000-000000000702');

-- ─── LESSONS: Docker ─────────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000070101', 'a2000000-0000-0000-0000-000000000701', 'Imagens, containers e Dockerfile',
$theory$
## Imagens, containers e Dockerfile

### Os três substantivos
- **Imagem** — pacote imutável com a aplicação + runtime + dependências. Análogo ao `.jar`.
- **Container** — uma instância da imagem em execução. Análogo ao processo da JVM.
- **Registry** — repositório de imagens (Docker Hub, ECR, GHCR). Análogo ao Maven Central.

Containers **não são VMs**: compartilham o kernel do host, isolados por namespaces/cgroups — sobem em milissegundos e pesam megabytes.

```bash
docker build -t learnway-api:1.0 .        # Dockerfile -> imagem
docker run -d -p 8080:8080 learnway-api:1.0   # imagem -> container
docker ps / docker logs -f <id> / docker exec -it <id> sh
```

### Dockerfile para Spring Boot: multi-stage
Compilar num estágio pesado e rodar num estágio enxuto:

```dockerfile
# Estágio 1: build (JDK + Maven — descartado)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q       # camada cacheável de dependências
COPY src ./src
RUN mvn -DskipTests package -q

# Estágio 2: runtime (só o JRE + jar) — é o que vira imagem final
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
USER 1000                              # nunca rode como root
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Camadas e cache: por que a ORDEM importa
Cada instrução do Dockerfile vira uma **camada** imutável e cacheada. Uma camada só é reconstruída se **ela ou alguma anterior** mudou. Por isso:

```text
COPY pom.xml  +  resolve dependências   ← muda raramente: cache quente
COPY src      +  compila                ← muda a cada edição de código
```

Copiar `src` **antes** do `pom.xml` invalidaria o cache das dependências a cada edição de `.java` — rebuild de minutos em vez de segundos. Regra: **do que menos muda para o que mais muda**.

### Configuração e segredos
A mesma imagem roda em dev/staging/prod — o que muda entra **por fora**, via variáveis de ambiente (`SPRING_DATASOURCE_URL` sobrescreve `spring.datasource.url` no Boot):

```bash
docker run -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/app imagem
```

> **Nunca** copie `.env`, senhas ou chaves para dentro da imagem: imagem vai para registry, e registry vaza. Segredo entra em runtime.
$theory$, 15, 3, 1, 16),

 ('a3000000-0000-0000-0000-000000070102', 'a2000000-0000-0000-0000-000000000701', 'docker-compose, redes e volumes',
$theory$
## docker-compose, redes e volumes

Aplicação de verdade não vive só: precisa de banco, cache, broker. O **docker-compose** declara o conjunto num YAML e sobe tudo com um comando.

```yaml
services:
  api:
    build: ./learnway-api
    ports:
      - "8080:8080"                 # porta host : porta container
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/learnway
    depends_on:
      db:
        condition: service_healthy  # espera o banco ficar SAUDÁVEL

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: learnway
      POSTGRES_USER: learnway
      POSTGRES_PASSWORD: dev123
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learnway"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
```

```bash
docker compose up -d      # sobe tudo
docker compose logs -f api
docker compose down       # derruba (volumes nomeados FICAM)
```

### Rede: serviços se enxergam pelo NOME
O compose cria uma rede interna onde cada serviço é resolvido por DNS pelo **nome do serviço**: a API alcança o banco em `db:5432`.

> ⚠️ A pegadinha clássica: dentro do container, **`localhost` é o próprio container** — não a sua máquina, nem o outro serviço. `jdbc:postgresql://localhost:5432` dentro do container da API falha; o correto é `db:5432`.

O mapeamento `"8080:8080"` existe para o **host** (você, o navegador) alcançar o container; entre containers da mesma rede, a porta interna basta e o `ports` nem é necessário.

### Volumes: o que sobrevive
Containers são **descartáveis por design** — `down` + `up` = filesystem zerado. O que precisa durar mora em **volume**:

- **Volume nomeado** (`pgdata:`) — gerenciado pelo Docker; o padrão para dados de banco.
- **Bind mount** (`./src:/app/src`) — pasta do host dentro do container; útil em dev (hot reload).

Sem o volume no Postgres, **cada `docker compose down` apaga o banco inteiro** — o erro que todo iniciante comete uma vez.

### healthcheck + depends_on: ordem de subida de verdade
`depends_on` sozinho só espera o container **iniciar** — e o Postgres leva segundos até aceitar conexões. Com `condition: service_healthy`, a API só sobe quando o healthcheck passa, eliminando o clássico `Connection refused` de corrida de inicialização.

> Um `docker compose up` que funciona na primeira tentativa em qualquer máquina é o teste de maturidade do ambiente de desenvolvimento do projeto.
$theory$, 15, 3, 2, 15);

-- ─── LESSONS: Kubernetes ─────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000070201', 'a2000000-0000-0000-0000-000000000702', 'Kubernetes: pods, deployments e services',
$theory$
## Kubernetes: pods, deployments e services

Docker roda containers **numa** máquina. O **Kubernetes** (K8s) orquestra containers em um **cluster** de máquinas: decide onde cada um roda, reinicia o que morre, escala e distribui tráfego.

### A ideia central: estado desejado
Você não dá comandos ("suba 3 containers") — você **declara** o estado desejado num YAML, e os controladores do K8s trabalham continuamente para a realidade convergir:

```text
declarado: "quero 3 réplicas da api:1.4"
realidade: 2 rodando (uma morreu) → K8s cria a 3ª sozinho, sem humano
```

Isso é a **reconciliação** — o coração do Kubernetes e o que compra o *self-healing*.

### Os objetos essenciais
- **Pod** — a menor unidade: um ou mais containers que vivem e morrem juntos, com IP próprio. Você raramente cria pods diretamente — eles são **gado, não bicho de estimação**.
- **Deployment** — declara "quero N réplicas desta imagem" e gerencia os pods: recria os que morrem, faz **rolling update** (troca versão gradualmente, sem downtime) e permite rollback.
- **Service** — endereço **estável** na frente dos pods (que nascem e morrem com IPs novos). Faz o balanceamento e dá o nome DNS: `http://pedidos` resolve para os pods saudáveis do serviço `pedidos`.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: learnway-api
spec:
  replicas: 3
  selector:
    matchLabels: { app: learnway-api }
  template:
    metadata:
      labels: { app: learnway-api }
    spec:
      containers:
        - name: api
          image: registry/learnway-api:1.4.0
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: learnway-api
spec:
  selector: { app: learnway-api }     # encontra os pods pelo label
  ports:
    - port: 80
      targetPort: 8080
```

### Como o tráfego externo entra
`Service` do tipo `ClusterIP` (padrão) só existe dentro do cluster. Para o mundo externo há o **Ingress**: regras de roteamento HTTP (host/caminho → service) num ponto de entrada — o papel que o API Gateway/NGINX cumpre.

### kubectl: o dia a dia
```bash
kubectl apply -f deployment.yaml      # declara/atualiza o estado desejado
kubectl get pods / get svc            # o que está rodando
kubectl logs -f pod/learnway-api-xyz  # logs de um pod
kubectl rollout undo deployment/learnway-api   # rollback da versão
kubectl scale deployment/learnway-api --replicas=5
```

> Mate um pod (`kubectl delete pod ...`) e observe o Deployment recriá-lo em segundos. Esse pequeno experimento ensina mais sobre a filosofia do K8s do que horas de leitura.
$theory$, 20, 4, 1, 17),

 ('a3000000-0000-0000-0000-000000070202', 'a2000000-0000-0000-0000-000000000702', 'Config, secrets, probes e escala',
$theory$
## Config, secrets, probes e escala

### ConfigMap e Secret: configuração fora da imagem
A regra do Docker continua: a imagem é a mesma em todo ambiente; a configuração entra por fora. No K8s:

- **ConfigMap** — configuração não sensível (URLs, feature flags, níveis de log).
- **Secret** — credenciais e chaves (senha do banco, JWT secret). Montados como variáveis de ambiente ou arquivos no pod.

```yaml
containers:
  - name: api
    image: registry/learnway-api:1.4.0
    envFrom:
      - configMapRef: { name: api-config }
    env:
      - name: SPRING_DATASOURCE_PASSWORD
        valueFrom:
          secretKeyRef: { name: api-secrets, key: db-password }
```

> Secrets do K8s são codificados em Base64, **não criptografados** por padrão — controle de acesso (RBAC) e criptografia at-rest/gerenciadores externos (Vault, Secrets Manager) completam a história. Base64 no YAML commitado = senha vazada.

### Probes: ensine o K8s a saber se você está bem
O K8s só faz *self-healing* bem se souber **o que é "saudável"** para a sua aplicação:

| Probe | Pergunta | Se falha… |
|---|---|---|
| **liveness** | "o processo está vivo/destravado?" | o container é **reiniciado** |
| **readiness** | "está pronto para receber TRÁFEGO?" | o pod **sai do balanceamento** (sem restart) |
| startup | "ainda está inicializando?" | dá tempo extra antes das outras cobrarem |

```yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
```

O Spring Boot Actuator expõe os dois endpoints prontos. Distinção crucial: app aquecendo cache ou esperando o banco = **not ready** (tire do tráfego), não *not alive* (reiniciar não ajudaria em nada — e reinício em loop de um app saudável esperando dependência é o bug clássico de liveness mal configurada).

### Requests, limits e autoscaling
Cada container declara o que precisa:

```yaml
resources:
  requests: { cpu: "250m", memory: "512Mi" }   # reserva p/ agendamento
  limits:   { cpu: "1",    memory: "1Gi" }     # teto (estourar memória = OOMKill)
```

O **HPA** (Horizontal Pod Autoscaler) ajusta as réplicas pela carga:

```bash
kubectl autoscale deployment/learnway-api --min=2 --max=10 --cpu-percent=70
```

> A tríade que torna um serviço "cidadão de primeira classe" no K8s: imagem sem segredos + probes corretas + requests/limits declarados. Sem isso, o orquestrador voa às cegas.
$theory$, 20, 4, 2, 16);

-- ─── LESSONS: CI/CD ──────────────────────────────────────────────────
INSERT INTO lessons (id, subtopic_id, title, theory_content, xp_reward, difficulty_level, order_index, estimated_minutes) VALUES
 ('a3000000-0000-0000-0000-000000070301', 'a2000000-0000-0000-0000-000000000703', 'CI: integração contínua na prática',
$theory$
## CI: integração contínua na prática

**Integração contínua** é integrar o trabalho de todos, várias vezes ao dia, com **verificação automática a cada push**. O objetivo é um só: encurtar o tempo entre introduzir um problema e descobri-lo — um bug apontado em 5 minutos custa minutos; descoberto na sexta de deploy, custa o fim de semana.

### A anatomia de um pipeline
```text
push ─► checkout ─► build ─► testes ─► lint/análise ─► empacotar (jar/imagem) ─► publicar artefato
         │ falhou em qualquer etapa? ─► pipeline VERMELHO, PR bloqueado, autor notificado
```

Em GitHub Actions:

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17', cache: maven }
      - run: mvn -B verify              # compila + roda TODOS os testes
      - run: docker build -t learnway-api:${{ github.sha }} .
```

Conceitos que aparecem em qualquer ferramenta (Actions, GitLab CI, Jenkins):
- **Gatilho** (`on`) — push, PR, tag, cron.
- **Job/steps** — a sequência de comandos numa máquina descartável e limpa.
- **Cache** — dependências Maven/npm entre execuções (minutos → segundos).
- **Artefato** — o produto do build (jar, imagem) publicado com identificador único.

### Os princípios que fazem CI funcionar
1. **Fail fast** — etapas baratas primeiro (compilação, testes unitários); as caras (integração, E2E) depois. Feedback em minutos, não em uma hora.
2. **Build reprodutível** — a máquina do CI é descartável e limpa: se só funciona "na sua máquina", o CI conta a verdade.
3. **Verde é sagrado** — pipeline quebrado é a prioridade do time; conviver com vermelho treina todo mundo a ignorá-lo (e aí ele não protege mais nada).
4. **PR só entra verde** — *branch protection*: o merge é bloqueado sem o check passar.

### Versionar o artefato pelo commit
A imagem gerada leva o **SHA do commit** (`learnway-api:9f3ab12`): qualquer coisa rodando em produção aponta exatamente para o código que a gerou. Tags móveis como `latest` em produção são um convite ao "que versão está no ar?".

> CI é um investimento com juros compostos: cada verificação automatizada é uma classe de bug que **nunca mais** entra despercebida.
$theory$, 15, 3, 1, 15),

 ('a3000000-0000-0000-0000-000000070302', 'a2000000-0000-0000-0000-000000000703', 'CD: estratégias de deploy',
$theory$
## CD: estratégias de deploy

**Continuous Delivery** = todo commit verde gera um artefato **pronto para produção** (deploy com um clique). **Continuous Deployment** = o clique também é automático. Em ambos, deploy deixa de ser evento e vira rotina — e a rotina exige estratégias que não derrubem usuários.

### Rolling update (o padrão do Kubernetes)
Troca as réplicas **gradualmente**: sobe um pod da versão nova, espera ficar `ready`, derruba um da antiga, repete.

- ✅ Sem downtime, sem infraestrutura extra.
- ⚠️ Durante a janela, **as duas versões convivem** — mudanças de banco e de contrato precisam ser retrocompatíveis (expandir → migrar → contrair).

### Blue-green
Dois ambientes completos: **blue** (atual) e **green** (novo). Deploy no green, testa à vontade, e então **vira a chave** do tráfego de uma vez.

- ✅ Corte instantâneo; rollback = virar a chave de volta.
- ⚠️ Custa o dobro de infraestrutura durante a transição.

### Canary
Libera a versão nova para uma **fatia pequena** do tráfego (1%, 5%, 25%…) enquanto observa métricas (erros, latência). Saudável? Aumenta a fatia. Degradou? Reverte — e só o canário sofreu.

- ✅ Menor raio de explosão possível; decisão guiada por métricas reais.
- ⚠️ Exige roteamento fino (service mesh/ingress) e **observabilidade madura** — sem métricas confiáveis, canary é teatro.

### Feature flags: deploy ≠ release
A flag separa **colocar código em produção** de **ligar a funcionalidade**:

```java
if (featureFlags.isEnabled("novo-checkout", usuario)) {
    return novoCheckout();
}
return checkoutAtual();
```

Código novo entra desligado, é ligado para 1% dos usuários, depois 100% — e um problema se resolve **desligando a flag em segundos, sem deploy**. Custo real: flags velhas são dívida técnica; remova-as após consolidar.

### Rollback: o plano A (não o Z)
Deploy maduro assume que reverter é rotina:
- Imagens **imutáveis e versionadas** → rollback = apontar de volta para a tag anterior (`kubectl rollout undo`).
- A parte difícil é o **banco**: migração destrutiva (dropar coluna usada pela versão anterior) impede a volta. Padrão **expand/contract**: adicionar o novo (expand), migrar o código, e só remover o velho (contract) quando ninguém mais o usa — várias versões depois.

> Pergunta que define a maturidade do time: *"se este deploy der errado, quanto tempo até os usuários pararem de sofrer?"* — se a resposta passa de minutos, a estratégia (rollback, flags, canary) é o que falta.
$theory$, 20, 4, 2, 16);

-- ─── QUESTIONS ───────────────────────────────────────────────────────
-- L1: Docker básico -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007010101', 'a3000000-0000-0000-0000-000000070101', 'MULTIPLE_CHOICE',
  'Qual a relação correta entre imagem e container?', 'Pense em .jar e processo da JVM.', 1, 5, 3),
 ('a4000000-0000-0000-0000-000007010102', 'a3000000-0000-0000-0000-000000070101', 'MULTIPLE_CHOICE',
  'Num Dockerfile de projeto Maven, por que copiar o `pom.xml` e resolver dependências ANTES de copiar o `src`?', 'Camadas são cacheadas de cima para baixo.', 2, 5, 4);

-- L2: compose -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007010201', 'a3000000-0000-0000-0000-000000070102', 'MULTIPLE_CHOICE',
  'No compose, a API precisa se conectar ao serviço `db` (Postgres). Qual host usar na connection string?', 'Dentro do container, quem é localhost?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000007010202', 'a3000000-0000-0000-0000-000000070102', 'MULTIPLE_CHOICE',
  'Sem volume declarado para o Postgres, o que acontece com os dados ao rodar `docker compose down` e `up` de novo?', 'Containers são descartáveis por design.', 2, 5, 3);

-- L3: K8s básico -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007020101', 'a3000000-0000-0000-0000-000000070201', 'MULTIPLE_CHOICE',
  'Um pod de um Deployment com `replicas: 3` morre inesperadamente. O que acontece?', 'Estado desejado vs realidade.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000007020102', 'a3000000-0000-0000-0000-000000070201', 'DESCRIPTIVE',
  'Pods nascem e morrem com IPs diferentes. Explique o papel do Service do Kubernetes e como outros serviços encontram os pods de forma estável.', 'Endereço estável + DNS + labels.', 2, 10, 4);

-- L4: probes/config -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007020201', 'a3000000-0000-0000-0000-000000070202', 'MULTIPLE_CHOICE',
  'Qual a diferença entre liveness e readiness probe?', 'Uma reinicia; a outra tira do tráfego.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000007020202', 'a3000000-0000-0000-0000-000000070202', 'MULTIPLE_CHOICE',
  'Onde a senha do banco deve viver num deploy Kubernetes?', 'Nem na imagem, nem no ConfigMap.', 2, 5, 3);

-- L5: CI -> 2 MULTIPLE_CHOICE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007030101', 'a3000000-0000-0000-0000-000000070301', 'MULTIPLE_CHOICE',
  'Qual o objetivo central da integração contínua?', 'O que encurta: o build ou o tempo até descobrir o problema?', 1, 5, 3),
 ('a4000000-0000-0000-0000-000007030102', 'a3000000-0000-0000-0000-000000070301', 'MULTIPLE_CHOICE',
  'Por que ordenar o pipeline com as etapas baratas (compilação, testes unitários) antes das caras (integração, E2E)?', 'Fail fast.', 2, 5, 3);

-- L6: CD -> 1 MC + 1 DESCRIPTIVE
INSERT INTO lesson_questions (id, lesson_id, question_type, question_text, theory_hint, order_index, xp_reward, difficulty_level) VALUES
 ('a4000000-0000-0000-0000-000007030201', 'a3000000-0000-0000-0000-000000070302', 'MULTIPLE_CHOICE',
  'Qual estratégia libera a versão nova para uma fatia pequena do tráfego enquanto observa métricas, antes de expandir?', 'O pássaro na mina de carvão.', 1, 5, 4),
 ('a4000000-0000-0000-0000-000007030202', 'a3000000-0000-0000-0000-000000070302', 'DESCRIPTIVE',
  'Explique como feature flags separam "deploy" de "release" e por que isso reduz o risco de publicar código novo. Cite também o custo que as flags trazem.', 'Código em produção desligado; ligar sem deploy.', 2, 10, 4);

-- ─── OPTIONS ─────────────────────────────────────────────────────────
-- L1 Q1: imagem vs container
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000701010101', 'a4000000-0000-0000-0000-000007010101', 'A imagem é o pacote imutável; o container é uma instância dela em execução — várias podem rodar da mesma imagem.', TRUE,  'Correto: imagem : container :: .jar : processo. O run instancia; a imagem nunca muda.', 1),
 ('a5000000-0000-0000-0000-000701010102', 'a4000000-0000-0000-0000-000007010101', 'São sinônimos usados por ferramentas diferentes.', FALSE, 'São conceitos distintos: artefato vs execução.', 2),
 ('a5000000-0000-0000-0000-000701010103', 'a4000000-0000-0000-0000-000007010101', 'O container é o arquivo baixado; a imagem é ele rodando.', FALSE, 'É o inverso.', 3),
 ('a5000000-0000-0000-0000-000701010104', 'a4000000-0000-0000-0000-000007010101', 'A imagem é uma VM completa com kernel próprio.', FALSE, 'Containers compartilham o kernel do host — é o que os torna leves.', 4);

-- L1 Q2: ordem das camadas
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000701010201', 'a4000000-0000-0000-0000-000007010102', 'Para aproveitar o cache de camadas: dependências mudam raramente e ficam cacheadas; editar código só reconstrói da camada do src em diante.', TRUE,  'Correto: camadas anteriores intactas são reaproveitadas — rebuild de segundos em vez de minutos.', 1),
 ('a5000000-0000-0000-0000-000701010202', 'a4000000-0000-0000-0000-000007010102', 'Porque o Maven exige o pom.xml no diretório antes de qualquer arquivo.', FALSE, 'O Maven precisa do pom para RODAR, mas a ordem de cópia no Dockerfile é decisão de cache, não exigência.', 2),
 ('a5000000-0000-0000-0000-000701010203', 'a4000000-0000-0000-0000-000007010102', 'Por segurança: o src não pode ficar na mesma camada do pom.', FALSE, 'Não há regra de segurança aí — é otimização de build.', 3),
 ('a5000000-0000-0000-0000-000701010204', 'a4000000-0000-0000-0000-000007010102', 'A ordem é indiferente; o resultado e o tempo são os mesmos.', FALSE, 'O resultado é o mesmo, mas o TEMPO de rebuild muda drasticamente com o cache.', 4);

-- L2 Q1: host db
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000701020101', 'a4000000-0000-0000-0000-000007010201', 'db — os serviços da rede do compose se resolvem por DNS pelo nome do serviço.', TRUE,  'Correto: jdbc:postgresql://db:5432/learnway. Entre containers, o nome do serviço é o host.', 1),
 ('a5000000-0000-0000-0000-000701020102', 'a4000000-0000-0000-0000-000007010201', 'localhost — os containers compartilham a rede local.', FALSE, 'Dentro do container, localhost é o PRÓPRIO container — a conexão falha.', 2),
 ('a5000000-0000-0000-0000-000701020103', 'a4000000-0000-0000-0000-000007010201', 'O IP fixo 172.17.0.2 do container do banco.', FALSE, 'IPs de container mudam a cada recriação — nunca dependa deles.', 3),
 ('a5000000-0000-0000-0000-000701020104', 'a4000000-0000-0000-0000-000007010201', 'host.docker.internal', FALSE, 'Esse nome alcança o HOST a partir do container — útil noutros cenários, não para outro serviço do compose.', 4);

-- L2 Q2: sem volume
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000701020201', 'a4000000-0000-0000-0000-000007010202', 'Os dados são perdidos — o filesystem do container morre com ele; persistência exige volume.', TRUE,  'Correto: containers são descartáveis; o banco inteiro some no down. Volume nomeado resolve.', 1),
 ('a5000000-0000-0000-0000-000701020202', 'a4000000-0000-0000-0000-000007010202', 'Nada — o Docker preserva o filesystem entre execuções automaticamente.', FALSE, 'Sem volume, o estado vive no container e morre com ele.', 2),
 ('a5000000-0000-0000-0000-000701020203', 'a4000000-0000-0000-0000-000007010202', 'O Postgres se recusa a subir sem volume.', FALSE, 'Sobe normalmente — o perigo é justamente parecer que está tudo bem.', 3),
 ('a5000000-0000-0000-0000-000701020204', 'a4000000-0000-0000-0000-000007010202', 'Os dados vão automaticamente para a pasta do projeto.', FALSE, 'Isso exigiria um bind mount declarado — nada é automático.', 4);

-- L3 Q1: self-healing
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000702010101', 'a4000000-0000-0000-0000-000007020101', 'O Deployment detecta a divergência do estado desejado e cria um pod novo automaticamente.', TRUE,  'Correto: reconciliação — declarou 3, o controlador mantém 3. É o self-healing do K8s.', 1),
 ('a5000000-0000-0000-0000-000702010102', 'a4000000-0000-0000-0000-000007020101', 'O cluster fica com 2 réplicas até um operador humano intervir.', FALSE, 'Intervenção manual é exatamente o que a reconciliação elimina.', 2),
 ('a5000000-0000-0000-0000-000702010103', 'a4000000-0000-0000-0000-000007020101', 'O Deployment inteiro é reiniciado, derrubando as outras réplicas.', FALSE, 'Só o pod perdido é reposto; as demais réplicas seguem servindo.', 3),
 ('a5000000-0000-0000-0000-000702010104', 'a4000000-0000-0000-0000-000007020101', 'O K8s faz rollback para a versão anterior da imagem.', FALSE, 'Rollback é operação de versão (rollout undo), não a reação a pod morto.', 4);

-- L4 Q1: liveness vs readiness
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000702020101', 'a4000000-0000-0000-0000-000007020201', 'Liveness falhou → container reiniciado; readiness falhou → pod sai do balanceamento, sem restart.', TRUE,  'Correto: "está vivo?" vs "pode receber tráfego?". App esperando o banco = not ready, não not alive.', 1),
 ('a5000000-0000-0000-0000-000702020102', 'a4000000-0000-0000-0000-000007020201', 'São o mesmo check com nomes diferentes por versão do K8s.', FALSE, 'São probes distintas com consequências bem diferentes.', 2),
 ('a5000000-0000-0000-0000-000702020103', 'a4000000-0000-0000-0000-000007020201', 'Liveness roda uma vez no boot; readiness roda para sempre.', FALSE, 'Ambas rodam periodicamente durante toda a vida do pod (startup probe cobre o boot).', 3),
 ('a5000000-0000-0000-0000-000702020104', 'a4000000-0000-0000-0000-000007020201', 'Readiness reinicia o pod; liveness tira do tráfego.', FALSE, 'É o inverso.', 4);

-- L4 Q2: secret
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000702020201', 'a4000000-0000-0000-0000-000007020202', 'Num Secret do K8s (idealmente com criptografia/gestor externo), injetada no pod como env var ou arquivo.', TRUE,  'Correto: nem na imagem, nem em ConfigMap, nem commitada — Secret com RBAC, e Vault/Secrets Manager para maturidade extra.', 1),
 ('a5000000-0000-0000-0000-000702020202', 'a4000000-0000-0000-0000-000007020202', 'Hardcoded na imagem, que já é privada no registry.', FALSE, 'Imagem vaza (pull, camadas, CI) — segredo nunca entra na imagem.', 2),
 ('a5000000-0000-0000-0000-000702020203', 'a4000000-0000-0000-0000-000007020202', 'Num ConfigMap junto com as outras configs.', FALSE, 'ConfigMap é para dado NÃO sensível — sem os controles de acesso do Secret.', 3),
 ('a5000000-0000-0000-0000-000702020204', 'a4000000-0000-0000-0000-000007020202', 'No application.yml commitado, para o time todo ter acesso.', FALSE, 'Credencial commitada = vazada; histórico do git não perdoa.', 4);

-- L5 Q1: objetivo CI
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000703010101', 'a4000000-0000-0000-0000-000007030101', 'Encurtar o tempo entre introduzir um problema e descobri-lo, verificando cada push automaticamente.', TRUE,  'Correto: feedback em minutos — o custo de um bug cresce com o tempo que passa despercebido.', 1),
 ('a5000000-0000-0000-0000-000703010102', 'a4000000-0000-0000-0000-000007030101', 'Eliminar a necessidade de escrever testes.', FALSE, 'CI EXECUTA os testes — sem eles, o pipeline verifica quase nada.', 2),
 ('a5000000-0000-0000-0000-000703010103', 'a4000000-0000-0000-0000-000007030101', 'Fazer o deploy automático a cada commit.', FALSE, 'Isso é continuous deployment — etapa além do CI.', 3),
 ('a5000000-0000-0000-0000-000703010104', 'a4000000-0000-0000-0000-000007030101', 'Substituir o code review humano.', FALSE, 'CI e review são complementares: máquina checa o verificável, humanos o resto.', 4);

-- L5 Q2: fail fast
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000703010201', 'a4000000-0000-0000-0000-000007030102', 'Para falhar rápido: a maioria dos erros é pega nas etapas baratas, devolvendo feedback em minutos sem gastar os recursos das caras.', TRUE,  'Correto: fail fast — não faz sentido rodar 30 min de E2E num código que nem compila.', 1),
 ('a5000000-0000-0000-0000-000703010202', 'a4000000-0000-0000-0000-000007030102', 'Porque as etapas caras só funcionam depois das baratas por limitação técnica.', FALSE, 'Poderiam rodar em qualquer ordem/paralelo — a ordenação é decisão de eficiência de feedback.', 2),
 ('a5000000-0000-0000-0000-000703010203', 'a4000000-0000-0000-0000-000007030102', 'Para economizar dinheiro apenas — o tempo de feedback não muda.', FALSE, 'O tempo de feedback é justamente o maior ganho.', 3),
 ('a5000000-0000-0000-0000-000703010204', 'a4000000-0000-0000-0000-000007030102', 'A ordem é aleatória nos pipelines modernos.', FALSE, 'A ordem é desenhada de propósito, do barato ao caro.', 4);

-- L6 Q1: canary
INSERT INTO question_options (id, question_id, option_text, is_correct, explanation, order_index) VALUES
 ('a5000000-0000-0000-0000-000703020101', 'a4000000-0000-0000-0000-000007030201', 'Canary', TRUE,  'Correto: fatia pequena → observa métricas → expande ou reverte. Menor raio de explosão possível.', 1),
 ('a5000000-0000-0000-0000-000703020102', 'a4000000-0000-0000-0000-000007030201', 'Blue-green', FALSE, 'Blue-green vira 100% do tráfego de uma vez — o corte é instantâneo, não gradual.', 2),
 ('a5000000-0000-0000-0000-000703020103', 'a4000000-0000-0000-0000-000007030201', 'Rolling update', FALSE, 'Rolling troca réplicas gradualmente, mas sem direcionar fatia de TRÁFEGO por métrica.', 3),
 ('a5000000-0000-0000-0000-000703020104', 'a4000000-0000-0000-0000-000007030201', 'Big bang (tudo de uma vez)', FALSE, 'É o oposto: risco máximo, raio de explosão total.', 4);

-- ─── DESCRIPTIVE ANSWERS ─────────────────────────────────────────────
INSERT INTO descriptive_answers (id, question_id, reference_answer, evaluation_criteria) VALUES
 ('a7000000-0000-0000-0000-000007020102', 'a4000000-0000-0000-0000-000007020102',
  'O Service é um endereço ESTÁVEL (IP virtual + nome DNS) na frente de um conjunto de pods, selecionados por LABELS (selector app=x). Pods morrem e nascem com IPs novos, mas o Service permanece: ele mantém a lista de endpoints saudáveis (integrada à readiness probe) e balanceia as requisições entre eles. Outros serviços simplesmente chamam http://nome-do-service — o DNS interno do cluster resolve — sem conhecer nem acompanhar os IPs dos pods.',
  'Deve explicar o endereço/DNS estável, a seleção de pods por labels e o balanceamento entre pods vivos. Bônus por citar a integração com readiness (pod not ready sai dos endpoints) ou tipos de Service (ClusterIP/Ingress para tráfego externo). Penalizar se disser que os serviços chamam os IPs dos pods diretamente.'),
 ('a7000000-0000-0000-0000-000007030202', 'a4000000-0000-0000-0000-000007030202',
  'Deploy é colocar o código em produção; release é torná-lo ativo para usuários. Com feature flag, o código novo entra DESLIGADO (deploy sem release): o risco de publicar cai porque nada muda para o usuário. A ativação é gradual e independente de deploy — liga para 1% dos usuários, observa, expande — e um problema se resolve DESLIGANDO a flag em segundos, sem novo deploy nem rollback. Custos: flags antigas acumulam como dívida técnica (caminhos mortos, combinações de teste explodem), exigem disciplina de remoção após consolidar e alguma infraestrutura de gestão.',
  'Deve distinguir deploy (código em produção) de release (funcionalidade ativa), explicar a ativação gradual/desligamento instantâneo sem deploy, e citar o custo (dívida das flags velhas, complexidade de teste). Penalizar se tratar flag como substituto de testes ou confundir com branch de git.');
