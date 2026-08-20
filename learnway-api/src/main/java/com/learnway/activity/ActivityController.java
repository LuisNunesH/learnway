package com.learnway.activity;

import com.learnway.activity.dto.CalendarDayDto;
import com.learnway.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@Tag(name = "Activity", description = "Calendário de presença e atividades")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping("/visit")
    @Operation(summary = "Registra que o usuário entrou no app hoje (idempotente)")
    public void visit() {
        activityService.recordLogin(SecurityUtils.currentUserId());
    }

    @GetMapping("/calendar")
    @Operation(summary = "Calendário mensal: dias com login e contagem de atividades")
    public List<CalendarDayDto> calendar(@RequestParam int year, @RequestParam int month) {
        return activityService.calendar(SecurityUtils.currentUserId(), year, month);
    }
}
