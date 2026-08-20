package com.learnway.activity.dto;

import java.time.LocalDate;

/** Um dia do calendário de atividade do usuário. */
public record CalendarDayDto(
        LocalDate date,
        boolean loggedIn,
        long activities
) {
}
