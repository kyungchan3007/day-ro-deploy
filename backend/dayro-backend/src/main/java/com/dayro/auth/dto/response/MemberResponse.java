package com.dayro.auth.dto.response;

import com.dayro.auth.domain.Member;

import java.time.LocalDateTime;

public record MemberResponse(
        String provider,
        String nickname,
        String email,
        String name,
        String profileImage,
        String birthday,
        LocalDateTime joinedAt
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(
                "KAKAO",
                member.getNickname(),
                member.getEmail(),
                member.getName(),
                member.getProfileImage(),
                member.getBirthday(),
                member.getCreatedAt()
        );
    }
}
