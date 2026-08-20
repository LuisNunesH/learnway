package com.learnway.auth.oauth;

import com.learnway.activity.ActivityService;
import com.learnway.auth.AuthProvider;
import com.learnway.auth.JwtService;
import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.config.OAuthProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;

/**
 * Fecha o ciclo do login social: encontra (por e-mail) ou cria o usuário
 * e redireciona ao frontend com os JWTs da aplicação no fragment da URL
 * (fragment não trafega em logs de servidor/proxies).
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final OAuthProperties properties;
    private final ActivityService activityService;

    public OAuth2LoginSuccessHandler(UserRepository userRepository,
                                     JwtService jwtService,
                                     OAuthProperties properties,
                                     ActivityService activityService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.properties = properties;
        this.activityService = activityService;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        AuthProvider provider = "google".equals(token.getAuthorizedClientRegistrationId())
                ? AuthProvider.GOOGLE : AuthProvider.GITHUB;
        OAuth2User principal = token.getPrincipal();

        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            log.warn("Login social {} sem e-mail disponível — abortando", provider);
            response.sendRedirect(properties.failureRedirectUri());
            return;
        }

        User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseGet(() -> createUser(email.toLowerCase(Locale.ROOT), principal, provider));

        if (user.getAvatarUrl() == null) {
            user.setAvatarUrl(avatarOf(principal, provider));
            userRepository.save(user);
        }

        activityService.recordLogin(user.getId());

        String access = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refresh = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        String redirect = UriComponentsBuilder.fromUriString(properties.frontendRedirectUri())
                .fragment("access_token=" + access + "&refresh_token=" + refresh)
                .build(true)
                .toUriString();

        response.sendRedirect(redirect);
    }

    private User createUser(String email, OAuth2User principal, AuthProvider provider) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(uniqueUsername(baseUsername(email, principal, provider)));
        user.setPasswordHash(null);
        user.setAuthProvider(provider);
        user.setAvatarUrl(avatarOf(principal, provider));
        log.info("Criando conta via {} para {}", provider, email);
        return userRepository.save(user);
    }

    private String baseUsername(String email, OAuth2User principal, AuthProvider provider) {
        String candidate = provider == AuthProvider.GITHUB
                ? principal.getAttribute("login")
                : principal.getAttribute("name");
        if (candidate == null || candidate.isBlank()) {
            candidate = email.substring(0, email.indexOf('@'));
        }
        String slug = candidate.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]+", ".")
                .replaceAll("\\.{2,}", ".")
                .replaceAll("^\\.|\\.$", "");
        return slug.length() >= 3 ? slug : "dev." + slug;
    }

    private String uniqueUsername(String base) {
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + (++suffix);
        }
        return candidate;
    }

    private String avatarOf(OAuth2User principal, AuthProvider provider) {
        return provider == AuthProvider.GITHUB
                ? principal.getAttribute("avatar_url")
                : principal.getAttribute("picture");
    }
}
