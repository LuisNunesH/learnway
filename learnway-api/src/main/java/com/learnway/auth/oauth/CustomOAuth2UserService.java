package com.learnway.auth.oauth;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Extende o user service padrão para resolver o e-mail do GitHub quando o
 * usuário o mantém privado (o /user do GitHub devolve {@code email: null};
 * o e-mail real vem de /user/emails, que exige o scope {@code user:email}).
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final String GITHUB = "github";
    private static final String GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

    private final RestClient restClient = RestClient.create();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(request);

        boolean isGithub = GITHUB.equals(request.getClientRegistration().getRegistrationId());
        if (!isGithub || user.getAttribute("email") != null) {
            return user;
        }

        String email = fetchPrimaryGithubEmail(request.getAccessToken().getTokenValue());
        if (email == null) {
            return user; // o success handler rejeita com mensagem amigável
        }

        Map<String, Object> attributes = new HashMap<>(user.getAttributes());
        attributes.put("email", email);
        // "id" é o user-name-attribute padrão do GitHub
        return new DefaultOAuth2User(user.getAuthorities(), attributes, "id");
    }

    private String fetchPrimaryGithubEmail(String accessToken) {
        try {
            List<Map<String, Object>> emails = restClient.get()
                    .uri(GITHUB_EMAILS_URL)
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/vnd.github+json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (emails == null || emails.isEmpty()) {
                return null;
            }
            return emails.stream()
                    .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                    .map(e -> (String) e.get("email"))
                    .findFirst()
                    .orElse((String) emails.get(0).get("email"));
        } catch (Exception ex) {
            return null;
        }
    }
}
