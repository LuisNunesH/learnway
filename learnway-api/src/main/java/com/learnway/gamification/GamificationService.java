package com.learnway.gamification;

import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.common.LevelCalculator;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.common.time.AppClock;
import com.learnway.gamification.dto.AchievementDto;
import com.learnway.gamification.dto.LeaderboardEntryDto;
import com.learnway.gamification.entity.*;
import com.learnway.gamification.repository.AchievementRepository;
import com.learnway.gamification.repository.UserAchievementRepository;
import com.learnway.gamification.repository.XpEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Central place for XP awards, streak maintenance, achievement granting and the leaderboard.
 * Low-level: it never depends on the progress/review/session modules, so callers in those
 * modules invoke {@link #grantIfAbsent} with a slug once they detect a condition is met.
 */
@Service
public class GamificationService {

    private final UserRepository userRepository;
    private final XpEventRepository xpEventRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AppClock clock;

    public GamificationService(UserRepository userRepository,
                               XpEventRepository xpEventRepository,
                               AchievementRepository achievementRepository,
                               UserAchievementRepository userAchievementRepository,
                               AppClock clock) {
        this.userRepository = userRepository;
        this.xpEventRepository = xpEventRepository;
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.clock = clock;
    }

    /** Adds XP to the user's total and records a ledger event. */
    @Transactional
    public int awardXp(UUID userId, int amount, XpSource source, UUID referenceId) {
        if (amount <= 0) {
            User u = requireUser(userId);
            return u.getXpTotal();
        }
        User user = requireUser(userId);
        user.setXpTotal(user.getXpTotal() + amount);
        xpEventRepository.save(new XpEvent(userId, amount, source, referenceId));
        return user.getXpTotal();
    }

    /**
     * Updates the consecutive-day streak based on the user's last activity date,
     * then grants streak achievements when thresholds are crossed.
     */
    @Transactional
    public void touchActivity(UUID userId) {
        User user = requireUser(userId);
        LocalDate today = clock.today();
        LocalDate last = user.getLastActivityDate();

        if (last == null) {
            user.setStreakDays(1);
        } else if (last.equals(today)) {
            // already counted today
        } else if (last.equals(today.minusDays(1))) {
            user.setStreakDays(user.getStreakDays() + 1);
        } else {
            user.setStreakDays(1);
        }
        user.setLastActivityDate(today);

        if (user.getStreakDays() >= 7) grantIfAbsent(userId, "streak_7");
        if (user.getStreakDays() >= 30) grantIfAbsent(userId, "streak_30");
    }

    /**
     * Grants an achievement if the user does not already have it.
     * @return the newly granted achievement, or empty if already owned / unknown slug.
     */
    @Transactional
    public Optional<AchievementDto> grantIfAbsent(UUID userId, String slug) {
        Optional<Achievement> maybe = achievementRepository.findBySlug(slug);
        if (maybe.isEmpty()) {
            return Optional.empty();
        }
        Achievement achievement = maybe.get();
        if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId())) {
            return Optional.empty();
        }
        UserAchievement granted = new UserAchievement(userId, achievement.getId());
        userAchievementRepository.save(granted);
        if (achievement.getXpBonus() > 0) {
            awardXp(userId, achievement.getXpBonus(), XpSource.ACHIEVEMENT, achievement.getId());
        }
        return Optional.of(AchievementDto.earned(achievement, granted.getEarnedAt()));
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> listAllForUser(UUID userId) {
        Map<UUID, OffsetDateTime> earned = new HashMap<>();
        userAchievementRepository.findByUserId(userId)
                .forEach(ua -> earned.put(ua.getAchievementId(), ua.getEarnedAt()));

        return achievementRepository.findAll().stream()
                .map(a -> earned.containsKey(a.getId())
                        ? AchievementDto.earned(a, earned.get(a.getId()))
                        : AchievementDto.locked(a))
                .sorted(Comparator.comparing(AchievementDto::slug))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> listEarned(UUID userId) {
        return listAllForUser(userId).stream().filter(AchievementDto::earned).toList();
    }

    @Transactional(readOnly = true)
    public long countEarned(UUID userId) {
        return userAchievementRepository.countByUserId(userId);
    }

    /** Top 10 users by XP earned since the start of the current ISO week (segunda, 00:00 local). */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> weeklyLeaderboard(UUID currentUserId) {
        OffsetDateTime weekStart = clock.startOfDay(clock.today().with(DayOfWeek.MONDAY));

        var aggregates = xpEventRepository.aggregateSince(weekStart, PageRequest.of(0, 10));
        List<LeaderboardEntryDto> result = new ArrayList<>();
        int rank = 1;
        for (var agg : aggregates) {
            User user = userRepository.findById(agg.getUserId()).orElse(null);
            if (user == null) continue;
            result.add(new LeaderboardEntryDto(
                    rank,
                    user.getId(),
                    user.getUsername(),
                    user.getAvatarUrl(),
                    agg.getTotalXp() == null ? 0 : agg.getTotalXp(),
                    LevelCalculator.levelFor(user.getXpTotal()),
                    rank == 1,
                    user.getId().equals(currentUserId)));
            rank++;
        }
        return result;
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
