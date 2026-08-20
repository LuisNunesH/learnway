package com.learnway.review;

import com.learnway.common.security.SecurityUtils;
import com.learnway.review.dto.CompleteReviewRequest;
import com.learnway.review.dto.ReviewDueDto;
import com.learnway.review.dto.ReviewResultDto;
import com.learnway.review.dto.ReviewStatsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Reviews", description = "Revisão espaçada (SM-2) — os cristais de conhecimento")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/due")
    @Operation(summary = "Revisões pendentes do usuário")
    public List<ReviewDueDto> due() {
        return reviewService.listDue(SecurityUtils.currentUserId());
    }

    @PostMapping("/{lessonId}/complete")
    @Operation(summary = "Registra o resultado de uma revisão e reagenda")
    public ReviewResultDto complete(@PathVariable UUID lessonId,
                                    @Valid @RequestBody CompleteReviewRequest request) {
        return reviewService.completeReview(SecurityUtils.currentUserId(), lessonId, request.quality());
    }

    @GetMapping("/stats")
    @Operation(summary = "Estatísticas de revisão (cristais pendentes, atrasados, etc.)")
    public ReviewStatsDto stats() {
        return reviewService.stats(SecurityUtils.currentUserId());
    }
}
