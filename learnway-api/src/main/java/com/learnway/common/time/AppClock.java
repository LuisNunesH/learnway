package com.learnway.common.time;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Fuso horário da aplicação — a fonte única de "que dia é hoje".
 *
 * <p>Instantes continuam gravados em UTC (TIMESTAMPTZ); o que muda aqui é o
 * recorte de <em>dia civil</em>: streak, calendário de presença, heatmap e a
 * data da sessão de estudo passam a virar à meia-noite de Brasília, e não à
 * meia-noite UTC (que no Brasil cai às 21h — fazendo um acesso das 21h ser
 * contabilizado no dia seguinte).</p>
 */
@Component
public class AppClock {

    private final ZoneId zone;
    private final Clock clock;

    @Autowired
    public AppClock(@Value("${learnway.timezone:America/Sao_Paulo}") String zoneId) {
        this(zoneId, Clock.systemUTC());
    }

    /** Para testes: permite fixar o instante "agora". */
    public AppClock(String zoneId, Clock clock) {
        this.zone = ZoneId.of(zoneId);
        this.clock = clock;
    }

    public ZoneId zone() {
        return zone;
    }

    /** Identificador IANA, para queries nativas ({@code AT TIME ZONE :zone}). */
    public String zoneId() {
        return zone.getId();
    }

    /** Instante atual, normalizado em UTC para persistência. */
    public OffsetDateTime now() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    /** Hoje no fuso da aplicação. */
    public LocalDate today() {
        return LocalDate.now(clock.withZone(zone));
    }

    /** O dia civil (no fuso da aplicação) a que um instante pertence. */
    public LocalDate dateOf(OffsetDateTime instant) {
        return instant.atZoneSameInstant(zone).toLocalDate();
    }

    /** Meia-noite local do dia informado, como instante. */
    public OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(zone).toOffsetDateTime();
    }
}
