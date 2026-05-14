package com.dayro.auth.service;

import com.dayro.auth.dto.response.AuthResponse;

public interface AuthService {
    /**
     * 카카오 로그인
     * @param String
     * @return AuthResponse
     * */
    AuthResponse kakaoLogin(String kakaoAccessToken);

    /**
     * Refresh 토큰 검증
     * @param String
     * @return AuthResponse
     * */
    AuthResponse refresh(String refreshToken);

    /**
     * 로그아웃
     * @param String
     * @return void
     * */
    void logout(String memberId);
}
