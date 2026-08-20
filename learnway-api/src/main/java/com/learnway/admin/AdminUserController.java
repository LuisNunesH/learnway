package com.learnway.admin;

import com.learnway.admin.dto.UpdateUserRoleRequest;
import com.learnway.auth.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Gestão de usuários — restrito a administradores")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "Lista todos os usuários da plataforma")
    public List<UserDto> listUsers() {
        return adminUserService.listUsers();
    }

    @PatchMapping("/{userId}/role")
    @Operation(summary = "Altera o papel (USER/ADMIN) de um usuário")
    public UserDto updateRole(@PathVariable UUID userId,
                              @Valid @RequestBody UpdateUserRoleRequest request) {
        return adminUserService.updateRole(userId, request.role());
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um usuário e todos os seus dados (cascade)")
    public void deleteUser(@PathVariable UUID userId) {
        adminUserService.deleteUser(userId);
    }
}
