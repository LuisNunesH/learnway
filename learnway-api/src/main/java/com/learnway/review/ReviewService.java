package com.learnway.review;

import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.content.entity.Lesson;
import com.learnway.content.repository.LessonRepository;
import com.learnway.gamification.GamificationService;
import com.learnway.gamification.dto.AchievementDto;
import com.learnway.gamification.entity.XpSource;
import com.learnway.gamification.repository.XpEventRepository;
import com.learnway.review.dto.ReviewDueDto;
import com.learnway.review.dto.ReviewResultDto;
import com.learnway.review.dto.ReviewStatsDto;
import com.learnway.review.entity.ReviewSchedule;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private static final int REVIEW_XP_PASS = 10;
    private static final int REVIEW_XP_FAIL = 3;
    private static final long REVIEWER_ACHIEVEMENT_THRESHOLD = 20;

    private final ReviewScheduleRepository scheduleRepository;
    private final SpacedRepetitionService sm2;
    private final LessonRepository lessonRepository;
    private final GamificationService gamificationService;
    private final XpEventRepository xpEventRepository;

    public ReviewService(ReviewScheduleRepository scheduleRepository,
                         SpacedRepetitionService sm2,
                         LessonRepository lessonRepository,
                         GamificationService gamificationService,
                         XpEventRepository xpEventRepository) {
        this.scheduleRepository = scheduleRepository;
        this.sm2 = sm2;
        this.lessonRepository = lessonRepository;
        this.gamificationService = gamificationService;
        this.xpEventRepository = xpEventRepository;
    }

    /**
     * Recomputes urgency for every schedule that is due now and persists changes.
     * Invoked hourly by the reminder scheduler.
     * @return the number of schedules currently due.
     */
    @Transactional
    public int refreshDueUrgencies() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ReviewSchedule> due = scheduleRepository.findByNextReviewAtLessThanEqual(now);
        for (ReviewSchedule schedule : due) {
            schedule.setUrgencyLevel(sm2.urgencyFor(schedule.getNextReviewAt()));
        }
        return due.size();
    }

    /** Creates the first review schedule for a lesson, if none exists yet. */
    @Transactional
    public void ensureSchedule(UUID userId, UUID lessonId) {
        if (scheduleRepository.findByUserIdAndLessonId(userId, lessonId).isEmpty()) {
            scheduleRepository.save(sm2.initialSchedule(userId, lessonId));
        }
    }

    @Transactional(readOnly = true)
    public List<ReviewDueDto> listDue(UUID userId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return scheduleRepository
                .findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(userId, now).stream()
                .map(this::toDueDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewStatsDto stats(UUID userId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        long total = scheduleRepository.countByUserId(userId);
        List<ReviewSchedule> all = scheduleRepository.findByUserIdOrderByNextReviewAtAsc(userId);

        long overdue = 0;
        long dueToday = 0;
        long due = 0;
        OffsetDateTime next = null;
        for (ReviewSchedule s : all) {
            switch (sm2.urgencyFor(s.getNextReviewAt())) {
                case OVERDUE -> { overdue++; due++; }
                case DUE_TODAY -> { dueToday++; if (!s.getNextReviewAt().isAfter(now)) due++; }
                case NORMAL -> { if (next == null) next = s.getNextReviewAt(); }
            }
        }
        return new ReviewStatsDto(total, due, overdue, dueToday, next);
    }

    @Transactional
    public ReviewResultDto completeReview(UUID userId, UUID lessonId, int quality) {
        ReviewSchedule schedule = scheduleRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Nenhuma revisão agendada para esta lição"));

        sm2.applyReview(schedule, quality);
        scheduleRepository.save(schedule);

        int xp = quality >= 3 ? REVIEW_XP_PASS : REVIEW_XP_FAIL;
        gamificationService.awardXp(userId, xp, XpSource.REVIEW, lessonId);
        gamificationService.touchActivity(userId);

        List<AchievementDto> newAchievements = new ArrayList<>();
        if (xpEventRepository.countByUserIdAndSource(userId, XpSource.REVIEW) >= REVIEWER_ACHIEVEMENT_THRESHOLD) {
            gamificationService.grantIfAbsent(userId, "reviewer").ifPresent(newAchievements::add);
        }

        return new ReviewResultDto(
                lessonId, quality, schedule.getIntervalDays(), schedule.getRepetitions(),
                schedule.getEaseFactor(), schedule.getNextReviewAt(), schedule.getUrgencyLevel(),
                xp, newAchievements);
    }

    private ReviewDueDto toDueDto(ReviewSchedule s) {
        Lesson lesson = lessonRepository.findById(s.getLessonId()).orElse(null);
        String lessonTitle = lesson != null ? lesson.getTitle() : "(lição removida)";
        String subtopicTitle = lesson != null ? lesson.getSubtopic().getTitle() : null;
        String topicTitle = lesson != null ? lesson.getSubtopic().getTopic().getTitle() : null;
        String colorHex = lesson != null ? lesson.getSubtopic().getTopic().getColorHex() : null;

        return new ReviewDueDto(
                s.getLessonId(), lessonTitle, subtopicTitle, topicTitle, colorHex,
                s.getNextReviewAt(), sm2.urgencyFor(s.getNextReviewAt()),
                s.getIntervalDays(), s.getRepetitions());
    }
}
