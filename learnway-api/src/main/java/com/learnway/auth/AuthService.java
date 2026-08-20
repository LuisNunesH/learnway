package com.learnway.auth;

import com.learnway.activity.ActivityService;
import com.learnway.auth.dto.*;
import com.learnway.common.exception.BadRequestException;
import com.learnway.common.exception.ConflictException;
import com.learnway.common.exception.ResourceNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ActivityService activityService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       ActivityService activityService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.activityService = activityService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().toLowerCase().trim();
        String username = request.username().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("E-mail já cadastrado");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Nome de usuário já está em uso");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        // recordLogin abre uma transação REQUIRES_NEW, que não enxerga o usuário
        // ainda não commitado desta transação — chamado direto, viola a FK de
        // login_events. Adiamos para depois do commit.
        UUID newUserId = user.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                activityService.recordLogin(newUserId);
            }
        });
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByUsernameOrEmail(request.usernameOrEmail(), request.usernameOrEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", request.usernameOrEmail()));

        if (user.getPasswordHash() == null) {
            throw new BadRequestException(
                    "Esta conta foi criada com login social. Entre com " + providerLabel(user) + ".");
        }

        // Throws BadCredentialsException (handled globally) on failure.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.usernameOrEmail(), request.password()));

        activityService.recordLogin(user.getId());
        return buildAuthResponse(user);
    }

    private String providerLabel(User user) {
        return switch (user.getAuthProvider()) {
            case GOOGLE -> "Google";
            case GITHUB -> "GitHub";
            default -> "seu provedor social";
        };
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();
        if (!jwtService.isValid(token) || !jwtService.isRefreshToken(token)) {
            throw new BadRequestException("Refresh token inválido ou expirado");
        }
        UUID userId = jwtService.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String access = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refresh = jwtService.generateRefreshToken(user.getId(), user.getUsername());
        return AuthResponse.of(access, refresh, jwtService.getAccessTokenExpiresInSeconds(), UserDto.from(user));
    }
}
