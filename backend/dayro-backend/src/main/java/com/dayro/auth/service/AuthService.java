package com.dayro.auth.service;

import com.dayro.auth.dto.response.AuthResponse;
import com.dayro.auth.dto.response.MemberResponse;

public interface AuthService {
    /**
     * 카카오 로그인 (인가코드 방식)
     * @param code 카카오 인가코드
     * @return AuthResponse
     * */
    AuthResponse kakaoLogin(String code);

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

    /**
     * 로그인한 사용자 정보 조회
     * @param memberId
     * @return MemberResponse
     * */
    MemberResponse getMyInfo(String memberId);
}
