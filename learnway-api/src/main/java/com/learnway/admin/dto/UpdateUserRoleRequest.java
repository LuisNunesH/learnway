package com.learnway.admin.dto;

import com.learnway.auth.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull Role role) {}
