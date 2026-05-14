package com.dayro.auth.service.impl;

import com.dayro.auth.client.KakaoClient;
import com.dayro.auth.domain.Member;
import com.dayro.auth.domain.RefreshToken;
import com.dayro.auth.dto.KakaoUserInfo;
import com.dayro.auth.dto.response.AuthResponse;
import com.dayro.auth.repository.MemberRepository;
import com.dayro.auth.repository.RefreshTokenRepository;
import com.dayro.global.config.jwt.JwtProvider;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {
    @Mock
    KakaoClient kakaoClient;
    @Mock
    MemberRepository memberRepository;
    @Mock
    RefreshTokenRepository refreshTokenRepository;
    @Mock
    JwtProvider jwtProvider;

    @InjectMocks
    AuthServiceImpl authService;

    @Test
    void kakaoLogin_newUser() {
        KakaoUserInfo userInfo = new KakaoUserInfo();
        userInfo.setId(12345L);

        KakaoUserInfo.KakaoAccount account = new KakaoUserInfo.KakaoAccount();
        account.setEmail("xord7@naver.com");

        KakaoUserInfo.KakaoAccount.Profile profile = new KakaoUserInfo.KakaoAccount.Profile();
        profile.setProfileImageUrl("https://test-image.com/profile.jpg");
        profile.setNickname("테스트유저");

        account.setProfile(profile);
        userInfo.setKakaoAccount(account);

        given(kakaoClient.getUserInfo(anyString())).willReturn(userInfo);
        given(memberRepository.findByKakaoId(anyString())).willReturn(Optional.empty());

        Member savedMember = Member.builder()
                .kakaoId("12345")
                .email("xord7@naver.com")
                .nickname("테스트유저")
                .profileImage("https://test-image.com/profile.jpg")
                .build();
        ReflectionTestUtils.setField(savedMember, "id", UUID.randomUUID());

        given(memberRepository.save(any(Member.class))).willReturn(savedMember);
        given(jwtProvider.createAccessToken(anyString())).willReturn("test-access-token");
        given(jwtProvider.createRefreshToken(anyString())).willReturn("test-refresh-token");
        given(jwtProvider.getRefreshTokenExpiresAt()).willReturn(LocalDateTime.now().plusDays(14));

        AuthResponse result = authService.kakaoLogin("kakao-access-token");

        assertThat(result.isNewUser()).isTrue();
        assertThat(result.accessToken()).isEqualTo("test-access-token");
        assertThat(result.refreshToken()).isEqualTo("test-refresh-token");
    }

    @Test
    void kakaoLogin_existingUser() {
        KakaoUserInfo userInfo = new KakaoUserInfo();
        userInfo.setId(12345L);

        KakaoUserInfo.KakaoAccount account = new KakaoUserInfo.KakaoAccount();
        account.setEmail("xord7@naver.com");

        KakaoUserInfo.KakaoAccount.Profile profile = new KakaoUserInfo.KakaoAccount.Profile();
        profile.setNickname("테스트유저");
        profile.setProfileImageUrl("https://test-image.com/profile.jpg");

        account.setProfile(profile);
        userInfo.setKakaoAccount(account);

        Member existingMember = Member.builder()
                .kakaoId("12345")
                .email("xord7@naver.com")
                .nickname("이전닉네임")
                .profileImage("https://old-image.com/profile.jpg")
                .build();
        ReflectionTestUtils.setField(existingMember, "id", UUID.randomUUID());

        given(kakaoClient.getUserInfo(anyString())).willReturn(userInfo);
        given(memberRepository.findByKakaoId(anyString())).willReturn(Optional.of(existingMember));
        given(jwtProvider.createAccessToken(anyString())).willReturn("test-access-token");
        given(jwtProvider.createRefreshToken(anyString())).willReturn("test-refresh-token");
        given(jwtProvider.getRefreshTokenExpiresAt()).willReturn(LocalDateTime.now().plusDays(14));

        AuthResponse result = authService.kakaoLogin("kakao-access-token");

        assertThat(result.isNewUser()).isFalse();
        assertThat(result.accessToken()).isEqualTo("test-access-token");
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    void kakaoLogin_kakaoAuthFailed() {
        given(kakaoClient.getUserInfo(anyString())).willThrow(new RuntimeException("카카오 서버 오류"));

        assertThatThrownBy(() -> authService.kakaoLogin("invalid-kakao-token"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.KAKAO_AUTH_FAILED);
    }

    @Test
    void refresh_validToken() {
        Member member = Member.builder()
                .kakaoId("12345")
                .email("xord7@naver.com")
                .nickname("테스트유저")
                .profileImage("https://test-image.com/profile.jpg")
                .build();
        ReflectionTestUtils.setField(member, "id", UUID.randomUUID());

        RefreshToken savedToken = RefreshToken.builder()
                .member(member)
                .token("valid-refresh-token")
                .expiresAt(LocalDateTime.now().plusDays(14))
                .build();

        given(refreshTokenRepository.findByToken("valid-refresh-token")).willReturn(Optional.of(savedToken));
        given(jwtProvider.validateToken("valid-refresh-token")).willReturn(true);
        given(jwtProvider.createAccessToken(anyString())).willReturn("new-access-token");

        AuthResponse result = authService.refresh("valid-refresh-token");

        assertThat(result.accessToken()).isEqualTo("new-access-token");
        assertThat(result.refreshToken()).isEqualTo("valid-refresh-token");
    }

    @Test
    void refresh_tokenNotFound() {
        given(refreshTokenRepository.findByToken(anyString())).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("unknown-token"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_TOKEN);
    }

    @Test
    void refresh_expiredToken() {
        Member member = Member.builder()
                .kakaoId("12345")
                .email("xord7@naver.com")
                .nickname("테스트유저")
                .profileImage("https://test-image.com/profile.jpg")
                .build();
        ReflectionTestUtils.setField(member, "id", UUID.randomUUID());

        RefreshToken expiredToken = RefreshToken.builder()
                .member(member)
                .token("expired-refresh-token")
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        given(refreshTokenRepository.findByToken("expired-refresh-token")).willReturn(Optional.of(expiredToken));
        given(jwtProvider.validateToken("expired-refresh-token")).willReturn(false);

        assertThatThrownBy(() -> authService.refresh("expired-refresh-token"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_TOKEN);
    }

    @Test
    void logout_success() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .kakaoId("12345")
                .email("xord7@naver.com")
                .nickname("테스트유저")
                .profileImage("https://test-image.com/profile.jpg")
                .build();
        ReflectionTestUtils.setField(member, "id", memberId);

        given(memberRepository.findById(memberId)).willReturn(Optional.of(member));

        authService.logout(memberId.toString());

        verify(refreshTokenRepository).deleteByMember(member);
    }

    @Test
    void logout_memberNotFound() {
        UUID unknownId = UUID.randomUUID();
        given(memberRepository.findById(unknownId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.logout(unknownId.toString()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MEMBER_NOT_FOUND);
    }
}
