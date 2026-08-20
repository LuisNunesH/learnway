package com.learnway.progress;

import com.learnway.ai.AiEvaluationService;
import com.learnway.ai.dto.CodeEvaluation;
import com.learnway.ai.dto.DescriptiveEvaluation;
import com.learnway.common.exception.BadRequestException;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.content.ContentService;
import com.learnway.content.entity.*;
import com.learnway.content.repository.*;
import com.learnway.gamification.GamificationService;
import com.learnway.gamification.dto.AchievementDto;
import com.learnway.gamification.entity.XpSource;
import com.learnway.progress.dto.*;
import com.learnway.progress.entity.LessonStatus;
import com.learnway.progress.entity.QuestionAttempt;
import com.learnway.progress.entity.UserLessonProgress;
import com.learnway.review.ReviewScheduleRepository;
import com.learnway.review.ReviewService;
import com.learnway.review.SpacedRepetitionService;
import com.learnway.review.entity.ReviewSchedule;
import com.learnway.review.entity.UrgencyLevel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ProgressService {

    private static final int CODE_WARRIOR_THRESHOLD = 5;
    private static final int SPEED_DEMON_THRESHOLD = 10;

    private final UserLessonProgressRepository progressRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final LessonRepository lessonRepository;
    private final LessonQuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final AiEvaluationService aiEvaluationService;
    private final ReviewService reviewService;
    private final ReviewScheduleRepository reviewScheduleRepository;
    private final SpacedRepetitionService spacedRepetitionService;
    private final GamificationService gamificationService;

    public ProgressService(UserLessonProgressRepository progressRepository,
                           QuestionAttemptRepository attemptRepository,
                           LessonRepository lessonRepository,
                           LessonQuestionRepository questionRepository,
                           QuestionOptionRepository optionRepository,
                           TopicRepository topicRepository,
                           SubtopicRepository subtopicRepository,
                           AiEvaluationService aiEvaluationService,
                           ReviewService reviewService,
                           ReviewScheduleRepository reviewScheduleRepository,
                           SpacedRepetitionService spacedRepetitionService,
                           GamificationService gamificationService) {
        this.progressRepository = progressRepository;
        this.attemptRepository = attemptRepository;
        this.lessonRepository = lessonRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.topicRepository = topicRepository;
        this.subtopicRepository = subtopicRepository;
        this.aiEvaluationService = aiEvaluationService;
        this.reviewService = reviewService;
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.spacedRepetitionService = spacedRepetitionService;
        this.gamificationService = gamificationService;
    }

    // ── Lesson lifecycle ────────────────────────────────────────────────

    @Transactional
    public LessonProgressDto startLesson(UUID userId, UUID lessonId) {
        requireLesson(lessonId);
        UserLessonProgress progress = progressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> new UserLessonProgress(userId, lessonId));
        if (progress.getStatus() != LessonStatus.COMPLETED) {
            progress.setStatus(LessonStatus.IN_PROGRESS);
        }
        progress.setAttempts(progress.getAttempts() + 1);
        progress = progressRepository.save(progress);
        gamificationService.touchActivity(userId);
        return LessonProgressDto.from(progress);
    }

    @Transactional
    public AnswerResultDto answerQuestion(UUID userId, UUID questionId, AnswerRequest request) {
        LessonQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
        UUID lessonId = question.getLesson().getId();

        AnswerResultDto result = switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE -> gradeMultipleChoice(question, request);
            case DESCRIPTIVE -> gradeDescriptive(question, request);
            case CODE_CHALLENGE -> gradeCode(question, request);
        };

        // Persist the attempt.
        QuestionAttempt attempt = new QuestionAttempt();
        attempt.setUserId(userId);
        attempt.setQuestionId(questionId);
        attempt.setLessonId(lessonId);
        attempt.setQuestionType(question.getQuestionType());
        attempt.setCorrect(result.correct());
        attempt.setScore(result.score());
        attempt.setXpEarned(result.xpEarned());
        attempt.setTimeSpentSeconds(request.timeSpentSeconds());
        attemptRepository.save(attempt);

        if (result.xpEarned() > 0) {
            gamificationService.awardXp(userId, result.xpEarned(), XpSource.QUESTION, questionId);
        }
        gamificationService.touchActivity(userId);

        List<AchievementDto> achievements = checkAnswerAchievements(userId, question, request, result);

        return withAchievements(result, achievements);
    }

    @Transactional
    public CompleteLessonResultDto completeLesson(UUID userId, UUID lessonId) {
        Lesson lesson = requireLesson(lessonId);
        List<LessonQuestion> questions = questionRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);

        BigDecimal score = computeScore(userId, lessonId, questions);
        boolean perfect = score.compareTo(BigDecimal.valueOf(100)) == 0 && !questions.isEmpty();

        UserLessonProgress progress = progressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> new UserLessonProgress(userId, lessonId));
        boolean firstCompletion = progress.getStatus() != LessonStatus.COMPLETED;

        progress.setStatus(LessonStatus.COMPLETED);
        progress.setScorePercentage(score);
        progress.setCompletedAt(OffsetDateTime.now());

        int xpEarned = 0;
        if (firstCompletion) {
            xpEarned = lesson.getXpReward();
            progress.setXpEarned(progress.getXpEarned() + xpEarned);
        }
        progressRepository.save(progress);

        if (xpEarned > 0) {
            gamificationService.awardXp(userId, xpEarned, XpSource.LESSON, lessonId);
        }

        // First review crystal lights up.
        reviewService.ensureSchedule(userId, lessonId);
        OffsetDateTime nextReviewAt = reviewScheduleRepository.findByUserIdAndLessonId(userId, lessonId)
                .map(ReviewSchedule::getNextReviewAt).orElse(null);

        gamificationService.touchActivity(userId);

        List<AchievementDto> newAchievements = new ArrayList<>();
        if (progressRepository.countByUserIdAndStatus(userId, LessonStatus.COMPLETED) >= 1) {
            gamificationService.grantIfAbsent(userId, "first_lesson").ifPresent(newAchievements::add);
        }
        if (perfect) {
            gamificationService.grantIfAbsent(userId, "no_mistakes").ifPresent(newAchievements::add);
        }

        return new CompleteLessonResultDto(lessonId, progress.getStatus(), score, xpEarned,
                firstCompletion, nextReviewAt, newAchievements);
    }

    // ── Grading ─────────────────────────────────────────────────────────

    private AnswerResultDto gradeMultipleChoice(LessonQuestion question, AnswerRequest request) {
        if (request.selectedOptionId() == null) {
            throw new BadRequestException("selectedOptionId é obrigatório para múltipla escolha");
        }
        List<QuestionOption> options = optionRepository.findByQuestionIdOrderByOrderIndexAsc(question.getId());
        QuestionOption selected = options.stream()
                .filter(o -> o.getId().equals(request.selectedOptionId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Alternativa não pertence a esta questão"));
        QuestionOption correctOption = options.stream().filter(QuestionOption::isCorrect).findFirst().orElse(null);

        boolean correct = selected.isCorrect();
        int xp = correct ? question.getXpReward() : 0;

        List<AnswerResultDto.OptionFeedback> feedback = options.stream()
                .map(o -> new AnswerResultDto.OptionFeedback(
                        o.getId(), o.getOptionText(), o.isCorrect(), o.getExplanation(),
                        o.getId().equals(request.selectedOptionId())))
                .toList();

        return new AnswerResultDto(question.getId(), QuestionType.MULTIPLE_CHOICE, correct,
                correct ? 100 : 0, xp, request.selectedOptionId(),
                correctOption != null ? correctOption.getId() : null,
                feedback, null, null, List.of());
    }

    private AnswerResultDto gradeDescriptive(LessonQuestion question, AnswerRequest request) {
        if (request.answerText() == null || request.answerText().trim().length() < ContentService.DESCRIPTIVE_MIN_CHARS) {
            throw new BadRequestException("A resposta deve ter ao menos "
                    + ContentService.DESCRIPTIVE_MIN_CHARS + " caracteres");
        }
        DescriptiveEvaluation eval = aiEvaluationService.evaluateDescriptive(question.getId(), request.answerText());
        int xp = eval.passed() ? question.getXpReward() : 0;
        return new AnswerResultDto(question.getId(), QuestionType.DESCRIPTIVE, eval.passed(),
                eval.score(), xp, null, null, null, eval, null, List.of());
    }

    private AnswerResultDto gradeCode(LessonQuestion question, AnswerRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new BadRequestException("O campo 'code' é obrigatório para desafios de código");
        }
        CodeEvaluation eval = aiEvaluationService.evaluateCode(question.getId(), request.code());
        int xp = eval.passed() ? question.getXpReward() : 0;
        return new AnswerResultDto(question.getId(), QuestionType.CODE_CHALLENGE, eval.passed(),
                eval.score(), xp, null, null, null, null, eval, List.of());
    }

    private List<AchievementDto> checkAnswerAchievements(UUID userId, LessonQuestion question,
                                                         AnswerRequest request, AnswerResultDto result) {
        List<AchievementDto> granted = new ArrayList<>();
        if (!result.correct()) {
            return granted;
        }
        switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE -> {
                if (request.timeSpentSeconds() != null && request.timeSpentSeconds() < 30
                        && attemptRepository.countFastCorrectMultipleChoice(userId) >= SPEED_DEMON_THRESHOLD) {
                    gamificationService.grantIfAbsent(userId, "speed_demon").ifPresent(granted::add);
                }
            }
            case CODE_CHALLENGE -> {
                if (attemptRepository.countDistinctCorrectCodeChallenges(userId) >= CODE_WARRIOR_THRESHOLD) {
                    gamificationService.grantIfAbsent(userId, "code_warrior").ifPresent(granted::add);
                }
            }
            case DESCRIPTIVE -> { /* no answer-level achievement */ }
        }
        return granted;
    }

    private BigDecimal computeScore(UUID userId, UUID lessonId, List<LessonQuestion> questions) {
        if (questions.isEmpty()) {
            return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        }
        // Latest attempt per question wins.
        Map<UUID, Boolean> latestCorrect = new HashMap<>();
        for (QuestionAttempt a : attemptRepository.findByUserIdAndLessonIdOrderByCreatedAtAsc(userId, lessonId)) {
            latestCorrect.put(a.getQuestionId(), a.isCorrect());
        }
        long correct = questions.stream()
                .filter(q -> Boolean.TRUE.equals(latestCorrect.get(q.getId())))
                .count();
        return BigDecimal.valueOf(correct * 100.0 / questions.size()).setScale(2, RoundingMode.HALF_UP);
    }

    // ── Trail map ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TrailDto buildTrail(UUID userId) {
        Map<UUID, UserLessonProgress> progressByLesson = new HashMap<>();
        progressRepository.findByUserId(userId).forEach(p -> progressByLesson.put(p.getLessonId(), p));

        Map<UUID, ReviewSchedule> reviewByLesson = new HashMap<>();
        reviewScheduleRepository.findByUserIdOrderByNextReviewAtAsc(userId)
                .forEach(r -> reviewByLesson.put(r.getLessonId(), r));

        List<TrailDto.TopicNode> topicNodes = new ArrayList<>();
        for (Topic topic : topicRepository.findAllByActiveTrueOrderByOrderIndexAsc()) {
            List<Subtopic> subtopics = subtopicRepository.findByTopicIdOrderByOrderIndexAsc(topic.getId());

            // Pre-compute completion per subtopic for prerequisite checks.
            Map<UUID, List<Lesson>> lessonsBySubtopic = new HashMap<>();
            Map<UUID, Boolean> subtopicComplete = new HashMap<>();
            for (Subtopic st : subtopics) {
                List<Lesson> lessons = lessonRepository.findBySubtopicIdOrderByOrderIndexAsc(st.getId());
                lessonsBySubtopic.put(st.getId(), lessons);
                boolean complete = !lessons.isEmpty() && lessons.stream().allMatch(l ->
                        isCompleted(progressByLesson.get(l.getId())));
                subtopicComplete.put(st.getId(), complete);
            }

            long completedLessons = 0;
            long totalLessons = 0;
            List<TrailDto.SubtopicNode> subtopicNodes = new ArrayList<>();
            for (Subtopic st : subtopics) {
                boolean locked = st.getPrerequisiteSubtopicId() != null
                        && !Boolean.TRUE.equals(subtopicComplete.get(st.getPrerequisiteSubtopicId()));

                List<Lesson> lessons = lessonsBySubtopic.get(st.getId());
                List<TrailDto.LessonNode> lessonNodes = new ArrayList<>();
                boolean previousCompleted = true;
                for (Lesson lesson : lessons) {
                    totalLessons++;
                    UserLessonProgress p = progressByLesson.get(lesson.getId());
                    boolean completed = isCompleted(p);
                    if (completed) completedLessons++;

                    TrailDto.NodeStatus status;
                    UrgencyLevel crystal = null;
                    if (locked) {
                        status = TrailDto.NodeStatus.LOCKED;
                    } else if (completed) {
                        ReviewSchedule schedule = reviewByLesson.get(lesson.getId());
                        if (schedule != null) {
                            crystal = spacedRepetitionService.urgencyFor(schedule.getNextReviewAt());
                        }
                        status = (crystal == UrgencyLevel.OVERDUE || crystal == UrgencyLevel.DUE_TODAY)
                                ? TrailDto.NodeStatus.REVIEW : TrailDto.NodeStatus.COMPLETED;
                    } else if (previousCompleted) {
                        status = TrailDto.NodeStatus.AVAILABLE;
                    } else {
                        status = TrailDto.NodeStatus.LOCKED;
                    }

                    lessonNodes.add(new TrailDto.LessonNode(
                            lesson.getId(), lesson.getTitle(), lesson.getOrderIndex(),
                            lesson.getDifficultyLevel(), lesson.getXpReward(), status,
                            p != null ? p.getScorePercentage() : null, crystal));

                    previousCompleted = completed;
                }

                subtopicNodes.add(new TrailDto.SubtopicNode(
                        st.getId(), st.getSlug(), st.getTitle(), st.getOrderIndex(),
                        locked, st.getPrerequisiteSubtopicId(), lessonNodes));
            }

            topicNodes.add(new TrailDto.TopicNode(
                    topic.getId(), topic.getSlug(), topic.getTitle(), topic.getIcon(),
                    topic.getColorHex(), topic.getOrderIndex(), completedLessons, totalLessons, subtopicNodes));
        }

        return new TrailDto(topicNodes);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private boolean isCompleted(UserLessonProgress p) {
        return p != null && p.getStatus() == LessonStatus.COMPLETED;
    }

    private Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
    }

    private AnswerResultDto withAchievements(AnswerResultDto base, List<AchievementDto> achievements) {
        return new AnswerResultDto(base.questionId(), base.type(), base.correct(), base.score(),
                base.xpEarned(), base.selectedOptionId(), base.correctOptionId(), base.options(),
                base.descriptiveEvaluation(), base.codeEvaluation(), achievements);
    }
}
