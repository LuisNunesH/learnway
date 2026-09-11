# LearnWay API

Backend da **LearnWay** — plataforma de aprendizado gamificada para devs Java fullstack.
Spring Boot 3.3 · Java 17 · PostgreSQL (Neon) · Flyway · Spring Security (JWT) · Google Gemini.

---

## 1. Pré-requisitos

- **JDK 17+** (`JAVA_HOME` apontando para ele)
- **Maven 3.8+**
- Conta gratuita no **Neon** (PostgreSQL) — https://neon.tech
- Chave gratuita da **Google Gemini API** — https://aistudio.google.com

---

## 2. Banco de dados (Neon)

1. Crie uma conta em https://neon.tech e um projeto chamado `learnway`.
2. Em **Connection Details**, copie a connection string. O Neon entrega no formato URI:
   ```
   postgresql://USUARIO:SENHA@ep-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. O Spring usa o formato **JDBC** com usuário/senha separados. Converta assim:
   - `DATABASE_URL` → `jdbc:postgresql://ep-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `DATABASE_USERNAME` → `USUARIO`
   - `DATABASE_PASSWORD` → `SENHA`

> As tabelas e o conteúdo inicial (conquistas + trilha **Java – Fundamentos**) são criados
> automaticamente pelo **Flyway** na primeira execução. Não rode SQL na mão.

---

## 3. IA (Google Gemini)

1. Acesse https://aistudio.google.com → **Get API Key**.
2. Gere a chave e use em `GEMINI_API_KEY`.

A IA é usada para: avaliar respostas descritivas, avaliar desafios de código e o chat
contextual "Aprofundar com IA". Sem a chave, os endpoints `/api/ai/**` (e respostas
descritivas/código) retornam **502** com mensagem amigável; o resto da API funciona normalmente.

---

## 4. Variáveis de ambiente (arquivo `.env`)

1. **Copie o arquivo `.env.example` para `.env`** na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
2. **Preencha com suas credenciais** (o arquivo `.env` é ignorado pelo git):
   ```
   DATABASE_URL=jdbc:postgresql://<seu-host>.neon.tech/neondb?sslmode=require
   DATABASE_USERNAME=<seu-usuario-neon>
   DATABASE_PASSWORD=<sua-senha>
   JWT_SECRET=<base64-de-256-bits>
   GEMINI_API_KEY=<sua-chave-gemini>
   ```

A aplicação carrega automaticamente as variáveis do `.env` na inicialização. Variáveis já definidas no sistema (ex.: CI/production) não são sobrescritas.

| Variável | Obrigatória | Default |
|---|---|---|
| `DATABASE_URL` | sim | — |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | sim | — |
| `JWT_SECRET` (Base64) | recomendado | segredo de dev embutido |
| `GEMINI_API_KEY` | p/ features de IA | vazio (IA desativada) |
| `GEMINI_MODEL` | não | `gemini-1.5-flash` |
| `CORS_ALLOWED_ORIGINS` | não | `http://localhost:4200` |

---

## 5. Executar

```bash
mvn spring-boot:run
```

A API sobe em **http://localhost:8080**.
Documentação interativa (Swagger UI): **http://localhost:8080/swagger-ui.html**

Build do JAR:
```bash
mvn clean package
java -jar target/learnway-api-0.1.0.jar
```

---

## 6. Endpoints

### Auth (`/api/auth`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | cria conta, devolve tokens |
| POST | `/login` | login por username/email + senha |
| POST | `/refresh` | renova o access token |

### Conteúdo (`/api`)
| GET | `/topics` | trilhas ativas |
| GET | `/topics/{id}/subtopics` | subtópicos de uma trilha |
| GET | `/subtopics/{id}/lessons` | lições de um subtópico |
| GET | `/lessons/{id}` | teoria + questões (sem gabarito) |

### Progresso (`/api/progress`)
| GET | `/trail` | mapa de trilha com estado dos nós |
| POST | `/lesson/{id}/start` | inicia lição |
| POST | `/lesson/{id}/complete` | conclui, calcula score, agenda revisão |
| POST | `/question/{id}/answer` | responde (MC determinístico; descritiva/código via IA) |

### Revisões — SM-2 (`/api/reviews`)
| GET | `/due` | revisões pendentes (cristais) |
| POST | `/{lessonId}/complete` | registra resultado (quality 0–5) e reagenda |
| GET | `/stats` | cristais pendentes / atrasados |

### Sessões de estudo (`/api/sessions`)
| POST | `/start` | inicia/retoma timer |
| POST | `/end` | encerra e calcula duração |
| GET | `/stats` | tempo total, semanal e diário |

### IA (`/api/ai`)
| POST | `/evaluate-descriptive` | avalia resposta descritiva |
| POST | `/evaluate-code` | avalia desafio de código |
| POST | `/ask` | chat contextual |

### Gamificação
| GET | `/api/leaderboard/weekly` | top 10 da semana |
| GET | `/api/achievements` | catálogo + status do usuário |
| GET | `/api/achievements/my` | conquistas desbloqueadas |
| GET | `/api/users/profile/me` | perfil: stats, heatmap, XP no tempo, acurácia |

Todas as rotas (exceto `/api/auth/**`, Swagger e `/actuator/health`) exigem
o header `Authorization: Bearer <accessToken>`.

---

## 7. Arquitetura

```
com.learnway
├── config/        SecurityConfig, JwtAuthenticationFilter, CORS, Gemini/JWT props, OpenAPI
├── common/        LevelCalculator, exceptions + handler, SecurityUtils, UserPrincipal
├── auth/          User, JwtService, AuthService/Controller
├── content/       Topic→Subtopic→Lesson→Question (+ options/code/descriptive), ContentService
├── progress/      UserLessonProgress, QuestionAttempt, motor de respostas, trilha
├── review/        ReviewSchedule + SpacedRepetitionService (SM-2)
├── session/       StudySession (timer de estudo)
├── ai/            GeminiService (real) + AiEvaluationService
├── gamification/  XpEvent, Achievement, leaderboard semanal
├── profile/       agregação de estatísticas do perfil
└── scheduler/     ReviewReminderScheduler (@Scheduled horário)
```

### Spaced Repetition (cristais de conhecimento)
Ao concluir uma lição, um cristal acende no mapa. Conforme `next_review_at` se aproxima,
o cristal "fica com fome" e, quando vence, pulsa em vermelho (`OVERDUE`/`DUE_TODAY`).
O algoritmo **SM-2** (`SpacedRepetitionService`) reagenda a cada revisão: acertos
aumentam o intervalo (1d → 6d → 15d → …); erros resetam para 1 dia.

---

## 8. Notas

- `spring.jpa.hibernate.ddl-auto=validate`: o schema é de responsabilidade do Flyway; o
  Hibernate apenas valida que as entidades batem com as tabelas. Se precisar evoluir o
  schema, adicione uma nova migration `V3__...sql` (nunca edite as já aplicadas).
- IDs são `UUID` gerados pela aplicação (`GenerationType.UUID`).
- Datas/horas usam `timestamptz` (UTC) mapeadas para `OffsetDateTime`.
