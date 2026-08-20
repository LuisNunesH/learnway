package com.learnway.gamification;

import com.learnway.common.security.SecurityUtils;
import com.learnway.gamification.dto.LeaderboardEntryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@Tag(name = "Leaderboard", description = "Ranking semanal de XP")
public class LeaderboardController {

    private final GamificationService gamificationService;

    public LeaderboardController(GamificationService gamificationService) {
        this.gamificationService = gamificationService;
    }

    @GetMapping("/weekly")
    @Operation(summary = "Top 10 da semana por XP (reinicia toda segunda-feira)")
    public List<LeaderboardEntryDto> weekly() {
        return gamificationService.weeklyLeaderboard(SecurityUtils.currentUserId());
    }
}
