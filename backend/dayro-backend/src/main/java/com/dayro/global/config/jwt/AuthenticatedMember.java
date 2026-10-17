package com.dayro.global.config.jwt;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

// 비로그인 허용(permitAll) 경로에서 "토큰이 있으면 회원, 없으면 비회원"을 구분할 때 쓴다.
// @AuthenticationPrincipal은 비로그인일 때 "anonymousUser" 문자열을 주입하므로 이런 경로에서는 쓰지 않는다.
public final class AuthenticatedMember {

    private AuthenticatedMember() {
    }

    public static UUID currentIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // JwtAuthenticationFilter가 유효한 토큰일 때만 UsernamePasswordAuthenticationToken(principal=memberId)을 넣는다
        if (!(authentication instanceof UsernamePasswordAuthenticationToken)
                || !(authentication.getPrincipal() instanceof String memberId)) {
            return null;
        }
        try {
            return UUID.fromString(memberId);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
