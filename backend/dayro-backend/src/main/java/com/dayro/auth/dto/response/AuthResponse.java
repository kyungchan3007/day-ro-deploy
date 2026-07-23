package com.dayro.auth.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        boolean isNewUser
) {}
