package com.learnway.flashcard;

import com.learnway.common.exception.BadRequestException;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.content.entity.Lesson;
import com.learnway.flashcard.dto.*;
import com.learnway.flashcard.entity.Flashcard;
import com.learnway.flashcard.entity.FlashcardProgress;
import com.learnway.gamification.GamificationService;
import com.learnway.gamification.dto.AchievementDto;
import com.learnway.gamification.entity.XpSource;
import com.learnway.gamification.repository.XpEventRepository;
import com.learnway.progress.UserLessonProgressRepository;
import com.learnway.progress.entity.LessonStatus;
import com.learnway.progress.entity.UserLessonProgress;
import com.learnway.review.SpacedRepetitionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Flashcards estilo Anki: cada carta de uma lição concluída tem seu próprio
 * agendamento SM-2 por usuário. Cartas sem progresso são "novas" e ficam
 * disponíveis imediatamente; as demais voltam quando o intervalo vence.
 */
@Service
public class FlashcardService {

    private static final int FLASHCARD_XP_PASS = 3;
    private static final int FLASHCARD_XP_FAIL = 1;
    private static final long CARD_MASTER_THRESHOLD = 50;

    private final FlashcardRepository flashcardRepository;
    private final FlashcardProgressRepository progressRepository;
    private final UserLessonProgressRepository lessonProgressRepository;
    private final SpacedRepetitionService sm2;
    private final GamificationService gamificationService;
    private final XpEventRepository xpEventRepository;

    public FlashcardService(FlashcardRepository flashcardRepository,
                            FlashcardProgressRepository progressRepository,
                            UserLessonProgressRepository lessonProgressRepository,
                            SpacedRepetitionService sm2,
                            GamificationService gamificationService,
                            XpEventRepository xpEventRepository) {
        this.flashcardRepository = flashcardRepository;
        this.progressRepository = progressRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.sm2 = sm2;
        this.gamificationService = gamificationService;
        this.xpEventRepository = xpEventRepository;
    }

    @Transactional(readOnly = true)
    public List<FlashcardDeckDto> decks(UUID userId) {
        List<UUID> completedLessons = completedLessonIds(userId);
        if (completedLessons.isEmpty()) {
            return List.of();
        }
        List<Flashcard> cards = flashcardRepository.findByLessonIdInOrderByOrderIndexAsc(completedLessons);
        Map<UUID, FlashcardProgress> progressByCard = progressByCard(userId, cards);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Map<Lesson, List<Flashcard>> byLesson = cards.stream()
                .collect(Collectors.groupingBy(Flashcard::getLesson));

        return byLesson.entrySet().stream()
                .sorted(Comparator.comparingLong(entry -> lessonSortKey(entry.getKey())))
                .map(entry -> toDeckDto(entry.getKey(), entry.getValue(), progressByCard, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardDueDto> due(UUID userId, UUID lessonId) {
        List<UUID> completedLessons = completedLessonIds(userId);
        if (lessonId != null) {
            if (!completedLessons.contains(lessonId)) {
                throw new BadRequestException("Complete a lição antes de estudar os flashcards dela.");
            }
            completedLessons = List.of(lessonId);
        }
        if (completedLessons.isEmpty()) {
            return List.of();
        }

        List<Flashcard> cards = flashcardRepository.findByLessonIdInOrderByOrderIndexAsc(completedLessons);
        Map<UUID, FlashcardProgress> progressByCard = progressByCard(userId, cards);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        List<FlashcardDueDto> dueCards = new ArrayList<>();
        List<FlashcardDueDto> newCards = new ArrayList<>();
        for (Flashcard card : cards) {
            FlashcardProgress progress = progressByCard.get(card.getId());
            if (progress == null) {
                newCards.add(toDueDto(card, null, true));
            } else if (!progress.getNextReviewAt().isAfter(now)) {
                dueCards.add(toDueDto(card, progress, false));
            }
        }
        // Vencidas primeiro (mais atrasada no topo), depois as novas na ordem do baralho.
        dueCards.sort(Comparator.comparing(FlashcardDueDto::nextReviewAt));

        List<FlashcardDueDto> result = new ArrayList<>(dueCards);
        result.addAll(newCards);
        return result;
    }

    @Transactional
    public FlashcardGradeResultDto grade(UUID userId, UUID flashcardId, int quality) {
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard", flashcardId));

        UUID lessonId = card.getLesson().getId();
        boolean lessonCompleted = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
                .map(p -> p.getStatus() == LessonStatus.COMPLETED)
                .orElse(false);
        if (!lessonCompleted) {
            throw new BadRequestException("Complete a lição antes de estudar os flashcards dela.");
        }

        FlashcardProgress progress = progressRepository.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> new FlashcardProgress(userId, flashcardId));
        sm2.apply(progress, quality);
        progressRepository.save(progress);

        int xp = quality >= 3 ? FLASHCARD_XP_PASS : FLASHCARD_XP_FAIL;
        gamificationService.awardXp(userId, xp, XpSource.FLASHCARD, flashcardId);
        gamificationService.touchActivity(userId);

        List<AchievementDto> newAchievements = new ArrayList<>();
        if (xpEventRepository.countByUserIdAndSource(userId, XpSource.FLASHCARD) >= CARD_MASTER_THRESHOLD) {
            gamificationService.grantIfAbsent(userId, "card_master").ifPresent(newAchievements::add);
        }

        return new FlashcardGradeResultDto(
                flashcardId, quality, progress.getIntervalDays(), progress.getRepetitions(),
                progress.getEaseFactor(), progress.getNextReviewAt(), xp, newAchievements);
    }

    @Transactional(readOnly = true)
    public FlashcardStatsDto stats(UUID userId) {
        List<FlashcardDeckDto> decks = decks(userId);
        int total = decks.stream().mapToInt(FlashcardDeckDto::totalCards).sum();
        int news = decks.stream().mapToInt(FlashcardDeckDto::newCards).sum();
        int due = decks.stream().mapToInt(FlashcardDeckDto::dueCards).sum();
        OffsetDateTime next = decks.stream()
                .map(FlashcardDeckDto::nextReviewAt)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);
        return new FlashcardStatsDto(total, news, due, next);
    }

    // ── Internos ────────────────────────────────────────────────────────

    private List<UUID> completedLessonIds(UUID userId) {
        return lessonProgressRepository.findByUserId(userId).stream()
                .filter(p -> p.getStatus() == LessonStatus.COMPLETED)
                .map(UserLessonProgress::getLessonId)
                .toList();
    }

    private Map<UUID, FlashcardProgress> progressByCard(UUID userId, List<Flashcard> cards) {
        if (cards.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = cards.stream().map(Flashcard::getId).toList();
        return progressRepository.findByUserIdAndFlashcardIdIn(userId, ids).stream()
                .collect(Collectors.toMap(FlashcardProgress::getFlashcardId, Function.identity()));
    }

    private FlashcardDeckDto toDeckDto(Lesson lesson, List<Flashcard> cards,
                                       Map<UUID, FlashcardProgress> progressByCard, OffsetDateTime now) {
        int news = 0;
        int due = 0;
        OffsetDateTime next = null;
        for (Flashcard card : cards) {
            FlashcardProgress progress = progressByCard.get(card.getId());
            if (progress == null) {
                news++;
            } else if (!progress.getNextReviewAt().isAfter(now)) {
                due++;
            } else if (next == null || progress.getNextReviewAt().isBefore(next)) {
                next = progress.getNextReviewAt();
            }
        }
        return new FlashcardDeckDto(
                lesson.getId(), lesson.getTitle(),
                lesson.getSubtopic().getTitle(),
                lesson.getSubtopic().getTopic().getTitle(),
                lesson.getSubtopic().getTopic().getColorHex(),
                cards.size(), news, due, next);
    }

    private FlashcardDueDto toDueDto(Flashcard card, FlashcardProgress progress, boolean isNew) {
        Lesson lesson = card.getLesson();
        return new FlashcardDueDto(
                card.getId(), lesson.getId(), lesson.getTitle(),
                lesson.getSubtopic().getTopic().getTitle(),
                lesson.getSubtopic().getTopic().getColorHex(),
                card.getFrontText(), card.getBackText(),
                isNew,
                progress != null ? progress.getIntervalDays() : 1,
                progress != null ? progress.getRepetitions() : 0,
                progress != null ? progress.getNextReviewAt() : null);
    }

    /** Ordena baralhos pela posição da lição na trilha (tópico → subtópico → lição). */
    private static long lessonSortKey(Lesson lesson) {
        return lesson.getSubtopic().getTopic().getOrderIndex() * 1_000_000L
                + lesson.getSubtopic().getOrderIndex() * 1_000L
                + lesson.getOrderIndex();
    }
}
