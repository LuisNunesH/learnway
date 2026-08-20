package com.learnway.admin;

import com.learnway.auth.Role;
import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.auth.dto.UserDto;
import com.learnway.common.exception.BadRequestException;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.common.security.SecurityUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> listUsers() {
        return userRepository.findAll(Sort.by("createdAt")).stream()
                .map(UserDto::from)
                .toList();
    }

    @Transactional
    public UserDto updateRole(UUID userId, Role role) {
        if (userId.equals(SecurityUtils.currentUserId()) && role != Role.ADMIN) {
            throw new BadRequestException("Você não pode remover o próprio papel de administrador");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
        user.setRole(role);
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (userId.equals(SecurityUtils.currentUserId())) {
            throw new BadRequestException("Você não pode excluir a própria conta de administrador");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
        userRepository.delete(user);
    }
}
