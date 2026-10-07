package com.dayro.auth.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "kakao_id", nullable = false, unique = true)
    private String kakaoId;

    @Column
    private String email;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "profile_image")
    private String profileImage;

    @Column
    private String name;        // 카카오싱크 실명

    @Enumerated(EnumType.STRING)
    @Column
    private Gender gender;       // 성별 (MALE / FEMALE), 미동의 시 null

    @Column(length = 4)
    private String birthday;     // "MMDD" 형식, 미동의 시 null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Member(String kakaoId, String email, String nickname, String profileImage,
                  String name, Gender gender, String birthday) {
        this.kakaoId = kakaoId;
        this.email = email;
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.name = name;
        this.gender = gender;
        this.birthday = birthday;
    }

    public void updateProfile(String nickname, String profileImage,
                              String name, Gender gender, String birthday) {
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.name = name;
        this.gender = gender;
        this.birthday = birthday;
    }
}
