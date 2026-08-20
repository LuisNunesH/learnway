package com.learnway.profile;

import com.learnway.common.security.SecurityUtils;
import com.learnway.profile.dto.ProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/profile")
@Tag(name = "Profile", description = "Perfil e estatísticas do usuário")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Perfil completo: estatísticas, conquistas, heatmap e XP ao longo do tempo")
    public ProfileDto me() {
        return profileService.getProfile(SecurityUtils.currentUserId());
    }
}
