package com.learnway.scheduler;

import com.learnway.review.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Hourly job that recomputes how urgent each pending review is, so the
 * "knowledge crystals" on the map fade and turn red as reviews fall due.
 */
@Component
public class ReviewReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReviewReminderScheduler.class);

    private final ReviewService reviewService;

    public ReviewReminderScheduler(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @Scheduled(cron = "${learnway.review.scheduler-cron}")
    public void refreshReviews() {
        int due = reviewService.refreshDueUrgencies();
        if (due > 0) {
            log.info("Revisões pendentes recalculadas: {} cristais aguardando revisão.", due);
        }
    }
}
