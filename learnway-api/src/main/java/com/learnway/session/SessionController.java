package com.learnway.session;

import com.learnway.common.security.SecurityUtils;
import com.learnway.session.dto.SessionDto;
import com.learnway.session.dto.SessionStatsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Sessions", description = "Timer de tempo de estudo")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/start")
    @Operation(summary = "Inicia (ou retoma) uma sessão de estudo")
    public SessionDto start() {
        return sessionService.start(SecurityUtils.currentUserId());
    }

    @PostMapping("/heartbeat")
    @Operation(summary = "Sinal de vida do cronômetro; mantém a sessão aberta")
    public SessionDto heartbeat() {
        return sessionService.heartbeat(SecurityUtils.currentUserId());
    }

    @PostMapping("/end")
    @Operation(summary = "Encerra a sessão aberta e calcula a duração")
    public SessionDto end() {
        return sessionService.end(SecurityUtils.currentUserId());
    }

    @GetMapping("/stats")
    @Operation(summary = "Tempo total, semanal e histórico diário")
    public SessionStatsDto stats() {
        return sessionService.stats(SecurityUtils.currentUserId());
    }
}
