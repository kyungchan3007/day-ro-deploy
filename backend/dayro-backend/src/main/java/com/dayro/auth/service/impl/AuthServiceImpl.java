package com.dayro.auth.service.impl;

import com.dayro.auth.client.KakaoClient;
import com.dayro.auth.domain.Member;
import com.dayro.auth.domain.RefreshToken;
import com.dayro.auth.dto.KakaoUserInfo;
import com.dayro.auth.dto.response.AuthResponse;
import com.dayro.auth.repository.MemberRepository;
import com.dayro.auth.repository.RefreshTokenRepository;
import com.dayro.auth.service.AuthService;
import com.dayro.global.config.jwt.JwtProvider;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final KakaoClient kakaoClient;
    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    @Transactional
    public AuthResponse kakaoLogin(String kakaoAccessToken) {
        KakaoUserInfo userInfo;
        try {
            userInfo = kakaoClient.getUserInfo(kakaoAccessToken);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
        }

        String kakaoId = String.valueOf(userInfo.getId());
        KakaoUserInfo.KakaoAccount account = userInfo.getKakaoAccount();
        String email = account != null ? account.getEmail() : null;
        String nickname = (account != null && account.getProfile() != null) ? account.getProfile().getNickname() : null;
        String profileImage = (account != null && account.getProfile() != null) ? account.getProfile().getProfileImageUrl() : null;

        boolean isNewUser;
        Member member = memberRepository.findByKakaoId(kakaoId).orElse(null);

        if (member == null) {
            member = memberRepository.save(Member.builder()
                    .kakaoId(kakaoId)
                    .email(email)
                    .nickname(nickname)
                    .profileImage(profileImage)
                    .build());
            isNewUser = true;
        } else {
            member.updateProfile(nickname, profileImage);
            isNewUser = false;
        }

        String accessToken = jwtProvider.createAccessToken(member.getId().toString());
        String refreshToken = jwtProvider.createRefreshToken(member.getId().toString());

        refreshTokenRepository.deleteByMember(member);
        refreshTokenRepository.save(RefreshToken.builder()
                .member(member)
                .token(refreshToken)
                .expiresAt(jwtProvider.getRefreshTokenExpiresAt())
                .build());

        return new AuthResponse(accessToken, refreshToken, isNewUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        RefreshToken saved = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        String memberId = saved.getMember().getId().toString();
        String newAccessToken = jwtProvider.createAccessToken(memberId);

        return new AuthResponse(newAccessToken, refreshToken, false);
    }

    @Transactional
    public void logout(String memberId) {
        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        refreshTokenRepository.deleteByMember(member);
    }
}
