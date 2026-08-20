package com.learnway.profile;

import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.auth.dto.UserDto;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.common.time.AppClock;
import com.learnway.content.entity.Lesson;
import com.learnway.content.entity.Topic;
import com.learnway.content.repository.LessonRepository;
import com.learnway.content.repository.TopicRepository;
import com.learnway.gamification.GamificationService;
import com.learnway.gamification.entity.XpEvent;
import com.learnway.gamification.repository.XpEventRepository;
import com.learnway.profile.dto.ProfileDto;
import com.learnway.progress.UserLessonProgressRepository;
import com.learnway.progress.QuestionAttemptRepository;
import com.learnway.progress.entity.LessonStatus;
import com.learnway.session.StudySessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private static final int XP_HISTORY_DAYS = 30;
    private static final int HEATMAP_DAYS = 84; // 12 weeks

    private final UserRepository userRepository;
    private final StudySessionRepository sessionRepository;
    private final UserLessonProgressRepository progressRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final XpEventRepository xpEventRepository;
    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final GamificationService gamificationService;
    private final AppClock clock;

    public ProfileService(UserRepository userRepository,
                          StudySessionRepository sessionRepository,
                          UserLessonProgressRepository progressRepository,
                          QuestionAttemptRepository attemptRepository,
                          XpEventRepository xpEventRepository,
                          TopicRepository topicRepository,
                          LessonRepository lessonRepository,
                          GamificationService gamificationService,
                          AppClock clock) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.progressRepository = progressRepository;
        this.attemptRepository = attemptRepository;
        this.xpEventRepository = xpEventRepository;
        this.topicRepository = topicRepository;
        this.lessonRepository = lessonRepository;
        this.gamificationService = gamificationService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        long totalStudyMinutes = sessionRepository.totalMinutes(userId);
        long lessonsCompleted = progressRepository.countByUserIdAndStatus(userId, LessonStatus.COMPLETED);

        List<ProfileDto.TypeAccuracy> accuracy = attemptRepository.accuracyByType(userId).stream()
                .map(r -> new ProfileDto.TypeAccuracy(r.getType(), r.getTotal(), r.getCorrect(),
                        r.getTotal() == 0 ? 0.0 : round1(r.getCorrect() * 100.0 / r.getTotal())))
                .toList();

        return new ProfileDto(
                UserDto.from(user),
                totalStudyMinutes,
                lessonsCompleted,
                gamificationService.countEarned(userId),
                gamificationService.listEarned(userId),
                accuracy,
                xpHistory(userId),
                studyHeatmap(userId),
                lessonsByTopic(userId));
    }

    private List<ProfileDto.XpPoint> xpHistory(UUID userId) {
        OffsetDateTime since = clock.startOfDay(clock.today().minusDays(XP_HISTORY_DAYS - 1));
        Map<LocalDate, Long> byDay = new TreeMap<>();
        for (XpEvent event : xpEventRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since)) {
            LocalDate day = clock.dateOf(event.getCreatedAt());
            byDay.merge(day, (long) event.getAmount(), Long::sum);
        }
        return byDay.entrySet().stream()
                .map(e -> new ProfileDto.XpPoint(e.getKey(), e.getValue()))
                .toList();
    }

    private List<ProfileDto.DayActivity> studyHeatmap(UUID userId) {
        LocalDate from = clock.today().minusDays(HEATMAP_DAYS - 1);
        return sessionRepository.dailyMinutesSince(userId, from).stream()
                .map(r -> new ProfileDto.DayActivity(r.getDate(), r.getMinutes()))
                .toList();
    }

    private List<ProfileDto.TopicDistribution> lessonsByTopic(UUID userId) {
        Set<UUID> completedLessonIds = progressRepository.findByUserId(userId).stream()
                .filter(p -> p.getStatus() == LessonStatus.COMPLETED)
                .map(p -> p.getLessonId())
                .collect(Collectors.toSet());

        List<ProfileDto.TopicDistribution> distribution = new ArrayList<>();
        for (Topic topic : topicRepository.findAllByActiveTrueOrderByOrderIndexAsc()) {
            List<Lesson> lessons = lessonRepository.findByTopicId(topic.getId());
            long completed = lessons.stream().filter(l -> completedLessonIds.contains(l.getId())).count();
            distribution.add(new ProfileDto.TopicDistribution(
                    topic.getTitle(), topic.getColorHex(), completed, lessons.size()));
        }
        return distribution;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
