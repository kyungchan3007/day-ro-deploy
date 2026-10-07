package com.dayro.auth.service.impl;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.activity.repository.ActivityEventRepository;
import com.dayro.auth.client.KakaoClient;
import com.dayro.auth.domain.Gender;
import com.dayro.auth.domain.Member;
import com.dayro.auth.domain.MemberServiceTerm;
import com.dayro.auth.domain.RefreshToken;
import com.dayro.auth.dto.KakaoServiceTerms;
import com.dayro.auth.dto.KakaoUserInfo;
import com.dayro.auth.dto.response.AuthResponse;
import com.dayro.auth.dto.response.MemberResponse;
import com.dayro.auth.repository.MemberRepository;
import com.dayro.auth.repository.MemberServiceTermRepository;
import com.dayro.auth.repository.RefreshTokenRepository;
import com.dayro.auth.service.AuthService;
import com.dayro.course.repository.CourseRepository;
import com.dayro.global.config.jwt.JwtProvider;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final KakaoClient kakaoClient;
    private final MemberRepository memberRepository;
    private final MemberServiceTermRepository memberServiceTermRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CourseRepository courseRepository;
    private final JwtProvider jwtProvider;
    private final ActivityEventRepository activityEventRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public AuthResponse kakaoLogin(String code) {
        String kakaoAccessToken;
        KakaoUserInfo userInfo;
        try {
            kakaoAccessToken = kakaoClient.getAccessToken(code);
            userInfo = kakaoClient.getUserInfo(kakaoAccessToken);
        } catch (Exception e) {
            log.warn("카카오 인증 실패", e);
            throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
        }

        String kakaoId = String.valueOf(userInfo.getId());
        KakaoUserInfo.KakaoAccount account = userInfo.getKakaoAccount();
        String email = account != null ? account.getEmail() : null;
        String nickname = (account != null && account.getProfile() != null) ? account.getProfile().getNickname() : null;
        String profileImage = (account != null && account.getProfile() != null) ? account.getProfile().getProfileImageUrl() : null;
        // 카카오싱크 추가 정보 (선택 동의 항목이라 미동의 시 null)
        String name = account != null ? account.getName() : null;
        Gender gender = Gender.from(account != null ? account.getGender() : null);
        String birthday = account != null ? account.getBirthday() : null;

        boolean isNewUser;
        Member member = memberRepository.findByKakaoId(kakaoId).orElse(null);

        if (member == null) {
            member = memberRepository.save(Member.builder()
                    .kakaoId(kakaoId)
                    .email(email)
                    .nickname(nickname)
                    .profileImage(profileImage)
                    .name(name)
                    .gender(gender)
                    .birthday(birthday)
                    .build());
            // 신규 가입자에 한해 카카오싱크 약관 동의 내역 저장
            saveServiceTerms(member, kakaoAccessToken);
            isNewUser = true;
        } else {
            member.updateProfile(nickname, profileImage, name, gender, birthday);
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

        eventPublisher.publishEvent(isNewUser
                ? ActivityOccurredEvent.of(ActivityEventType.SIGN_UP, member.getId(), ActivityOccurredEvent.metadata(
                        "hasName", name != null,
                        "hasGender", gender != null,
                        "hasBirthday", birthday != null))
                : ActivityOccurredEvent.of(ActivityEventType.LOGIN, member.getId(), Map.of()));

        return new AuthResponse(accessToken, refreshToken, isNewUser);
    }

    // 카카오싱크 약관 동의 내역을 조회해 동의(agreed=true)한 약관만 저장
    // 카카오싱크 권한 미승인 앱에서는 403(permission denied)이 나는데, 부가 정보라 로그인 자체를 막으면 안 됨
    private void saveServiceTerms(Member member, String kakaoAccessToken) {
        KakaoServiceTerms serviceTerms;
        try {
            serviceTerms = kakaoClient.getServiceTerms(kakaoAccessToken);
        } catch (Exception e) {
            log.warn("카카오싱크 약관 동의 내역 조회 실패 - 로그인은 계속 진행", e);
            return;
        }
        if (serviceTerms == null || serviceTerms.getServiceTerms() == null) {
            return;
        }
        serviceTerms.getServiceTerms().stream()
                .filter(KakaoServiceTerms.ServiceTerm::isAgreed)
                .forEach(term -> memberServiceTermRepository.save(MemberServiceTerm.builder()
                        .member(member)
                        .tag(term.getTag())
                        .agreedAt(term.getAgreedAt() != null
                                ? term.getAgreedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                                : null)
                        .build()));
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        RefreshToken saved = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        UUID memberId = saved.getMember().getId();
        String newAccessToken = jwtProvider.createAccessToken(memberId.toString());
        // access token(30분)이 만료돼 재발급받는 것도 앱을 쓰고 있다는 뜻이라 일일 활동으로 센다
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.ACTIVE, memberId, Map.of()));

        return new AuthResponse(newAccessToken, refreshToken, false);
    }

    @Transactional
    public void logout(String memberId) {
        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        refreshTokenRepository.deleteByMember(member);
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.LOGOUT, member.getId(), Map.of()));
    }

    @Transactional(readOnly = true)
    public MemberResponse getMyInfo(String memberId) {
        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        // 프론트가 앱 진입 시 세션 확인용으로 호출하므로 일일 활동(DAU) 기준점으로 쓴다 - 하루 1건 중복 제거는 리스너가 한다
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.ACTIVE, member.getId(), Map.of()));
        return MemberResponse.from(member);
    }

    @Transactional
    public void withdraw(String memberId) {
        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        try {
            kakaoClient.unlink(member.getKakaoId());
        } catch (Exception e) {
            // 카카오 연결 끊기는 이미 끊겨있거나 일시 장애일 수 있어 실패해도 탈퇴 자체는 막지 않음
            log.warn("카카오 연결 끊기 실패 - 회원 탈퇴는 계속 진행", e);
        }

        UUID id = member.getId();
        // 코스가 함께 삭제되기 전에 탈퇴 통계용 값을 먼저 읽어둔다
        long savedCourseCount = courseRepository.countByMember_Id(id);
        Long memberDays = member.getCreatedAt() == null ? null
                : Duration.between(member.getCreatedAt(), LocalDateTime.now()).toDays();

        refreshTokenRepository.deleteByMember(member);
        memberServiceTermRepository.deleteAllByMember_Id(id);
        courseRepository.deleteAllByMember_Id(id);
        memberRepository.delete(member);

        // 탈퇴 후 개인정보 파기 원칙 - 통계는 남기되 이 회원의 과거 활동과의 연결을 끊는다. 탈퇴 이벤트 자체도 member_id 없이 남긴다
        activityEventRepository.anonymizeMember(id);
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.WITHDRAW, null, ActivityOccurredEvent.metadata(
                "memberDays", memberDays,
                "savedCourseCount", savedCourseCount)));
    }
}
