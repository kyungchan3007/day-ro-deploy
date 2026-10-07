package com.dayro.global.config.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtProviderTest {

    // 실행마다 만드는 테스트 전용 서명 키 원문(HMAC-SHA 최소 길이 32바이트 이상)
    private final String signingSecret = UUID.randomUUID() + "-" + UUID.randomUUID();

    private final JwtProvider jwtProvider = new JwtProvider();
    private final SecretKey key = Keys.hmacShaKeyFor(signingSecret.getBytes(StandardCharsets.UTF_8));
    private final String memberId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtProvider, "secretKey", signingSecret);
        jwtProvider.init();
    }

    @Test
    void accessToken_isAcceptedForApiAuthentication() {
        assertThat(jwtProvider.isValidAccessToken(jwtProvider.createAccessToken(memberId))).isTrue();
    }

    @Test
    void refreshToken_isRejectedForApiAuthentication() {
        // 로그아웃/탈퇴로 DB에서 지운 refresh 토큰이 API 인증에 쓰이면 안 된다
        String refreshToken = jwtProvider.createRefreshToken(memberId);

        assertThat(jwtProvider.validateToken(refreshToken)).isTrue(); // refresh API용 검증은 그대로 통과
        assertThat(jwtProvider.isValidAccessToken(refreshToken)).isFalse();
    }

    @Test
    void legacyAccessTokenWithoutType_isStillAccepted() {
        // type 클레임 도입 전 발급된 access 토큰(30분) - 배포 직후 로그인 사용자가 튕기지 않아야 한다
        assertThat(jwtProvider.isValidAccessToken(legacyToken(Duration.ofMinutes(30)))).isTrue();
    }

    @Test
    void legacyRefreshTokenWithoutType_isRejected() {
        assertThat(jwtProvider.isValidAccessToken(legacyToken(Duration.ofDays(14)))).isFalse();
    }

    @Test
    void expiredAccessToken_isRejected() {
        Date issuedAt = new Date(System.currentTimeMillis() - Duration.ofHours(1).toMillis());
        String expired = Jwts.builder().subject(memberId).claim("type", "access")
                .issuedAt(issuedAt).expiration(new Date(issuedAt.getTime() + Duration.ofMinutes(30).toMillis()))
                .signWith(key).compact();

        assertThat(jwtProvider.isValidAccessToken(expired)).isFalse();
    }

    @Test
    void tokenSignedWithOtherKey_isRejected() {
        String otherSecret = UUID.randomUUID() + "-" + UUID.randomUUID();
        SecretKey otherKey = Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        String forged = Jwts.builder().subject(memberId).claim("type", "access")
                .issuedAt(now).expiration(new Date(now.getTime() + 60_000)).signWith(otherKey).compact();

        assertThat(jwtProvider.isValidAccessToken(forged)).isFalse();
    }

    private String legacyToken(Duration lifetime) {
        Date now = new Date();
        return Jwts.builder().subject(memberId)
                .issuedAt(now).expiration(new Date(now.getTime() + lifetime.toMillis()))
                .signWith(key).compact();
    }
}
