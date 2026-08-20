package com.learnway.activity;

import com.learnway.activity.dto.CalendarDayDto;
import com.learnway.common.exception.BadRequestException;
import com.learnway.common.time.AppClock;
import com.learnway.gamification.entity.XpSource;
import com.learnway.gamification.repository.XpEventRepository;
import com.learnway.progress.QuestionAttemptRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ActivityService {

    private final LoginEventRepository loginEventRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final XpEventRepository xpEventRepository;
    private final AppClock clock;

    public ActivityService(LoginEventRepository loginEventRepository,
                           QuestionAttemptRepository attemptRepository,
                           XpEventRepository xpEventRepository,
                           AppClock clock) {
        this.loginEventRepository = loginEventRepository;
        this.attemptRepository = attemptRepository;
        this.xpEventRepository = xpEventRepository;
        this.clock = clock;
    }

    /**
     * Marca que o usuário entrou hoje (no máximo um registro por dia).
     * REQUIRES_NEW para funcionar mesmo chamado de transações readOnly (login).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLogin(UUID userId) {
        LocalDate today = clock.today();
        if (loginEventRepository.existsByUserIdAndEventDate(userId, today)) return;
        try {
            loginEventRepository.save(new LoginEvent(userId, today));
        } catch (DataIntegrityViolationException ignored) {
            // corrida entre duas requisições do mesmo dia — o unique já garantiu
        }
    }

    /**
     * Calendário de um mês: para cada dia, se o usuário entrou no app e
     * quantas atividades fez (questões respondidas + revisões + flashcards).
     */
    @Transactional(readOnly = true)
    public List<CalendarDayDto> calendar(UUID userId, int year, int month) {
        if (month < 1 || month > 12 || year < 2000 || year > 2100) {
            throw new BadRequestException("Ano ou mês inválido");
        }
        YearMonth ym = YearMonth.of(year, month);
        LocalDate first = ym.atDay(1);
        LocalDate last = ym.atEndOfMonth();
        // Janela e agrupamento no fuso da aplicação: sem isso o que foi feito
        // às 21h de Brasília cairia no dia seguinte (00h UTC).
        OffsetDateTime from = clock.startOfDay(first);
        OffsetDateTime to = clock.startOfDay(last.plusDays(1));
        String zone = clock.zoneId();

        Set<LocalDate> loginDays = new HashSet<>(loginEventRepository.eventDatesBetween(userId, first, last));

        Map<LocalDate, Long> activities = new HashMap<>();
        attemptRepository.dailyCountsBetween(userId, from, to, zone)
                .forEach(r -> activities.merge(r.getDate(), r.getTotal(), Long::sum));
        xpEventRepository.dailyCountsBySourceBetween(userId, XpSource.REVIEW.name(), from, to, zone)
                .forEach(r -> activities.merge(r.getDate(), r.getTotal(), Long::sum));
        xpEventRepository.dailyCountsBySourceBetween(userId, XpSource.FLASHCARD.name(), from, to, zone)
                .forEach(r -> activities.merge(r.getDate(), r.getTotal(), Long::sum));

        List<CalendarDayDto> days = new ArrayList<>(last.getDayOfMonth());
        for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
            long count = activities.getOrDefault(d, 0L);
            // fez atividade ⇒ estava logado, mesmo sem evento explícito (dados antigos)
            days.add(new CalendarDayDto(d, loginDays.contains(d) || count > 0, count));
        }
        return days;
    }
}
