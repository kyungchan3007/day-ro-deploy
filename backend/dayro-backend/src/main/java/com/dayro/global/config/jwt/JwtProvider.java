package com.dayro.global.config.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    // application.yml의 jwt.secret.key 값을 주입받는 원본 문자열
    @Value("${jwt.secret.key}")
    private String secretKey;

    // 실제 서명에 사용할 SecretKey 타입 (init()에서 변환)
    private SecretKey key;

    private final Logger LOGGER = LoggerFactory.getLogger(JwtProvider.class);

    private final long accessTokenValidityMilliseconds = 30 * 60 * 1000L;       // 30분
    private final long refreshTokenValidityMilliseconds = 14 * 24 * 60 * 60 * 1000L; // 14일

    // access/refresh는 서명 키와 subject가 같아서, 종류를 담지 않으면 refresh 토큰(14일)이 API 인증에도 통과한다.
    // 그러면 로그아웃/탈퇴로 DB에서 지운 refresh 토큰으로도 계속 API를 호출할 수 있다.
    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    // Bean 생성 직후 딱 한 번 실행
    // yml에서 주입받은 String secretKey를 서명용 SecretKey 타입으로 변환
    @PostConstruct
    protected void init() {
        LOGGER.info("[init] JwtTokenProvider 내 secretKey 초기화 시작");
        key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        LOGGER.info("[init] JwtTokenProvider 내 SecretKey 초기화 완료");
    }

    // 로그인 성공 시 JWT 토큰 생성
    // subject(memberId): 토큰 주인이 누구인지
    // issuedAt: 발급 시각
    // expiration: 만료 시각
    // signWith(key): 비밀키로 서명 → Signature 생성
    public String createAccessToken(String memberId) {
        LOGGER.info("[createAccessToken] 토큰 생성 시작");
        Date now = new Date();

        String token = Jwts.builder()
                .subject(memberId)
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTokenValidityMilliseconds))
                .signWith(key)
                .compact();

        LOGGER.info("[createAccessToken] 토큰 생성 완료");
        return token;
    }

    // 로그인 성공 시 JWT 토큰 생성
    // subject(memberId): 토큰 주인이 누구인지
    // issuedAt: 발급 시각
    // expiration: 만료 시각
    // signWith(key): 비밀키로 서명 → Signature 생성
    public String createRefreshToken(String memberId) {
        LOGGER.info("[createRefreshToken] 토큰 생성 시작");
        Date now = new Date();

        String token = Jwts.builder()
                .subject(memberId)
                .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshTokenValidityMilliseconds))
                .signWith(key)
                .compact();

        LOGGER.info("[createRefreshToken] 토큰 생성 완료");
        return token;
    }

    // 토큰에서 userId를 꺼내 DB에서 유저를 조회하고 인증 객체 반환
    // Spring Security가 이 Authentication 객체를 보고 인증된 사용자로 인식함
    public Authentication getAuthentication(String token) {
        String memberId = getMemberId(token);
        return new UsernamePasswordAuthenticationToken(memberId, null, List.of());
    }

    // 토큰의 Payload에서 subject(userId) 추출
    // verifyWith(key): 서명 검증에 사용할 키 지정
    // parseSignedClaims: 토큰 파싱 + 서명 검증 (위조된 토큰이면 예외 발생)
    // getPayload().getSubject(): Payload의 sub 값(userId) 반환
    public String getMemberId(String token) {
        LOGGER.debug("[getUsername] 토큰 기반 회원 구별 정보 추출");
        String info = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        LOGGER.debug("[getUsername] 토큰 기반 회원 구별 정보 추출 완료, info : {}", info);
        return info;
    }

    // 요청 헤더에서 토큰 추출
    // Authorization: Bearer eyJhbGci... 형식에서 "Bearer " 제거 후 토큰만 반환
    public String resolveToken(HttpServletRequest request) {
        LOGGER.debug("[resolveToken] HTTP 헤더에서 token 값 추출");
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    public LocalDateTime getRefreshTokenExpiresAt() {
        return LocalDateTime.now().plusDays(14);
    }

    // 토큰 유효성 검증
    // parseSignedClaims 자체가 서명 검증 포함 → 위조/변조 시 예외 발생
    // 만료 시각이 현재보다 이전이면 false 반환
    public boolean validateToken(String token) {
        LOGGER.debug("[validateToken] 토큰 유효 체크 시작");
        try {
            Jws<Claims> claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return !claims.getPayload().getExpiration().before(new Date());
        } catch (Exception e) {
            LOGGER.info("[validateToken] 토큰 유효 체크 예외 발생");
            return false;
        }
    }

    // API 인증(JwtAuthenticationFilter)에 쓸 수 있는 토큰인지 - 서명/만료에 더해 access 토큰인지까지 확인한다
    public boolean isValidAccessToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (claims.getExpiration().before(new Date())) {
                return false;
            }
            String type = claims.get(TOKEN_TYPE_CLAIM, String.class);
            if (type != null) {
                return ACCESS_TOKEN_TYPE.equals(type);
            }
            // type 클레임 도입 전에 발급된 토큰 - 배포 직후 로그인 사용자가 튕기지 않도록, 수명이 access 토큰 이하인 것만 access로 인정한다.
            // 기존 refresh 토큰(수명 14일)은 여기서 걸러진다. 기존 access 토큰이 모두 만료되는(배포 후 30분) 뒤에는 이 분기를 지워도 된다
            return isIssuedAsAccessToken(claims);
        } catch (Exception e) {
            LOGGER.info("[isValidAccessToken] 토큰 유효 체크 예외 발생");
            return false;
        }
    }

    private boolean isIssuedAsAccessToken(Claims claims) {
        if (claims.getIssuedAt() == null) {
            return false;
        }
        long lifetime = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();
        return lifetime <= accessTokenValidityMilliseconds;
    }
}
