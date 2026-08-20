package com.learnway.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Convenience accessors for the currently authenticated user.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserPrincipal> currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal);
    }

    /** @return the current user's id, or throws if there is no authenticated user. */
    public static UUID currentUserId() {
        return currentPrincipal()
                .map(UserPrincipal::getId)
                .orElseThrow(() -> new IllegalStateException("Nenhum usuário autenticado no contexto"));
    }

    /** @return whether the current user has the ADMIN role. */
    public static boolean isAdmin() {
        return currentPrincipal().map(UserPrincipal::isAdmin).orElse(false);
    }
}
