package com.learnway.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnway.ai.dto.AskResponse;
import com.learnway.ai.dto.ChatTurn;
import com.learnway.ai.dto.CodeEvaluation;
import com.learnway.ai.dto.DescriptiveEvaluation;
import com.learnway.ai.dto.StatementValidation;
import com.learnway.common.exception.BadRequestException;
import com.learnway.common.exception.ExternalServiceException;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.content.entity.*;
import com.learnway.content.repository.CodeChallengeRepository;
import com.learnway.content.repository.DescriptiveAnswerRepository;
import com.learnway.content.repository.LessonQuestionRepository;
import com.learnway.content.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Builds the AI prompts, calls the model (via {@link AiRouter}, com fallback) and parses
 * its JSON output into typed evaluations.
 */
@Service
public class AiEvaluationService {

    private static final int PASS_THRESHOLD = 60;
    private static final int THEORY_CONTEXT_LIMIT = 4000;

    private final AiRouter aiRouter;
    private final LessonQuestionRepository questionRepository;
    private final DescriptiveAnswerRepository descriptiveAnswerRepository;
    private final CodeChallengeRepository codeChallengeRepository;
    private final LessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    public AiEvaluationService(AiRouter aiRouter,
                               LessonQuestionRepository questionRepository,
                               DescriptiveAnswerRepository descriptiveAnswerRepository,
                               CodeChallengeRepository codeChallengeRepository,
                               LessonRepository lessonRepository,
                               ObjectMapper objectMapper) {
        this.aiRouter = aiRouter;
        this.questionRepository = questionRepository;
        this.descriptiveAnswerRepository = descriptiveAnswerRepository;
        this.codeChallengeRepository = codeChallengeRepository;
        this.lessonRepository = lessonRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public DescriptiveEvaluation evaluateDescriptive(UUID questionId, String studentAnswer) {
        LessonQuestion question = requireQuestion(questionId, QuestionType.DESCRIPTIVE);
        DescriptiveAnswer reference = descriptiveAnswerRepository.findByQuestionId(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Gabarito da questão", questionId));

        String prompt = """
                Você é um avaliador técnico sênior Java.
                Avalie a resposta abaixo de forma construtiva e didática.

                Pergunta: %s
                Resposta de referência: %s
                Critérios de avaliação: %s
                Resposta do aluno: %s

                Responda APENAS com JSON válido neste formato:
                {
                  "score": 0-100,
                  "passed": boolean,
                  "feedback": "feedback construtivo em português",
                  "strengths": ["ponto forte 1", "ponto forte 2"],
                  "improvements": ["melhoria 1", "melhoria 2"],
                  "complementary_tip": "dica técnica adicional"
                }
                """.formatted(
                question.getQuestionText(),
                reference.getReferenceAnswer(),
                nullSafe(reference.getEvaluationCriteria()),
                studentAnswer);

        JsonNode json = callAndParse(prompt);
        int score = clampScore(json.path("score").asInt(0));
        boolean passed = json.has("passed") ? json.path("passed").asBoolean() : score >= PASS_THRESHOLD;

        return new DescriptiveEvaluation(
                score,
                passed,
                json.path("feedback").asText(""),
                readStringArray(json.path("strengths")),
                readStringArray(json.path("improvements")),
                json.path("complementary_tip").asText(""));
    }

    @Transactional(readOnly = true)
    public CodeEvaluation evaluateCode(UUID questionId, String studentCode) {
        LessonQuestion question = requireQuestion(questionId, QuestionType.CODE_CHALLENGE);
        CodeChallenge challenge = codeChallengeRepository.findByQuestionId(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Desafio de código", questionId));

        String prompt = """
                Você é um avaliador de código Java sênior.
                Desafio: %s
                Código do aluno:
                %s
                Solução de referência (NÃO revele ao aluno):
                %s
                Test cases: %s

                Avalie tecnicamente: corretude, legibilidade, boas práticas Java e eficiência.
                Responda APENAS com JSON válido neste formato:
                {
                  "passed": boolean,
                  "score": 0-100,
                  "test_results": [{"case": "...", "passed": boolean}],
                  "code_review": "análise técnica detalhada em português",
                  "best_practices_feedback": "feedback sobre padrões Java",
                  "suggested_improvement": "código melhorado com comentários"
                }
                """.formatted(
                question.getQuestionText(),
                studentCode,
                nullSafe(challenge.getSolutionCode()),
                nullSafe(challenge.getTestCases()));

        JsonNode json = callAndParse(prompt);
        int score = clampScore(json.path("score").asInt(0));
        boolean passed = json.has("passed") ? json.path("passed").asBoolean() : score >= PASS_THRESHOLD;

        List<CodeEvaluation.TestResult> testResults = new ArrayList<>();
        JsonNode results = json.path("test_results");
        if (results.isArray()) {
            for (JsonNode r : results) {
                testResults.add(new CodeEvaluation.TestResult(
                        r.path("case").asText(""), r.path("passed").asBoolean(false)));
            }
        }

        return new CodeEvaluation(
                passed,
                score,
                testResults,
                json.path("code_review").asText(""),
                json.path("best_practices_feedback").asText(""),
                json.path("suggested_improvement").asText(""));
    }

    @Transactional(readOnly = true)
    public AskResponse ask(UUID lessonId, String userQuestion) {
        String context = "";
        if (lessonId != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
            String theory = lesson.getTheoryContent();
            if (theory != null && theory.length() > THEORY_CONTEXT_LIMIT) {
                theory = theory.substring(0, THEORY_CONTEXT_LIMIT);
            }
            context = "Contexto da lição \"%s\":\n%s\n\n".formatted(lesson.getTitle(), theory);
        }

        String prompt = """
                Você é um tutor técnico de Java/Spring, didático, direto e em português.
                %sPergunta do aluno: %s

                Responda de forma clara e objetiva, com exemplos de código quando ajudar.
                Se a pergunta fugir de programação Java/Spring, redirecione gentilmente o aluno ao tema.
                """.formatted(context, userQuestion);

        String answer = aiRouter.generate(prompt, false);
        return new AskResponse(answer.trim());
    }

    /** Contexto máximo enviado à IA quando o artigo vem do frontend (teoria). */
    private static final int ARTICLE_CONTEXT_LIMIT = 12000;
    /** Quantas falas anteriores entram no prompt do chat de dúvidas. */
    private static final int HISTORY_TURNS = 8;
    private static final java.util.Set<String> VALID_VERDICTS =
            java.util.Set.of("CORRECT", "PARTIALLY_CORRECT", "INCORRECT");

    public StatementValidation validateStatement(String articleTitle, String articleContent, String statement) {
        String context = truncate(articleContent, ARTICLE_CONTEXT_LIMIT);

        String prompt = """
                Você é um professor de Java/Spring corrigindo um aluno que está validando o próprio conhecimento.
                O aluno leu o artigo abaixo e vai fazer AFIRMAÇÕES sobre o conteúdo; sua tarefa é dizer se cada
                afirmação está correta, parcialmente correta ou incorreta, e explicar o porquê de forma didática.

                Artigo "%s":
                %s

                Afirmação do aluno: %s

                Regras:
                - Julgue a afirmação tecnicamente, usando o artigo como base principal (mas corrija também erros técnicos gerais de Java/Spring).
                - Se a afirmação não for uma afirmação sobre o conteúdo (ex.: pergunta solta ou assunto fora de Java/Spring), use verdict INCORRECT e explique gentilmente que a proposta é validar afirmações sobre o artigo.
                - Explicação em português, curta e didática; reforce o que está certo e corrija com precisão o que está errado.

                Responda APENAS com JSON válido neste formato:
                {
                  "verdict": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT",
                  "explanation": "explicação didática em português"
                }
                """.formatted(articleTitle, context, statement);

        JsonNode json = callAndParse(prompt);
        String verdict = json.path("verdict").asText("").toUpperCase();
        if (!VALID_VERDICTS.contains(verdict)) {
            verdict = "PARTIALLY_CORRECT";
        }
        return new StatementValidation(verdict, json.path("explanation").asText(""));
    }

    /**
     * Chat de dúvidas sobre um artigo de teoria: conversa livre, multi-turno, com o
     * texto do artigo como contexto principal.
     */
    public AskResponse askTheory(String articleTitle, String articleContent,
                                 String question, List<ChatTurn> history) {
        String prompt = """
                Você é um tutor técnico de Java/Spring, didático, direto e em português.
                O aluno está lendo o artigo abaixo e quer tirar dúvidas sobre ele.

                Artigo "%s":
                %s
                %s
                Pergunta do aluno: %s

                Regras:
                - Responda em português, de forma clara e objetiva, com exemplos de código quando ajudar.
                - Use o artigo como base principal, mas complemente com conhecimento geral de Java/Spring quando a dúvida passar do texto.
                - Leve em conta a conversa até aqui: o aluno pode estar dando seguimento a uma pergunta anterior.
                - Se a pergunta fugir de programação Java/Spring, redirecione gentilmente o aluno ao tema do artigo.
                - Use markdown (listas, blocos de código, negrito) para facilitar a leitura, sem enrolação.
                """.formatted(
                articleTitle,
                truncate(articleContent, ARTICLE_CONTEXT_LIMIT),
                formatHistory(history),
                question);

        String answer = aiRouter.generate(prompt, false);
        return new AskResponse(answer.trim());
    }

    // ── helpers ─────────────────────────────────────────────────────────

    /** Últimas falas em texto corrido para o prompt; vazio na primeira pergunta. */
    private String formatHistory(List<ChatTurn> history) {
        if (history == null || history.isEmpty()) {
            return "";
        }
        List<ChatTurn> recent = history.size() > HISTORY_TURNS
                ? history.subList(history.size() - HISTORY_TURNS, history.size())
                : history;
        StringBuilder text = new StringBuilder("\nConversa até aqui:\n");
        for (ChatTurn turn : recent) {
            text.append("user".equalsIgnoreCase(turn.role()) ? "Aluno" : "Você")
                    .append(": ").append(turn.text()).append('\n');
        }
        return text.toString();
    }

    private String truncate(String text, int limit) {
        return text.length() > limit ? text.substring(0, limit) : text;
    }

    private LessonQuestion requireQuestion(UUID questionId, QuestionType expected) {
        LessonQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
        if (question.getQuestionType() != expected) {
            throw new BadRequestException("Tipo de questão incompatível com esta avaliação");
        }
        return question;
    }

    private JsonNode callAndParse(String prompt) {
        String raw = aiRouter.generate(prompt, true);
        try {
            return objectMapper.readTree(extractJson(raw));
        } catch (Exception ex) {
            throw new ExternalServiceException("A IA retornou uma resposta em formato inesperado.");
        }
    }

    /** Strips markdown code fences and isolates the outermost JSON object. */
    private String extractJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```(json)?", "").replaceAll("```$", "").trim();
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> values.add(n.asText()));
        }
        return values;
    }

    private int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
