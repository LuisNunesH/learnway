package com.learnway.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LoginEventRepository extends JpaRepository<LoginEvent, UUID> {

    boolean existsByUserIdAndEventDate(UUID userId, LocalDate eventDate);

    @Query("""
            select e.eventDate from LoginEvent e
            where e.userId = :userId and e.eventDate between :from and :to
            """)
    List<LocalDate> eventDatesBetween(@Param("userId") UUID userId,
                                      @Param("from") LocalDate from,
                                      @Param("to") LocalDate to);
}
