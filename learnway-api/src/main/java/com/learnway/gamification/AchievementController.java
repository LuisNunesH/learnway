package com.learnway.gamification;

import com.learnway.common.security.SecurityUtils;
import com.learnway.gamification.dto.AchievementDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@Tag(name = "Achievements", description = "Conquistas do usuário")
public class AchievementController {

    private final GamificationService gamificationService;

    public AchievementController(GamificationService gamificationService) {
        this.gamificationService = gamificationService;
    }

    @GetMapping
    @Operation(summary = "Catálogo de conquistas com status (desbloqueada ou não) do usuário")
    public List<AchievementDto> all() {
        return gamificationService.listAllForUser(SecurityUtils.currentUserId());
    }

    @GetMapping("/my")
    @Operation(summary = "Apenas as conquistas já desbloqueadas")
    public List<AchievementDto> mine() {
        return gamificationService.listEarned(SecurityUtils.currentUserId());
    }
}
